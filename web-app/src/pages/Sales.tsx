import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Share2, Eye, ChevronRight } from "lucide-react";
import { Card, PageHeader, Badge, Button, SegmentedControl, currency, inlineSelectClass } from "../components/ui";
import { CsvImportButton } from "../components/CsvImportButton";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { ShareDashboardModal } from "../components/ShareDashboardModal";
import { PaceCard, PerformanceStatCards, PerformanceTrendChart, signedCurrency } from "../components/performance";
import { downloadCsv } from "../lib/csv";
import { AS_OF_LABEL } from "../lib/calendar";
import {
  combinedPerformance,
  formatDays,
  formatPct,
  monthlySeries,
  paceLabel,
  paceStatus,
  paceTone,
  periods,
  repPerformance,
  withMetrics,
  type PeriodType,
} from "../lib/performance";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { salesOrders, grossProfit, marginPct, type SalesOrder } from "../data/mockData";

const statusTone: Record<SalesOrder["status"], "emerald" | "amber" | "rose"> = {
  paid: "emerald",
  pending: "amber",
  overdue: "rose",
};

export default function Sales() {
  const { profile, visibleReps, canViewSalesDashboard, canViewCompanyMetrics, canShareDashboard } = useRole();
  const { budgets, shares, team } = useDemoData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [shareOpen, setShareOpen] = useState(false);

  if (!canViewSalesDashboard) {
    return (
      <div>
        <PageHeader title="Sales Dashboard" description="Gross profit performance against budget and last year." />
        <RestrictedNotice requiredRoles="Account Managers, Assistants, Management, and Super User" />
      </div>
    );
  }

  const isAssistant = profile.role === "assistant";
  const requestedRep = searchParams.get("rep");
  // Management can drill from the company view into one Account Manager; assistants pick among dashboards shared with them.
  const selectedRep =
    requestedRep && visibleReps.includes(requestedRep) ? requestedRep : canViewCompanyMetrics ? null : visibleReps[0] ?? null;
  const isCompanyView = canViewCompanyMetrics && !selectedRep;
  const scopeReps = selectedRep ? [selectedRep] : isCompanyView ? visibleReps : [];
  const selectRep = (rep: string | null) => setSearchParams(rep ? { rep } : {});

  if (isAssistant && scopeReps.length === 0) {
    const supports = team.find((m) => m.id === profile.userId)?.supports ?? [];
    return (
      <div>
        <PageHeader title="Shared Sales Dashboards" description="Sales Dashboards your Account Managers have shared with you." />
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Share2 className="text-slate-400" size={28} />
          <div>
            <p className="text-sm font-semibold text-slate-800">No dashboards have been shared with you yet</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              When an Account Manager you support shares their Sales Dashboard, it will appear here as a read-only view.
              {supports.length > 0 && ` You support: ${supports.join(", ")}.`}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const metrics = withMetrics(combinedPerformance(scopeReps, period, budgets));
  const series = monthlySeries(scopeReps, budgets);
  const repRows = isCompanyView
    ? visibleReps.map((rep) => ({ rep, ...withMetrics(repPerformance(rep, period, budgets)) }))
    : [];
  const visibleOrders = salesOrders.filter((o) => scopeReps.includes(o.rep));
  const orderTotals = visibleOrders.reduce(
    (acc, o) => ({ sales: acc.sales + o.amount, cost: acc.cost + o.cost, gp: acc.gp + grossProfit(o) }),
    { sales: 0, cost: 0, gp: 0 }
  );
  const blendedMargin = orderTotals.sales === 0 ? 0 : (orderTotals.gp / orderTotals.sales) * 100;
  const myShareCount = shares.filter((s) => s.owner === profile.name).length;
  const assistantShare = isAssistant ? shares.find((s) => s.owner === selectedRep && s.assistant === profile.name) : undefined;

  const description = isCompanyView
    ? "Company-wide GP$ performance across all Account Managers, compared against Budget, Last Year, and daily pace."
    : isAssistant
    ? `${selectedRep}'s Sales Dashboard, shared with you (read-only).`
    : canViewCompanyMetrics
    ? `${selectedRep}'s performance — Management view.`
    : `Your performance, ${profile.name} — compared against your budget, last year, and daily pace.`;

  return (
    <div>
      <PageHeader
        title={isAssistant ? "Shared Sales Dashboard" : "Sales Dashboard"}
        description={description}
        actions={
          <>
            {canShareDashboard && (
              <Button variant="secondary" onClick={() => setShareOpen(true)}>
                <Share2 size={15} /> Share{myShareCount > 0 ? ` (${myShareCount})` : ""}
              </Button>
            )}
            {!isAssistant && <CsvImportButton label="Import" />}
            <Button
              variant="primary"
              onClick={() =>
                downloadCsv(
                  `sales-orders-${selectedRep ?? "company"}-${period}.csv`,
                  visibleOrders.map((o) => ({
                    order: o.id,
                    customer: o.customer,
                    rep: o.rep,
                    date: o.date,
                    total_sales: o.amount,
                    total_cost: o.cost,
                    gross_profit: grossProfit(o),
                    margin_pct: marginPct(o).toFixed(1),
                    status: o.status,
                    source: o.source,
                  }))
                )
              }
            >
              <Download size={15} /> Export CSV
            </Button>
          </>
        }
      />

      {assistantShare && (
        <Card className="mb-4 flex flex-wrap items-center gap-2 border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
          <Eye size={15} />
          Shared with you by <span className="font-semibold">{assistantShare.owner}</span> on {assistantShare.sharedAt}
          <Badge tone="sky">Read-only</Badge>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl options={periods} value={period} onChange={setPeriod} />
        {(canViewCompanyMetrics || (isAssistant && visibleReps.length > 1)) && (
          <select
            aria-label="Account Manager"
            value={selectedRep ?? ""}
            onChange={(e) => selectRep(e.target.value || null)}
            className={inlineSelectClass}
          >
            {canViewCompanyMetrics && <option value="">All Account Managers (company-wide)</option>}
            {visibleReps.map((rep) => (
              <option key={rep} value={rep}>
                {isAssistant ? `${rep}'s dashboard` : rep}
              </option>
            ))}
          </select>
        )}
        {canViewCompanyMetrics && selectedRep && (
          <button onClick={() => selectRep(null)} className="text-sm font-medium text-brand-600 hover:underline">
            Back to company view
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">Figures as of {AS_OF_LABEL}</span>
      </div>

      <PerformanceStatCards metrics={metrics} period={period} />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PerformanceTrendChart
          data={series}
          className="lg:col-span-2"
          title={isCompanyView ? "Company GP$ vs Budget vs Last Year" : `${selectedRep} — GP$ vs Budget vs Last Year`}
        />
        <PaceCard metrics={metrics} period={period} />
      </div>

      {isCompanyView && (
        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
            <h3 className="text-sm font-semibold text-slate-700">Account Manager Comparison</h3>
            <span className="text-xs text-slate-400">
              {periods.find((p) => p.key === period)?.toDate} · select a row to open that Account Manager's dashboard
            </span>
          </div>
          <div className="px-5 pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={repRows} margin={{ left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="rep" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
                  width={48}
                />
                <Tooltip formatter={(value) => currency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="actual" name="Actual GP$" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budgetToDate" name="Budget (to date)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ly" name="Last Year (same period)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Account Manager</th>
                  <th className="px-5 py-3 font-medium">Actual GP$</th>
                  <th className="px-5 py-3 font-medium">Budget</th>
                  <th className="px-5 py-3 font-medium">% of Budget</th>
                  <th className="px-5 py-3 font-medium">vs Budget (to date)</th>
                  <th className="px-5 py-3 font-medium">LY (same period)</th>
                  <th className="px-5 py-3 font-medium">vs LY</th>
                  <th className="px-5 py-3 font-medium">Days Ahead / Behind</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repRows.map((r) => {
                  const status = paceStatus(r.daysAheadBehind);
                  const noBudget = r.budget === 0;
                  return (
                    <tr key={r.rep} className="cursor-pointer hover:bg-slate-50" onClick={() => selectRep(r.rep)}>
                      <td className="px-5 py-3 font-medium text-slate-800">{r.rep}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{currency(r.actual)}</td>
                      <td className="px-5 py-3 text-slate-600">{noBudget ? "—" : currency(r.budget)}</td>
                      <td className="px-5 py-3 text-slate-600">{noBudget ? "—" : `${r.pctOfBudget.toFixed(0)}%`}</td>
                      <td className={`px-5 py-3 font-medium ${r.actual >= r.budgetToDate ? "text-emerald-600" : "text-rose-600"}`}>
                        {noBudget ? "—" : signedCurrency(r.actual - r.budgetToDate)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{currency(r.ly)}</td>
                      <td className={`px-5 py-3 font-medium ${r.vsLyPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatPct(r.vsLyPct, true)}
                      </td>
                      <td className="px-5 py-3">
                        {noBudget ? (
                          <Badge tone="amber">No budget set</Badge>
                        ) : (
                          <span className="flex items-center gap-2 text-slate-700">
                            {formatDays(r.daysAheadBehind)}
                            <Badge tone={paceTone[status]}>{paceLabel[status]}</Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Data Integration Summary — Total Sales, Cost, Gross Profit, Margin</h3>
          <span className="text-xs text-slate-400">Mapped from ASI SmartBooks + Facilis Syncore exports</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Sales</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{currency(orderTotals.sales)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Cost</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{currency(orderTotals.cost)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Gross Profit</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{currency(orderTotals.gp)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Margin</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{blendedMargin.toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Account Manager</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Total Sales</th>
                <th className="px-5 py-3 font-medium">Total Cost</th>
                <th className="px-5 py-3 font-medium">Gross Profit</th>
                <th className="px-5 py-3 font-medium">Margin</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">{order.id}</td>
                  <td className="px-5 py-3 text-slate-600">{order.customer}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{order.rep}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">{order.date}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{currency(order.amount)}</td>
                  <td className="px-5 py-3 text-slate-600">{currency(order.cost)}</td>
                  <td className="px-5 py-3 text-slate-600">{currency(grossProfit(order))}</td>
                  <td className="px-5 py-3 text-slate-600">{marginPct(order).toFixed(1)}%</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={order.source === "ASI SmartBooks" ? "sky" : "violet"}>{order.source}</Badge>
                  </td>
                </tr>
              ))}
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-400">
                    No orders in this view yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {canShareDashboard && <ShareDashboardModal open={shareOpen} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
