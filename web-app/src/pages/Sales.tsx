import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Target, CalendarDays } from "lucide-react";
import { Card, PageHeader, Badge, Button, StatCard, currency } from "../components/ui";
import { CsvImportButton } from "../components/CsvImportButton";
import { downloadCsv } from "../lib/csv";
import { useRole } from "../context/RoleContext";
import {
  salesOrders,
  grossProfit,
  marginPct,
  repBudgetsByPeriod,
  daysAheadBehind,
  type SalesOrder,
  type PeriodType,
} from "../data/mockData";

const statusTone: Record<SalesOrder["status"], "emerald" | "amber" | "rose"> = {
  paid: "emerald",
  pending: "amber",
  overdue: "rose",
};

const periods: { key: PeriodType; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" },
];

const PIE_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];

export default function Sales() {
  const { profile, canViewAllAccounts } = useRole();
  const [period, setPeriod] = useState<PeriodType>("monthly");

  const allBudgets = repBudgetsByPeriod[period];
  const budgets = canViewAllAccounts
    ? allBudgets
    : allBudgets.filter((b) => b.rep === profile.ownerName);

  const totals = budgets.reduce(
    (acc, b) => ({
      actual: acc.actual + b.actualGP,
      budget: acc.budget + b.budgetGP,
      ly: acc.ly + b.lyGP,
    }),
    { actual: 0, budget: 0, ly: 0 }
  );
  const pctToBudget = totals.budget === 0 ? 0 : (totals.actual / totals.budget) * 100;
  const vsLy = totals.ly === 0 ? 0 : ((totals.actual - totals.ly) / totals.ly) * 100;
  const avgDaysAheadBehind =
    budgets.length === 0 ? 0 : budgets.reduce((sum, b) => sum + daysAheadBehind(b), 0) / budgets.length;

  const visibleOrders = canViewAllAccounts
    ? salesOrders
    : salesOrders.filter((o) => o.rep === profile.ownerName);

  const orderTotals = visibleOrders.reduce(
    (acc, o) => ({
      sales: acc.sales + o.amount,
      cost: acc.cost + o.cost,
      gp: acc.gp + grossProfit(o),
    }),
    { sales: 0, cost: 0, gp: 0 }
  );
  const blendedMargin = orderTotals.sales === 0 ? 0 : (orderTotals.gp / orderTotals.sales) * 100;

  const pieData = useMemo(
    () => budgets.map((b) => ({ name: b.rep, value: b.actualGP })),
    [budgets]
  );

  return (
    <div>
      <PageHeader
        title="Sales Dashboard"
        description={
          canViewAllAccounts
            ? "Gross profit performance across all Account Managers, mapped from ASI SmartBooks + Facilis Syncore."
            : `Your performance — ${profile.name}. Account Managers see only their own accounts.`
        }
        actions={
          <>
            <CsvImportButton label="Import" />
            <Button
              variant="primary"
              onClick={() =>
                downloadCsv(
                  `sales-orders-${period}.csv`,
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

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              period === p.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Actual GP$ (${periods.find((p) => p.key === period)?.label})`}
          value={currency(totals.actual)}
          delta={`${pctToBudget.toFixed(0)}% of budget`}
          deltaTone={pctToBudget >= 100 ? "positive" : pctToBudget >= 80 ? "neutral" : "negative"}
          icon={<Target size={18} />}
        />
        <StatCard
          label="Budget GP$"
          value={currency(totals.budget)}
          delta={`${currency(Math.max(0, totals.budget - totals.actual))} remaining`}
          deltaTone="neutral"
          icon={<CalendarDays size={18} />}
        />
        <StatCard
          label="vs. Last Year"
          value={`${vsLy >= 0 ? "+" : ""}${vsLy.toFixed(1)}%`}
          delta={`LY: ${currency(totals.ly)}`}
          deltaTone={vsLy >= 0 ? "positive" : "negative"}
          icon={vsLy >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        />
        <StatCard
          label="Days Ahead / Behind"
          value={`${avgDaysAheadBehind >= 0 ? "+" : ""}${avgDaysAheadBehind.toFixed(1)} days`}
          delta={avgDaysAheadBehind >= 0 ? "Ahead of daily pace" : "Behind daily pace"}
          deltaTone={avgDaysAheadBehind >= 0 ? "positive" : "negative"}
          icon={<TrendingUp size={18} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Actual vs. Budget vs. LY by Account Manager</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgets} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="rep" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip formatter={(value) => currency(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="actualGP" name="Actual GP$" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="budgetGP" name="Budget GP$" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lyGP" name="LY GP$" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">GP$ Share ({periods.find((p) => p.key === period)?.label})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}
                </span>
                <span>{currency(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

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
                  <td className="px-5 py-3 font-medium text-slate-800">{order.id}</td>
                  <td className="px-5 py-3 text-slate-600">{order.customer}</td>
                  <td className="px-5 py-3 text-slate-600">{order.rep}</td>
                  <td className="px-5 py-3 text-slate-500">{order.date}</td>
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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
