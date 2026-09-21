import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, Scale, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Card, StatCard, currency } from "./ui";
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

/** The three comparisons every sales-facing user gets: vs Budget, vs Last Year, and days ahead / behind. */
export function PerformanceStatCards({ metrics, period }: { metrics: PerformanceMetrics; period: PeriodType }) {
  const toDate = periods.find((p) => p.key === period)?.toDate ?? "";
  const status = paceStatus(metrics.daysAheadBehind);
  const vsBudget = metrics.actual - metrics.budgetToDate;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={`Actual GP$ · ${toDate}`}
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
        Days ahead / behind = (Actual − budget due to date) ÷ this month's daily budget rate.
      </p>
    </Card>
  );
}

export function PerformanceTrendChart({
  data,
  title = "GP$ vs Budget vs Last Year",
  className = "",
}: {
  data: { month: string; actual: number | null; budget: number; ly: number }[];
  title?: string;
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
            width={48}
          />
          <Tooltip formatter={(value) => (value == null ? "—" : currency(Number(value)))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="actual" name="Actual GP$" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={22} />
          <Line dataKey="budget" name="Budget" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          <Line dataKey="ly" name="Last Year" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2.5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
