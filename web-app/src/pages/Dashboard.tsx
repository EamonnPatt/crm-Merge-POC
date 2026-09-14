import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { Card, PageHeader, StatCard, Badge, currency } from "../components/ui";
import { useRole } from "../context/RoleContext";
import {
  revenueTrend,
  salesByRep,
  pipelineDeals,
  pipelineStages,
  orderIssues,
  customers,
  dataSources,
} from "../data/mockData";

export default function Dashboard() {
  const { profile, canViewAllAccounts } = useRole();

  const scopedPipelineDeals = canViewAllAccounts
    ? pipelineDeals
    : pipelineDeals.filter((d) => d.owner === profile.ownerName);
  const scopedSalesByRep = canViewAllAccounts
    ? salesByRep
    : salesByRep.filter((r) => r.rep === profile.ownerName);
  const scopedCustomers = canViewAllAccounts
    ? customers
    : customers.filter((c) => c.accountManager === profile.ownerName);

  const openPipelineValue = scopedPipelineDeals
    .filter((d) => d.stage !== "closed_won")
    .reduce((sum, d) => sum + d.value, 0);
  const openIssues = orderIssues.filter((i) => i.status !== "resolved").length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          canViewAllAccounts
            ? "Company-wide snapshot across Sales Reporting, CPR, and Order Excellence."
            : `Your snapshot, ${profile.name} — scoped to your own accounts and pipeline.`
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (MTD)"
          value={currency(158000)}
          delta="-8.1% vs target"
          deltaTone="negative"
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Open Pipeline Value"
          value={currency(openPipelineValue)}
          delta="+12.4% vs last month"
          deltaTone="positive"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Open Order Issues"
          value={String(openIssues)}
          delta="2 high severity"
          deltaTone="negative"
          icon={<AlertTriangle size={18} />}
        />
        <StatCard
          label={canViewAllAccounts ? "Active Accounts" : "Your Accounts"}
          value={canViewAllAccounts ? "312" : String(scopedCustomers.length)}
          delta={canViewAllAccounts ? "+6 this month" : `${scopedCustomers.filter((c) => c.priority === "A").length} priority A`}
          deltaTone="positive"
          icon={<Users size={18} />}
        />
      </div>
      {!canViewAllAccounts && (
        <Card className="mt-4 border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Account Managers see only their own accounts, pipeline, and sales performance — company-wide figures and budget editing are restricted to Management and Super User roles.
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Revenue vs. Target</h3>
            <span className="text-xs text-slate-400">Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip formatter={(value) => currency(Number(value))} />
              <Area type="monotone" dataKey="target" stroke="#cbd5e1" fill="none" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

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
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            {canViewAllAccounts ? "Revenue by Sales Rep" : "Your Revenue"}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scopedSalesByRep} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="rep" tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(value) => currency(Number(value))} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Pipeline by Stage</h3>
          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const deals = scopedPipelineDeals.filter((d) => d.stage === stage.key);
              const value = deals.reduce((sum, d) => sum + d.value, 0);
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                      {stage.label}
                    </span>
                    <span>{deals.length} deals &middot; {currency(value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${stage.color}`}
                      style={{ width: `${Math.min(100, (value / 300000) * 100)}%` }}
                    />
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
