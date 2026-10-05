import { useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, PageHeader, Badge, Button, Field, Modal, currency, inputClass, inlineSelectClass } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { useDemoData, type ProjectInput } from "../context/DemoDataContext";
import { projectStatusLabel, type ProjectLink, type ProjectTrackerEntry } from "../data/mockData";
import { AS_OF_ISO, monthLabel } from "../lib/calendar";
import { parseAmount } from "../lib/amount";
import { isWebUrl } from "../lib/url";

type Status = ProjectTrackerEntry["status"];

const statusTone: Record<Status, "slate" | "sky" | "amber" | "emerald" | "rose"> = {
  researching: "slate",
  active: "sky",
  on_hold: "amber",
  won: "emerald",
  lost: "rose",
};

const statuses = Object.keys(projectStatusLabel) as Status[];

export default function ProjectTracker() {
  const { profile, canViewProjectTracker, canViewAllProjects } = useRole();
  const { projects, team } = useDemoData();
  const [amFilter, setAmFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [monthFilter, setMonthFilter] = useState("");
  const [editing, setEditing] = useState<ProjectTrackerEntry | "new" | null>(null);

  if (!canViewProjectTracker) {
    return (
      <div>
        <PageHeader title="Project Tracker" description="CPR Sales Plan: active initiatives and potential opportunities." />
        <RestrictedNotice requiredRoles="Management, Super User, and Account Managers (own entries)" />
      </div>
    );
  }

  const scoped = canViewAllProjects ? projects : projects.filter((p) => p.accountManager === profile.name);
  const visible = scoped
    .filter((p) => !amFilter || p.accountManager === amFilter)
    .filter((p) => !statusFilter || p.status === statusFilter)
    .filter((p) => !monthFilter || p.month === monthFilter)
    .sort((a, b) => b.month.localeCompare(a.month) || a.accountName.localeCompare(b.accountName));
  const months = [...new Set(scoped.map((p) => p.month))].sort().reverse();
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const filtered = Boolean(amFilter || statusFilter || monthFilter);

  return (
    <div>
      <PageHeader
        title="Project Tracker"
        description={
          canViewAllProjects
            ? "CPR Sales Plan: active initiatives and potential opportunities across all accounts."
            : `Your CPR Sales Plan entries, ${profile.name}. Management sees every Account Manager's plan.`
        }
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus size={15} /> Add Project
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statuses.map((s) => {
          const rows = visible.filter((p) => p.status === s);
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? "" : s)}
              className={`rounded-xl border bg-white p-4 text-left shadow-sm transition-colors ${active ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center justify-between">
                <Badge tone={statusTone[s]}>{projectStatusLabel[s]}</Badge>
                <span className="text-xs text-slate-400">{rows.length}</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">{currency(rows.reduce((a, p) => a + p.targetValue, 0))}</p>
              <p className="text-xs text-slate-400">total target value</p>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {canViewAllProjects && (
          <select aria-label="Account Manager filter" className={inlineSelectClass} value={amFilter} onChange={(e) => setAmFilter(e.target.value)}>
            <option value="">All Account Managers</option>
            {accountManagers.map((am) => (
              <option key={am} value={am}>
                {am}
              </option>
            ))}
          </select>
        )}
        <select aria-label="Status filter" className={inlineSelectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | "")}>
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {projectStatusLabel[s]}
            </option>
          ))}
        </select>
        <select aria-label="Month filter" className={inlineSelectClass} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        {filtered && (
          <button
            className="text-sm font-medium text-brand-600 hover:underline"
            onClick={() => {
              setAmFilter("");
              setStatusFilter("");
              setMonthFilter("");
            }}
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-slate-500">
          {visible.length} project{visible.length === 1 ? "" : "s"} · <span className="font-semibold text-slate-800">{currency(visible.reduce((a, p) => a + p.targetValue, 0))}</span> target
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Account Manager</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Target Value</th>
                <th className="px-4 py-3 font-medium">Historical Projects</th>
                <th className="px-4 py-3 font-medium">Potential Projects</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Links</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="min-w-[11rem] px-4 py-3 font-medium text-slate-800">
                    {p.accountName}
                    <div className="text-[11px] font-normal text-slate-400">
                      Updated {p.updatedAt.slice(0, 10)} · {p.updatedBy}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.accountManager}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{monthLabel(p.month)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{currency(p.targetValue)}</td>
                  <td className="max-w-[14rem] px-4 py-3 text-xs text-slate-500">{p.historicalProjects || "—"}</td>
                  <td className="max-w-[14rem] px-4 py-3 text-xs text-slate-500">{p.potentialProjects || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[p.status]}>{projectStatusLabel[p.status]}</Badge>
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 text-xs text-slate-500">{p.notes || "—"}</td>
                  <td className="px-4 py-3">
                    {p.links.length === 0 ? (
                      <span className="text-xs text-slate-300">—</span>
                    ) : (
                      <div className="flex max-w-[12rem] flex-col gap-1">
                        {p.links.map((link, i) =>
                          isWebUrl(link.url) ? (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                            >
                              <ExternalLink size={12} className="shrink-0" /> <span className="truncate">{link.label}</span>
                            </a>
                          ) : (
                            <span key={i} className="text-xs text-slate-400">
                              {link.label}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" className="px-2 py-1" onClick={() => setEditing(p)} aria-label={`Edit ${p.accountName}`}>
                      <Pencil size={14} /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-400">
                    {scoped.length === 0 ? "No projects yet. Use Add Project to start your sales plan." : "No projects match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <ProjectModal project={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ProjectModal({ project, onClose }: { project?: ProjectTrackerEntry; onClose: () => void }) {
  const { profile, canViewAllProjects } = useRole();
  const { team, accounts, saveProject } = useDemoData();
  const [form, setForm] = useState<Omit<ProjectInput, "targetValue">>(
    project ?? {
      accountName: "",
      accountManager: canViewAllProjects ? "" : profile.name,
      month: AS_OF_ISO.slice(0, 7),
      historicalProjects: "",
      potentialProjects: "",
      status: "researching",
      notes: "",
      links: [],
    }
  );
  const [target, setTarget] = useState(project ? String(project.targetValue) : "");
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setLink = (index: number, patch: Partial<ProjectLink>) => set("links", form.links.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const accountOptions = accounts.filter((a) => canViewAllProjects || a.accountManager === profile.name).map((a) => a.company);

  const submit = () => {
    const targetValue = parseAmount(target);
    if (!form.accountName.trim()) return setError("Enter the account.");
    if (!form.accountManager) return setError("Choose the Account Manager.");
    if (!/^\d{4}-\d{2}$/.test(form.month)) return setError("Choose the plan month.");
    if (targetValue === null) return setError('Enter the target value, e.g. "65000", "65k" or "$1.2m".');
    const links = form.links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })).filter((l) => l.label || l.url);
    const bad = links.find((l) => !isWebUrl(l.url));
    if (bad) return setError(`"${bad.label || bad.url}" needs a full link starting with https://`);
    saveProject(
      {
        ...form,
        id: project?.id,
        accountName: form.accountName.trim(),
        targetValue,
        links: links.map((l) => ({ ...l, label: l.label || "Link" })),
      },
      profile
    );
    onClose();
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={project ? `Edit ${project.accountName}` : "Add Project"}
      description="CPR Sales Plan entry. Changes are recorded in the Audit Trail."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{project ? "Save Changes" : "Add Project"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Account *">
          <input className={inputClass} list="project-accounts" value={form.accountName} onChange={(e) => set("accountName", e.target.value)} />
          <datalist id="project-accounts">
            {accountOptions.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>
        <Field label="Account Manager *">
          <select className={inputClass} value={form.accountManager} disabled={!canViewAllProjects} onChange={(e) => set("accountManager", e.target.value)}>
            <option value="">Select…</option>
            {accountManagers.map((am) => (
              <option key={am} value={am}>
                {am}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Month *">
          <input type="month" className={inputClass} value={form.month} onChange={(e) => set("month", e.target.value)} />
        </Field>
        <Field label="Target value *" hint='Shorthand works: "65k", "$65,000", "1.2m".'>
          <input className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 65k" />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {projectStatusLabel[s]}
              </option>
            ))}
          </select>
        </Field>
        <div />
        <Field label="Historical projects">
          <textarea className={`${inputClass} h-16 resize-none`} value={form.historicalProjects} onChange={(e) => set("historicalProjects", e.target.value)} />
        </Field>
        <Field label="Potential projects">
          <textarea className={`${inputClass} h-16 resize-none`} value={form.potentialProjects} onChange={(e) => set("potentialProjects", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea className={`${inputClass} h-16 resize-none`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-600">Links (files, quotes, orders, supporting docs)</p>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => set("links", [...form.links, { label: "", url: "" }])}>
            <Plus size={13} /> Add link
          </Button>
        </div>
        {form.links.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">No links yet.</p>
        ) : (
          <div className="space-y-2">
            {form.links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Link ${i + 1} label`}
                  className={`${inputClass} w-40 shrink-0`}
                  placeholder="Label, e.g. Quote"
                  value={link.label}
                  onChange={(e) => setLink(i, { label: e.target.value })}
                />
                <input aria-label={`Link ${i + 1} URL`} className={inputClass} placeholder="https://…" value={link.url} onChange={(e) => setLink(i, { url: e.target.value })} />
                <button
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                  aria-label={`Remove link ${i + 1}`}
                  onClick={() => set("links", form.links.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}
