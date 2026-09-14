import { useState } from "react";
import { Plus, Download, CheckCircle2, Circle } from "lucide-react";
import { Card, PageHeader, Badge, Button, currency } from "../components/ui";
import { CsvImportButton } from "../components/CsvImportButton";
import { downloadCsv } from "../lib/csv";
import { useRole } from "../context/RoleContext";
import { customers, type AccountPriority } from "../data/mockData";

const priorityTone: Record<AccountPriority, "rose" | "amber" | "sky"> = {
  A: "rose",
  B: "amber",
  Prospect: "sky",
};

const priorities: AccountPriority[] = ["A", "B", "Prospect"];

export default function Customers() {
  const { profile, canViewAllAccounts } = useRole();
  const [filter, setFilter] = useState<AccountPriority | "all">("all");

  const scoped = canViewAllAccounts ? customers : customers.filter((c) => c.accountManager === profile.ownerName);
  const visible = filter === "all" ? scoped : scoped.filter((c) => c.priority === filter);

  return (
    <div>
      <PageHeader
        title="Accounts"
        description={
          canViewAllAccounts
            ? "All accounts consolidated from ASI SmartBooks and Facilis Syncore."
            : `Accounts assigned to you, ${profile.name}. Add notes and log weekly/monthly activity.`
        }
        actions={
          <>
            <CsvImportButton label="Import" />
            <Button
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  "accounts.csv",
                  visible.map((c) => ({
                    id: c.id,
                    name: c.name,
                    company: c.company,
                    account_manager: c.accountManager,
                    priority: c.priority,
                    lifetime_value: c.lifetimeValue,
                    ly_gross_profit: c.lyGrossProfit,
                    since: c.since,
                    source: c.source,
                  }))
                )
              }
            >
              <Download size={15} /> Export
            </Button>
            <Button variant="primary">
              <Plus size={15} /> Add Account
            </Button>
          </>
        }
      />

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            filter === "all" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All
        </button>
        {priorities.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === p ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Priority {p}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Account Manager</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Lifetime Value</th>
                <th className="px-5 py-3 font-medium">LY Gross Profit</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {c.name}
                    <div className="text-xs font-normal text-slate-400">{c.email}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{c.company}</td>
                  <td className="px-5 py-3 text-slate-600">{c.accountManager}</td>
                  <td className="px-5 py-3">
                    <Badge tone={priorityTone[c.priority]}>{c.priority}</Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{currency(c.lifetimeValue)}</td>
                  <td className="px-5 py-3 text-slate-600">{c.lyGrossProfit > 0 ? currency(c.lyGrossProfit) : "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1" title="Weekly activity logged">
                        {c.weeklyActivityLogged ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <Circle size={14} className="text-slate-300" />
                        )}
                        Wkly
                      </span>
                      <span className="flex items-center gap-1" title="Monthly activity logged">
                        {c.monthlyActivityLogged ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <Circle size={14} className="text-slate-300" />
                        )}
                        Mthly
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 max-w-xs text-xs text-slate-500">{c.notes}</td>
                  <td className="px-5 py-3">
                    <Badge tone={c.source === "ASI SmartBooks" ? "sky" : "violet"}>{c.source}</Badge>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-slate-400">
                    No accounts match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
