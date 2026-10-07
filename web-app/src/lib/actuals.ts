import type { RepActuals, SalesOrder } from "../data/mockData";
import { AS_OF_ISO, CURRENT_MONTH, FISCAL_YEAR, MONTHS, defaultBusinessDays } from "./calendar";

const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0);

/**
 * Builds each rep's actual and last-year figures straight from their sales orders (the demo ships pre-generated
 * figures instead). FY months after the current one are null; "today" is the orders dated on the as-of date, and last
 * year's daily figure is last year's same month spread over that month's business days.
 */
export function buildRepActuals(orders: SalesOrder[], reps: string[]): RepActuals[] {
  const lyBusinessDays = defaultBusinessDays(FISCAL_YEAR - 1)[CURRENT_MONTH] || 1;

  return reps.map((rep) => {
    const own = orders.filter((o) => o.rep === rep);
    const series = (value: (o: SalesOrder) => number) => {
      const monthly = (year: number) =>
        MONTHS.map((_, m) =>
          sum(
            own
              .filter((o) => Number(o.date.slice(0, 4)) === year && Number(o.date.slice(5, 7)) - 1 === m)
              .map(value),
          ),
        );
      const thisYear = monthly(FISCAL_YEAR);
      const lastYear = monthly(FISCAL_YEAR - 1);
      return {
        monthlyActual: thisYear.map((v, m) => (m > CURRENT_MONTH ? null : v)),
        monthlyLy: lastYear,
        todayActual: sum(own.filter((o) => o.date === AS_OF_ISO).map(value)),
        todayLy: lastYear[CURRENT_MONTH] / lyBusinessDays,
      };
    };
    return { rep, gp: series((o) => o.amount - o.cost), sales: series((o) => o.amount) };
  });
}
