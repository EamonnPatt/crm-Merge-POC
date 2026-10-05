import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Share2, Eye, ChevronRight } from "lucide-react";
import { Card, PageHeader, Badge, Button, SegmentedControl, currency, inlineSelectClass } from "../components/ui";
import { CsvImportButton } from "../components/CsvImportButton";
import { RestrictedNotice } from "../components/RestrictedNotice";
import { ShareDashboardModal } from "../components/ShareDashboardModal";
import {
  ComparisonViews,
  MetricSwitch,
  PaceCard,
  PerformanceStatCards,
  PerformanceTrendChart,
  ShareDonut,
  SplitBar,
  signedCurrency,
  type ShareSlice,
} from "../components/performance";
import { downloadCsv } from "../lib/csv";
import { OTHER_COLOR, SERIES_COLORS } from "../lib/palette";
import { AS_OF_LABEL } from "../lib/calendar";
import {
  combinedPerformance,
  formatDays,
  formatPct,
  monthlySeries,
  orderTotals,
  ordersInPeriod,
  paceLabel,
  paceStatus,
  paceTone,
  periods,
  repPerformance,
  withMetrics,
  type PeriodType,
} from "../lib/performance";
import { useMetricPreference } from "../lib/usePreference";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { salesOrders, grossProfit, marginPct, metricLabel, type Metric, type SalesOrder } from "../data/mockData";

const statusTone: Record<SalesOrder["status"], "emerald" | "amber" | "rose"> = {
  paid: "emerald",
  pending: "amber",
  overdue: "rose",
};

const ORDER_PAGE = 25;
const metricOf = (o: SalesOrder, metric: Metric) => (metric === "gp" ? grossProfit(o) : o.amount);

export default function Sales() {
  const { profile, visibleReps, canViewSalesDashboard, canViewCompanyMetrics, canShareDashboard } = useRole();
  const { shares, team, perfInputs } = useDemoData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [metric, setMetric] = useMetricPreference();
  const [shareOpen, setShareOpen] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);

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

  const inputs = perfInputs(metric);
  const label = metricLabel[metric];
  const toDate = periods.find((p) => p.key === period)?.toDate ?? "";
  const metrics = withMetrics(combinedPerformance(scopeReps, period, inputs));
  const mtd = withMetrics(combinedPerformance(scopeReps, "monthly", inputs));
  const ytd = withMetrics(combinedPerformance(scopeReps, "annual", inputs));
  const series = monthlySeries(scopeReps, inputs);
  const repRows = isCompanyView ? visibleReps.map((rep) => ({ rep, ...withMetrics(repPerformance(rep, period, inputs)) })) : [];

  // Orders are generated from the same figures as the performance cards, so these totals tie out exactly.
  const scopeOrders = salesOrders.filter((o) => scopeReps.includes(o.rep));
  const periodOrders = ordersInPeriod(scopeOrders, period);
  const totals = orderTotals(periodOrders);
  const shownOrders = showAllOrders ? periodOrders : periodOrders.slice(0, ORDER_PAGE);

  // Colors follow the entity (fixed Account Manager / customer order), never the slice's rank.
  const allAms = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const sumFor = (orders: SalesOrder[]) => orders.reduce((a, o) => a + metricOf(o, metric), 0);
  let slices: ShareSlice[];
  if (isCompanyView) {
    slices = visibleReps.map((rep) => ({
      name: rep,
      value: sumFor(periodOrders.filter((o) => o.rep === rep)),
      color: SERIES_COLORS[allAms.indexOf(rep) % SERIES_COLORS.length],
    }));
  } else {
    const customers = [...new Set(scopeOrders.map((o) => o.customer))].sort();
    const byCustomer = customers.map((c, i) => ({ name: c, value: sumFor(periodOrders.filter((o) => o.customer === c)), color: SERIES_COLORS[i % SERIES_COLORS.length] }));
    const top = [...byCustomer].sort((a, b) => b.value - a.value).slice(0, 5);
    const rest = byCustomer.filter((c) => !top.includes(c));
    slices = byCustomer.filter((c) => top.includes(c));
    if (rest.length) slices.push({ name: "Other customers", value: rest.reduce((a, c) => a + c.value, 0), color: OTHER_COLOR });
  }
  const sourceParts: ShareSlice[] = [
    { name: "ASI SmartBooks", value: sumFor(periodOrders.filter((o) => o.source === "ASI SmartBooks")), color: SERIES_COLORS[0] },
    { name: "Facilis Syncore", value: sumFor(periodOrders.filter((o) => o.source === "Facilis Syncore")), color: SERIES_COLORS[1] },
  ];

  const myShareCount = shares.filter((s) => s.owner === profile.name).length;
  const assistantShare = isAssistant ? shares.find((s) => s.owner === selectedRep && s.assistant === profile.name) : undefined;

  const description = isCompanyView
    ? `Company-wide ${label} performance across all Account Managers, compared against Budget, Last Year, and daily pace.`
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
                  periodOrders.map((o) => ({
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
        <MetricSwitch value={metric} onChange={setMetric} />
        {(canViewCompanyMetrics || (isAssistant && visibleReps.length > 1)) && (
          <select aria-label="Account Manager" value={selectedRep ?? ""} onChange={(e) => selectRep(e.target.value || null)} className={inlineSelectClass}>
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

      <PerformanceStatCards metrics={metrics} period={period} metric={metric} />

      <Card className="mt-4 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Total Sale, Total Cost, GP and Margin — {toDate}</h3>
          <span className="text-xs text-slate-400">
            {totals.orders} order{totals.orders === 1 ? "" : "s"} from ASI SmartBooks + Facilis Syncore
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Sale", value: currency(totals.sales), testId: "total-sale" },
            { label: "Total Cost", value: currency(totals.cost), testId: "total-cost" },
            { label: "Gross Profit", value: currency(totals.gp), testId: "total-gp" },
            { label: "Margin %", value: `${totals.margin.toFixed(1)}%`, testId: "total-margin" },
          ].map((t) => (
            <div key={t.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-800" data-testid={t.testId}>
                {t.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PerformanceTrendChart
          data={series}
          metric={metric}
          className="lg:col-span-2"
          title={isCompanyView ? `Company ${label} vs Budget vs Last Year` : `${selectedRep} — ${label} vs Budget vs Last Year`}
        />
        <PaceCard metrics={metrics} period={period} />
      </div>

      <div className="mt-6">
        <ComparisonViews selected={metrics} period={period} mtd={mtd} ytd={ytd} metric={metric} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ShareDonut
          className="lg:col-span-2"
          title={isCompanyView ? `${label} Share by Account Manager` : `${label} Share by Customer`}
          subtitle={toDate}
          slices={slices}
        />
        <SplitBar title={`${label} by Source System`} subtitle={toDate} parts={sourceParts} />
      </div>

      {isCompanyView && (
        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
            <h3 className="text-sm font-semibold text-slate-700">Account Manager Comparison</h3>
            <span className="text-xs text-slate-400">{toDate} · select a row to open that Account Manager's dashboard</span>
          </div>
          <div className="px-5 pt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={repRows} margin={{ left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="rep" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} width={48} />
                <Tooltip formatter={(value) => currency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="actual" name={`Actual ${label}`} fill="#4f46e5" radius={[4, 4, 0, 0]} />
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
                  <th className="px-5 py-3 font-medium">Actual {label}</th>
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
                      <td className={`px-5 py-3 font-medium ${r.vsLyPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatPct(r.vsLyPct, true)}</td>
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

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <h3 className="text-sm font-semibold text-slate-700">Orders — {toDate}</h3>
          <span className="text-xs text-slate-400">
            {periodOrders.length > ORDER_PAGE && !showAllOrders ? `Latest ${ORDER_PAGE} of ${periodOrders.length}` : `${periodOrders.length} orders`}
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
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
              {shownOrders.map((order) => (
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
                    <Badge tone={statusTone[order.status]}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={order.source === "ASI SmartBooks" ? "sky" : "violet"}>{order.source}</Badge>
                  </td>
                </tr>
              ))}
              {periodOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-400">
                    No orders in this period yet.
                  </td>
                </tr>
              )}
            </tbody>
            {periodOrders.length > 0 && (
              <tfoot className="bg-slate-50 text-sm font-semibold text-slate-800">
                <tr>
                  <td className="px-5 py-3" colSpan={4}>
                    Period total ({periodOrders.length} orders)
                  </td>
                  <td className="px-5 py-3">{currency(totals.sales)}</td>
                  <td className="px-5 py-3">{currency(totals.cost)}</td>
                  <td className="px-5 py-3">{currency(totals.gp)}</td>
                  <td className="px-5 py-3">{totals.margin.toFixed(1)}%</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {periodOrders.length > ORDER_PAGE && (
          <div className="border-t border-slate-100 px-5 py-3 text-center">
            <button className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setShowAllOrders((v) => !v)}>
              {showAllOrders ? "Show latest 25 only" : `Show all ${periodOrders.length} orders`}
            </button>
          </div>
        )}
      </Card>

      {canShareDashboard && <ShareDashboardModal open={shareOpen} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
