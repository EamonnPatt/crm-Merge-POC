export type Source = "ASI SmartBooks" | "Facilis Syncore";

export const dataSources: {
  name: Source;
  status: "connected" | "attention";
  lastSync: string;
  recordsSynced: number;
  method: string;
}[] = [
  {
    name: "ASI SmartBooks",
    status: "attention",
    lastSync: "2026-09-03 06:00 AM",
    recordsSynced: 4218,
    method: "Scheduled Excel export",
  },
  {
    name: "Facilis Syncore",
    status: "connected",
    lastSync: "2026-09-03 09:15 AM",
    recordsSynced: 9873,
    method: "Syncore API v2.0",
  },
];

export const revenueTrend = [
  { month: "Oct", revenue: 182000, target: 175000 },
  { month: "Nov", revenue: 194500, target: 180000 },
  { month: "Dec", revenue: 221000, target: 200000 },
  { month: "Jan", revenue: 176000, target: 190000 },
  { month: "Feb", revenue: 203500, target: 195000 },
  { month: "Mar", revenue: 238000, target: 210000 },
  { month: "Apr", revenue: 215000, target: 215000 },
  { month: "May", revenue: 247000, target: 220000 },
  { month: "Jun", revenue: 261500, target: 225000 },
  { month: "Jul", revenue: 249000, target: 230000 },
  { month: "Aug", revenue: 272000, target: 235000 },
  { month: "Sep", revenue: 158000, target: 240000 },
];

export const salesByRep = [
  { rep: "M. Alvarez", revenue: 84200 },
  { rep: "D. Chen", revenue: 71850 },
  { rep: "R. Okafor", revenue: 66300 },
  { rep: "S. Patel", revenue: 59900 },
  { rep: "J. Whitfield", revenue: 47650 },
];

export const pipelineStages = [
  { key: "lead", label: "Lead", color: "bg-slate-400" },
  { key: "qualified", label: "Qualified", color: "bg-sky-500" },
  { key: "proposal", label: "Proposal", color: "bg-amber-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-violet-500" },
  { key: "closed_won", label: "Closed Won", color: "bg-emerald-500" },
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

export const pipelineDeals: PipelineDeal[] = [
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
  source: Source;
  since: string;
  accountManager: string;
  priority: AccountPriority;
  notes: string;
  weeklyActivityLogged: boolean;
  monthlyActivityLogged: boolean;
  lyGrossProfit: number;
}

export const customers: Customer[] = [
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

export const prospects: Prospect[] = [
  { id: "P-3001", name: "Grace Whitfield", company: "Anchor Point LLC", stage: "negotiation", estValue: 58000, owner: "M. Alvarez", lastContact: "2026-09-01" },
  { id: "P-3002", name: "Sam Delgado", company: "Redline Transport", stage: "lead", estValue: 21500, owner: "R. Okafor", lastContact: "2026-08-29" },
  { id: "P-3003", name: "Elena Marsh", company: "Summit Builders", stage: "qualified", estValue: 143000, owner: "S. Patel", lastContact: "2026-08-27" },
  { id: "P-3004", name: "IsaacTon", company: "Northgate Co-op", stage: "proposal", estValue: 215000, owner: "S. Patel", lastContact: "2026-08-30" },
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

export const referralPartners: ReferralPartner[] = [
  { id: "R-4001", name: "Keystone Advisory Group", contact: "b.harmon@keystoneadv.com", referralsSent: 18, conversions: 11, commissionOwed: 8250, status: "active" },
  { id: "R-4002", name: "Lonestar Equipment Brokers", contact: "c.reyes@lonestareb.com", referralsSent: 9, conversions: 4, commissionOwed: 3100, status: "active" },
  { id: "R-4003", name: "Palmetto Trade Partners", contact: "info@palmettotrade.com", referralsSent: 5, conversions: 1, commissionOwed: 600, status: "inactive" },
  { id: "R-4004", name: "Ironclad Distribution Network", contact: "a.silva@ironcladdn.com", referralsSent: 27, conversions: 19, commissionOwed: 14700, status: "active" },
];

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

export const salesOrders: SalesOrder[] = [
  { id: "SO-88213", customer: "Harbor Logistics", rep: "M. Alvarez", date: "2026-09-01", amount: 12400, cost: 8680, status: "paid", source: "ASI SmartBooks" },
  { id: "SO-88214", customer: "Meridian Freight", rep: "D. Chen", date: "2026-09-01", amount: 8750, cost: 6300, status: "pending", source: "Facilis Syncore" },
  { id: "SO-88215", customer: "Bluecrest Supply", rep: "R. Okafor", date: "2026-08-31", amount: 21600, cost: 14800, status: "paid", source: "ASI SmartBooks" },
  { id: "SO-88216", customer: "Northgate Co-op", rep: "S. Patel", date: "2026-08-30", amount: 5400, cost: 4050, status: "overdue", source: "Facilis Syncore" },
  { id: "SO-88217", customer: "Coastal Industrial", rep: "J. Whitfield", date: "2026-08-29", amount: 17850, cost: 12100, status: "paid", source: "Facilis Syncore" },
  { id: "SO-88218", customer: "TriState Materials", rep: "D. Chen", date: "2026-08-28", amount: 33200, cost: 22300, status: "pending", source: "ASI SmartBooks" },
  { id: "SO-88219", customer: "Anchor Point LLC", rep: "M. Alvarez", date: "2026-08-27", amount: 9600, cost: 7100, status: "paid", source: "ASI SmartBooks" },
  { id: "SO-88220", customer: "Redline Transport", rep: "R. Okafor", date: "2026-08-26", amount: 4100, cost: 3200, status: "overdue", source: "Facilis Syncore" },
];

export function grossProfit(order: SalesOrder): number {
  return order.amount - order.cost;
}

export function marginPct(order: SalesOrder): number {
  return order.amount === 0 ? 0 : (grossProfit(order) / order.amount) * 100;
}

/** Sales Dashboard: budget vs. actual vs. LY performance, per Account Manager, per period type. */
export type PeriodType = "daily" | "monthly" | "quarterly" | "annual";

export interface RepBudget {
  rep: string;
  businessDaysElapsed: number;
  businessDaysInPeriod: number;
  actualGP: number;
  budgetGP: number;
  lyGP: number;
}

export const repBudgetsByPeriod: Record<PeriodType, RepBudget[]> = {
  daily: [
    { rep: "M. Alvarez", businessDaysElapsed: 1, businessDaysInPeriod: 1, actualGP: 3120, budgetGP: 750, lyGP: 2400 },
    { rep: "D. Chen", businessDaysElapsed: 1, businessDaysInPeriod: 1, actualGP: 980, budgetGP: 750, lyGP: 1100 },
    { rep: "R. Okafor", businessDaysElapsed: 1, businessDaysInPeriod: 1, actualGP: 610, budgetGP: 700, lyGP: 590 },
    { rep: "S. Patel", businessDaysElapsed: 1, businessDaysInPeriod: 1, actualGP: 540, budgetGP: 650, lyGP: 700 },
    { rep: "J. Whitfield", businessDaysElapsed: 1, businessDaysInPeriod: 1, actualGP: 890, budgetGP: 600, lyGP: 520 },
  ],
  monthly: [
    { rep: "M. Alvarez", businessDaysElapsed: 12, businessDaysInPeriod: 20, actualGP: 15400, budgetGP: 15000, lyGP: 13200 },
    { rep: "D. Chen", businessDaysElapsed: 12, businessDaysInPeriod: 20, actualGP: 9420, budgetGP: 15000, lyGP: 12800 },
    { rep: "R. Okafor", businessDaysElapsed: 12, businessDaysInPeriod: 20, actualGP: 8100, budgetGP: 14000, lyGP: 9700 },
    { rep: "S. Patel", businessDaysElapsed: 12, businessDaysInPeriod: 20, actualGP: 6800, budgetGP: 13000, lyGP: 11400 },
    { rep: "J. Whitfield", businessDaysElapsed: 12, businessDaysInPeriod: 20, actualGP: 7900, budgetGP: 12000, lyGP: 8200 },
  ],
  quarterly: [
    { rep: "M. Alvarez", businessDaysElapsed: 44, businessDaysInPeriod: 64, actualGP: 48200, budgetGP: 45000, lyGP: 39600 },
    { rep: "D. Chen", businessDaysElapsed: 44, businessDaysInPeriod: 64, actualGP: 31100, budgetGP: 45000, lyGP: 38400 },
    { rep: "R. Okafor", businessDaysElapsed: 44, businessDaysInPeriod: 64, actualGP: 26700, budgetGP: 42000, lyGP: 29100 },
    { rep: "S. Patel", businessDaysElapsed: 44, businessDaysInPeriod: 64, actualGP: 22300, budgetGP: 39000, lyGP: 34200 },
    { rep: "J. Whitfield", businessDaysElapsed: 44, businessDaysInPeriod: 64, actualGP: 25600, budgetGP: 36000, lyGP: 24600 },
  ],
  annual: [
    { rep: "M. Alvarez", businessDaysElapsed: 176, businessDaysInPeriod: 250, actualGP: 184200, budgetGP: 180000, lyGP: 158400 },
    { rep: "D. Chen", businessDaysElapsed: 176, businessDaysInPeriod: 250, actualGP: 121600, budgetGP: 180000, lyGP: 153600 },
    { rep: "R. Okafor", businessDaysElapsed: 176, businessDaysInPeriod: 250, actualGP: 104300, budgetGP: 168000, lyGP: 116400 },
    { rep: "S. Patel", businessDaysElapsed: 176, businessDaysInPeriod: 250, actualGP: 88900, budgetGP: 156000, lyGP: 136800 },
    { rep: "J. Whitfield", businessDaysElapsed: 176, businessDaysInPeriod: 250, actualGP: 99200, budgetGP: 144000, lyGP: 98400 },
  ],
};

export function daysAheadBehind(b: RepBudget): number {
  const dailyBudget = b.budgetGP / b.businessDaysInPeriod;
  const dailyActual = b.actualGP / b.businessDaysElapsed;
  if (dailyBudget === 0) return 0;
  return (dailyActual - dailyBudget) / dailyBudget * b.businessDaysElapsed;
}

/** Project Tracker (Management-only): active initiatives and prospective opportunities per account. */
export interface ProjectTrackerEntry {
  id: string;
  accountName: string;
  accountManager: string;
  dateEntered: string;
  targetValue: number;
  historicalProjects: string;
  potentialProjects: string;
  status: "researching" | "active" | "on_hold" | "won" | "lost";
  notes: string;
  docLink?: string;
}

export const projectTrackerEntries: ProjectTrackerEntry[] = [
  { id: "PT-01", accountName: "Harbor Logistics", accountManager: "M. Alvarez", dateEntered: "2026-08-15", targetValue: 65000, historicalProjects: "Uniform program (2024), fleet signage (2025)", potentialProjects: "Branded PPE rollout for new depot", status: "active", notes: "Waiting on budget sign-off from their ops director.", docLink: "https://docs.google.com/spreadsheets/d/example-harbor-projects" },
  { id: "PT-02", accountName: "TriState Materials", accountManager: "D. Chen", dateEntered: "2026-07-22", targetValue: 210000, historicalProjects: "Annual parts agreement (2023-2025)", potentialProjects: "3-year renewal + expanded SKU list", status: "active", notes: "Renewal terms in legal review.", docLink: "https://docs.google.com/spreadsheets/d/example-tristate-projects" },
  { id: "PT-03", accountName: "Bluecrest Supply", accountManager: "R. Okafor", dateEntered: "2026-06-30", targetValue: 34000, historicalProjects: "Warehouse equipment refresh (2025)", potentialProjects: "Second-site equipment package", status: "researching", notes: "Need updated site headcount before quoting." },
  { id: "PT-04", accountName: "Northgate Co-op", accountManager: "S. Patel", dateEntered: "2026-08-01", targetValue: 215000, historicalProjects: "None on file", potentialProjects: "Regional distribution deal", status: "on_hold", notes: "Paused pending resolution of open backorder issue (OI-501)." },
  { id: "PT-05", accountName: "Redline Transport", accountManager: "R. Okafor", dateEntered: "2026-08-28", targetValue: 37500, historicalProjects: "None — new account", potentialProjects: "Standing PO for consumables", status: "won", notes: "Closed 2026-08-30, onboarding underway." },
  { id: "PT-06", accountName: "Vantage Rail Co.", accountManager: "J. Whitfield", dateEntered: "2026-08-05", targetValue: 34800, historicalProjects: "None on file", potentialProjects: "Introductory order + site visit", status: "lost", notes: "Went with an incumbent supplier this cycle; revisit in 6 months." },
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

export const auditLog: AuditLogEntry[] = [
  { id: "AL-9001", timestamp: "2026-09-14 08:12", user: "Jane Doe", role: "Management", action: "Updated budget", entity: "S. Patel — September GP budget", details: "Changed monthly budget from $12,500 to $13,000." },
  { id: "AL-9002", timestamp: "2026-09-13 17:40", user: "K. Sanders", role: "CSR", action: "Updated order status", entity: "OI-501 — Northgate Co-op", details: "Marked as Open, added carrier delay note." },
  { id: "AL-9003", timestamp: "2026-09-13 14:05", user: "M. Alvarez", role: "Account Manager", action: "Added account note", entity: "C-2001 — Harbor Logistics", details: "Logged weekly activity: QBR scheduled for October." },
  { id: "AL-9004", timestamp: "2026-09-12 11:22", user: "John Doe", role: "Super User", action: "Changed user role", entity: "T. Reyes", details: "Role changed from Account Manager to CSR." },
  { id: "AL-9005", timestamp: "2026-09-11 09:50", user: "D. Chen", role: "Account Manager", action: "Added account", entity: "C-2002 — Meridian Freight", details: "New account created, priority set to A." },
  { id: "AL-9006", timestamp: "2026-09-10 16:33", user: "Jane Doe", role: "Management", action: "Exported report", entity: "Sales Summary — August 2026", details: "Exported CSV for board reporting." },
];

/** System access levels reference (Settings page, Super User view). */
export interface AccessLevelRow {
  capability: string;
  account_manager: boolean;
  csr: boolean;
  management: boolean;
  super_user: boolean;
}

export const accessLevelMatrix: AccessLevelRow[] = [
  { capability: "View own sales performance", account_manager: true, csr: false, management: true, super_user: true },
  { capability: "View full company performance", account_manager: false, csr: false, management: true, super_user: true },
  { capability: "Add / edit own accounts", account_manager: true, csr: false, management: true, super_user: true },
  { capability: "View order status", account_manager: true, csr: true, management: true, super_user: true },
  { capability: "Update Order Excellence tracker", account_manager: false, csr: true, management: true, super_user: true },
  { capability: "Enter / edit budgets", account_manager: false, csr: false, management: true, super_user: true },
  { capability: "Access Project Tracker", account_manager: false, csr: false, management: true, super_user: true },
  { capability: "View audit trail", account_manager: false, csr: false, management: true, super_user: true },
  { capability: "Configure system / integrations", account_manager: false, csr: false, management: false, super_user: true },
];

export interface OrderIssue {
  id: string;
  order: string;
  customer: string;
  issueType: string;
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  assignedTo: string;
  daysOpen: number;
}

export const orderIssues: OrderIssue[] = [
  { id: "OI-501", order: "SO-88216", customer: "Northgate Co-op", issueType: "Shipping delay", severity: "high", status: "open", assignedTo: "K. Sanders", daysOpen: 6 },
  { id: "OI-502", order: "SO-88220", customer: "Redline Transport", issueType: "Invoice discrepancy", severity: "medium", status: "in_progress", assignedTo: "T. Reyes", daysOpen: 3 },
  { id: "OI-503", order: "SO-88214", customer: "Meridian Freight", issueType: "Wrong item shipped", severity: "high", status: "open", assignedTo: "K. Sanders", daysOpen: 2 },
  { id: "OI-504", order: "SO-88198", customer: "Vantage Rail Co.", issueType: "Damaged goods", severity: "medium", status: "resolved", assignedTo: "M. Duarte", daysOpen: 0 },
  { id: "OI-505", order: "SO-88187", customer: "Summit Builders", issueType: "Backorder", severity: "low", status: "in_progress", assignedTo: "T. Reyes", daysOpen: 9 },
  { id: "OI-506", order: "SO-88170", customer: "Palmetto Trade Partners", issueType: "Pricing error", severity: "low", status: "resolved", assignedTo: "M. Duarte", daysOpen: 0 },
];

export const reportCatalog = [
  { id: "RPT-1", name: "Sales Summary", description: "Revenue, orders, and rep performance by period.", updated: "Daily" },
  { id: "RPT-2", name: "Pipeline Forecast", description: "Weighted forecast across all open pipeline stages.", updated: "Daily" },
  { id: "RPT-3", name: "Order Issue Trends", description: "Issue volume, severity mix, and resolution time.", updated: "Weekly" },
  { id: "RPT-4", name: "Referral Partner Performance", description: "Referral volume and conversion by partner.", updated: "Monthly" },
  { id: "RPT-5", name: "Customer Activity", description: "Order frequency and lifetime value by account.", updated: "Weekly" },
  { id: "RPT-6", name: "Data Source Reconciliation", description: "Record counts and sync health across ASI and Syncore.", updated: "Daily" },
];
