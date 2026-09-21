import { FileSpreadsheet, FileText } from "lucide-react";
import { Card, PageHeader, Button, Badge } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { reportCatalog } from "../data/mockData";

export default function Reports() {
  const { canViewReports, canViewCompanyMetrics } = useRole();

  if (!canViewReports) {
    return (
      <div>
        <PageHeader title="Reports" description="Interactive reports available for export." />
        <RestrictedNotice requiredRoles="Account Managers, Management, and Super User" />
      </div>
    );
  }

  // Company-wide reports carry company metrics, so Account Managers only get their personal reports.
  const reports = reportCatalog.filter((r) => canViewCompanyMetrics || r.scope === "personal");

  return (
    <div>
      <PageHeader
        title="Reports"
        description={
          canViewCompanyMetrics
            ? "Interactive reports available for export, company-wide and per Account Manager."
            : "Your personal reports, scoped to your own accounts and performance."
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">{report.name}</h3>
              <Badge tone={report.scope === "company" ? "violet" : "sky"}>{report.scope === "company" ? "Company-wide" : "Personal"}</Badge>
            </div>
            <p className="mt-1.5 flex-1 text-sm text-slate-500">{report.description}</p>
            <p className="mt-3 text-xs text-slate-400">Refreshes {report.updated.toLowerCase()}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="secondary" className="flex-1 justify-center">
                <FileSpreadsheet size={15} /> Excel
              </Button>
              <Button variant="secondary" className="flex-1 justify-center">
                <FileText size={15} /> PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
