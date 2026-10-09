import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, Scale, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Card, SegmentedControl, StatCard, currency } from "./ui";
import { metricLabel, type Metric } from "../data/mockData";
import {
  formatDays,
  formatPct,
  paceLabel,
  paceStatus,
  paceTone,
  periods,
  type PerformanceMetrics,
  type PeriodType,
} from "../lib/performance";

export function signedCurrency(value: number): string {
  return `${value >= 0 ? "+" : "−"}${currency(Math.abs(value))}`;
}

const toneFor = { ahead: "positive", on_pace: "neutral", behind: "negative" } as const;

/** GP$ / Sales$ switch (client decision Q-1: the demo supports both, GP$ by default). */
export function MetricSwitch({ value, onChange }: { value: Metric; onChange: (metric: Metric) => void }) {
  return (
    <SegmentedControl
      options={[
        { key: "gp" as const, label: "GP $" },
        { key: "sales" as const, label: "Sales $" },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

/** The three comparisons every sales-facing user gets: vs Budget, vs Last Year, and days ahead / behind. */
export function PerformanceStatCards({ metrics, period, metric = "gp" }: { metrics: PerformanceMetrics; period: PeriodType; metric?: Metric }) {
  const toDate = periods.find((p) => p.key === period)?.toDate ?? "";
  const status = paceStatus(metrics.daysAheadBehind);
  const vsBudget = metrics.actual - metrics.budgetToDate;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={`Actual ${metricLabel[metric]} · ${toDate}`}
        value={currency(metrics.actual)}
        delta={`${metrics.pctOfBudget.toFixed(0)}% of ${period === "daily" ? "daily" : "period"} budget`}
        deltaTone={toneFor[status]}
        icon={<Target size={18} />}
      />
      <StatCard
        label="vs Budget (to date)"
        value={signedCurrency(vsBudget)}
        delta={`Full budget: ${currency(metrics.budget)}`}
        deltaTone={vsBudget >= 0 ? "positive" : "negative"}
        icon={<Scale size={18} />}
      />
      <StatCard
        label="vs Last Year"
        value={formatPct(metrics.vsLyPct, true)}
        delta={`LY same period: ${currency(metrics.ly)}`}
        deltaTone={metrics.vsLyPct >= 0 ? "positive" : "negative"}
        icon={metrics.vsLyPct >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
      />
      <StatCard
        label="Days Ahead / Behind"
        value={formatDays(metrics.daysAheadBehind)}
        delta={status === "ahead" ? "Ahead of budget pace" : status === "behind" ? "Behind budget pace" : "On budget pace"}
        deltaTone={toneFor[status]}
        icon={<CalendarClock size={18} />}
      />
    </div>
  );
}

function ProgressRow({ label, detail, pct, barClass }: { label: string; detail: string; pct: number; barClass: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-500">{detail}</span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

export function PaceCard({ metrics, period, className = "" }: { metrics: PerformanceMetrics; period: PeriodType; className?: string }) {
  const toDate = periods.find((p) => p.key === period)?.toDate ?? "";
  const status = paceStatus(metrics.daysAheadBehind);
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Pace to Budget</h3>
        <span className="text-xs text-slate-400">{toDate}</span>
      </div>
      <div className="space-y-4">
        <ProgressRow
          label="Time elapsed"
          detail={`${metrics.elapsedDays} of ${metrics.totalDays} business days`}
          pct={metrics.pctOfPeriodElapsed}
          barClass="bg-slate-400"
        />
        <ProgressRow
          label="Budget achieved"
          detail={`${currency(metrics.actual)} of ${currency(metrics.budget)}`}
          pct={metrics.pctOfBudget}
          barClass={status === "behind" ? "bg-rose-500" : "bg-emerald-500"}
        />
      </div>
      <dl className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Days ahead / behind</dt>
          <dd className="flex items-center gap-2 font-semibold text-slate-800">
            {formatDays(metrics.daysAheadBehind)}
            <Badge tone={paceTone[status]}>{paceLabel[status]}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">vs Last Year</dt>
          <dd className="font-semibold text-slate-800">
            {signedCurrency(metrics.vsLyAmount)} ({formatPct(metrics.vsLyPct, true)})
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Needed to hit budget</dt>
          <dd className="font-semibold text-slate-800">
            {metrics.remainingDays === 0
              ? "Period ends today"
              : metrics.actual >= metrics.budget
              ? "Budget met"
              : `${currency(metrics.requiredPerDay)}/day × ${metrics.remainingDays}d`}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Days ahead / behind = (Actual − budget due to date) ÷ this month's daily budget rate. Business days exclude company
        holidays.
      </p>
    </Card>
  );
}

export function PerformanceTrendChart({
  data,
  title,
  metric = "gp",
  className = "",
}: {
  data: { month: string; actual: number | null; budget: number; ly: number }[];
  title: string;
  metric?: Metric;
  className?: string;
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400">FY2026 by month</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ left: 4, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} interval={0} />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
            width={48}
          />
          <Tooltip formatter={(value) => (value == null ? "—" : currency(Number(value)))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="actual" name={`Actual ${metricLabel[metric]}`} fill="var(--chart-primary)" radius={[4, 4, 0, 0]} barSize={22} />
          <Line dataKey="budget" name="Budget" stroke="var(--chart-budget-line)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          <Line dataKey="ly" name="Last Year" stroke="var(--chart-ly-line)" strokeWidth={2} dot={{ r: 2.5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * The comparison views named in the requirements doc: Sales vs Budget (the selected period), Sales vs MTD and
 * Sales vs YTD. "Sales" follows the GP$ / Sales$ switch.
 */
export function ComparisonViews({
  selected,
  period,
  mtd,
  ytd,
  metric,
}: {
  selected: PerformanceMetrics;
  period: PeriodType;
  mtd: PerformanceMetrics;
  ytd: PerformanceMetrics;
  metric: Metric;
}) {
  const periodName = periods.find((p) => p.key === period)?.toDate.toLowerCase() ?? "";
  const rows = [
    { name: "Sales vs Budget", detail: `Selected period (${periodName})`, m: selected },
    { name: "Sales vs MTD", detail: "Month to date vs budget and LY month to date", m: mtd },
    { name: "Sales vs YTD", detail: "Year to date vs budget and LY year to date", m: ytd },
  ];
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <h3 className="text-sm font-semibold text-slate-700">Comparison Views</h3>
        <span className="text-xs text-slate-400">Figures in {metricLabel[metric]}</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-medium">View</th>
              <th className="px-5 py-2.5 text-right font-medium">Actual</th>
              <th className="px-5 py-2.5 text-right font-medium">Budget (to date)</th>
              <th className="px-5 py-2.5 text-right font-medium">vs Budget</th>
              <th className="px-5 py-2.5 text-right font-medium">Last Year</th>
              <th className="px-5 py-2.5 text-right font-medium">vs LY</th>
              <th className="px-5 py-2.5 font-medium">Days Ahead / Behind</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ name, detail, m }) => {
              const status = paceStatus(m.daysAheadBehind);
              const variance = m.actual - m.budgetToDate;
              return (
                <tr key={name}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{name}</p>
                    <p className="text-xs text-slate-400">{detail}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-800">{currency(m.actual)}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{currency(m.budgetToDate)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {signedCurrency(variance)}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">{currency(m.ly)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${m.vsLyPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatPct(m.vsLyPct, true)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-slate-700">
                      {formatDays(m.daysAheadBehind)}
                      <Badge tone={paceTone[status]}>{paceLabel[status]}</Badge>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export interface ShareSlice {
  name: string;
  value: number;
  color: string;
}

/**
 * Part-to-whole donut (≤ 6 slices). Some palette colors are below 3:1 contrast on white, so every slice is also
 * listed with its value and share — color is never the only way to tell slices apart.
 */
export function ShareDonut({ title, subtitle, slices, className = "" }: { title: string; subtitle?: string; slices: ShareSlice[]; className?: string }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const shown = slices.filter((s) => s.value > 0);
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
      {total <= 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No sales in this period yet.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-[180px] w-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={shown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} stroke="#ffffff" strokeWidth={2} isAnimationActive={false}>
                  {shown.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${currency(Number(value))} (${((Number(value) / total) * 100).toFixed(1)}%)`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-slate-400">Total</span>
              <span className="text-sm font-semibold text-slate-800">{currency(total)}</span>
            </div>
          </div>
          <ul className="w-full space-y-1.5 text-sm">
            {slices.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="whitespace-nowrap text-slate-800">
                  {currency(s.value)} <span className="text-xs text-slate-400">{total ? ((s.value / total) * 100).toFixed(0) : 0}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/** A two-part split shown as one labeled bar (a 2-slice pie reads worse than this). */
export function SplitBar({ title, subtitle, parts }: { title: string; subtitle?: string; parts: ShareSlice[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          parts.map((p) => (
            <div key={p.name} title={`${p.name}: ${currency(p.value)}`} style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }} />
          ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {parts.map((p) => (
          <li key={p.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="text-slate-800">
              {currency(p.value)} <span className="text-xs text-slate-400">{total ? ((p.value / total) * 100).toFixed(0) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
