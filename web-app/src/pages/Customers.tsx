import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Download, CheckCircle2, Circle, Pencil } from "lucide-react";
import { Card, PageHeader, Badge, Button, Field, Modal, SegmentedControl, currency, inputClass, inlineSelectClass } from "../components/ui";
import { CsvImportButton } from "../components/CsvImportButton";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { downloadCsv } from "../lib/csv";
import { todayIso } from "../lib/calendar";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import type { AccountPriority, AccountSource, Customer } from "../data/mockData";

const priorityTone: Record<AccountPriority, "rose" | "amber" | "sky"> = {
  A: "rose",
  B: "amber",
  Prospect: "sky",
};

const priorities: AccountPriority[] = ["A", "B", "Prospect"];

const sourceTone: Record<AccountSource, "sky" | "violet" | "emerald"> = {
  "ASI SmartBooks": "sky",
  "Facilis Syncore": "violet",
  "Created in app": "emerald",
};

export default function Customers() {
  const { profile, canViewCompanyMetrics, canViewCpr, canCreateAccounts } = useRole();
  const { accounts } = useDemoData();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [filter, setFilter] = useState<AccountPriority | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  if (!canViewCpr) {
    return (
      <div>
        <PageHeader title="Accounts" description="Customer accounts consolidated from ASI SmartBooks and Facilis Syncore." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }

  const scoped = canViewCompanyMetrics ? accounts : accounts.filter((c) => c.accountManager === profile.ownerName);
  const needle = query.trim().toLowerCase();
  const visible = scoped
    .filter((c) => filter === "all" || c.priority === filter)
    .filter((c) => !needle || [c.company, c.name, c.email, c.accountManager, c.notes].some((v) => v.toLowerCase().includes(needle)));

  return (
    <div>
      <PageHeader
        title="Accounts"
        description={
          canViewCompanyMetrics
            ? "All accounts consolidated from ASI SmartBooks and Facilis Syncore. Management creates new accounts and assigns them to an Account Manager."
            : `Accounts assigned to you, ${profile.name}. Add notes and log weekly/monthly activity. New accounts are created by Management.`
        }
        actions={
          <>
            <CsvImportButton label="Import" />
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  "accounts.csv",
                  visible.map((c) => ({
                    id: c.id,
                    name: c.name,
                    company: c.company,
                    account_manager: c.accountManager,
                    priority: c.priority,
                    lifetime_value: c.lifetimeValue,
                    ly_gross_profit: c.lyGrossProfit,
                    since: c.since,
                    source: c.source,
                  }))
                )
              }
            >
              <Download size={15} /> Export
            </Button>
            {canCreateAccounts && (
              <Button variant="primary" onClick={() => setAddOpen(true)}>
                <Plus size={15} /> Add Account
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={[{ key: "all" as const, label: "All" }, ...priorities.map((p) => ({ key: p, label: `Priority ${p}` }))]}
          value={filter}
          onChange={setFilter}
        />
        <input
          type="search"
          aria-label="Filter accounts"
          placeholder="Filter by company, contact, note…"
          className={`${inlineSelectClass} min-w-[14rem]`}
          value={query}
          onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        />
        <span className="text-xs text-slate-400">Click Wkly / Mthly to log activity; use the pencil to edit notes.</span>
      </div>

      {justAdded && (
        <Card className="mb-4 flex items-center justify-between border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <span>{justAdded}</span>
          <button className="text-xs font-medium hover:underline" onClick={() => setJustAdded(null)}>
            Dismiss
          </button>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Account Manager</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Lifetime Value</th>
                <th className="px-5 py-3 font-medium">LY Gross Profit</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {c.name}
                    {c.source === "Created in app" && c.since === todayIso() && (
                      <span className="ml-2">
                        <Badge tone="emerald">New</Badge>
                      </span>
                    )}
                    <div className="text-xs font-normal text-slate-400">{c.email}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{c.company}</td>
                  <td className="px-5 py-3 text-slate-600">{c.accountManager}</td>
                  <td className="px-5 py-3">
                    <Badge tone={priorityTone[c.priority]}>{c.priority}</Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{c.lifetimeValue > 0 ? currency(c.lifetimeValue) : "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{c.lyGrossProfit > 0 ? currency(c.lyGrossProfit) : "—"}</td>
                  <td className="px-5 py-3">
                    <ActivityToggles account={c} />
                  </td>
                  <td className="px-5 py-3 max-w-xs text-xs text-slate-500">
                    <AccountNotes account={c} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={sourceTone[c.source]}>{c.source}</Badge>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-slate-400">
                    No accounts match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {addOpen && (
        <AddAccountModal
          onClose={() => setAddOpen(false)}
          onCreated={(message) => {
            setAddOpen(false);
            setFilter("all");
            setJustAdded(message);
          }}
        />
      )}
    </div>
  );
}

const emptyForm = {
  company: "",
  name: "",
  email: "",
  phone: "",
  accountManager: "",
  priority: "B" as AccountPriority,
  source: "Created in app" as AccountSource,
  notes: "",
};

function AddAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: (message: string) => void }) {
  const { profile } = useRole();
  const { team, addAccount } = useDemoData();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const accountManagers = team.filter((m) => m.role === "account_manager");
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.company.trim() || !form.name.trim()) return setError("Company and primary contact are required.");
    if (!form.accountManager) return setError("Assign the account to an Account Manager.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
    const account = addAccount(
      {
        company: form.company.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        accountManager: form.accountManager,
        priority: form.priority,
        source: form.source,
        notes: form.notes.trim(),
        totalOrders: 0,
        lifetimeValue: 0,
        lyGrossProfit: 0,
        since: todayIso(),
        weeklyActivityLogged: false,
        monthlyActivityLogged: false,
      },
      profile
    );
    onCreated(`${account.company} (${account.id}) created and assigned to ${account.accountManager}. It now appears in their Accounts list.`);
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title="Add Account"
      description="Create a new customer account and assign it to an Account Manager."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create Account</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company *">
          <input className={inputClass} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Pinecrest Outfitters" />
        </Field>
        <Field label="Primary contact *">
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 000-0000" />
        </Field>
        <Field label="Account Manager *">
          <select className={inputClass} value={form.accountManager} onChange={(e) => set("accountManager", e.target.value)}>
            <option value="">Select…</option>
            {accountManagers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputClass} value={form.priority} onChange={(e) => set("priority", e.target.value as AccountPriority)}>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p === "Prospect" ? "Prospect" : `Priority ${p}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source system" hint="Where this customer's orders are recorded. Once integrations are live, the account links to that system's record.">
          <select className={inputClass} value={form.source} onChange={(e) => set("source", e.target.value as AccountSource)}>
            <option value="Created in app">Created in app (new customer)</option>
            <option value="ASI SmartBooks">ASI SmartBooks</option>
            <option value="Facilis Syncore">Facilis Syncore</option>
          </select>
        </Field>
        <Field label="Notes">
          <textarea className={`${inputClass} h-[74px] resize-none`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}

function ActivityToggles({ account }: { account: Customer }) {
  const { profile } = useRole();
  const { updateAccountActivity } = useDemoData();
  const toggle = (key: "weeklyActivityLogged" | "monthlyActivityLogged", label: string) => {
    const on = account[key];
    return (
      <button
        onClick={() => updateAccountActivity(account.id, { [key]: !on }, profile)}
        className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-slate-100"
        title={on ? `${label} activity logged — click to clear` : `Log ${label.toLowerCase()} activity`}
        aria-pressed={on}
        aria-label={`${label} activity for ${account.company}`}
      >
        {on ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-300" />}
        {label === "Weekly" ? "Wkly" : "Mthly"}
      </button>
    );
  };
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      {toggle("weeklyActivityLogged", "Weekly")}
      {toggle("monthlyActivityLogged", "Monthly")}
    </div>
  );
}

function AccountNotes({ account }: { account: Customer }) {
  const { profile } = useRole();
  const { updateAccountActivity } = useDemoData();
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <div className="group flex items-start gap-1.5">
        <span>{account.notes || <span className="text-slate-300">No notes</span>}</span>
        <button
          className="shrink-0 rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
          aria-label={`Edit notes for ${account.company}`}
          onClick={() => setDraft(account.notes)}
        >
          <Pencil size={12} />
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <textarea
        aria-label={`Notes for ${account.company}`}
        className={`${inputClass} h-16 resize-none text-xs`}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="flex gap-1.5">
        <Button
          className="px-2 py-1 text-xs"
          onClick={() => {
            if (draft.trim() !== account.notes) updateAccountActivity(account.id, { notes: draft.trim() }, profile);
            setDraft(null);
          }}
        >
          Save
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setDraft(null)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
