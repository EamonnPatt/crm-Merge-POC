// Reads and writes the app's data in Supabase, translating between database rows (ids, snake_case) and the shapes the
// screens already use (names, camelCase). Row Level Security decides what each signed-in user actually gets back.
import { supabase } from "../lib/supabase";
import type { Tables } from "../lib/database.types";
import type { DemoData, DemoSettings } from "../context/DemoDataContext";
import { FISCAL_YEAR, nowStamp } from "../lib/calendar";
import type {
  AuditLogEntry,
  Budget,
  Customer,
  DashboardShare,
  DataSourceInfo,
  OrderIssue,
  PipelineDeal,
  ProjectLink,
  ProjectTrackerEntry,
  Prospect,
  ReferralPartner,
  SalesOrder,
  TeamMember,
} from "./mockData";

export type DataKey = keyof DemoData;

/** Lookups between a person's database id (U-03) and the name the screens use (M. Alvarez). */
export interface Names {
  idToName: Map<string, string>;
  nameToId: Map<string, string>;
}

export const namesOf = (team: TeamMember[]): Names => ({
  idToName: new Map(team.map((m) => [m.id, m.name])),
  nameToId: new Map(team.map((m) => [m.name, m.id])),
});

const stampOf = (iso: string | null): string => (iso ? nowStamp(new Date(iso)) : "");
const orEmpty = (v: string | null | undefined) => v ?? "";
const orNull = (v: string | undefined | null) => (v ? v : null);

function fail(table: string, error: { message: string } | null) {
  if (error) throw new Error(`${table}: ${error.message}`);
}

/** Updates one row by id and fails loudly if nothing changed (row Level Security hides rows rather than raising an error). */
async function updateRow(table: "customers" | "prospects" | "pipeline_deals" | "referral_partners" | "order_issues" | "project_tracker", values: Record<string, unknown>, id: string) {
  const { data, error } = await supabase.from(table).update(values as never).eq("id", id).select("id");
  fail(table, error);
  if (!data?.length) throw new Error(`${table}: could not update ${id} (not found, or you do not have permission).`);
}

function idFor(names: Names, name: string): string {
  const id = names.nameToId.get(name);
  if (!id) throw new Error(`"${name}" is not a known user.`);
  return id;
}

/** PostgREST returns at most 1000 rows per request, so large tables are read in pages. */
async function fetchPaged<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, label: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    fail(label, error);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

// ---------------------------------------------------------------------------
// Row -> UI
// ---------------------------------------------------------------------------
const toTeam = (users: Tables<"app_users">[], supports: Tables<"assistant_supports">[]): TeamMember[] => {
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  return users
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      ...(u.role === "assistant" ? { supports: supports.filter((s) => s.assistant_id === u.id).map((s) => nameById.get(s.account_manager_id) ?? s.account_manager_id) } : {}),
    }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
};

const toBudget = (r: Tables<"budgets">, n: Names): Budget => ({
  id: r.id,
  rep: n.idToName.get(r.rep_id) ?? r.rep_id,
  fiscalYear: r.fiscal_year,
  gp: r.gp_monthly ?? undefined,
  sales: r.sales_monthly ?? undefined,
  notes: r.notes,
  updatedBy: (r.updated_by_id && n.idToName.get(r.updated_by_id)) || "",
  updatedAt: stampOf(r.updated_at),
});

const toAccount = (r: Tables<"customers">, n: Names): Customer => ({
  id: r.id,
  name: r.name,
  company: r.company,
  email: r.email,
  phone: r.phone,
  totalOrders: r.total_orders,
  lifetimeValue: r.lifetime_value,
  source: r.source,
  since: r.since,
  accountManager: n.idToName.get(r.account_manager_id) ?? r.account_manager_id,
  priority: r.priority,
  notes: r.notes,
  weeklyActivityLogged: r.weekly_activity_logged,
  monthlyActivityLogged: r.monthly_activity_logged,
  lyGrossProfit: r.ly_gross_profit,
});

const toIssue = (r: Tables<"order_issues">, n: Names): OrderIssue => ({
  id: r.id,
  order: r.order_number,
  customer: r.customer_name,
  accountManager: n.idToName.get(r.account_manager_id) ?? r.account_manager_id,
  issueType: r.issue_type,
  severity: r.severity,
  status: r.status,
  assignedTo: (r.assigned_to_id && n.idToName.get(r.assigned_to_id)) || "",
  inHandDate: orEmpty(r.in_hand_date),
  openedOn: r.opened_on,
  resolvedOn: r.resolved_on ?? undefined,
  notes: r.notes,
  updatedBy: (r.updated_by_id && n.idToName.get(r.updated_by_id)) || "",
  updatedAt: stampOf(r.updated_at),
});

const toProject = (r: Tables<"project_tracker">, n: Names): ProjectTrackerEntry => ({
  id: r.id,
  accountName: r.account_name,
  accountManager: n.idToName.get(r.account_manager_id) ?? r.account_manager_id,
  month: r.plan_month,
  targetValue: r.target_value,
  historicalProjects: r.historical_projects,
  potentialProjects: r.potential_projects,
  status: r.status,
  notes: r.notes,
  links: Array.isArray(r.links) ? (r.links as unknown as ProjectLink[]) : [],
  updatedBy: (r.updated_by_id && n.idToName.get(r.updated_by_id)) || "",
  updatedAt: stampOf(r.updated_at),
});

const toProspect = (r: Tables<"prospects">, n: Names): Prospect => ({
  id: r.id,
  name: r.name,
  company: r.company,
  stage: r.stage,
  estValue: r.est_value,
  owner: n.idToName.get(r.owner_id) ?? r.owner_id,
  lastContact: orEmpty(r.last_contact),
});

const toDeal = (r: Tables<"pipeline_deals">, n: Names): PipelineDeal => ({
  id: r.id,
  name: r.name,
  company: r.company,
  value: r.value,
  owner: n.idToName.get(r.owner_id) ?? r.owner_id,
  stage: r.stage,
  closeDate: orEmpty(r.close_date),
});

const toPartner = (r: Tables<"referral_partners">): ReferralPartner => ({
  id: r.id,
  name: r.name,
  contact: r.contact,
  referralsSent: r.referrals_sent,
  conversions: r.conversions,
  commissionOwed: r.commission_owed,
  status: r.status,
});

const toAudit = (r: Tables<"audit_log">): AuditLogEntry => ({
  id: r.id,
  timestamp: stampOf(r.occurred_at),
  user: r.actor_name,
  role: r.actor_role,
  action: r.action,
  entity: r.entity,
  details: r.details,
});

const toSettings = (r: Tables<"app_settings"> | undefined, base: DemoSettings): DemoSettings => {
  if (!r) return base;
  const integrations = r.integrations as Record<string, { method?: string; schedule?: string; location?: string }>;
  return {
    orderSheetUrl: r.order_sheet_url,
    orderSheetEmbedUrl: r.order_sheet_embed_url,
    amProjectAccess: r.am_project_access,
    amSeeAllOrderIssues: r.am_see_all_order_issues,
    notifications: { ...base.notifications, ...(r.notifications as Record<string, boolean>) },
    security: { ...base.security, ...(r.security as Record<string, boolean>) },
    // API keys are never stored in the database (use Supabase Vault / Edge Function secrets), so they stay blank here.
    integrations: {
      "ASI SmartBooks": { ...base.integrations["ASI SmartBooks"], ...integrations["ASI SmartBooks"], apiKey: "" },
      "Facilis Syncore": { ...base.integrations["Facilis Syncore"], ...integrations["Facilis Syncore"], apiKey: "" },
    },
  };
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------
export interface LoadedExtras {
  salesOrders: SalesOrder[];
  dataSources: DataSourceInfo[];
}

async function loadTeam(): Promise<TeamMember[]> {
  const [users, supports] = await Promise.all([supabase.from("app_users").select("*"), supabase.from("assistant_supports").select("*")]);
  fail("app_users", users.error);
  fail("assistant_supports", supports.error);
  return toTeam(users.data ?? [], supports.data ?? []);
}

/** Loads the collections named in `keys` (all of them if omitted). `team` is always read first, since names depend on it. */
export async function loadData(baseSettings: DemoSettings, keys?: Set<DataKey>): Promise<Partial<DemoData> & { team: TeamMember[] }> {
  const want = (k: DataKey) => !keys || keys.has(k);
  const team = await loadTeam();
  const names = namesOf(team);
  const out: Partial<DemoData> & { team: TeamMember[] } = { team };

  const tasks: PromiseLike<void>[] = [];
  const run = <T,>(key: DataKey, query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>, apply: (rows: T[]) => void) => {
    if (!want(key)) return;
    tasks.push(
      query.then(({ data, error }) => {
        fail(key, error);
        apply(data ?? []);
      }),
    );
  };

  run("budgets", supabase.from("budgets").select("*"), (rows) => (out.budgets = rows.map((r) => toBudget(r, names)).sort((a, b) => a.rep.localeCompare(b.rep) || a.fiscalYear - b.fiscalYear)));
  run("businessDays", supabase.from("business_day_overrides").select("*"), (rows) => (out.businessDays = rows.map((r) => ({ fiscalYear: r.fiscal_year, monthly: r.monthly, updatedBy: (r.updated_by_id && names.idToName.get(r.updated_by_id)) || "", updatedAt: stampOf(r.updated_at) }))));
  run("accounts", supabase.from("customers").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }), (rows) => (out.accounts = rows.map((r) => toAccount(r, names))));
  run("shares", supabase.from("dashboard_shares").select("*"), (rows) => (out.shares = rows.map((r): DashboardShare => ({ owner: names.idToName.get(r.owner_id) ?? r.owner_id, assistant: names.idToName.get(r.assistant_id) ?? r.assistant_id, sharedAt: r.shared_at.slice(0, 10) }))));
  run("orderIssues", supabase.from("order_issues").select("*").order("opened_on", { ascending: false }).order("id", { ascending: false }), (rows) => (out.orderIssues = rows.map((r) => toIssue(r, names))));
  run("projects", supabase.from("project_tracker").select("*").order("updated_at", { ascending: false }), (rows) => (out.projects = rows.map((r) => toProject(r, names))));
  run("prospects", supabase.from("prospects").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }), (rows) => (out.prospects = rows.map((r) => toProspect(r, names))));
  run("deals", supabase.from("pipeline_deals").select("*").order("id"), (rows) => (out.deals = rows.map((r) => toDeal(r, names))));
  run("partners", supabase.from("referral_partners").select("*").order("id"), (rows) => (out.partners = rows.map(toPartner)));
  run("auditLog", supabase.from("audit_log").select("*").order("occurred_at", { ascending: false }).limit(500), (rows) => (out.auditLog = rows.map(toAudit)));
  run("settings", supabase.from("app_settings").select("*"), (rows) => (out.settings = toSettings(rows[0], baseSettings)));

  await Promise.all(tasks);
  return out;
}

/** FY(last) and FY(this) orders the signed-in user may see: enough for actuals, LY and the orders table. */
export async function loadSales(names: Names): Promise<LoadedExtras> {
  const from = `${FISCAL_YEAR - 1}-01-01`;
  const [orders, sources] = await Promise.all([
    fetchPaged<Tables<"sales_orders">>((a, b) => supabase.from("sales_orders").select("*").gte("invoice_date", from).order("invoice_date", { ascending: false }).order("id", { ascending: false }).range(a, b), "sales_orders"),
    supabase.from("data_sources").select("*"),
  ]);
  fail("data_sources", sources.error);
  return {
    salesOrders: orders.map((o) => ({
      id: o.order_number,
      customer: o.customer_name,
      rep: names.idToName.get(o.rep_id) ?? o.rep_id,
      date: o.invoice_date,
      amount: o.amount,
      cost: o.cost,
      status: o.status,
      source: o.source,
    })),
    dataSources: (sources.data ?? []).map((s) => ({
      name: s.name,
      status: s.status,
      lastSync: s.last_sync ? stampOf(s.last_sync) : "Never",
      recordsSynced: s.records_synced,
      method: s.method,
    })),
  };
}

export interface InviteInput {
  /** Re-send the invite for someone already on the staff list. */
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  /** Ids of the Account Managers an assistant supports. */
  supports?: string[];
}

/** Creates an employee (or re-sends their invite) through the invite-user Edge Function, which checks the caller is Management / Super User. */
export async function inviteUser(input: InviteInput): Promise<void> {
  const { error } = await supabase.functions.invoke("invite-user", { body: { ...input, redirectTo: window.location.origin } });
  if (!error) return;
  let message = error.message;
  const context = (error as { context?: Response }).context;
  if (context && typeof context.json === "function") {
    try {
      message = ((await context.json()) as { error?: string }).error ?? message;
    } catch {
      // Keep the generic message.
    }
  }
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// Saving: the screens change the in-memory data and we write the difference
// ---------------------------------------------------------------------------
function diff<T>(prev: T[], next: T[], id: (t: T) => string) {
  const before = new Map(prev.map((x) => [id(x), x]));
  const after = new Set(next.map(id));
  return {
    added: next.filter((x) => !before.has(id(x))),
    changed: next.filter((x) => {
      const old = before.get(id(x));
      return old !== undefined && old !== x && JSON.stringify(old) !== JSON.stringify(x);
    }),
    removed: prev.filter((x) => !after.has(id(x))),
  };
}

/**
 * Writes whatever changed between two versions of the data and returns which collections were touched, so the caller
 * can reload them (picking up the ids and timestamps the database assigned). New rows are inserted without an id: the
 * database numbers them, so two people adding at once never collide.
 */
export async function saveChanges(prev: DemoData, next: DemoData, me: string): Promise<Set<DataKey>> {
  const touched = new Set<DataKey>();
  let names = namesOf(next.team);

  // Team first: everything else can refer to a brand-new person.
  const team = diff(prev.team, next.team, (m) => m.id);
  for (const m of team.added) {
    const { data, error } = await supabase.from("app_users").insert({ name: m.name, email: m.email, role: m.role, status: m.status }).select("id").single();
    fail("app_users", error);
    next = { ...next, team: next.team.map((x) => (x === m ? { ...x, id: data!.id } : x)) };
    if (m.supports?.length) {
      names = namesOf(next.team);
      const { error: e2 } = await supabase.from("assistant_supports").insert(m.supports.map((am) => ({ assistant_id: data!.id, account_manager_id: idFor(names, am) })));
      fail("assistant_supports", e2);
    }
    touched.add("team");
  }
  for (const m of team.changed) {
    const { error } = await supabase.from("app_users").update({ name: m.name, email: m.email, role: m.role, status: m.status }).eq("id", m.id);
    fail("app_users", error);
    if (m.role === "assistant") {
      names = namesOf(next.team);
      const { error: e1 } = await supabase.from("assistant_supports").delete().eq("assistant_id", m.id);
      fail("assistant_supports", e1);
      if (m.supports?.length) {
        const { error: e2 } = await supabase.from("assistant_supports").insert(m.supports.map((am) => ({ assistant_id: m.id, account_manager_id: idFor(names, am) })));
        fail("assistant_supports", e2);
      }
    }
    touched.add("team");
  }
  names = namesOf(next.team);
  const id = (name: string) => idFor(names, name);

  const accounts = diff(prev.accounts, next.accounts, (a) => a.id);
  const accountRow = (a: Customer) => ({
    name: a.name, company: a.company, email: a.email, phone: a.phone, total_orders: a.totalOrders, lifetime_value: a.lifetimeValue,
    source: a.source, since: a.since, account_manager_id: id(a.accountManager), priority: a.priority, notes: a.notes,
    weekly_activity_logged: a.weeklyActivityLogged, monthly_activity_logged: a.monthlyActivityLogged, ly_gross_profit: a.lyGrossProfit,
  });
  if (accounts.added.length) fail("customers", (await supabase.from("customers").insert(accounts.added.map(accountRow))).error);
  for (const a of accounts.changed) await updateRow("customers", accountRow(a), a.id);
  if (accounts.added.length || accounts.changed.length) touched.add("accounts");

  const prospects = diff(prev.prospects, next.prospects, (p) => p.id);
  const prospectRow = (p: Prospect) => ({ name: p.name, company: p.company, stage: p.stage, est_value: p.estValue, owner_id: id(p.owner), last_contact: orNull(p.lastContact) });
  if (prospects.added.length) fail("prospects", (await supabase.from("prospects").insert(prospects.added.map(prospectRow))).error);
  for (const p of prospects.changed) await updateRow("prospects", prospectRow(p), p.id);
  if (prospects.added.length || prospects.changed.length) touched.add("prospects");

  const deals = diff(prev.deals, next.deals, (d) => d.id);
  const dealRow = (d: PipelineDeal) => ({ name: d.name, company: d.company, value: d.value, owner_id: id(d.owner), stage: d.stage, close_date: orNull(d.closeDate) });
  if (deals.added.length) fail("pipeline_deals", (await supabase.from("pipeline_deals").insert(deals.added.map(dealRow))).error);
  for (const d of deals.changed) await updateRow("pipeline_deals", dealRow(d), d.id);
  if (deals.added.length || deals.changed.length) touched.add("deals");

  const partners = diff(prev.partners, next.partners, (p) => p.id);
  const partnerRow = (p: ReferralPartner) => ({ name: p.name, contact: p.contact, referrals_sent: p.referralsSent, conversions: p.conversions, commission_owed: p.commissionOwed, status: p.status });
  if (partners.added.length) fail("referral_partners", (await supabase.from("referral_partners").insert(partners.added.map(partnerRow))).error);
  for (const p of partners.changed) await updateRow("referral_partners", partnerRow(p), p.id);
  if (partners.added.length || partners.changed.length) touched.add("partners");

  const issues = diff(prev.orderIssues, next.orderIssues, (i) => i.id);
  const issueRow = (i: OrderIssue) => ({
    order_number: i.order, customer_name: i.customer, account_manager_id: id(i.accountManager), issue_type: i.issueType, severity: i.severity,
    status: i.status, assigned_to_id: i.assignedTo ? id(i.assignedTo) : null, in_hand_date: orNull(i.inHandDate), opened_on: i.openedOn,
    resolved_on: orNull(i.resolvedOn), notes: i.notes, updated_by_id: me,
  });
  if (issues.added.length) fail("order_issues", (await supabase.from("order_issues").insert(issues.added.map(issueRow))).error);
  for (const i of issues.changed) await updateRow("order_issues", issueRow(i), i.id);
  if (issues.added.length || issues.changed.length) touched.add("orderIssues");

  const projects = diff(prev.projects, next.projects, (p) => p.id);
  const projectRow = (p: ProjectTrackerEntry) => ({
    account_name: p.accountName, account_manager_id: id(p.accountManager), plan_month: p.month, target_value: p.targetValue,
    historical_projects: p.historicalProjects, potential_projects: p.potentialProjects, status: p.status, notes: p.notes,
    links: p.links as unknown as never, updated_by_id: me,
  });
  if (projects.added.length) fail("project_tracker", (await supabase.from("project_tracker").insert(projects.added.map(projectRow))).error);
  for (const p of projects.changed) await updateRow("project_tracker", projectRow(p), p.id);
  if (projects.added.length || projects.changed.length) touched.add("projects");

  const budgets = diff(prev.budgets, next.budgets, (b) => b.id);
  const budgetRows = [...budgets.added, ...budgets.changed].map((b) => ({
    rep_id: id(b.rep), fiscal_year: b.fiscalYear, gp_monthly: b.gp ?? null, sales_monthly: b.sales ?? null, notes: b.notes ?? "", updated_by_id: me,
  }));
  if (budgetRows.length) {
    fail("budgets", (await supabase.from("budgets").upsert(budgetRows, { onConflict: "rep_id,fiscal_year" })).error);
    touched.add("budgets");
  }

  const days = diff(prev.businessDays, next.businessDays, (o) => String(o.fiscalYear));
  const dayRows = [...days.added, ...days.changed].map((o) => ({ fiscal_year: o.fiscalYear, monthly: o.monthly, updated_by_id: me }));
  if (dayRows.length) fail("business_day_overrides", (await supabase.from("business_day_overrides").upsert(dayRows, { onConflict: "fiscal_year" })).error);
  for (const o of days.removed) fail("business_day_overrides", (await supabase.from("business_day_overrides").delete().eq("fiscal_year", o.fiscalYear)).error);
  if (dayRows.length || days.removed.length) touched.add("businessDays");

  const shares = diff(prev.shares, next.shares, (s) => `${s.owner}|${s.assistant}`);
  if (shares.added.length) fail("dashboard_shares", (await supabase.from("dashboard_shares").insert(shares.added.map((s) => ({ owner_id: id(s.owner), assistant_id: id(s.assistant) })))).error);
  for (const s of shares.removed) fail("dashboard_shares", (await supabase.from("dashboard_shares").delete().eq("owner_id", id(s.owner)).eq("assistant_id", id(s.assistant))).error);
  if (shares.added.length || shares.removed.length) touched.add("shares");

  if (prev.settings !== next.settings && JSON.stringify(prev.settings) !== JSON.stringify(next.settings)) {
    const s = next.settings;
    const integrations = Object.fromEntries(Object.entries(s.integrations).map(([name, { method, schedule, location }]) => [name, { method, schedule, location }]));
    fail(
      "app_settings",
      (await supabase.from("app_settings").update({
        order_sheet_url: s.orderSheetUrl, order_sheet_embed_url: s.orderSheetEmbedUrl, am_project_access: s.amProjectAccess,
        am_see_all_order_issues: s.amSeeAllOrderIssues, notifications: s.notifications, security: s.security, integrations, updated_by_id: me,
      }).eq("id", true)).error,
    );
    touched.add("settings");
  }

  // Audit entries last, so a failed change above never leaves a log line for something that did not happen.
  const audit = diff(prev.auditLog, next.auditLog, (e) => e.id);
  if (audit.added.length) {
    fail("audit_log", (await supabase.from("audit_log").insert([...audit.added].reverse().map((e) => ({ actor_name: e.user, actor_role: e.role, action: e.action, entity: e.entity, details: e.details })))).error);
    touched.add("auditLog");
  }

  return touched;
}

