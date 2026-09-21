import { Plus } from "lucide-react";
import { Card, PageHeader, Button, currency } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { pipelineDeals, pipelineStages } from "../data/mockData";

export default function SalesPipeline() {
  const { profile, canViewCpr, canViewCompanyMetrics } = useRole();

  if (!canViewCpr) {
    return (
      <div>
        <PageHeader title="Sales Pipeline" description="Sales strategy pipeline." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }

  const scopedDeals = canViewCompanyMetrics ? pipelineDeals : pipelineDeals.filter((d) => d.owner === profile.name);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Sales Pipeline"
        description={
          canViewCompanyMetrics
            ? "Sales strategy pipeline across all active and won deals."
            : `Your sales strategy pipeline, ${profile.name}.`
        }
        actions={
          <Button variant="primary">
            <Plus size={15} /> Add Deal
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {pipelineStages.map((stage) => {
          const deals = scopedDeals.filter((d) => d.stage === stage.key);
          const total = deals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div key={stage.key} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                  {stage.label}
                </span>
                <span className="text-xs text-slate-400">{deals.length}</span>
              </div>
              <p className="mb-2 px-1 text-xs text-slate-400">{currency(total)}</p>
              <div className="flex flex-1 flex-col gap-2">
                {deals.map((deal) => (
                  <Card key={deal.id} className="cursor-pointer p-3 hover:shadow-md">
                    <p className="text-sm font-medium text-slate-800">{deal.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{deal.company}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{currency(deal.value)}</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                        {deal.owner
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Close: {deal.closeDate}</p>
                  </Card>
                ))}
                {deals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
