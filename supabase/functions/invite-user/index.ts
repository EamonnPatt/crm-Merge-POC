// Lets Management / Super User create an employee: adds them to the staff list (app_users) and emails them an invite
// to set a password. It needs the service_role key (to call the Auth admin API), which is why this runs here and never
// in the browser. The caller's role is checked against app_users before anything is written.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ROLES = ["super_user", "management", "account_manager", "assistant", "csr"] as const;
type Role = (typeof ROLES)[number];
const ROLE_LABEL: Record<Role, string> = {
  super_user: "Super User",
  management: "Management",
  account_manager: "Account Manager",
  assistant: "Assistant",
  csr: "CSR",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Use POST." });

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // Who is asking, and are they allowed to?
  const { data: authData } = await caller.auth.getUser();
  if (!authData.user) return reply(401, { error: "Sign in first." });
  const { data: me } = await admin.from("app_users").select("id, name, role").eq("auth_user_id", authData.user.id).maybeSingle();
  if (!me || (me.role !== "management" && me.role !== "super_user")) return reply(403, { error: "Only Management or a Super User can create accounts." });

  let body: { userId?: string; name?: string; email?: string; role?: string; supports?: string[]; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid request." });
  }

  const redirectTo = typeof body.redirectTo === "string" && /^https?:\/\//.test(body.redirectTo) ? body.redirectTo : undefined;
  let createdId: string | null = null;
  let target: { id: string; name: string; email: string; role: Role };

  if (body.userId) {
    // Re-send the invite for someone already on the staff list who has no login yet.
    const { data: row } = await admin.from("app_users").select("id, name, email, role, auth_user_id").eq("id", body.userId).maybeSingle();
    if (!row) return reply(404, { error: "That user does not exist." });
    if (row.auth_user_id) return reply(409, { error: `${row.name} already has a login.` });
    if (row.role === "super_user" && me.role !== "super_user") return reply(403, { error: "Only a Super User can invite a Super User." });
    target = row as typeof target;
  } else {
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const role = body.role as Role;
    if (!name || name.length > 100) return reply(400, { error: "Enter the person's name." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return reply(400, { error: "Enter a valid email address." });
    if (!ROLES.includes(role)) return reply(400, { error: "Choose a role." });
    if (role === "super_user" && me.role !== "super_user") return reply(403, { error: "Only a Super User can create a Super User." });

    const supports = [...new Set(body.supports ?? [])];
    if (role === "assistant") {
      if (supports.length === 0) return reply(400, { error: "Choose at least one Account Manager this assistant supports." });
      const { data: ams } = await admin.from("app_users").select("id").eq("role", "account_manager").in("id", supports);
      if ((ams?.length ?? 0) !== supports.length) return reply(400, { error: "One of the chosen Account Managers does not exist." });
    }

    const { data: dupe } = await admin.from("app_users").select("id").ilike("email", email).maybeSingle();
    if (dupe) return reply(409, { error: "A user with this email already exists." });

    const { data: row, error } = await admin.from("app_users").insert({ name, email, role, status: "invited" }).select("id, name, email, role").single();
    if (error || !row) return reply(500, { error: error?.message ?? "Could not create the user." });
    createdId = row.id;
    target = row as typeof target;
    if (role === "assistant") {
      const { error: e2 } = await admin.from("assistant_supports").insert(supports.map((am) => ({ assistant_id: row.id, account_manager_id: am })));
      if (e2) {
        await admin.from("app_users").delete().eq("id", row.id);
        return reply(500, { error: e2.message });
      }
    }
  }

  // Email the invite. If it cannot be sent, undo the staff row we just made so nothing half-created is left behind.
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(target.email, { redirectTo, data: { name: target.name } });
  if (inviteError) {
    if (createdId) await admin.from("app_users").delete().eq("id", createdId);
    const exists = /already|registered/i.test(inviteError.message);
    return reply(exists ? 409 : 502, { error: exists ? "A login already exists for that email." : `Could not send the invite: ${inviteError.message}` });
  }

  await admin.from("audit_log").insert({
    actor_id: me.id,
    actor_name: me.name,
    actor_role: ROLE_LABEL[me.role as Role],
    action: createdId ? "Created user" : "Sent invite",
    entity: target.name,
    details: `${ROLE_LABEL[target.role]} invited at ${target.email}.`,
  });

  return reply(200, { id: target.id, name: target.name, email: target.email, role: target.role });
});
