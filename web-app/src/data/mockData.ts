import type { Role } from "../lib/roles";
import {
  AS_OF,
  AS_OF_ISO,
  CURRENT_MONTH,
  FISCAL_YEAR,
  businessDatesInMonth,
  currentMonthDays,
  isoDaysFromToday,
  stampDaysAgo,
} from "../lib/calendar";

export type Source = "ASI SmartBooks" | "Facilis Syncore";
/** Accounts created directly in this app (by Management) rather than synced from a source system. */
export type AccountSource = Source | "Created in app";

/** Which money figure the dashboards and budgets compare: Gross Profit $ (default) or Sales $. Pending client decision Q-1. */
export type Metric = "gp" | "sales";

export const metricLabel: Record<Metric, string> = { gp: "GP$", sales: "Sales$" };

export interface DataSourceInfo {
  name: Source;
  status: "connected" | "attention";
  lastSync: string;
  recordsSynced: number;
  method: string;
}

export const dataSources: DataSourceInfo[] = [
  {
    name: "ASI SmartBooks",
    status: "attention",
    lastSync: "2026-09-21 06:00 AM",
    recordsSynced: 4218,
    method: "Scheduled Excel export",
  },
  {
    name: "Facilis Syncore",
    status: "connected",
    lastSync: "2026-09-21 09:15 AM",
    recordsSynced: 9873,
    method: "Syncore API v2.0",
  },
];

export const pipelineStages = [
  { key: "lead", label: "Lead", color: "bg-slate-400", probability: 0.1 },
  { key: "qualified", label: "Qualified", color: "bg-sky-500", probability: 0.25 },
  { key: "proposal", label: "Proposal", color: "bg-amber-500", probability: 0.5 },
  { key: "negotiation", label: "Negotiation", color: "bg-violet-500", probability: 0.75 },
  { key: "closed_won", label: "Closed Won", color: "bg-emerald-500", probability: 1 },
] as const;

export type PipelineStageKey = (typeof pipelineStages)[number]["key"];

export interface PipelineDeal {
  id: string;
  name: string;
  company: string;
  value: number;
  owner: string;
  stage: PipelineStageKey;
  closeDate: string;
}

export const pipelineDealSeed: PipelineDeal[] = [
  { id: "D-1001", name: "Fleet resupply contract", company: "Harbor Logistics", value: 42000, owner: "M. Alvarez", stage: "lead", closeDate: "2026-10-12" },
  { id: "D-1002", name: "Annual parts agreement", company: "Meridian Freight", value: 128500, owner: "D. Chen", stage: "qualified", closeDate: "2026-09-28" },
  { id: "D-1003", name: "Warehouse equipment refresh", company: "Bluecrest Supply", value: 76200, owner: "R. Okafor", stage: "qualified", closeDate: "2026-10-05" },
  { id: "D-1004", name: "Regional distribution deal", company: "Northgate Co-op", value: 215000, owner: "S. Patel", stage: "proposal", closeDate: "2026-09-20" },
  { id: "D-1005", name: "Multi-site service plan", company: "Coastal Industrial", value: 93400, owner: "J. Whitfield", stage: "proposal", closeDate: "2026-09-25" },
  { id: "D-1006", name: "Referral: parts distribution", company: "Anchor Point LLC", value: 58000, owner: "M. Alvarez", stage: "negotiation", closeDate: "2026-09-14" },
  { id: "D-1007", name: "Renewal + expansion", company: "TriState Materials", value: 164900, owner: "D. Chen", stage: "negotiation", closeDate: "2026-09-10" },
  { id: "D-1008", name: "New account onboarding", company: "Redline Transport", value: 37500, owner: "R. Okafor", stage: "closed_won", closeDate: "2026-08-30" },
  { id: "D-1009", name: "Bulk order standing PO", company: "Summit Builders", value: 289000, owner: "S. Patel", stage: "closed_won", closeDate: "2026-08-22" },
];

export type AccountPriority = "A" | "B" | "Prospect";

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalOrders: number;
  lifetimeValue: number;
  source: AccountSource;
  since: string;
  accountManager: string;
  priority: AccountPriority;
  notes: string;
  weeklyActivityLogged: boolean;
  monthlyActivityLogged: boolean;
  lyGrossProfit: number;
}

export const customerSeed: Customer[] = [
  { id: "C-2001", name: "Laura Kim", company: "Harbor Logistics", email: "l.kim@harborlogistics.com", phone: "(555) 201-3344", totalOrders: 46, lifetimeValue: 412000, source: "ASI SmartBooks", since: "2021-03-11", accountManager: "M. Alvarez", priority: "A", notes: "Key account — quarterly business review scheduled for Oct.", weeklyActivityLogged: true, monthlyActivityLogged: true, lyGrossProfit: 96400 },
  { id: "C-2002", name: "Trevor Boyd", company: "Meridian Freight", email: "trevor.boyd@meridianfreight.com", phone: "(555) 288-9021", totalOrders: 31, lifetimeValue: 298500, source: "Facilis Syncore", since: "2022-07-02", accountManager: "D. Chen", priority: "A", notes: "Renewal + expansion deal in negotiation.", weeklyActivityLogged: true, monthlyActivityLogged: true, lyGrossProfit: 71200 },
  { id: "C-2003", name: "Priya Nair", company: "Bluecrest Supply", email: "priya.nair@bluecrest.com", phone: "(555) 340-1187", totalOrders: 58, lifetimeValue: 521300, source: "ASI SmartBooks", since: "2019-11-19", accountManager: "R. Okafor", priority: "A", notes: "Longest-tenured account, stable monthly volume.", weeklyActivityLogged: false, monthlyActivityLogged: true, lyGrossProfit: 118500 },
  { id: "C-2004", name: "Owen Fischer", company: "Northgate Co-op", email: "owen.f@northgateco.com", phone: "(555) 118-7765", totalOrders: 22, lifetimeValue: 187600, source: "Facilis Syncore", since: "2023-01-27", accountManager: "S. Patel", priority: "B", notes: "Backorder issue affecting reorder cadence — see Order Excellence.", weeklyActivityLogged: false, monthlyActivityLogged: false, lyGrossProfit: 39800 },
  { id: "C-2005", name: "Dana Whitcombe", company: "Coastal Industrial", email: "dana.w@coastalind.com", phone: "(555) 902-4471", totalOrders: 39, lifetimeValue: 356200, source: "Facilis Syncore", since: "2020-09-08", accountManager: "J. Whitfield", priority: "B", notes: "Multi-site service plan up for renewal in Q4.", weeklyActivityLogged: true, monthlyActivityLogged: true, lyGrossProfit: 82100 },
  { id: "C-2006", name: "Marcus Ihejirika", company: "TriState Materials", email: "marcus.i@tristatemat.com", phone: "(555) 664-2290", totalOrders: 64, lifetimeValue: 601400, source: "ASI SmartBooks", since: "2018-05-14", accountManager: "D. Chen", priority: "A", notes: "Largest account by lifetime value.", weeklyActivityLogged: true, monthlyActivityLogged: true, lyGrossProfit: 142300 },
  { id: "C-2007", name: "Grace Whitfield", company: "Anchor Point LLC", email: "g.whitfield@anchorpoint.com", phone: "(555) 774-1290", totalOrders: 6, lifetimeValue: 58000, source: "ASI SmartBooks", since: "2025-11-02", accountManager: "M. Alvarez", priority: "Prospect", notes: "In negotiation, targeting close before quarter end.", weeklyActivityLogged: true, monthlyActivityLogged: false, lyGrossProfit: 0 },
  { id: "C-2008", name: "Sam Delgado", company: "Redline Transport", email: "s.delgado@redlinetrans.com", phone: "(555) 330-8842", totalOrders: 2, lifetimeValue: 9600, source: "Facilis Syncore", since: "2026-02-14", accountManager: "R. Okafor", priority: "Prospect", notes: "Early-stage lead, follow up monthly.", weeklyActivityLogged: false, monthlyActivityLogged: false, lyGrossProfit: 0 },
];

export interface Prospect {
  id: string;
  name: string;
  company: string;
  stage: PipelineStageKey;
  estValue: number;
  owner: string;
  lastContact: string;
}

export const prospectSeed: Prospect[] = [
  { id: "P-3001", name: "Grace Whitfield", company: "Anchor Point LLC", stage: "negotiation", estValue: 58000, owner: "M. Alvarez", lastContact: "2026-09-01" },
  { id: "P-3002", name: "Sam Delgado", company: "Redline Transport", stage: "lead", estValue: 21500, owner: "R. Okafor", lastContact: "2026-08-29" },
  { id: "P-3003", name: "Elena Marsh", company: "Summit Builders", stage: "qualified", estValue: 143000, owner: "S. Patel", lastContact: "2026-08-27" },
  { id: "P-3004", name: "Isaac Ton", company: "Northgate Co-op", stage: "proposal", estValue: 215000, owner: "S. Patel", lastContact: "2026-08-30" },
  { id: "P-3005", name: "Renee Castillo", company: "Vantage Rail Co.", stage: "lead", estValue: 34800, owner: "J. Whitfield", lastContact: "2026-08-22" },
];

export interface ReferralPartner {
  id: string;
  name: string;
  contact: string;
  referralsSent: number;
  conversions: number;
  commissionOwed: number;
  status: "active" | "inactive";
}

export const referralPartnerSeed: ReferralPartner[] = [
  { id: "R-4001", name: "Keystone Advisory Group", contact: "b.harmon@keystoneadv.com", referralsSent: 18, conversions: 11, commissionOwed: 8250, status: "active" },
  { id: "R-4002", name: "Lonestar Equipment Brokers", contact: "c.reyes@lonestareb.com", referralsSent: 9, conversions: 4, commissionOwed: 3100, status: "active" },
  { id: "R-4003", name: "Palmetto Trade Partners", contact: "info@palmettotrade.com", referralsSent: 5, conversions: 1, commissionOwed: 600, status: "inactive" },
  { id: "R-4004", name: "Ironclad Distribution Network", contact: "a.silva@ironcladdn.com", referralsSent: 27, conversions: 19, commissionOwed: 14700, status: "active" },
];

/**
 * Users / team members. The demo "View as" switcher lists these, and Management can add more
 * (including Assistant accounts) from Settings → Team Access.
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Assistants only: the Account Managers this assistant supports. */
  supports?: string[];
  status: "active" | "invited";
}

export const teamSeed: TeamMember[] = [
  { id: "U-01", name: "John Doe", email: "john.doe@add-impact.com", role: "super_user", status: "active" },
  { id: "U-02", name: "Jane Doe", email: "jane.doe@add-impact.com", role: "management", status: "active" },
  { id: "U-03", name: "M. Alvarez", email: "m.alvarez@add-impact.com", role: "account_manager", status: "active" },
  { id: "U-04", name: "D. Chen", email: "d.chen@add-impact.com", role: "account_manager", status: "active" },
  { id: "U-05", name: "R. Okafor", email: "r.okafor@add-impact.com", role: "account_manager", status: "active" },
  { id: "U-06", name: "S. Patel", email: "s.patel@add-impact.com", role: "account_manager", status: "active" },
  { id: "U-07", name: "J. Whitfield", email: "j.whitfield@add-impact.com", role: "account_manager", status: "active" },
  { id: "U-08", name: "L. Brooks", email: "l.brooks@add-impact.com", role: "assistant", supports: ["M. Alvarez", "D. Chen"], status: "active" },
  { id: "U-09", name: "P. Nguyen", email: "p.nguyen@add-impact.com", role: "assistant", supports: ["R. Okafor", "S. Patel"], status: "active" },
  { id: "U-10", name: "K. Sanders", email: "k.sanders@add-impact.com", role: "csr", status: "active" },
  { id: "U-11", name: "T. Reyes", email: "t.reyes@add-impact.com", role: "csr", status: "active" },
  { id: "U-12", name: "M. Duarte", email: "m.duarte@add-impact.com", role: "csr", status: "active" },
];

/** An Account Manager's Sales Dashboard shared (read-only) with one of their assistants. */
export interface DashboardShare {
  owner: string;
  assistant: string;
  sharedAt: string;
}

export const dashboardShareSeed: DashboardShare[] = [
  { owner: "M. Alvarez", assistant: "L. Brooks", sharedAt: "2026-09-15" },
  { owner: "R. Okafor", assistant: "P. Nguyen", sharedAt: "2026-09-10" },
];

/**
 * Budgets: monthly targets per Account Manager per fiscal year, in GP$ and/or Sales$. Management creates and edits
 * these on the Budgets page; they drive every "vs Budget" and "Days ahead / behind" figure.
 */
export interface Budget {
  id: string;
  rep: string;
  fiscalYear: number;
  /** Jan–Dec GP$ budget, if set. */
  gp?: number[];
  /** Jan–Dec Sales$ budget, if set. */
  sales?: number[];
  notes?: string;
  updatedBy: string;
  updatedAt: string;
}

export function budgetValues(budget: Budget | undefined, metric: Metric): number[] | undefined {
  return budget?.[metric];
}

const amSeed = [
  { rep: "M. Alvarez", base: 15000, pace: 1.06, ly: 0.9, margin: 0.31 },
  { rep: "D. Chen", base: 15000, pace: 0.78, ly: 1.02, margin: 0.27 },
  { rep: "R. Okafor", base: 14000, pace: 0.9, ly: 0.94, margin: 0.33 },
  { rep: "S. Patel", base: 13000, pace: 0.74, ly: 1.05, margin: 0.29 },
  { rep: "J. Whitfield", base: 12000, pace: 1.02, ly: 0.88, margin: 0.3 },
];

/** Seasonal shape of the seeded budgets (sums to 12). */
const budgetShape = [0.8, 0.87, 1, 1, 1.07, 1.07, 1, 1, 1, 1.07, 1.07, 1.05];

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const wobble = (i: number, seed: number, amount = 0.07) => 1 + amount * Math.sin(i * 1.9 + seed * 2.3);
const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0);

export const budgetSeed: Budget[] = amSeed.map((a, i) => ({
  id: `B-2026-${i + 1}`,
  rep: a.rep,
  fiscalYear: 2026,
  gp: budgetShape.map((s) => roundTo(a.base * s, 100)),
  sales: budgetShape.map((s) => roundTo((a.base * s) / a.margin, 500)),
  notes: a.rep === "S. Patel" ? "Sep raised after the Northgate regional deal moved to proposal." : "",
  updatedBy: "Jane Doe",
  updatedAt: a.rep === "S. Patel" ? "2026-09-14 08:12" : "2026-01-06 09:30",
}));

/** One metric's actual and last-year figures for an Account Manager. */
export interface ActualSeries {
  /** FY2026 by month. Current month is month-to-date; future months are null. */
  monthlyActual: (number | null)[];
  /** FY2025 (last year) full months. */
  monthlyLy: number[];
  todayActual: number;
  todayLy: number;
}

/**
 * Actual and last-year GP$ and Sales$ per Account Manager, as they'd arrive from ASI SmartBooks + Facilis Syncore.
 * Dummy figures generated once from the seeded budgets, so editing a budget later does not move actuals.
 */
export interface RepActuals {
  rep: string;
  gp: ActualSeries;
  sales: ActualSeries;
}

export const repActuals: RepActuals[] = amSeed.map((a, idx) => {
  const budget = budgetSeed[idx].gp!;
  const mtdShare = currentMonthDays.elapsed / currentMonthDays.total;
  const monthlyLy = budget.map((b, m) => roundTo(b * a.ly * wobble(m, idx + 7), 10));
  const monthlyActual = budget.map((b, m) => {
    if (m > CURRENT_MONTH) return null;
    const full = b * a.pace * wobble(m, idx);
    return roundTo(m === CURRENT_MONTH ? full * mtdShare : full, 10);
  });
  const todayActual = roundTo((budget[CURRENT_MONTH] / currentMonthDays.total) * a.pace * (1 + 0.3 * Math.sin(idx * 3.1 + 1)), 10);
  const todayLy = roundTo((monthlyLy[CURRENT_MONTH] / currentMonthDays.total) * (1 + 0.15 * Math.cos(idx * 2.2)), 10);
  // Sales = GP ÷ margin, with the margin drifting a few points month to month (and a touch lower last year).
  const monthMargin = (m: number) => a.margin * (1 + 0.04 * Math.sin(m * 1.3 + idx));
  const lyMargin = (m: number) => a.margin * 0.98 * (1 + 0.04 * Math.cos(m * 1.1 + idx));
  return {
    rep: a.rep,
    gp: { monthlyActual, monthlyLy, todayActual, todayLy },
    sales: {
      monthlyActual: monthlyActual.map((v, m) => (v === null ? null : roundTo(v / monthMargin(m), 10))),
      monthlyLy: monthlyLy.map((v, m) => roundTo(v / lyMargin(m), 10)),
      todayActual: roundTo(todayActual / monthMargin(CURRENT_MONTH), 10),
      todayLy: roundTo(todayLy / lyMargin(CURRENT_MONTH), 10),
    },
  };
});

export interface SalesOrder {
  id: string;
  customer: string;
  rep: string;
  date: string;
  amount: number;
  cost: number;
  status: "paid" | "pending" | "overdue";
  source: Source;
}

/** Customers each Account Manager's dummy orders are spread across, with the system each customer's orders live in. */
const orderCustomers: Record<string, [string, Source][]> = {
  "M. Alvarez": [["Harbor Logistics", "ASI SmartBooks"], ["Anchor Point LLC", "ASI SmartBooks"], ["Pinecrest Outfitters", "Facilis Syncore"]],
  "D. Chen": [["TriState Materials", "ASI SmartBooks"], ["Meridian Freight", "Facilis Syncore"], ["Lakeside Health", "Facilis Syncore"]],
  "R. Okafor": [["Bluecrest Supply", "ASI SmartBooks"], ["Redline Transport", "Facilis Syncore"], ["Granite Ridge Schools", "ASI SmartBooks"]],
  "S. Patel": [["Northgate Co-op", "Facilis Syncore"], ["Summit Builders", "ASI SmartBooks"], ["Cedar & Pine Realty", "Facilis Syncore"]],
  "J. Whitfield": [["Coastal Industrial", "Facilis Syncore"], ["Vantage Rail Co.", "ASI SmartBooks"], ["Palmetto Trade Partners", "Facilis Syncore"]],
};

/** Splits a total into weighted whole-dollar parts that add back up to exactly the total. */
function split(total: number, weights: number[]): number[] {
  const weightTotal = sum(weights);
  const parts = weights.map((w) => Math.round((total * w) / weightTotal));
  parts[parts.length - 1] += total - sum(parts);
  return parts;
}

/**
 * Dummy orders generated from the same actuals the dashboards use, so for any rep and any period the orders' GP and
 * sales add up exactly to the performance figures (today's orders = Daily, September's = Monthly, and so on).
 */
export const salesOrders: SalesOrder[] = (() => {
  const orders: Omit<SalesOrder, "id">[] = [];
  repActuals.forEach(({ rep, gp, sales }, r) => {
    const customers = orderCustomers[rep];
    const add = (gpTotal: number, salesTotal: number, dates: string[], month: number, seed: number) => {
      const n = dates.length;
      const salesWeights = dates.map((_, k) => 1 + 0.5 * Math.sin(seed + k * 2.1));
      const gpWeights = salesWeights.map((w, k) => w * (1 + 0.15 * Math.cos(seed * 1.7 + k)));
      const saleParts = split(salesTotal, salesWeights);
      const gpParts = split(gpTotal, gpWeights);
      dates.forEach((date, k) => {
        const [customer, source] = customers[(seed + k) % customers.length];
        const status: SalesOrder["status"] =
          month < CURRENT_MONTH - 1 ? "paid" : month === CURRENT_MONTH - 1 ? (k === n - 1 && r % 2 === 1 ? "overdue" : k % 2 ? "pending" : "paid") : "pending";
        orders.push({ customer, rep, date, amount: saleParts[k], cost: saleParts[k] - gpParts[k], status, source });
      });
    };
    for (let m = 0; m <= CURRENT_MONTH; m++) {
      const pick = (days: string[], n: number) => Array.from({ length: n }, (_, k) => days[Math.floor(((k + 0.5) * days.length) / n)]);
      if (m < CURRENT_MONTH) {
        add(gp.monthlyActual[m]!, sales.monthlyActual[m]!, pick(businessDatesInMonth(FISCAL_YEAR, m), 4), m, r * 12 + m);
      } else {
        const earlier = businessDatesInMonth(FISCAL_YEAR, m, AS_OF.getDate() - 1);
        add(gp.monthlyActual[m]! - gp.todayActual, sales.monthlyActual[m]! - sales.todayActual, pick(earlier, 3), m, r * 12 + m);
        add(gp.todayActual, sales.todayActual, Array(r % 2 === 0 ? 2 : 1).fill(AS_OF_ISO), m, r * 7 + 3);
      }
    }
  });
  return orders
    .sort((a, b) => a.date.localeCompare(b.date) || a.rep.localeCompare(b.rep))
    .map((o, i) => ({ ...o, id: `SO-${87001 + i}` }))
    .reverse();
})();

export function grossProfit(order: SalesOrder): number {
  return order.amount - order.cost;
}

export function marginPct(order: SalesOrder): number {
  return order.amount === 0 ? 0 : (grossProfit(order) / order.amount) * 100;
}

/** Project Tracker / CPR Sales Plan: active initiatives and prospective opportunities per account. */
export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectTrackerEntry {
  id: string;
  accountName: string;
  accountManager: string;
  /** Plan month, "YYYY-MM". */
  month: string;
  targetValue: number;
  historicalProjects: string;
  potentialProjects: string;
  status: "researching" | "active" | "on_hold" | "won" | "lost";
  notes: string;
  links: ProjectLink[];
  updatedBy: string;
  updatedAt: string;
}

export const projectTrackerSeed: ProjectTrackerEntry[] = [
  { id: "PT-01", accountName: "Harbor Logistics", accountManager: "M. Alvarez", month: "2026-09", targetValue: 65000, historicalProjects: "Uniform program (2024), fleet signage (2025)", potentialProjects: "Branded PPE rollout for new depot", status: "active", notes: "Waiting on budget sign-off from their ops director.", links: [{ label: "Project sheet", url: "https://docs.google.com/spreadsheets/d/example-harbor-projects" }, { label: "Quote Q-2291", url: "https://example.com/quotes/Q-2291" }], updatedBy: "M. Alvarez", updatedAt: "2026-09-15 11:20" },
  { id: "PT-02", accountName: "TriState Materials", accountManager: "D. Chen", month: "2026-09", targetValue: 210000, historicalProjects: "Annual parts agreement (2023-2025)", potentialProjects: "3-year renewal + expanded SKU list", status: "active", notes: "Renewal terms in legal review.", links: [{ label: "Project sheet", url: "https://docs.google.com/spreadsheets/d/example-tristate-projects" }], updatedBy: "D. Chen", updatedAt: "2026-09-12 16:05" },
  { id: "PT-03", accountName: "Bluecrest Supply", accountManager: "R. Okafor", month: "2026-10", targetValue: 34000, historicalProjects: "Warehouse equipment refresh (2025)", potentialProjects: "Second-site equipment package", status: "researching", notes: "Need updated site headcount before quoting.", links: [], updatedBy: "R. Okafor", updatedAt: "2026-09-02 09:45" },
  { id: "PT-04", accountName: "Northgate Co-op", accountManager: "S. Patel", month: "2026-08", targetValue: 215000, historicalProjects: "None on file", potentialProjects: "Regional distribution deal", status: "on_hold", notes: "Paused pending resolution of open backorder issue (OI-501).", links: [{ label: "Proposal deck", url: "https://example.com/docs/northgate-proposal" }], updatedBy: "Jane Doe", updatedAt: "2026-09-13 17:55" },
  { id: "PT-05", accountName: "Redline Transport", accountManager: "R. Okafor", month: "2026-08", targetValue: 37500, historicalProjects: "None — new account", potentialProjects: "Standing PO for consumables", status: "won", notes: "Closed 2026-08-30, onboarding underway.", links: [{ label: "Order SO-88220", url: "https://example.com/orders/SO-88220" }], updatedBy: "R. Okafor", updatedAt: "2026-08-30 15:10" },
  { id: "PT-06", accountName: "Vantage Rail Co.", accountManager: "J. Whitfield", month: "2026-08", targetValue: 34800, historicalProjects: "None on file", potentialProjects: "Introductory order + site visit", status: "lost", notes: "Went with an incumbent supplier this cycle; revisit in 6 months.", links: [], updatedBy: "J. Whitfield", updatedAt: "2026-08-21 10:30" },
];

export const projectStatusLabel: Record<ProjectTrackerEntry["status"], string> = {
  researching: "Researching",
  active: "Active",
  on_hold: "On Hold",
  won: "Won",
  lost: "Lost",
};

/** Audit Trail (Management / Super User only). */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  details: string;
}

export const auditLogSeed: AuditLogEntry[] = [
  { id: "AL-9008", timestamp: "2026-09-15 10:04", user: "M. Alvarez", role: "Account Manager", action: "Shared sales dashboard", entity: "M. Alvarez — Sales Dashboard", details: "Shared read-only with assistant L. Brooks." },
  { id: "AL-9001", timestamp: "2026-09-14 08:12", user: "Jane Doe", role: "Management", action: "Updated budget", entity: "S. Patel — FY2026 GP$ budget", details: "Sep: $12,500 → $13,000." },
  { id: "AL-9002", timestamp: "2026-09-13 17:40", user: "K. Sanders", role: "CSR", action: "Updated order issue", entity: "OI-501 — Northgate Co-op", details: "Marked as Open, added carrier delay note." },
  { id: "AL-9003", timestamp: "2026-09-13 14:05", user: "M. Alvarez", role: "Account Manager", action: "Added account note", entity: "C-2001 — Harbor Logistics", details: "Logged weekly activity: QBR scheduled for October." },
  { id: "AL-9004", timestamp: "2026-09-12 11:22", user: "John Doe", role: "Super User", action: "Changed user role", entity: "T. Reyes", details: "Role changed from Account Manager to CSR." },
  { id: "AL-9005", timestamp: "2026-09-11 09:50", user: "Jane Doe", role: "Management", action: "Created account", entity: "C-2008 — Redline Transport", details: "New account created and assigned to R. Okafor, priority set to Prospect." },
  { id: "AL-9007", timestamp: "2026-09-10 17:15", user: "R. Okafor", role: "Account Manager", action: "Shared sales dashboard", entity: "R. Okafor — Sales Dashboard", details: "Shared read-only with assistant P. Nguyen." },
  { id: "AL-9006", timestamp: "2026-09-10 16:33", user: "Jane Doe", role: "Management", action: "Exported report", entity: "Sales Summary — August 2026", details: "Exported CSV for board reporting." },
];

/** System access levels reference (Settings page). Rows tied to open client decisions follow the demo setting. */
export interface AccessLevelRow {
  capability: string;
  account_manager: boolean;
  assistant: boolean;
  csr: boolean;
  management: boolean;
  super_user: boolean;
}

export function accessLevelMatrix(decisions: { amProjectAccess: boolean; amSeeAllOrderIssues: boolean }): AccessLevelRow[] {
  return [
    { capability: "View own Sales Dashboard", account_manager: true, assistant: false, csr: false, management: true, super_user: true },
    { capability: "Compare performance vs LY, Budget, and days ahead / behind", account_manager: true, assistant: true, csr: false, management: true, super_user: true },
    { capability: "Share own Sales Dashboard with assistants", account_manager: true, assistant: false, csr: false, management: false, super_user: false },
    { capability: "View a Sales Dashboard shared by their Account Manager (read-only)", account_manager: false, assistant: true, csr: false, management: true, super_user: true },
    { capability: "View company-wide metrics", account_manager: false, assistant: false, csr: false, management: true, super_user: true },
    { capability: "View budgets (Account Managers: own only)", account_manager: true, assistant: false, csr: false, management: true, super_user: true },
    { capability: "Create / edit budgets and business days", account_manager: false, assistant: false, csr: false, management: true, super_user: true },
    { capability: "Create new customer accounts", account_manager: false, assistant: false, csr: false, management: true, super_user: true },
    { capability: "View / update own accounts", account_manager: true, assistant: false, csr: false, management: true, super_user: true },
    { capability: "Create user accounts (incl. Assistants)", account_manager: false, assistant: false, csr: false, management: true, super_user: true },
    { capability: decisions.amSeeAllOrderIssues ? "View order status (Account Managers: all accounts, read-only)" : "View order status (own accounts)", account_manager: true, assistant: true, csr: true, management: true, super_user: true },
    { capability: "Log / update Order Excellence issues", account_manager: false, assistant: false, csr: true, management: true, super_user: true },
    { capability: "Link the Order Excellence spreadsheet", account_manager: false, assistant: false, csr: false, management: true, super_user: true },
    { capability: decisions.amProjectAccess ? "Project Tracker (Account Managers: own entries)" : "Access Project Tracker", account_manager: decisions.amProjectAccess, assistant: false, csr: false, management: true, super_user: true },
    { capability: "View audit trail", account_manager: false, assistant: false, csr: false, management: true, super_user: true },
    { capability: "Configure system / integrations", account_manager: false, assistant: false, csr: false, management: false, super_user: true },
  ];
}

export interface OrderIssue {
  id: string;
  order: string;
  customer: string;
  /** Account Manager who owns the customer — used to scope issues for AMs and their assistants. */
  accountManager: string;
  issueType: string;
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  assignedTo: string;
  /** Date the customer needs the order in hand. */
  inHandDate: string;
  openedOn: string;
  resolvedOn?: string;
  notes: string;
  updatedBy: string;
  updatedAt: string;
}

export const issueTypes = [
  "Shipping delay",
  "Backorder",
  "Imprint proof pending",
  "Wrong item shipped",
  "Damaged goods",
  "Invoice discrepancy",
  "Pricing error",
  "Other",
];

/** Built when the demo data is seeded, relative to the real clock, so "days open" and the daily-update stamp look current. */
export function orderIssueSeed(): OrderIssue[] {
  const d = isoDaysFromToday;
  return [
    { id: "OI-501", order: "SO-88216", customer: "Northgate Co-op", accountManager: "S. Patel", issueType: "Shipping delay", severity: "high", status: "open", assignedTo: "K. Sanders", inHandDate: d(4), openedOn: d(-6), notes: "Carrier delay at the Memphis hub; expedite requested.", updatedBy: "K. Sanders", updatedAt: stampDaysAgo(1, 17, 40) },
    { id: "OI-502", order: "SO-88220", customer: "Redline Transport", accountManager: "R. Okafor", issueType: "Invoice discrepancy", severity: "medium", status: "in_progress", assignedTo: "T. Reyes", inHandDate: d(9), openedOn: d(-3), notes: "Freight billed twice; credit memo requested from accounting.", updatedBy: "T. Reyes", updatedAt: stampDaysAgo(1, 16, 5) },
    { id: "OI-503", order: "SO-88214", customer: "Meridian Freight", accountManager: "D. Chen", issueType: "Wrong item shipped", severity: "high", status: "open", assignedTo: "K. Sanders", inHandDate: d(2), openedOn: d(-2), notes: "Navy polos shipped instead of black; replacement on order.", updatedBy: "K. Sanders", updatedAt: stampDaysAgo(1, 15, 30) },
    { id: "OI-507", order: "SO-88213", customer: "Harbor Logistics", accountManager: "M. Alvarez", issueType: "Imprint proof pending", severity: "medium", status: "open", assignedTo: "M. Duarte", inHandDate: d(12), openedOn: d(-1), notes: "Waiting on customer approval of the revised logo proof.", updatedBy: "M. Duarte", updatedAt: stampDaysAgo(1, 14, 10) },
    { id: "OI-504", order: "SO-88198", customer: "Vantage Rail Co.", accountManager: "J. Whitfield", issueType: "Damaged goods", severity: "medium", status: "resolved", assignedTo: "M. Duarte", inHandDate: d(-2), openedOn: d(-8), resolvedOn: d(-3), notes: "Replacement delivered; carrier claim filed.", updatedBy: "M. Duarte", updatedAt: stampDaysAgo(3, 11, 0) },
    { id: "OI-505", order: "SO-88187", customer: "Summit Builders", accountManager: "S. Patel", issueType: "Backorder", severity: "low", status: "in_progress", assignedTo: "T. Reyes", inHandDate: d(15), openedOn: d(-9), notes: "Supplier restock ETA next week; customer informed.", updatedBy: "T. Reyes", updatedAt: stampDaysAgo(2, 10, 20) },
    { id: "OI-506", order: "SO-88170", customer: "Palmetto Trade Partners", accountManager: "J. Whitfield", issueType: "Pricing error", severity: "low", status: "resolved", assignedTo: "M. Duarte", inHandDate: d(-5), openedOn: d(-12), resolvedOn: d(-10), notes: "Corrected invoice sent.", updatedBy: "M. Duarte", updatedAt: stampDaysAgo(10, 9, 15) },
  ];
}

/** "company" reports contain company-wide metrics and are limited to Management / Super User. */
export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  updated: string;
  scope: "company" | "personal";
}

export const reportCatalog: ReportDefinition[] = [
  { id: "RPT-7", name: "Budget Attainment", description: "Actual vs Budget vs LY with days ahead / behind, by Account Manager.", updated: "Daily", scope: "company" },
  { id: "RPT-1", name: "Sales Summary", description: "Total Sale, Total Cost, GP and Margin % by Account Manager, month to date and year to date.", updated: "Daily", scope: "company" },
  { id: "RPT-2", name: "Pipeline Forecast", description: "Weighted forecast across all open pipeline stages.", updated: "Daily", scope: "company" },
  { id: "RPT-3", name: "Order Issue Trends", description: "Issue volume, severity mix, and resolution time.", updated: "Weekly", scope: "company" },
  { id: "RPT-4", name: "Referral Partner Performance", description: "Referral volume and conversion by partner.", updated: "Monthly", scope: "company" },
  { id: "RPT-5", name: "Customer Activity", description: "Order frequency and lifetime value by account.", updated: "Weekly", scope: "company" },
  { id: "RPT-6", name: "Data Source Reconciliation", description: "Orders, sales and GP by month across ASI SmartBooks and Facilis Syncore.", updated: "Daily", scope: "company" },
  { id: "RPT-8", name: "My Sales Performance", description: "Your actual vs Budget vs LY with days ahead / behind, by period.", updated: "Daily", scope: "personal" },
  { id: "RPT-9", name: "My Account Activity", description: "Order frequency, lifetime value, and logged activity for your accounts.", updated: "Weekly", scope: "personal" },
  { id: "RPT-10", name: "My Pipeline", description: "Your open deals by stage with expected close dates.", updated: "Daily", scope: "personal" },
];
