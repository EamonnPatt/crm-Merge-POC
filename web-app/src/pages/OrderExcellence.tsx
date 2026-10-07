import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Clock, CheckCircle2, Plus, ExternalLink, Upload, History, Link2, Pencil } from "lucide-react";
import { Card, PageHeader, Badge, Button, Field, Modal, SegmentedControl, StatCard, inputClass, inlineSelectClass } from "../components/ui";
import { SpreadsheetImportModal, type RowResult } from "../components/SpreadsheetImportModal";
import { useRole } from "../context/RoleContext";
import { useDemoData, type OrderIssueInput } from "../context/DemoDataContext";
import { issueTypes, type OrderIssue } from "../data/mockData";
import { relativeStamp } from "../lib/calendar";
import { isWebUrl } from "../lib/url";
import {
  STALE_AFTER_HOURS,
  daysOpen,
  issueStatusLabel,
  issueStatusTone,
  lastTrackerUpdate,
  severityLabel,
  severityTone,
} from "../lib/orderIssues";

type StatusFilter = OrderIssue["status"] | "all" | "active";

const severities: OrderIssue["severity"][] = ["high", "medium", "low"];
const statuses: OrderIssue["status"][] = ["open", "in_progress", "resolved"];


export default function OrderExcellence() {
  const { profile, visibleReps, canEditOrderExcellence, canViewAllOrderIssues, canManageUsers } = useRole();
  const { orderIssues, settings, saveOrderIssue } = useDemoData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"tracker" | "sheet">("tracker");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [editing, setEditing] = useState<OrderIssue | "new" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const query = searchParams.get("q") ?? "";

  // CSRs and Management work the full queue; Account Managers see their own accounts' issues (or all, read-only, per Q-8)
  // and assistants see their Account Managers'.
  const scoped = canViewAllOrderIssues ? orderIssues : orderIssues.filter((i) => visibleReps.includes(i.accountManager));
  const needle = query.trim().toLowerCase();
  const issues = scoped
    .filter((i) => (statusFilter === "all" ? true : statusFilter === "active" ? i.status !== "resolved" : i.status === statusFilter))
    .filter((i) => !needle || [i.id, i.order, i.customer, i.accountManager, i.issueType, i.assignedTo, i.notes].some((v) => v.toLowerCase().includes(needle)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const count = (s: OrderIssue["status"]) => scoped.filter((i) => i.status === s).length;
  const lastUpdate = lastTrackerUpdate(orderIssues);
  const sheetUrl = settings.orderSheetUrl;

  const quickStatus = (issue: OrderIssue, status: OrderIssue["status"]) => saveOrderIssue({ ...issue, status }, profile);

  return (
    <div>
      <PageHeader
        title="Order Excellence"
        description={
          canEditOrderExcellence
            ? "Updated daily by CSRs to flag anything that could push an order past its in-hand date."
            : profile.role === "assistant"
            ? "Order issues on accounts of the Account Managers who've shared with you. Updated daily by CSRs. View only."
            : canViewAllOrderIssues
            ? "Order issues across all accounts. Updated daily by CSRs. View only."
            : "Order issues on your accounts. Updated daily by CSRs. View only."
        }
        actions={
          <>
            {isWebUrl(sheetUrl) ? (
              <a href={sheetUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">
                  <ExternalLink size={15} /> Open Linked Spreadsheet
                </Button>
              </a>
            ) : canManageUsers ? (
              <Link to="/settings#order-sheet">
                <Button variant="secondary">
                  <Link2 size={15} /> Link Spreadsheet
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" disabled title="Management hasn't linked the spreadsheet yet" className="cursor-not-allowed opacity-50">
                <ExternalLink size={15} /> Open Linked Spreadsheet
              </Button>
            )}
            {canEditOrderExcellence && (
              <>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  <Upload size={15} /> Import
                </Button>
                <Button variant="primary" onClick={() => setEditing("new")}>
                  <Plus size={15} /> Log Issue
                </Button>
              </>
            )}
          </>
        }
      />

      {lastUpdate && (
        <Card
          className={`mb-4 flex flex-wrap items-center gap-2 p-3 text-sm ${
            lastUpdate.stale ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {lastUpdate.stale ? <AlertTriangle size={15} /> : <History size={15} />}
          <span data-testid="tracker-last-updated">
            Last updated by <span className="font-semibold">{lastUpdate.by}</span>, {relativeStamp(lastUpdate.at)}
          </span>
          {lastUpdate.stale && (
            <span className="font-medium">
              · No updates in over {STALE_AFTER_HOURS} hours — today's update is due.
            </span>
          )}
        </Card>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={String(count("open"))} deltaTone="negative" icon={<AlertTriangle size={18} />} />
        <StatCard label="In Progress" value={String(count("in_progress"))} icon={<Clock size={18} />} />
        <StatCard label="Resolved" value={String(count("resolved"))} deltaTone="positive" icon={<CheckCircle2 size={18} />} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={[
            { key: "tracker" as const, label: "Tracker" },
            { key: "sheet" as const, label: "Embedded sheet" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "tracker" && (
          <>
            <select aria-label="Status filter" className={inlineSelectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="active">Open + In Progress</option>
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {issueStatusLabel[s]}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Filter by order, customer, CSR…"
              aria-label="Filter issues"
              className={`${inlineSelectClass} min-w-[14rem]`}
              value={query}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
            />
          </>
        )}
      </div>

      {tab === "sheet" ? (
        <EmbeddedSheet />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Issue</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Account Manager</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">In-Hand Date</th>
                  <th className="px-4 py-3 font-medium">Days Open</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Last Update</th>
                  {canEditOrderExcellence && <th className="px-4 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{issue.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{issue.order}</td>
                    <td className="min-w-[9rem] px-4 py-3 text-slate-600">{issue.customer}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{issue.accountManager}</td>
                    <td className="min-w-[8rem] px-4 py-3 text-slate-600">{issue.issueType}</td>
                    <td className="px-4 py-3">
                      <Badge tone={severityTone[issue.severity]}>{severityLabel[issue.severity]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {canEditOrderExcellence ? (
                        <select
                          aria-label={`Status of ${issue.id}`}
                          value={issue.status}
                          onChange={(e) => quickStatus(issue, e.target.value as OrderIssue["status"])}
                          className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:border-brand-400 focus:outline-none"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {issueStatusLabel[s]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge tone={issueStatusTone[issue.status]}>{issueStatusLabel[issue.status]}</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{issue.assignedTo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{issue.inHandDate || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{daysOpen(issue)}</td>
                    <td className="min-w-[16rem] max-w-[22rem] px-4 py-3 text-xs text-slate-500">{issue.notes || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {issue.updatedBy}
                      <div className="text-slate-400">{relativeStamp(issue.updatedAt)}</div>
                    </td>
                    {canEditOrderExcellence && (
                      <td className="px-4 py-3">
                        <Button variant="ghost" className="px-2 py-1" onClick={() => setEditing(issue)} aria-label={`Edit ${issue.id}`}>
                          <Pencil size={14} /> Edit
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-5 py-8 text-center text-sm text-slate-400">
                      {scoped.length === 0 ? "No order issues on your accounts." : "No issues match these filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="mt-3 text-xs text-slate-400">
        Columns are provisional until we have the client's Order Excellence spreadsheet (NEXT_STEPS I-1). Every change is
        recorded in the Audit Trail.
      </p>

      {editing && <IssueModal issue={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {importOpen && <ImportIssuesModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}

function EmbeddedSheet() {
  const { canManageUsers } = useRole();
  const { settings } = useDemoData();
  const url = settings.orderSheetEmbedUrl;
  if (!isWebUrl(url)) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Link2 className="text-slate-400" size={28} />
        <p className="text-sm font-semibold text-slate-800">No embedded spreadsheet yet</p>
        <p className="max-w-lg text-sm text-slate-500">
          Publish the Order Excellence sheet and paste its embed link in Settings. Google Sheets: File → Share → Publish to
          web → Embed. Excel Online: File → Share → Embed.
        </p>
        {canManageUsers && (
          <Link to="/settings#order-sheet" className="text-sm font-medium text-brand-600 hover:underline">
            Go to Settings → Order Excellence Spreadsheet
          </Link>
        )}
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <iframe title="Order Excellence spreadsheet" src={url} className="h-[640px] w-full border-0" />
    </Card>
  );
}

/** Customer → Account Manager, from the accounts list plus customers seen on orders and existing issues. */
function useCustomerOwners() {
  const { accounts, orderIssues, salesOrders } = useDemoData();
  const owners = new Map<string, string>();
  for (const o of salesOrders) owners.set(o.customer.toLowerCase(), o.rep);
  for (const i of orderIssues) owners.set(i.customer.toLowerCase(), i.accountManager);
  for (const a of accounts) owners.set(a.company.toLowerCase(), a.accountManager);
  return owners;
}

const blankIssue = (assignee: string): OrderIssueInput => ({
  order: "",
  customer: "",
  accountManager: "",
  issueType: issueTypes[0],
  severity: "medium",
  status: "open",
  assignedTo: assignee,
  inHandDate: "",
  notes: "",
});

function IssueModal({ issue, onClose }: { issue?: OrderIssue; onClose: () => void }) {
  const { profile } = useRole();
  const { team, accounts, saveOrderIssue, salesOrders } = useDemoData();
  const owners = useCustomerOwners();
  const [form, setForm] = useState<OrderIssueInput>(issue ?? blankIssue(profile.role === "csr" ? profile.name : ""));
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof OrderIssueInput>(key: K, value: OrderIssueInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const csrs = team.filter((m) => m.role === "csr").map((m) => m.name);
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const customers = [...new Set([...accounts.map((a) => a.company), ...salesOrders.map((o) => o.customer)])].sort();

  const submit = () => {
    if (!form.order.trim() || !form.customer.trim()) return setError("Order # and customer are required.");
    if (!form.accountManager) return setError("Choose the Account Manager for this customer.");
    if (!form.assignedTo) return setError("Assign the issue to a CSR.");
    saveOrderIssue({ ...form, order: form.order.trim(), customer: form.customer.trim(), notes: form.notes.trim() }, profile);
    onClose();
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={issue ? `Update ${issue.id}` : "Log Order Issue"}
      description={issue ? `${issue.customer} · opened ${issue.openedOn}` : "Flag anything that could push an order past its in-hand date."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{issue ? "Save Changes" : "Log Issue"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Order # *">
          <input className={inputClass} value={form.order} onChange={(e) => set("order", e.target.value)} placeholder="e.g. SO-88231" />
        </Field>
        <Field label="Customer *">
          <input
            className={inputClass}
            list="issue-customers"
            value={form.customer}
            onChange={(e) => {
              const owner = owners.get(e.target.value.trim().toLowerCase());
              setForm((f) => ({ ...f, customer: e.target.value, accountManager: owner ?? f.accountManager }));
            }}
          />
          <datalist id="issue-customers">
            {customers.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Account Manager *" hint="Filled in from the customer when we know it.">
          <select className={inputClass} value={form.accountManager} onChange={(e) => set("accountManager", e.target.value)}>
            <option value="">Select…</option>
            {accountManagers.map((am) => (
              <option key={am} value={am}>
                {am}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Issue type">
          <select className={inputClass} value={form.issueType} onChange={(e) => set("issueType", e.target.value)}>
            {[...new Set([...issueTypes, form.issueType])].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Severity">
          <select className={inputClass} value={form.severity} onChange={(e) => set("severity", e.target.value as OrderIssue["severity"])}>
            {severities.map((s) => (
              <option key={s} value={s}>
                {severityLabel[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as OrderIssue["status"])}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {issueStatusLabel[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assigned to *">
          <select className={inputClass} value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
            <option value="">Select…</option>
            {[...new Set([...csrs, form.assignedTo].filter(Boolean))].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="In-hand date">
          <input type="date" className={inputClass} value={form.inHandDate} onChange={(e) => set("inHandDate", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea className={`${inputClass} h-20 resize-none`} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="What happened, what's been done, next step…" />
          </Field>
        </div>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}

function parseDateText(text: string): string | null {
  const t = text.trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(t);
  if (us) {
    const year = us[3].length === 2 ? `20${us[3]}` : us[3];
    return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  }
  return null;
}

function parseChoice<T extends string>(text: string, choices: Record<string, T>, fallback: T): T | null {
  const key = text.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return fallback;
  return choices[key] ?? null;
}

function ImportIssuesModal({ onClose }: { onClose: () => void }) {
  const { profile } = useRole();
  const { team, importOrderIssues } = useDemoData();
  const owners = useCustomerOwners();
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);

  const toRecord = (v: Record<string, string>): RowResult<OrderIssueInput> => {
    if (!v.order || !v.customer) return { error: "Missing order # or customer." };
    const accountManager = accountManagers.find((am) => am.toLowerCase() === v.accountManager.toLowerCase()) ?? owners.get(v.customer.toLowerCase());
    if (!accountManager) return { error: `Unknown Account Manager for "${v.customer}". Add an Account Manager column.` };
    const severity = parseChoice<OrderIssue["severity"]>(v.severity, { high: "high", h: "high", medium: "medium", med: "medium", m: "medium", low: "low", l: "low" }, "medium");
    if (!severity) return { error: `Severity "${v.severity}" isn't High, Medium or Low.` };
    const status = parseChoice<OrderIssue["status"]>(
      v.status,
      { open: "open", new: "open", inprogress: "in_progress", working: "in_progress", pending: "in_progress", resolved: "resolved", closed: "resolved", done: "resolved", complete: "resolved" },
      "open"
    );
    if (!status) return { error: `Status "${v.status}" isn't Open, In Progress or Resolved.` };
    const inHandDate = parseDateText(v.inHandDate);
    if (inHandDate === null) return { error: `In-hand date "${v.inHandDate}" isn't a date (use YYYY-MM-DD or M/D/YYYY).` };
    return {
      record: {
        id: v.id || undefined,
        order: v.order,
        customer: v.customer,
        accountManager,
        issueType: v.issueType || "Other",
        severity,
        status,
        assignedTo: v.assignedTo || profile.name,
        inHandDate,
        notes: v.notes,
      },
    };
  };

  return (
    <SpreadsheetImportModal
      title="Import Order Excellence Spreadsheet"
      description="Load issues from the CSRs' spreadsheet. Rows with an existing Issue ID update that issue; other rows are added."
      fields={[
        { key: "id", label: "Issue ID", aliases: ["issue #", "issue no", "issueid"] },
        { key: "order", label: "Order #", required: true, aliases: ["order", "order number", "so", "sales order", "job", "job number"] },
        { key: "customer", label: "Customer", required: true, aliases: ["client", "account", "company"] },
        { key: "accountManager", label: "Account Manager", aliases: ["am", "rep", "sales rep", "account mgr"] },
        { key: "issueType", label: "Issue Type", aliases: ["type", "issue", "problem"] },
        { key: "severity", label: "Severity", aliases: ["priority"] },
        { key: "status", label: "Status" },
        { key: "assignedTo", label: "Assigned To", aliases: ["csr", "owner", "assignee"] },
        { key: "inHandDate", label: "In-Hand Date", aliases: ["in hand", "inhand", "in hand date", "due date", "due"] },
        { key: "notes", label: "Notes", aliases: ["comments", "comment", "update"] },
      ]}
      toRecord={toRecord}
      previewColumns={[
        { label: "Issue", render: (r) => r.id ?? <span className="text-slate-400">new</span> },
        { label: "Order", render: (r) => r.order },
        { label: "Customer", render: (r) => r.customer },
        { label: "AM", render: (r) => r.accountManager },
        { label: "Type", render: (r) => r.issueType },
        { label: "Severity", render: (r) => <Badge tone={severityTone[r.severity]}>{severityLabel[r.severity]}</Badge> },
        { label: "Status", render: (r) => <Badge tone={issueStatusTone[r.status]}>{issueStatusLabel[r.status]}</Badge> },
        { label: "Assigned", render: (r) => r.assignedTo },
        { label: "In-hand", render: (r) => r.inHandDate || "—" },
      ]}
      onImport={(records, fileName) => {
        const { created, updated } = importOrderIssues(records, fileName, profile);
        return `Imported from ${fileName}: ${created} new issue(s), ${updated} updated. The changes are in the Audit Trail.`;
      }}
      onClose={onClose}
      footnote="Accepted values — Severity: High / Medium / Low. Status: Open / In Progress / Resolved (Closed and Done count as Resolved). Dates: YYYY-MM-DD or M/D/YYYY."
    />
  );
}
