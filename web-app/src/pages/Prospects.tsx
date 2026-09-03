import { Plus } from "lucide-react";
import { Card, PageHeader, Badge, Button, currency } from "../components/ui";
import { prospects, pipelineStages, type PipelineStageKey } from "../data/mockData";

const stageTone: Record<PipelineStageKey, "slate" | "sky" | "amber" | "violet" | "emerald"> = {
  lead: "slate",
  qualified: "sky",
  proposal: "amber",
  negotiation: "violet",
  closed_won: "emerald",
};

export default function Prospects() {
  return (
    <div>
      <PageHeader
        title="Prospects"
        description="Active leads being worked ahead of the sales pipeline."
        actions={
          <Button variant="primary">
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
              {prospects.map((p) => {
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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
