import { FileSpreadsheet, FileText } from "lucide-react";
import { Card, PageHeader, Button } from "../components/ui";
import { reportCatalog } from "../data/mockData";

export default function Reports() {
  return (
    <div>
      <PageHeader title="Reports" description="Interactive reports available for export." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCatalog.map((report) => (
          <Card key={report.id} className="flex flex-col p-5">
            <h3 className="text-sm font-semibold text-slate-800">{report.name}</h3>
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
