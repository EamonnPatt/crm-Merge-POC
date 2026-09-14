import { ExternalLink, Plus } from "lucide-react";
import { Card, PageHeader, Badge, Button, currency } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { projectTrackerEntries, projectStatusLabel, type ProjectTrackerEntry } from "../data/mockData";

const statusTone: Record<ProjectTrackerEntry["status"], "slate" | "sky" | "amber" | "emerald" | "rose"> = {
  researching: "slate",
  active: "sky",
  on_hold: "amber",
  won: "emerald",
  lost: "rose",
};

export default function ProjectTracker() {
  const { canViewProjectTracker } = useRole();

  if (!canViewProjectTracker) {
    return (
      <div>
        <PageHeader title="Project Tracker" description="Management-only workspace for active initiatives and potential opportunities." />
        <RestrictedNotice requiredRoles="Management and Super User" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Project Tracker"
        description="Active initiatives and potential opportunities across all accounts. Management access only."
        actions={
          <Button variant="primary">
            <Plus size={15} /> Add Project
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 font-medium">Account Manager</th>
                <th className="px-5 py-3 font-medium">Date Entered</th>
                <th className="px-5 py-3 font-medium">Target Value</th>
                <th className="px-5 py-3 font-medium">Historical Projects</th>
                <th className="px-5 py-3 font-medium">Potential Projects</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">Doc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectTrackerEntries.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.accountName}</td>
                  <td className="px-5 py-3 text-slate-600">{p.accountManager}</td>
                  <td className="px-5 py-3 text-slate-500">{p.dateEntered}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{currency(p.targetValue)}</td>
                  <td className="px-5 py-3 max-w-[16rem] text-xs text-slate-500">{p.historicalProjects}</td>
                  <td className="px-5 py-3 max-w-[16rem] text-xs text-slate-500">{p.potentialProjects}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone[p.status]}>{projectStatusLabel[p.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 max-w-[14rem] text-xs text-slate-500">{p.notes}</td>
                  <td className="px-5 py-3">
                    {p.docLink ? (
                      <a
                        href={p.docLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                      >
                        Open <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
