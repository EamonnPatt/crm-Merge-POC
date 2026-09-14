import { AlertTriangle, Clock, CheckCircle2, Plus, ExternalLink } from "lucide-react";
import { Card, PageHeader, Badge, Button, StatCard } from "../components/ui";
import { useRole } from "../context/RoleContext";
import { orderIssues, type OrderIssue } from "../data/mockData";

const severityTone: Record<OrderIssue["severity"], "rose" | "amber" | "slate"> = {
  high: "rose",
  medium: "amber",
  low: "slate",
};

const statusTone: Record<OrderIssue["status"], "rose" | "sky" | "emerald"> = {
  open: "rose",
  in_progress: "sky",
  resolved: "emerald",
};

const statusLabel: Record<OrderIssue["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export default function OrderExcellence() {
  const { canEditOrderExcellence } = useRole();
  const open = orderIssues.filter((i) => i.status === "open").length;
  const inProgress = orderIssues.filter((i) => i.status === "in_progress").length;
  const resolved = orderIssues.filter((i) => i.status === "resolved").length;

  return (
    <div>
      <PageHeader
        title="Order Excellence"
        description={
          canEditOrderExcellence
            ? "Updated nightly by CSRs to flag anything that could push an order past its in-hand date."
            : "Tracking order-related issues across both source systems. Updated daily by CSRs."
        }
        actions={
          <>
            <Button variant="secondary">
              <ExternalLink size={15} /> Open Linked Spreadsheet
            </Button>
            {canEditOrderExcellence && (
              <Button variant="primary">
                <Plus size={15} /> Log Issue
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={String(open)} deltaTone="negative" icon={<AlertTriangle size={18} />} />
        <StatCard label="In Progress" value={String(inProgress)} icon={<Clock size={18} />} />
        <StatCard label="Resolved (30d)" value={String(resolved)} deltaTone="positive" icon={<CheckCircle2 size={18} />} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Issue</th>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Assigned To</th>
                <th className="px-5 py-3 font-medium">Days Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{issue.id}</td>
                  <td className="px-5 py-3 text-slate-600">{issue.order}</td>
                  <td className="px-5 py-3 text-slate-600">{issue.customer}</td>
                  <td className="px-5 py-3 text-slate-600">{issue.issueType}</td>
                  <td className="px-5 py-3">
                    <Badge tone={severityTone[issue.severity]}>
                      {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone[issue.status]}>{statusLabel[issue.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{issue.assignedTo}</td>
                  <td className="px-5 py-3 text-slate-500">{issue.daysOpen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
