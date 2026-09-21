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

/** Mon–Fri count for a month, optionally only through a given day of that month. */
export function businessDaysInMonth(year: number, month: number, throughDay?: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = Math.min(lastDay, throughDay ?? lastDay);
  let count = 0;
  for (let day = 1; day <= end; day++) {
    const dow = new Date(year, month, day).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export const currentMonthDays = {
  elapsed: businessDaysInMonth(FISCAL_YEAR, CURRENT_MONTH, AS_OF.getDate()),
  total: businessDaysInMonth(FISCAL_YEAR, CURRENT_MONTH),
};

export function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayIso(): string {
  return nowStamp().slice(0, 10);
}
