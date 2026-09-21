import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Share2, UserCheck } from "lucide-react";
import { Card, PageHeader, StatCard, Badge, currency } from "../components/ui";
import { PerformanceStatCards, PerformanceTrendChart, signedCurrency } from "../components/performance";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { AS_OF_LABEL, FISCAL_YEAR } from "../lib/calendar";
import {
  combinedPerformance,
  formatDays,
  formatPct,
  monthlySeries,
  paceLabel,
  paceStatus,
  paceTone,
  repPerformance,
  withMetrics,
  type PerformanceMetrics,
} from "../lib/performance";
import { pipelineDeals, pipelineStages, orderIssues, dataSources, type OrderIssue } from "../data/mockData";

const severityRank: Record<OrderIssue["severity"], number> = { high: 0, medium: 1, low: 2 };
const severityTone: Record<OrderIssue["severity"], "rose" | "amber" | "slate"> = { high: "rose", medium: "amber", low: "slate" };

export default function Dashboard() {
  const { profile } = useRole();
  if (profile.role === "csr") return <CsrDashboard />;
  if (profile.role === "assistant") return <AssistantDashboard />;
  return <SalesHome />;
}

/** Management / Super User (company-wide) and Account Managers (own figures only). */
function SalesHome() {
  const { profile, canViewCompanyMetrics, visibleReps } = useRole();
  const { budgets } = useDemoData();

  const mtd = withMetrics(combinedPerformance(visibleReps, "monthly", budgets));
  const ytd = withMetrics(combinedPerformance(visibleReps, "annual", budgets));
  const series = monthlySeries(visibleReps, budgets);
  const deals = pipelineDeals.filter((d) => visibleReps.includes(d.owner));
  const issues = orderIssues.filter((i) => i.status !== "resolved" && (canViewCompanyMetrics || visibleReps.includes(i.accountManager)));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          canViewCompanyMetrics
            ? "Company-wide snapshot across Sales Reporting, CPR, and Order Excellence."
            : `Your snapshot, ${profile.name} — your own accounts, pipeline, and performance only.`
        }
        actions={<span className="text-xs text-slate-400">Figures as of {AS_OF_LABEL}</span>}
      />

      <PerformanceStatCards metrics={mtd} period="monthly" />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PerformanceTrendChart
          data={series}
          className="lg:col-span-2"
          title={canViewCompanyMetrics ? "Company GP$ vs Budget vs Last Year" : "Your GP$ vs Budget vs Last Year"}
        />
        {canViewCompanyMetrics ? <DataSourceCard /> : <BudgetSummaryCard ytd={ytd} />}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {canViewCompanyMetrics ? <RepPaceCard reps={visibleReps} /> : <OpenIssuesCard issues={issues} title="Open Order Issues on Your Accounts" />}

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">{canViewCompanyMetrics ? "Pipeline by Stage" : "Your Pipeline by Stage"}</h3>
          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.key);
              const value = stageDeals.reduce((sum, d) => sum + d.value, 0);
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                      {stage.label}
                    </span>
                    <span>
                      {stageDeals.length} deals &middot; {currency(value)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                    <div className={`h-1.5 rounded-full ${stage.color}`} style={{ width: `${Math.min(100, (value / 300000) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DataSourceCard() {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Data Source Sync</h3>
      <div className="space-y-4">
        {dataSources.map((src) => (
          <div key={src.name} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">{src.name}</p>
              <Badge tone={src.status === "connected" ? "emerald" : "amber"}>
                {src.status === "connected" ? "Connected" : "Needs attention"}
              </Badge>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{src.method}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Last sync: {src.lastSync}</span>
              <span>{src.recordsSynced.toLocaleString()} records</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BudgetSummaryCard({ ytd }: { ytd: PerformanceMetrics }) {
  const status = paceStatus(ytd.daysAheadBehind);
  return (
    <Card className="flex flex-col p-5">
      <h3 className="text-sm font-semibold text-slate-700">Your FY{FISCAL_YEAR} Budget</h3>
      {ytd.budget === 0 ? (
        <p className="mt-3 flex-1 text-sm text-slate-500">Management hasn't set your budget yet.</p>
      ) : (
        <dl className="mt-4 flex-1 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Annual budget</dt>
            <dd className="font-semibold text-slate-800">{currency(ytd.budget)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Year-to-date actual</dt>
            <dd className="font-semibold text-slate-800">
              {currency(ytd.actual)} <span className="font-normal text-slate-400">({ytd.pctOfBudget.toFixed(0)}%)</span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">vs Budget (to date)</dt>
            <dd className={`font-semibold ${ytd.actual >= ytd.budgetToDate ? "text-emerald-600" : "text-rose-600"}`}>
              {signedCurrency(ytd.actual - ytd.budgetToDate)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">vs Last Year (YTD)</dt>
            <dd className={`font-semibold ${ytd.vsLyPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatPct(ytd.vsLyPct, true)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">YTD days ahead / behind</dt>
            <dd className="flex items-center gap-2 font-semibold text-slate-800">
              {formatDays(ytd.daysAheadBehind)} <Badge tone={paceTone[status]}>{paceLabel[status]}</Badge>
            </dd>
          </div>
        </dl>
      )}
      <Link to="/budgets" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        View my budget <ArrowRight size={14} />
      </Link>
    </Card>
  );
}

function RepPaceCard({ reps }: { reps: string[] }) {
  const { budgets } = useDemoData();
  return (
    <Card className="p-5 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Account Manager Pace — Month to Date</h3>
        <Link to="/sales" className="text-xs font-medium text-brand-600 hover:underline">
          Open Sales Dashboard
        </Link>
      </div>
      <div className="space-y-3.5">
        {reps.map((rep) => {
          const m = withMetrics(repPerformance(rep, "monthly", budgets));
          const status = paceStatus(m.daysAheadBehind);
          return (
            <Link key={rep} to={`/sales?rep=${encodeURIComponent(rep)}`} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800">{rep}</span>
                <span className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{currency(m.actual)} of {currency(m.budget)}</span>
                  <span className={m.vsLyPct >= 0 ? "text-emerald-600" : "text-rose-600"}>{formatPct(m.vsLyPct, true)} vs LY</span>
                  <span className="font-semibold text-slate-700">{formatDays(m.daysAheadBehind)}</span>
                  <Badge tone={m.budget === 0 ? "amber" : paceTone[status]}>{m.budget === 0 ? "No budget" : paceLabel[status]}</Badge>
                </span>
              </div>
              <div className="relative mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full ${status === "behind" ? "bg-rose-400" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, m.pctOfBudget)}%` }}
                />
                <div className="absolute top-[-3px] h-3 w-0.5 bg-slate-500" style={{ left: `${m.pctOfPeriodElapsed}%` }} title="Where you should be today" />
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">Bar = % of monthly budget achieved · marker = % of the month's business days elapsed.</p>
    </Card>
  );
}

function OpenIssuesCard({ issues, title, highlightAssignee }: { issues: OrderIssue[]; title: string; highlightAssignee?: string }) {
  const sorted = [...issues].sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.daysOpen - a.daysOpen);
  return (
    <Card className="overflow-hidden lg:col-span-2">
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <Link to="/order-excellence" className="text-xs font-medium text-brand-600 hover:underline">
          View all
        </Link>
      </div>
      {sorted.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">No open order issues.</p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <tbody className="divide-y divide-slate-100">
            {sorted.map((issue) => (
              <tr key={issue.id} className={issue.assignedTo === highlightAssignee ? "bg-brand-50/50" : ""}>
                <td className="px-5 py-2.5 font-medium text-slate-800">{issue.id}</td>
                <td className="px-5 py-2.5 text-slate-600">
                  {issue.customer}
                  <div className="text-xs text-slate-400">{issue.issueType}</div>
                </td>
                <td className="px-5 py-2.5">
                  <Badge tone={severityTone[issue.severity]}>{issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}</Badge>
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-500">
                  {issue.assignedTo}
                  <div className="text-slate-400">{issue.daysOpen}d open</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/** Assistants: only the Sales Dashboards their Account Managers have shared with them. */
function AssistantDashboard() {
  const { profile, visibleReps } = useRole();
  const { budgets, shares, team } = useDemoData();
  const supports = team.find((m) => m.id === profile.userId)?.supports ?? [];
  const notShared = supports.filter((rep) => !visibleReps.includes(rep));
  const issues = orderIssues.filter((i) => i.status !== "resolved" && visibleReps.includes(i.accountManager));

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile.name}`}
        description="Sales Dashboards shared with you by the Account Managers you support. Read-only."
        actions={<span className="text-xs text-slate-400">Figures as of {AS_OF_LABEL}</span>}
      />

      {visibleReps.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Share2 className="text-slate-400" size={28} />
          <p className="text-sm font-semibold text-slate-800">No dashboards have been shared with you yet</p>
          <p className="max-w-md text-sm text-slate-500">
            When an Account Manager you support shares their Sales Dashboard, it will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleReps.map((rep) => {
            const m = withMetrics(repPerformance(rep, "monthly", budgets));
            const status = paceStatus(m.daysAheadBehind);
            const share = shares.find((s) => s.owner === rep && s.assistant === profile.name);
            return (
              <Card key={rep} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{rep}</p>
                    <p className="text-xs text-slate-400">Shared with you on {share?.sharedAt}</p>
                  </div>
                  <Badge tone={paceTone[status]}>{paceLabel[status]}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Actual (MTD)</p>
                    <p className="font-semibold text-slate-800">{currency(m.actual)}</p>
                    <p className="text-xs text-slate-500">{m.pctOfBudget.toFixed(0)}% of budget</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">vs Last Year</p>
                    <p className={`font-semibold ${m.vsLyPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatPct(m.vsLyPct, true)}</p>
                    <p className="text-xs text-slate-500">LY {currency(m.ly)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Days ahead / behind</p>
                    <p className="font-semibold text-slate-800">{formatDays(m.daysAheadBehind)}</p>
                    <p className="text-xs text-slate-500">vs budget pace</p>
                  </div>
                </div>
                <Link
                  to={`/sales?rep=${encodeURIComponent(rep)}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                >
                  Open full dashboard <ArrowRight size={14} />
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {notShared.length > 0 && (
        <Card className="mt-4 p-4 text-sm text-slate-500">
          <span className="font-medium text-slate-700">Not shared yet:</span> {notShared.join(", ")}. They can share from their Sales
          Dashboard's Share button.
        </Card>
      )}

      {visibleReps.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <OpenIssuesCard issues={issues} title="Open Order Issues — Your Account Managers' Accounts" />
        </div>
      )}
    </div>
  );
}

/** CSRs: order-support workload. No sales performance or company-wide metrics. */
function CsrDashboard() {
  const { profile } = useRole();
  const active = orderIssues.filter((i) => i.status !== "resolved");
  const mine = active.filter((i) => i.assignedTo === profile.name);

  return (
    <div>
      <PageHeader title="Order Support" description={`Welcome, ${profile.name}. Open order issues across both source systems.`} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned to You" value={String(mine.length)} icon={<UserCheck size={18} />} />
        <StatCard
          label="Open"
          value={String(active.filter((i) => i.status === "open").length)}
          delta={`${active.filter((i) => i.severity === "high").length} high severity`}
          deltaTone="negative"
          icon={<AlertTriangle size={18} />}
        />
        <StatCard label="In Progress" value={String(active.filter((i) => i.status === "in_progress").length)} icon={<Clock size={18} />} />
        <StatCard
          label="Resolved (30d)"
          value={String(orderIssues.filter((i) => i.status === "resolved").length)}
          deltaTone="positive"
          icon={<CheckCircle2 size={18} />}
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OpenIssuesCard issues={active} title="Open & In-Progress Issues (yours highlighted)" highlightAssignee={profile.name} />
        <DataSourceCard />
      </div>
    </div>
  );
}
