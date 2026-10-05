import { budgetValues, grossProfit, repActuals, type Budget, type Metric, type SalesOrder } from "../data/mockData";
import { AS_OF_ISO, CURRENT_MONTH, FISCAL_YEAR, MONTHS, type BusinessCalendar } from "./calendar";

export type PeriodType = "daily" | "monthly" | "quarterly" | "annual";

export const periods: { key: PeriodType; label: string; toDate: string }[] = [
  { key: "daily", label: "Daily", toDate: "Today" },
  { key: "monthly", label: "Monthly", toDate: "Month to date" },
  { key: "quarterly", label: "Quarterly", toDate: "Quarter to date" },
  { key: "annual", label: "Annual", toDate: "Year to date" },
];

/** Everything a performance figure depends on that users can change: budgets, the metric shown, and business days. */
export interface PerfInputs {
  budgets: Budget[];
  metric: Metric;
  calendar: BusinessCalendar;
}

/** Raw figures (GP$ or Sales$) for one or more Account Managers over a period, as of the demo date. */
export interface Performance {
  actual: number;
  /** Full-period budget. */
  budget: number;
  /** Portion of the budget that should have been earned by now (seasonality-aware). */
  budgetToDate: number;
  /** Last year, same period to date. */
  ly: number;
  /** Current month's budget per business day — the rate used to express variance in days. */
  dailyBudgetRate: number;
  elapsedDays: number;
  totalDays: number;
}

export interface PerformanceMetrics extends Performance {
  pctOfBudget: number;
  pctOfPeriodElapsed: number;
  vsLyAmount: number;
  vsLyPct: number;
  /** Positive = ahead of budget pace, negative = behind. */
  daysAheadBehind: number;
  remainingDays: number;
  /** Amount needed per remaining business day to finish the period on budget. */
  requiredPerDay: number;
}

export type PaceStatus = "ahead" | "on_pace" | "behind";

const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export function monthlyBudgetFor(budgets: Budget[], rep: string, metric: Metric, fiscalYear = FISCAL_YEAR): number[] {
  return budgetValues(budgets.find((b) => b.rep === rep && b.fiscalYear === fiscalYear), metric) ?? Array(12).fill(0);
}

function actualsFor(rep: string, metric: Metric) {
  return (
    repActuals.find((r) => r.rep === rep)?.[metric] ?? {
      monthlyActual: MONTHS.map((_, m) => (m > CURRENT_MONTH ? null : 0)),
      monthlyLy: Array(12).fill(0),
      todayActual: 0,
      todayLy: 0,
    }
  );
}

function periodMonths(period: PeriodType): { first: number; last: number } {
  if (period === "annual") return { first: 0, last: 11 };
  if (period === "quarterly") {
    const first = Math.floor(CURRENT_MONTH / 3) * 3;
    return { first, last: first + 2 };
  }
  return { first: CURRENT_MONTH, last: CURRENT_MONTH };
}

function periodDays(period: PeriodType, calendar: BusinessCalendar): { elapsedDays: number; totalDays: number } {
  if (period === "daily") return { elapsedDays: 1, totalDays: 1 };
  const { first, last } = periodMonths(period);
  const days = (m: number) => calendar.monthly[m];
  return {
    elapsedDays: sum(range(first, CURRENT_MONTH - 1).map(days)) + calendar.elapsedThisMonth,
    totalDays: sum(range(first, last).map(days)),
  };
}

export function repPerformance(rep: string, period: PeriodType, { budgets, metric, calendar }: PerfInputs): Performance {
  const budget = monthlyBudgetFor(budgets, rep, metric);
  const { monthlyActual, monthlyLy, todayActual, todayLy } = actualsFor(rep, metric);
  const monthDays = calendar.monthly[CURRENT_MONTH];
  const mtdShare = monthDays === 0 ? 1 : calendar.elapsedThisMonth / monthDays;
  const dailyBudgetRate = monthDays === 0 ? 0 : budget[CURRENT_MONTH] / monthDays;

  if (period === "daily") {
    return { actual: todayActual, budget: dailyBudgetRate, budgetToDate: dailyBudgetRate, ly: todayLy, dailyBudgetRate, ...periodDays(period, calendar) };
  }

  const { first, last } = periodMonths(period);
  const completed = range(first, CURRENT_MONTH - 1);
  return {
    actual: sum(range(first, CURRENT_MONTH).map((m) => monthlyActual[m] ?? 0)),
    budget: sum(range(first, last).map((m) => budget[m])),
    budgetToDate: sum(completed.map((m) => budget[m])) + budget[CURRENT_MONTH] * mtdShare,
    ly: sum(completed.map((m) => monthlyLy[m])) + monthlyLy[CURRENT_MONTH] * mtdShare,
    dailyBudgetRate,
    ...periodDays(period, calendar),
  };
}

/** Combined performance for several Account Managers (e.g. the whole company). */
export function combinedPerformance(reps: string[], period: PeriodType, inputs: PerfInputs): Performance {
  const rows = reps.map((rep) => repPerformance(rep, period, inputs));
  return {
    actual: sum(rows.map((r) => r.actual)),
    budget: sum(rows.map((r) => r.budget)),
    budgetToDate: sum(rows.map((r) => r.budgetToDate)),
    ly: sum(rows.map((r) => r.ly)),
    dailyBudgetRate: sum(rows.map((r) => r.dailyBudgetRate)),
    ...periodDays(period, inputs.calendar),
  };
}

export function withMetrics(p: Performance): PerformanceMetrics {
  const remainingDays = Math.max(0, p.totalDays - p.elapsedDays);
  return {
    ...p,
    pctOfBudget: p.budget === 0 ? 0 : (p.actual / p.budget) * 100,
    pctOfPeriodElapsed: p.totalDays === 0 ? 0 : (p.elapsedDays / p.totalDays) * 100,
    vsLyAmount: p.actual - p.ly,
    vsLyPct: p.ly === 0 ? 0 : ((p.actual - p.ly) / p.ly) * 100,
    daysAheadBehind: p.dailyBudgetRate === 0 ? 0 : (p.actual - p.budgetToDate) / p.dailyBudgetRate,
    remainingDays,
    requiredPerDay: remainingDays === 0 ? 0 : Math.max(0, p.budget - p.actual) / remainingDays,
  };
}

export function paceStatus(daysAheadBehind: number): PaceStatus {
  if (daysAheadBehind >= 0.5) return "ahead";
  if (daysAheadBehind <= -0.5) return "behind";
  return "on_pace";
}

export const paceLabel: Record<PaceStatus, string> = {
  ahead: "Ahead",
  on_pace: "On pace",
  behind: "Behind",
};

export const paceTone: Record<PaceStatus, "emerald" | "slate" | "rose"> = {
  ahead: "emerald",
  on_pace: "slate",
  behind: "rose",
};

export function formatDays(days: number): string {
  const rounded = Math.round(days * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)} days`;
}

export function formatPct(pct: number, signed = false): string {
  const sign = signed && pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** Month-by-month actual vs budget vs LY for the fiscal year, summed across the given reps. */
export function monthlySeries(reps: string[], { budgets, metric }: PerfInputs) {
  return MONTHS.map((month, m) => {
    const actuals = reps.map((rep) => actualsFor(rep, metric));
    return {
      month: m === CURRENT_MONTH ? `${month} (MTD)` : month,
      actual: m > CURRENT_MONTH ? null : sum(actuals.map((a) => a.monthlyActual[m] ?? 0)),
      budget: sum(reps.map((rep) => monthlyBudgetFor(budgets, rep, metric)[m])),
      ly: sum(actuals.map((a) => a.monthlyLy[m])),
    };
  });
}

/** Orders dated within the selected period, up to the demo date. Their totals tie out to repPerformance. */
export function ordersInPeriod(orders: SalesOrder[], period: PeriodType): SalesOrder[] {
  if (period === "daily") return orders.filter((o) => o.date === AS_OF_ISO);
  const { first } = periodMonths(period);
  return orders.filter((o) => {
    const [y, m] = o.date.split("-").map(Number);
    return y === FISCAL_YEAR && m - 1 >= first && m - 1 <= CURRENT_MONTH && o.date <= AS_OF_ISO;
  });
}

export interface OrderTotals {
  orders: number;
  sales: number;
  cost: number;
  gp: number;
  margin: number;
}

export function orderTotals(orders: SalesOrder[]): OrderTotals {
  const sales = sum(orders.map((o) => o.amount));
  const cost = sum(orders.map((o) => o.cost));
  const gp = sum(orders.map(grossProfit));
  return { orders: orders.length, sales, cost, gp, margin: sales === 0 ? 0 : (gp / sales) * 100 };
}
