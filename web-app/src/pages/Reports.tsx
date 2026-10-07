import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Card, PageHeader, Button, Badge } from "../components/ui";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { reportCatalog, type ReportDefinition } from "../data/mockData";
import { buildReport, printReportAsPdf } from "../lib/reports";
import { downloadXlsx } from "../lib/csv";
import { todayIso } from "../lib/calendar";

export default function Reports() {
  const { profile, visibleReps, canViewReports, canViewCompanyMetrics } = useRole();
  const { accounts, deals, partners, orderIssues, perfInputs, logActivity, salesOrders } = useDemoData();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

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
  const build = (report: ReportDefinition) =>
    buildReport(report.id, {
      // Personal reports cover the viewer only; Management's copy of a personal report covers everyone.
      reps: canViewCompanyMetrics ? visibleReps : [profile.name],
      perf: perfInputs("gp"),
      accounts,
      deals,
      partners,
      orderIssues,
      salesOrders,
    });
  const fileName = (report: ReportDefinition, ext: string) => `${report.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${todayIso()}.${ext}`;

  const exportExcel = async (report: ReportDefinition) => {
    setBusy(`${report.id}-xlsx`);
    try {
      const table = build(report);
      await downloadXlsx(fileName(report, "xlsx"), table.columns, table.rows);
      logActivity(profile, "Exported report", report.name, `Exported Excel (${table.rows.length} rows).`);
      setNotice({ tone: "ok", text: `${report.name} downloaded as Excel.` });
    } catch {
      setNotice({ tone: "error", text: `Couldn't build the Excel file for ${report.name}.` });
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = (report: ReportDefinition) => {
    const table = build(report);
    if (printReportAsPdf(table)) {
      logActivity(profile, "Exported report", report.name, `Opened print view for PDF (${table.rows.length} rows).`);
      setNotice({ tone: "ok", text: `${report.name} opened in a new tab — choose "Save as PDF" in the print dialog.` });
    } else {
      setNotice({ tone: "error", text: "Your browser blocked the new tab. Allow pop-ups for this site and try again." });
    }
  };

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

      {notice && (
        <Card
          className={`mb-4 flex items-center justify-between p-3 text-sm ${
            notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <span>{notice.text}</span>
          <button className="text-xs font-medium hover:underline" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </Card>
      )}

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
              <Button variant="secondary" className="flex-1 justify-center" disabled={busy !== null} onClick={() => exportExcel(report)}>
                <FileSpreadsheet size={15} /> {busy === `${report.id}-xlsx` ? "Building…" : "Excel"}
              </Button>
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => exportPdf(report)}>
                <FileText size={15} /> PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
