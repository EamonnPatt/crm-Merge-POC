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
}

export const customers: Customer[] = [
  { id: "C-2001", name: "Laura Kim", company: "Harbor Logistics", email: "l.kim@harborlogistics.com", phone: "(555) 201-3344", totalOrders: 46, lifetimeValue: 412000, source: "ASI SmartBooks", since: "2021-03-11" },
  { id: "C-2002", name: "Trevor Boyd", company: "Meridian Freight", email: "trevor.boyd@meridianfreight.com", phone: "(555) 288-9021", totalOrders: 31, lifetimeValue: 298500, source: "Facilis Syncore", since: "2022-07-02" },
  { id: "C-2003", name: "Priya Nair", company: "Bluecrest Supply", email: "priya.nair@bluecrest.com", phone: "(555) 340-1187", totalOrders: 58, lifetimeValue: 521300, source: "ASI SmartBooks", since: "2019-11-19" },
  { id: "C-2004", name: "Owen Fischer", company: "Northgate Co-op", email: "owen.f@northgateco.com", phone: "(555) 118-7765", totalOrders: 22, lifetimeValue: 187600, source: "Facilis Syncore", since: "2023-01-27" },
  { id: "C-2005", name: "Dana Whitcombe", company: "Coastal Industrial", email: "dana.w@coastalind.com", phone: "(555) 902-4471", totalOrders: 39, lifetimeValue: 356200, source: "Facilis Syncore", since: "2020-09-08" },
  { id: "C-2006", name: "Marcus Ihejirika", company: "TriState Materials", email: "marcus.i@tristatemat.com", phone: "(555) 664-2290", totalOrders: 64, lifetimeValue: 601400, source: "ASI SmartBooks", since: "2018-05-14" },
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
  status: "paid" | "pending" | "overdue";
  source: Source;
}

export const salesOrders: SalesOrder[] = [
  { id: "SO-88213", customer: "Harbor Logistics", rep: "M. Alvarez", date: "2026-09-01", amount: 12400, status: "paid", source: "ASI SmartBooks" },
  { id: "SO-88214", customer: "Meridian Freight", rep: "D. Chen", date: "2026-09-01", amount: 8750, status: "pending", source: "Facilis Syncore" },
  { id: "SO-88215", customer: "Bluecrest Supply", rep: "R. Okafor", date: "2026-08-31", amount: 21600, status: "paid", source: "ASI SmartBooks" },
  { id: "SO-88216", customer: "Northgate Co-op", rep: "S. Patel", date: "2026-08-30", amount: 5400, status: "overdue", source: "Facilis Syncore" },
  { id: "SO-88217", customer: "Coastal Industrial", rep: "J. Whitfield", date: "2026-08-29", amount: 17850, status: "paid", source: "Facilis Syncore" },
  { id: "SO-88218", customer: "TriState Materials", rep: "D. Chen", date: "2026-08-28", amount: 33200, status: "pending", source: "ASI SmartBooks" },
  { id: "SO-88219", customer: "Anchor Point LLC", rep: "M. Alvarez", date: "2026-08-27", amount: 9600, status: "paid", source: "ASI SmartBooks" },
  { id: "SO-88220", customer: "Redline Transport", rep: "R. Okafor", date: "2026-08-26", amount: 4100, status: "overdue", source: "Facilis Syncore" },
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
