import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plug, Users, Bell, Shield, KeyRound, Check, Minus, UserPlus, FileSpreadsheet, Scale } from "lucide-react";
import { Card, PageHeader, Badge, Button, Field, Modal, Switch, inputClass } from "../components/ui";
import { useRole } from "../context/RoleContext";
import { useDemoData, type IntegrationConfig } from "../context/DemoDataContext";
import { dataSources, accessLevelMatrix, type Source } from "../data/mockData";
import { roleLabel, roleOrder, roleTone, type Role } from "../lib/roles";
import { isWebUrl } from "../lib/url";

export default function Settings() {
  const { profile, canManageUsers, canConfigureSystem } = useRole();
  const { team, shares, settings, updateSettings } = useDemoData();
  const { hash } = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  const [configuring, setConfiguring] = useState<Source | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Deep links like /settings#order-sheet (from Order Excellence) scroll to that card.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const sortedTeam = [...team].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
  const matrix = accessLevelMatrix(settings);

  const setDecision = (key: "amProjectAccess" | "amSeeAllOrderIssues", value: boolean, question: string, text: string) =>
    updateSettings({ [key]: value }, profile, { action: "Changed access setting", entity: question, details: `${text}: ${value ? "On" : "Off"}.` });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Integrations, team access, and notification preferences." />

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">System Access Levels</h3>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Five-tier role structure. Super User configures this matrix; everyone else sees it read-only. Your role:{" "}
          <span className="font-medium text-slate-700">{profile.label}</span>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Capability</th>
                {roleOrder.map((role) => (
                  <th
                    key={role}
                    className={`px-3 py-2 text-center font-medium ${role === profile.role ? "rounded-t-md bg-brand-50 text-brand-700" : ""}`}
                  >
                    {roleLabel[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row) => (
                <tr key={row.capability}>
                  <td className="py-2.5 pr-4 text-slate-700">{row.capability}</td>
                  {roleOrder.map((role) => (
                    <td key={role} className={`px-3 py-2.5 text-center ${role === profile.role ? "bg-brand-50" : ""}`}>
                      {row[role] ? <Check size={15} className="mx-auto text-emerald-600" /> : <Minus size={15} className="mx-auto text-slate-300" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Scale size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Pending Client Decisions</h3>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Open questions from the requirements review. Flip a switch to preview each option; the access matrix above updates to match.
          {!canManageUsers && " Management can change these."}
        </p>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {[
            {
              key: "amProjectAccess" as const,
              question: "Q-7 — Project Tracker access",
              text: "Account Managers can see and edit their own Project Tracker entries",
              hint: "Off: Project Tracker is Management-only. On (recommended): Account Managers see only their own entries; Management sees all.",
            },
            {
              key: "amSeeAllOrderIssues" as const,
              question: "Q-8 — Order Excellence visibility",
              text: "Account Managers can view every Account Manager's order issues (read-only)",
              hint: "Off: Account Managers see issues on their own accounts. Either way, only CSRs and Management can edit.",
            },
          ].map((d) => (
            <div key={d.key} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{d.question}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{d.text}</p>
                <p className="mt-0.5 text-xs text-slate-400">{d.hint}</p>
              </div>
              <Switch
                checked={settings[d.key]}
                label={d.text}
                disabled={!canManageUsers}
                onChange={(value) => setDecision(d.key, value, d.question, d.text)}
              />
            </div>
          ))}
        </div>
      </Card>

      <OrderSheetCard />

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plug size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Data Source Integrations</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dataSources.map((src) => {
            const config = settings.integrations[src.name];
            return (
              <div key={src.name} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{src.name}</p>
                  <Badge tone={src.status === "connected" ? "emerald" : "amber"}>{src.status === "connected" ? "Connected" : "Needs attention"}</Badge>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Method: {config.method}</p>
                <p className="mt-0.5 text-xs text-slate-500">Schedule: {config.schedule}</p>
                <p className="mt-0.5 text-xs text-slate-400">Last sync: {src.lastSync}</p>
                {canConfigureSystem && (
                  <Button variant="secondary" className="mt-3 w-full justify-center" onClick={() => setConfiguring(src.name)}>
                    Configure
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Team Access</h3>
          </div>
          {canManageUsers && (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus size={15} /> Add User
            </Button>
          )}
        </div>
        {notice && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <span>{notice}</span>
            <button className="text-xs font-medium hover:underline" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Details</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTeam.map((member) => {
                const sharedBy = shares.filter((s) => s.assistant === member.name).map((s) => s.owner);
                const sharedWith = shares.filter((s) => s.owner === member.name).map((s) => s.assistant);
                return (
                  <tr key={member.id}>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{member.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{member.email}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={roleTone[member.role]}>{roleLabel[member.role]}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-500">
                      {member.role === "assistant" && (
                        <>
                          Assists {member.supports?.join(", ") || "—"}
                          <div className="text-slate-400">{sharedBy.length ? `Dashboards shared: ${sharedBy.join(", ")}` : "No dashboards shared yet"}</div>
                        </>
                      )}
                      {member.role === "account_manager" && sharedWith.length > 0 && `Dashboard shared with ${sharedWith.join(", ")}`}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={member.status === "active" ? "emerald" : "amber"}>{member.status === "active" ? "Active" : "Invited"}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(settings.notifications).map(([label, on]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">{label}</span>
                <Switch checked={on} label={label} onChange={(value) => updateSettings({ notifications: { ...settings.notifications, [label]: value } }, profile)} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">In-app alerts appear under the bell in the top bar. Email delivery is connected in the production build.</p>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">Access & Security</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(settings.security).map(([label, on]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">{label}</span>
                <Switch
                  checked={on}
                  label={label}
                  disabled={!canConfigureSystem}
                  onChange={(value) =>
                    updateSettings({ security: { ...settings.security, [label]: value } }, profile, {
                      action: "Changed security setting",
                      entity: label,
                      details: `Turned ${value ? "on" : "off"}.`,
                    })
                  }
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {canConfigureSystem ? "Changes are recorded in the Audit Trail." : "Only a Super User can change these."} Enforced by the real login once
            SSO is connected.
          </p>
        </Card>
      </div>

      {addOpen && (
        <AddUserModal
          onClose={() => setAddOpen(false)}
          onCreated={(message) => {
            setAddOpen(false);
            setNotice(message);
          }}
        />
      )}
      {configuring && <IntegrationModal source={configuring} onClose={() => setConfiguring(null)} />}
    </div>
  );
}

function OrderSheetCard() {
  const { profile, canManageUsers } = useRole();
  const { settings, updateSettings } = useDemoData();
  const [url, setUrl] = useState(settings.orderSheetUrl);
  const [embedUrl, setEmbedUrl] = useState(settings.orderSheetEmbedUrl);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const dirty = url !== settings.orderSheetUrl || embedUrl !== settings.orderSheetEmbedUrl;

  const save = () => {
    const bad = [url, embedUrl].find((u) => u.trim() && !isWebUrl(u));
    if (bad) return setMessage({ tone: "error", text: "Links must start with https:// (or http://)." });
    updateSettings({ orderSheetUrl: url.trim(), orderSheetEmbedUrl: embedUrl.trim() }, profile, {
      action: "Linked Order Excellence spreadsheet",
      entity: "Order Excellence spreadsheet",
      details: `Open link: ${url.trim() || "none"}. Embed link: ${embedUrl.trim() || "none"}.`,
    });
    setMessage({ tone: "ok", text: "Saved. The Order Excellence page now uses these links." });
  };

  return (
    <div id="order-sheet" className="scroll-mt-4">
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Order Excellence Spreadsheet</h3>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          The CSRs' working spreadsheet. "Open Linked Spreadsheet" opens the first link; the Embedded sheet tab shows the second.
          {!canManageUsers && " Management and Super Users can change these."}
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field label="Spreadsheet link" hint="Google Sheets or Excel Online share link.">
            <input
              className={inputClass}
              value={url}
              disabled={!canManageUsers}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />
          </Field>
          <Field label="Embed link (optional)" hint="Google: File → Share → Publish to web → Embed. Excel Online: File → Share → Embed.">
            <input
              className={inputClass}
              value={embedUrl}
              disabled={!canManageUsers}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/…/pubhtml?widget=true"
            />
          </Field>
        </div>
        {canManageUsers && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={!dirty} className={dirty ? "" : "cursor-not-allowed opacity-50"}>
              Save links
            </Button>
            {message && <span className={`text-sm ${message.tone === "ok" ? "text-emerald-700" : "text-rose-700"}`}>{message.text}</span>}
          </div>
        )}
      </Card>
    </div>
  );
}

function IntegrationModal({ source, onClose }: { source: Source; onClose: () => void }) {
  const { profile } = useRole();
  const { settings, updateSettings } = useDemoData();
  const [form, setForm] = useState<IntegrationConfig>(settings.integrations[source]);
  const [test, setTest] = useState<string | null>(null);
  const set = <K extends keyof IntegrationConfig>(key: K, value: IntegrationConfig[K]) => setForm((f) => ({ ...f, [key]: value }));
  const isSyncore = source === "Facilis Syncore";
  const methods = isSyncore
    ? ["Syncore API v2", "Syncore data suite (when released)"]
    : ["Scheduled report to shared drive", "Read-only SQL connection", "Manual upload"];

  const save = () => {
    updateSettings({ integrations: { ...settings.integrations, [source]: form } }, profile, {
      action: "Configured integration",
      entity: source,
      details: `Method: ${form.method}; schedule: ${form.schedule}; ${isSyncore ? "API base" : "location"}: ${form.location || "—"}${
        form.apiKey !== settings.integrations[source].apiKey ? "; credential updated" : ""
      }.`,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Configure ${source}`}
      description="Connection settings used by the scheduled import."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Method">
          <select className={inputClass} value={form.method} onChange={(e) => set("method", e.target.value)}>
            {[...new Set([...methods, form.method])].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Schedule">
          <select className={inputClass} value={form.schedule} onChange={(e) => set("schedule", e.target.value)}>
            {[...new Set(["Nightly 2:00 AM", "Daily 6:00 AM", "Every 4 hours", "Manual only", form.schedule])].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label={isSyncore ? "API base URL" : "Report folder (Google Drive / SharePoint / network share)"}>
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder={isSyncore ? "https://api.syncore.app/v2/orders" : "e.g. SharePoint › Finance › SmartBooks Exports"}
          />
        </Field>
        {(isSyncore || form.method === "Read-only SQL connection") && (
          <Field label={isSyncore ? "API key (x-api-key)" : "Connection secret"} hint="Demo only: kept in this browser. Production stores it server-side.">
            <input type="password" className={inputClass} value={form.apiKey} onChange={(e) => set("apiKey", e.target.value)} placeholder="••••••••" autoComplete="off" />
          </Field>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() =>
              setTest(
                isSyncore
                  ? "Demo only: no live call made. Waiting on the Syncore rev2 API key from Facilis (NEXT_STEPS I-5)."
                  : "Demo only: no live connection. Waiting on ASI about SQL access or a scheduled report (NEXT_STEPS I-7, I-8)."
              )
            }
          >
            Test connection
          </Button>
          {test && <span className="text-xs text-amber-700">{test}</span>}
        </div>
      </div>
    </Modal>
  );
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (message: string) => void }) {
  const { profile } = useRole();
  const { team, addTeamMember } = useDemoData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("assistant");
  const [supports, setSupports] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Only a Super User can create another Super User.
  const assignableRoles = roleOrder.filter((r) => r !== "super_user" || profile.role === "super_user");
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);

  const submit = () => {
    if (!name.trim()) return setError("Enter the person's name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (team.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) return setError("A user with this email already exists.");
    if (role === "assistant" && supports.length === 0) return setError("Choose at least one Account Manager this assistant supports.");
    const member = addTeamMember(
      {
        name: name.trim(),
        email: email.trim(),
        role,
        supports: role === "assistant" ? supports : undefined,
        status: "invited",
      },
      profile
    );
    onCreated(
      role === "assistant"
        ? `${member.name} invited as an Assistant to ${supports.join(", ")}. They'll see a Sales Dashboard once that Account Manager shares it.`
        : `${member.name} invited as ${roleLabel[role]}.`
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add User"
      description="Create a login for a team member. They'll receive an email invite (once email delivery is connected)."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create User</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A. Rivera" />
          </Field>
          <Field label="Work email">
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@add-impact.com" />
          </Field>
        </div>
        <Field label="Role">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </Field>
        {role === "assistant" && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-600">Supports Account Manager(s)</p>
            <div className="grid grid-cols-2 gap-2">
              {accountManagers.map((am) => (
                <label key={am} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={supports.includes(am)}
                    onChange={(e) => setSupports((s) => (e.target.checked ? [...s, am] : s.filter((x) => x !== am)))}
                  />
                  {am}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Assistants have no access to sales figures by default. Each Account Manager decides whether to share their Sales
              Dashboard with them.
            </p>
          </div>
        )}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>
    </Modal>
  );
}
