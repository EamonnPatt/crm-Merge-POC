export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const FISCAL_YEAR = 2026;

/** Demo "today". Pinned so the dummy actuals and pace calculations stay internally consistent. */
export const AS_OF = new Date(2026, 8, 21);
export const AS_OF_LABEL = AS_OF.toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
export const CURRENT_MONTH = AS_OF.getMonth();

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const AS_OF_ISO = isoDate(AS_OF);

/**
 * Company holidays (observed dates). Placeholder US calendar until Add Impact sends theirs (NEXT_STEPS I-10).
 * Management can still override any month's business-day count on the Budgets page.
 */
export const COMPANY_HOLIDAYS: { date: string; name: string }[] = [
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-05-26", name: "Memorial Day" },
  { date: "2025-07-04", name: "Independence Day" },
  { date: "2025-09-01", name: "Labor Day" },
  { date: "2025-11-27", name: "Thanksgiving" },
  { date: "2025-11-28", name: "Day after Thanksgiving" },
  { date: "2025-12-25", name: "Christmas Day" },
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-05-25", name: "Memorial Day" },
  { date: "2026-07-03", name: "Independence Day (observed)" },
  { date: "2026-09-07", name: "Labor Day" },
  { date: "2026-11-26", name: "Thanksgiving" },
  { date: "2026-11-27", name: "Day after Thanksgiving" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-05-31", name: "Memorial Day" },
  { date: "2027-07-05", name: "Independence Day (observed)" },
  { date: "2027-09-06", name: "Labor Day" },
  { date: "2027-11-25", name: "Thanksgiving" },
  { date: "2027-11-26", name: "Day after Thanksgiving" },
  { date: "2027-12-24", name: "Christmas Day (observed)" },
];

const holidayDates = new Set(COMPANY_HOLIDAYS.map((h) => h.date));

export function holidaysIn(year: number, month: number) {
  const prefix = `${year}-${pad(month + 1)}-`;
  return COMPANY_HOLIDAYS.filter((h) => h.date.startsWith(prefix));
}

export function isBusinessDay(d: Date): boolean {
  const dow = d.getDay();
  return dow !== 0 && dow !== 6 && !holidayDates.has(isoDate(d));
}

/** Mon–Fri minus company holidays for a month, optionally only through a given day of that month. */
export function businessDaysInMonth(year: number, month: number, throughDay?: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = Math.min(lastDay, throughDay ?? lastDay);
  let count = 0;
  for (let day = 1; day <= end; day++) {
    if (isBusinessDay(new Date(year, month, day))) count++;
  }
  return count;
}

/** The business days of a month as dates, used to spread dummy orders across a month. */
export function businessDatesInMonth(year: number, month: number, throughDay?: number): string[] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = Math.min(lastDay, throughDay ?? lastDay);
  const dates: string[] = [];
  for (let day = 1; day <= end; day++) {
    const d = new Date(year, month, day);
    if (isBusinessDay(d)) dates.push(isoDate(d));
  }
  return dates;
}

export function defaultBusinessDays(year: number): number[] {
  return MONTHS.map((_, m) => businessDaysInMonth(year, m));
}

/** Holiday-aware default for the demo date. Used to seed dummy actuals, which never move when Management edits the calendar. */
export const currentMonthDays = {
  elapsed: businessDaysInMonth(FISCAL_YEAR, CURRENT_MONTH, AS_OF.getDate()),
  total: businessDaysInMonth(FISCAL_YEAR, CURRENT_MONTH),
};

/** Business days per month for the fiscal year, after Management's overrides. Drives every pace calculation. */
export interface BusinessCalendar {
  monthly: number[];
  /** Business days elapsed so far in the current month (holiday-aware, capped at that month's total). */
  elapsedThisMonth: number;
}

export function businessCalendar(overrides?: number[]): BusinessCalendar {
  const monthly = overrides ?? defaultBusinessDays(FISCAL_YEAR);
  return { monthly, elapsedThisMonth: Math.min(currentMonthDays.elapsed, monthly[CURRENT_MONTH]) };
}

export function nowStamp(date = new Date()): string {
  return `${isoDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function todayIso(): string {
  return nowStamp().slice(0, 10);
}

/** Real-clock stamp N days ago at a given time, e.g. stampDaysAgo(1, 17, 40) = yesterday 5:40 PM. */
export function stampDaysAgo(days: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return nowStamp(d);
}

export function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function parseStamp(stamp: string): Date {
  const [date, time = "00:00"] = stamp.split(" ");
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi);
}

/** "today 5:40 PM", "yesterday 9:15 AM", or "Sep 30, 5:40 PM". */
export function relativeStamp(stamp: string, now = new Date()): string {
  const d = parseStamp(stamp);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (dayDiff === 0) return `today ${time}`;
  if (dayDiff === 1) return `yesterday ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

export function hoursSince(stamp: string, now = new Date()): number {
  return (now.getTime() - parseStamp(stamp).getTime()) / 3_600_000;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.max(0, Math.round((parseStamp(toIso).getTime() - parseStamp(fromIso).getTime()) / 86_400_000));
}

/** "2026-08" → "Aug 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : month;
}
