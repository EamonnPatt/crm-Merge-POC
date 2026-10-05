import {
  pipelineStages,
  salesOrders,
  type Customer,
  type OrderIssue,
  type PipelineDeal,
  type ReferralPartner,
} from "../data/mockData";
import { AS_OF_LABEL, CURRENT_MONTH, FISCAL_YEAR, MONTHS } from "./calendar";
import { combinedPerformance, orderTotals, ordersInPeriod, periods, repPerformance, withMetrics, type PerfInputs } from "./performance";
import { daysOpen, issueStatusLabel, severityLabel } from "./orderIssues";

export interface ReportTable {
  title: string;
  subtitle: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ReportContext {
  /** Account Managers this viewer may see (everyone for Management, just themselves for an Account Manager). */
  reps: string[];
  perf: PerfInputs;
  accounts: Customer[];
  deals: PipelineDeal[];
  partners: ReferralPartner[];
  orderIssues: OrderIssue[];
}

const round = (n: number, places = 1) => Math.round(n * 10 ** places) / 10 ** places;
const pct = (n: number) => round(n, 1);
const stageLabel = (key: PipelineDeal["stage"]) => pipelineStages.find((s) => s.key === key)?.label ?? key;
const stageProbability = (key: PipelineDeal["stage"]) => pipelineStages.find((s) => s.key === key)?.probability ?? 0;

function attainmentRows(reps: string[], ctx: ReportContext, period: "monthly" | "annual") {
  return reps.map((rep) => {
    const m = withMetrics(repPerformance(rep, period, ctx.perf));
    return [rep, m.budget, round(m.budgetToDate, 0), m.actual, round(m.actual - m.budgetToDate, 0), pct(m.pctOfBudget), round(m.ly, 0), pct(m.vsLyPct), round(m.daysAheadBehind)];
  });
}

const attainmentColumns = ["Account Manager", "Budget (full period)", "Budget to date", "Actual", "vs Budget to date", "% of budget", "LY same period", "vs LY %", "Days ahead / behind"];

function salesSummaryRows(reps: string[]) {
  return reps.flatMap((rep) =>
    (["monthly", "annual"] as const).map((period) => {
      const t = orderTotals(ordersInPeriod(salesOrders.filter((o) => o.rep === rep), period));
      return [rep, period === "monthly" ? "Month to date" : "Year to date", t.orders, t.sales, t.cost, t.gp, pct(t.margin)];
    })
  );
}

/** Builds the table behind each catalog report, scoped to what the viewer may see. */
export function buildReport(id: string, ctx: ReportContext): ReportTable {
  const asOf = `As of ${AS_OF_LABEL}`;
  const myDeals = ctx.deals.filter((d) => ctx.reps.includes(d.owner));
  const myAccounts = ctx.accounts.filter((a) => ctx.reps.includes(a.accountManager));

  switch (id) {
    case "RPT-7":
      return {
        title: "Budget Attainment (GP$, year to date)",
        subtitle: asOf,
        columns: attainmentColumns,
        rows: attainmentRows(ctx.reps, ctx, "annual"),
      };
    case "RPT-1":
      return {
        title: "Sales Summary",
        subtitle: `${asOf} · Total Sale, Total Cost, GP and Margin %`,
        columns: ["Account Manager", "Period", "Orders", "Total Sale", "Total Cost", "Gross Profit", "Margin %"],
        rows: salesSummaryRows(ctx.reps),
      };
    case "RPT-2":
    case "RPT-10": {
      const open = (id === "RPT-10" ? myDeals : ctx.deals).filter((d) => d.stage !== "closed_won" || id === "RPT-10");
      return {
        title: id === "RPT-10" ? "My Pipeline" : "Pipeline Forecast",
        subtitle: `${asOf} · weighted value = value × stage probability`,
        columns: ["Deal", "Company", "Owner", "Stage", "Probability %", "Value", "Weighted value", "Expected close"],
        rows: open.map((d) => [d.name, d.company, d.owner, stageLabel(d.stage), stageProbability(d.stage) * 100, d.value, round(d.value * stageProbability(d.stage), 0), d.closeDate]),
      };
    }
    case "RPT-3":
      return {
        title: "Order Issue Trends",
        subtitle: asOf,
        columns: ["Issue", "Order", "Customer", "Account Manager", "Type", "Severity", "Status", "Assigned to", "Opened", "Days open", "In-hand date"],
        rows: ctx.orderIssues.map((i) => [i.id, i.order, i.customer, i.accountManager, i.issueType, severityLabel[i.severity], issueStatusLabel[i.status], i.assignedTo, i.openedOn, daysOpen(i), i.inHandDate]),
      };
    case "RPT-4":
      return {
        title: "Referral Partner Performance",
        subtitle: asOf,
        columns: ["Partner", "Contact", "Referrals sent", "Conversions", "Conversion %", "Commission owed", "Status"],
        rows: ctx.partners.map((p) => [p.name, p.contact, p.referralsSent, p.conversions, p.referralsSent ? pct((p.conversions / p.referralsSent) * 100) : 0, p.commissionOwed, p.status]),
      };
    case "RPT-5":
    case "RPT-9":
      return {
        title: id === "RPT-9" ? "My Account Activity" : "Customer Activity",
        subtitle: asOf,
        columns: ["Company", "Contact", "Account Manager", "Priority", "Total orders", "Lifetime value", "LY gross profit", "Weekly activity", "Monthly activity", "Notes"],
        rows: (id === "RPT-9" ? myAccounts : ctx.accounts).map((a) => [
          a.company,
          a.name,
          a.accountManager,
          a.priority,
          a.totalOrders,
          a.lifetimeValue,
          a.lyGrossProfit,
          a.weeklyActivityLogged ? "Logged" : "Not logged",
          a.monthlyActivityLogged ? "Logged" : "Not logged",
          a.notes,
        ]),
      };
    case "RPT-6":
      return {
        title: "Data Source Reconciliation",
        subtitle: `FY${FISCAL_YEAR} through ${AS_OF_LABEL}, by month and source system`,
        columns: ["Month", "Source", "Orders", "Total Sale", "Total Cost", "Gross Profit", "Margin %"],
        rows: MONTHS.slice(0, CURRENT_MONTH + 1).flatMap((month, m) =>
          (["ASI SmartBooks", "Facilis Syncore"] as const).map((source) => {
            const t = orderTotals(salesOrders.filter((o) => o.source === source && Number(o.date.slice(5, 7)) - 1 === m));
            return [month, source, t.orders, t.sales, t.cost, t.gp, pct(t.margin)];
          })
        ),
      };
    case "RPT-8":
      return {
        title: "My Sales Performance (GP$)",
        subtitle: asOf,
        columns: ["Period", "Actual", "Budget (full period)", "Budget to date", "vs Budget to date", "LY same period", "vs LY %", "Days ahead / behind"],
        rows: periods.map((p) => {
          const m = withMetrics(combinedPerformance(ctx.reps, p.key, ctx.perf));
          return [p.toDate, m.actual, round(m.budget, 0), round(m.budgetToDate, 0), round(m.actual - m.budgetToDate, 0), round(m.ly, 0), pct(m.vsLyPct), round(m.daysAheadBehind)];
        }),
      };
    default:
      return { title: id, subtitle: asOf, columns: [], rows: [] };
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function formatCell(value: string | number, column: string): string {
  if (typeof value !== "number") return escapeHtml(value);
  if (/%|days/i.test(column)) return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (/orders|referrals|conversions|probability/i.test(column)) return value.toLocaleString("en-US");
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** Opens a print-ready page; the browser's print dialog saves it as a PDF. Returns false if a popup blocker stopped it. */
export function printReportAsPdf(report: ReportTable): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  const head = report.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = report.rows
    .map((r) => `<tr>${r.map((v, i) => `<td class="${typeof v === "number" ? "num" : ""}">${formatCell(v, report.columns[i])}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 32px; }
  h1 { font-size: 18px; margin: 0; } p { color: #64748b; font-size: 12px; margin: 4px 0 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th { text-align: left; background: #f1f5f9; color: #475569; text-transform: uppercase; letter-spacing: .03em; font-size: 10px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; } td.num { text-align: right; white-space: nowrap; }
  footer { margin-top: 16px; font-size: 10px; color: #94a3b8; }
  @page { size: landscape; margin: 12mm; }
</style></head><body>
<h1>Add-Impact · ${escapeHtml(report.title)}</h1><p>${escapeHtml(report.subtitle)}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${report.columns.length}">No rows.</td></tr>`}</tbody></table>
<footer>Demo data. Generated ${escapeHtml(new Date().toLocaleString("en-US"))}.</footer>
<script>window.onload = () => { window.focus(); window.print(); };</script>
</body></html>`);
  win.document.close();
  return true;
}
