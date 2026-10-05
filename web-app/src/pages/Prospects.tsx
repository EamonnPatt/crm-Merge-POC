import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, PageHeader, Badge, Button, Field, Modal, currency, inputClass } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { pipelineStages, type PipelineStageKey } from "../data/mockData";
import { todayIso } from "../lib/calendar";
import { parseAmount } from "../lib/amount";

const stageTone: Record<PipelineStageKey, "slate" | "sky" | "amber" | "violet" | "emerald"> = {
  lead: "slate",
  qualified: "sky",
  proposal: "amber",
  negotiation: "violet",
  closed_won: "emerald",
};

export default function Prospects() {
  const { profile, canViewCpr, canViewCompanyMetrics } = useRole();
  const { prospects } = useDemoData();
  const [addOpen, setAddOpen] = useState(false);

  if (!canViewCpr) {
    return (
      <div>
        <PageHeader title="Prospects" description="Active leads being worked ahead of the sales pipeline." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }

  const visible = canViewCompanyMetrics ? prospects : prospects.filter((p) => p.owner === profile.name);

  return (
    <div>
      <PageHeader
        title="Prospects"
        description={
          canViewCompanyMetrics ? "Active leads being worked ahead of the sales pipeline." : "Your active leads, ahead of your sales pipeline."
        }
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add Prospect
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Est. Value</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Last Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((p) => {
                const stageLabel = pipelineStages.find((s) => s.key === p.stage)?.label ?? p.stage;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-5 py-3 text-slate-600">{p.company}</td>
                    <td className="px-5 py-3">
                      <Badge tone={stageTone[p.stage]}>{stageLabel}</Badge>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{currency(p.estValue)}</td>
                    <td className="px-5 py-3 text-slate-600">{p.owner}</td>
                    <td className="px-5 py-3 text-slate-500">{p.lastContact}</td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                    No prospects yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {addOpen && <AddProspectModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddProspectModal({ onClose }: { onClose: () => void }) {
  const { profile, canViewCompanyMetrics } = useRole();
  const { team, addProspect } = useDemoData();
  const [form, setForm] = useState({
    name: "",
    company: "",
    stage: "lead" as PipelineStageKey,
    estValue: "",
    owner: canViewCompanyMetrics ? "" : profile.name,
    lastContact: todayIso(),
  });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);

  const submit = () => {
    const estValue = parseAmount(form.estValue);
    if (!form.name.trim() || !form.company.trim()) return setError("Contact name and company are required.");
    if (!form.owner) return setError("Choose the Account Manager who owns this prospect.");
    if (estValue === null) return setError('Enter an estimated value, e.g. "40000" or "40k".');
    addProspect({ ...form, name: form.name.trim(), company: form.company.trim(), estValue }, profile);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Prospect"
      description="A lead being worked before it becomes a pipeline deal."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Add Prospect</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contact name *">
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Company *">
          <input className={inputClass} value={form.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field label="Stage">
          <select className={inputClass} value={form.stage} onChange={(e) => set("stage", e.target.value as PipelineStageKey)}>
            {pipelineStages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Est. value *" hint='"40k", "$40,000" and "1.2m" all work.'>
          <input className={inputClass} value={form.estValue} onChange={(e) => set("estValue", e.target.value)} placeholder="e.g. 40k" />
        </Field>
        <Field label="Owner *">
          <select className={inputClass} value={form.owner} disabled={!canViewCompanyMetrics} onChange={(e) => set("owner", e.target.value)}>
            <option value="">Select…</option>
            {accountManagers.map((am) => (
              <option key={am} value={am}>
                {am}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Last contact">
          <input type="date" className={inputClass} value={form.lastContact} onChange={(e) => set("lastContact", e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}
