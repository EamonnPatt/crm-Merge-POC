import { Download } from "lucide-react";
import { Card, PageHeader, Button } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { downloadCsv } from "../lib/csv";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";

export default function AuditTrail() {
  const { canViewAuditTrail } = useRole();
  const { auditLog } = useDemoData();

  if (!canViewAuditTrail) {
    return (
      <div>
        <PageHeader title="Audit Trail" description="System-wide log of changes and activity." />
        <RestrictedNotice requiredRoles="Management and Super User" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Every change and activity logged system-wide, for compliance and accountability."
        actions={
          <Button variant="secondary" onClick={() => downloadCsv("audit-trail.csv", auditLog)}>
            <Download size={15} /> Export
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{entry.timestamp}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{entry.user}</td>
                  <td className="px-5 py-3 text-slate-600">{entry.role}</td>
                  <td className="px-5 py-3 text-slate-600">{entry.action}</td>
                  <td className="px-5 py-3 text-slate-600">{entry.entity}</td>
                  <td className="px-5 py-3 max-w-md text-xs text-slate-500">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
