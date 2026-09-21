import { repActuals, type Budget } from "../data/mockData";
import { CURRENT_MONTH, FISCAL_YEAR, MONTHS, businessDaysInMonth, currentMonthDays } from "./calendar";

export type PeriodType = "daily" | "monthly" | "quarterly" | "annual";

export const periods: { key: PeriodType; label: string; toDate: string }[] = [
  { key: "daily", label: "Daily", toDate: "Today" },
  { key: "monthly", label: "Monthly", toDate: "Month to date" },
  { key: "quarterly", label: "Quarterly", toDate: "Quarter to date" },
  { key: "annual", label: "Annual", toDate: "Year to date" },
];

/** Raw GP$ figures for one or more Account Managers over a period, as of the demo date. */
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
  /** GP$ needed per remaining business day to finish the period on budget. */
  requiredPerDay: number;
}

export type PaceStatus = "ahead" | "on_pace" | "behind";

const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export function monthlyBudgetFor(budgets: Budget[], rep: string, fiscalYear = FISCAL_YEAR): number[] {
  return budgets.find((b) => b.rep === rep && b.fiscalYear === fiscalYear)?.monthly ?? Array(12).fill(0);
}

function actualsFor(rep: string) {
  return (
    repActuals.find((r) => r.rep === rep) ?? {
      rep,
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

function periodDays(period: PeriodType): { elapsedDays: number; totalDays: number } {
  if (period === "daily") return { elapsedDays: 1, totalDays: 1 };
  const { first, last } = periodMonths(period);
  const days = (m: number) => businessDaysInMonth(FISCAL_YEAR, m);
  return {
    elapsedDays: sum(range(first, CURRENT_MONTH - 1).map(days)) + currentMonthDays.elapsed,
    totalDays: sum(range(first, last).map(days)),
  };
}

export function repPerformance(rep: string, period: PeriodType, budgets: Budget[]): Performance {
  const budget = monthlyBudgetFor(budgets, rep);
  const { monthlyActual, monthlyLy, todayActual, todayLy } = actualsFor(rep);
  const mtdShare = currentMonthDays.elapsed / currentMonthDays.total;
  const dailyBudgetRate = budget[CURRENT_MONTH] / currentMonthDays.total;

  if (period === "daily") {
    return { actual: todayActual, budget: dailyBudgetRate, budgetToDate: dailyBudgetRate, ly: todayLy, dailyBudgetRate, ...periodDays(period) };
  }

  const { first, last } = periodMonths(period);
  const completed = range(first, CURRENT_MONTH - 1);
  return {
    actual: sum(range(first, CURRENT_MONTH).map((m) => monthlyActual[m] ?? 0)),
    budget: sum(range(first, last).map((m) => budget[m])),
    budgetToDate: sum(completed.map((m) => budget[m])) + budget[CURRENT_MONTH] * mtdShare,
    ly: sum(completed.map((m) => monthlyLy[m])) + monthlyLy[CURRENT_MONTH] * mtdShare,
    dailyBudgetRate,
    ...periodDays(period),
  };
}

/** Combined performance for several Account Managers (e.g. the whole company). */
export function combinedPerformance(reps: string[], period: PeriodType, budgets: Budget[]): Performance {
  const rows = reps.map((rep) => repPerformance(rep, period, budgets));
  return {
    actual: sum(rows.map((r) => r.actual)),
    budget: sum(rows.map((r) => r.budget)),
    budgetToDate: sum(rows.map((r) => r.budgetToDate)),
    ly: sum(rows.map((r) => r.ly)),
    dailyBudgetRate: sum(rows.map((r) => r.dailyBudgetRate)),
    ...periodDays(period),
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
export function monthlySeries(reps: string[], budgets: Budget[]) {
  return MONTHS.map((month, m) => {
    const actuals = reps.map((rep) => actualsFor(rep));
    return {
      month: m === CURRENT_MONTH ? `${month} (MTD)` : month,
      actual: m > CURRENT_MONTH ? null : sum(actuals.map((a) => a.monthlyActual[m] ?? 0)),
      budget: sum(reps.map((rep) => monthlyBudgetFor(budgets, rep)[m])),
      ly: sum(actuals.map((a) => a.monthlyLy[m])),
    };
  });
}
