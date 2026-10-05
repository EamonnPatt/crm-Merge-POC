import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, PageHeader, Button, Field, Modal, currency, inputClass } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { pipelineStages, type PipelineStageKey } from "../data/mockData";
import { initialsOf } from "../lib/roles";
import { isoDaysFromToday } from "../lib/calendar";
import { parseAmount } from "../lib/amount";

export default function SalesPipeline() {
  const { profile, canViewCpr, canViewCompanyMetrics } = useRole();
  const { deals } = useDemoData();
  const [addOpen, setAddOpen] = useState(false);

  if (!canViewCpr) {
    return (
      <div>
        <PageHeader title="Sales Pipeline" description="Sales strategy pipeline." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }

  const scopedDeals = canViewCompanyMetrics ? deals : deals.filter((d) => d.owner === profile.name);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Sales Pipeline"
        description={canViewCompanyMetrics ? "Sales strategy pipeline across all active and won deals." : `Your sales strategy pipeline, ${profile.name}.`}
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add Deal
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {pipelineStages.map((stage) => {
          const stageDeals = scopedDeals.filter((d) => d.stage === stage.key);
          const total = stageDeals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div key={stage.key} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                  {stage.label}
                </span>
                <span className="text-xs text-slate-400">{stageDeals.length}</span>
              </div>
              <p className="mb-2 px-1 text-xs text-slate-400">{currency(total)}</p>
              <div className="flex flex-1 flex-col gap-2">
                {stageDeals.map((deal) => (
                  <Card key={deal.id} className="p-3 hover:shadow-md">
                    <p className="text-sm font-medium text-slate-800">{deal.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{deal.company}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{currency(deal.value)}</span>
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700"
                        title={deal.owner}
                      >
                        {initialsOf(deal.owner)}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Close: {deal.closeDate}</p>
                  </Card>
                ))}
                {stageDeals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">No deals</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addOpen && <AddDealModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddDealModal({ onClose }: { onClose: () => void }) {
  const { profile, canViewCompanyMetrics } = useRole();
  const { team, accounts, addDeal } = useDemoData();
  const [form, setForm] = useState({
    name: "",
    company: "",
    value: "",
    owner: canViewCompanyMetrics ? "" : profile.name,
    stage: "lead" as PipelineStageKey,
    closeDate: isoDaysFromToday(30),
  });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const companies = accounts.filter((a) => canViewCompanyMetrics || a.accountManager === profile.name).map((a) => a.company);

  const submit = () => {
    const value = parseAmount(form.value);
    if (!form.name.trim() || !form.company.trim()) return setError("Deal name and company are required.");
    if (!form.owner) return setError("Choose the deal owner.");
    if (value === null) return setError('Enter the deal value, e.g. "85000" or "85k".');
    if (!form.closeDate) return setError("Choose an expected close date.");
    addDeal({ ...form, name: form.name.trim(), company: form.company.trim(), value }, profile);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Deal"
      description="Add an opportunity to the sales pipeline."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Add Deal</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Deal name *">
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Fall uniform refresh" />
        </Field>
        <Field label="Company *">
          <input className={inputClass} list="deal-companies" value={form.company} onChange={(e) => set("company", e.target.value)} />
          <datalist id="deal-companies">
            {companies.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Value *" hint='"85k", "$85,000" and "1.2m" all work.'>
          <input className={inputClass} value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="e.g. 85k" />
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
        <Field label="Expected close *">
          <input type="date" className={inputClass} value={form.closeDate} onChange={(e) => set("closeDate", e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}
