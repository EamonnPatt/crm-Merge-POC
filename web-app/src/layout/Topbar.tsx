import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown, Check, RotateCcw, AlertTriangle, TrendingDown, Wallet, Share2, Plug, LogOut, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useDemoData } from "../context/DemoDataContext";
import { useAuth } from "../context/AuthContext";
import { roleLabel, roleOrder } from "../lib/roles";
import { FISCAL_YEAR, relativeStamp } from "../lib/calendar";
import { formatDays, paceStatus, repPerformance, withMetrics } from "../lib/performance";
import { lastTrackerUpdate } from "../lib/orderIssues";

export default function Topbar({ title }: { title: string }) {
  const { profile, setUser, signedIn } = useRole();
  const { team, resetDemoData, sync } = useDemoData();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-4">
        <GlobalSearch />
        <Notifications />

        {signedIn ? (
          <div className="flex items-center gap-3">
            {sync.saving && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Loader2 size={12} className="animate-spin" /> Saving…
              </span>
            )}
            <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700">
              {profile.name} · {profile.label}
            </span>
            <button onClick={() => void signOut()} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        ) : (
        <div className="relative">
          <button
            data-testid="role-switcher-trigger"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pl-2.5 pr-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Viewing as</span>
            {profile.name} · {profile.label}
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Demo: view the app as…</p>
                <div className="max-h-[60vh] overflow-y-auto">
                  {roleOrder.map((role) => {
                    const members = team.filter((m) => m.role === role);
                    if (members.length === 0) return null;
                    return (
                      <div key={role} className="py-1">
                        <p className="px-2.5 pb-0.5 pt-1 text-[11px] font-medium text-slate-400">{roleLabel[role]}</p>
                        {members.map((m) => (
                          <button
                            key={m.id}
                            data-testid={`user-option-${m.id}`}
                            onClick={() => {
                              setUser(m.id);
                              setOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <span>
                              {m.name}
                              {m.status === "invited" && <span className="ml-1.5 text-xs text-amber-600">(new)</span>}
                            </span>
                            {m.id === profile.userId && <Check size={15} className="text-brand-600" />}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      if (window.confirm("Reset all demo data (budgets, accounts, issues, projects, users, settings, audit log) to the original sample data?")) {
                        resetDemoData();
                        setOpen(false);
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    <RotateCcw size={13} /> Reset demo data
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        )}
      </div>
    </header>
    {sync.error && (
      <div role="alert" className="flex items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-6 py-2 text-sm text-rose-800">
        <span>Your change was not saved and has been reverted: {sync.error}</span>
        <button onClick={sync.dismissError} className="text-xs font-medium underline">Dismiss</button>
      </div>
    )}
    </>
  );
}

interface SearchResult {
  kind: string;
  label: string;
  detail: string;
  to: string;
}

/** Searches only what the current user is allowed to see, so results never leak another Account Manager's records. */
function GlobalSearch() {
  const navigate = useNavigate();
  const { profile, visibleReps, canViewCompanyMetrics, canViewCpr, canViewProjectTracker, canViewAllProjects, canViewAllOrderIssues } = useRole();
  const { accounts, prospects, deals, orderIssues, projects } = useDemoData();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const q = query.trim().toLowerCase();
  const hit = (...values: string[]) => values.some((v) => v.toLowerCase().includes(q));
  const mine = (owner: string) => canViewCompanyMetrics || owner === profile.name;
  const results: SearchResult[] = q.length < 2
    ? []
    : [
        ...(canViewCpr
          ? accounts
              .filter((a) => mine(a.accountManager) && hit(a.company, a.name, a.email))
              .map((a) => ({ kind: "Account", label: a.company, detail: `${a.name} · ${a.accountManager}`, to: `/customers?q=${encodeURIComponent(a.company)}` }))
          : []),
        ...(canViewCpr
          ? prospects.filter((p) => mine(p.owner) && hit(p.company, p.name)).map((p) => ({ kind: "Prospect", label: p.company, detail: `${p.name} · ${p.owner}`, to: "/prospects" }))
          : []),
        ...(canViewCpr
          ? deals.filter((d) => mine(d.owner) && hit(d.name, d.company)).map((d) => ({ kind: "Deal", label: d.name, detail: `${d.company} · ${d.owner}`, to: "/pipeline" }))
          : []),
        ...orderIssues
          .filter((i) => (canViewAllOrderIssues || visibleReps.includes(i.accountManager)) && hit(i.id, i.order, i.customer, i.issueType))
          .map((i) => ({ kind: "Order issue", label: `${i.id} — ${i.customer}`, detail: `${i.issueType} · ${i.order}`, to: `/order-excellence?q=${encodeURIComponent(i.id)}` })),
        ...(canViewProjectTracker
          ? projects
              .filter((p) => (canViewAllProjects || p.accountManager === profile.name) && hit(p.accountName, p.potentialProjects))
              .map((p) => ({ kind: "Project", label: p.accountName, detail: p.potentialProjects, to: "/project-tracker" }))
          : []),
      ].slice(0, 8);

  const go = (r: SearchResult) => {
    navigate(r.to);
    setQuery("");
    setFocused(false);
  };

  return (
    <div className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="text"
        placeholder="Search accounts, orders, issues…"
        aria-label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0]);
          if (e.key === "Escape") setQuery("");
        }}
        className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      {focused && q.length >= 2 && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-slate-400">No matches you have access to.</p>
          ) : (
            results.map((r, i) => (
              <button key={`${r.kind}-${r.label}-${i}`} onMouseDown={() => go(r)} className="flex w-full flex-col rounded-md px-2.5 py-2 text-left hover:bg-slate-50">
                <span className="flex items-center gap-2 text-sm text-slate-800">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{r.kind}</span>
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="mt-0.5 truncate text-xs text-slate-400">{r.detail}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface Alert {
  id: string;
  icon: LucideIcon;
  tone: string;
  text: string;
  to: string;
}

/** In-app alerts derived from live demo data, scoped to the viewer and filtered by Settings → Notifications. */
function useAlerts(): Alert[] {
  const { profile, visibleReps, canViewCompanyMetrics, canViewAllOrderIssues } = useRole();
  const { orderIssues, budgets, team, settings, perfInputs, dataSources } = useDemoData();
  const on = (key: string) => settings.notifications[key] !== false;
  const alerts: Alert[] = [];
  const isManagement = canViewCompanyMetrics;

  const tracker = lastTrackerUpdate(orderIssues);
  if (on("Order Excellence not updated in 24 hours") && tracker?.stale && (isManagement || profile.role === "csr")) {
    alerts.push({
      id: `stale-${tracker.at}`,
      icon: AlertTriangle,
      tone: "text-amber-600",
      text: `Order Excellence hasn't been updated since ${relativeStamp(tracker.at)} (${tracker.by}).`,
      to: "/order-excellence",
    });
  }

  const scopedIssues = orderIssues.filter((i) => canViewAllOrderIssues || visibleReps.includes(i.accountManager));
  const high = scopedIssues.filter((i) => i.status !== "resolved" && i.severity === "high");
  if (on("New order issue logged") && high.length > 0) {
    alerts.push({
      id: `high-${high.map((i) => i.id).join(",")}`,
      icon: AlertTriangle,
      tone: "text-rose-600",
      text: `${high.length} high-severity order issue${high.length === 1 ? "" : "s"} open: ${high.map((i) => i.customer).join(", ")}.`,
      to: "/order-excellence",
    });
  }

  if (profile.role !== "csr") {
    for (const rep of visibleReps) {
      const m = withMetrics(repPerformance(rep, "monthly", perfInputs("gp")));
      if (m.budget > 0 && paceStatus(m.daysAheadBehind) === "behind" && m.daysAheadBehind <= -2) {
        alerts.push({
          id: `pace-${rep}-${Math.round(m.daysAheadBehind)}`,
          icon: TrendingDown,
          tone: "text-rose-600",
          text: `${rep === profile.name ? "You are" : `${rep} is`} ${formatDays(Math.abs(m.daysAheadBehind)).replace("+", "")} behind budget pace this month.`,
          to: `/sales?rep=${encodeURIComponent(rep)}`,
        });
      }
    }
  }

  if (isManagement) {
    const ams = team.filter((m) => m.role === "account_manager").map((m) => m.name);
    const missing = ams.filter((am) => !budgets.find((b) => b.rep === am && b.fiscalYear === FISCAL_YEAR + 1)?.gp);
    if (missing.length > 0) {
      alerts.push({
        id: `budgets-${missing.length}`,
        icon: Wallet,
        tone: "text-slate-500",
        text: `FY${FISCAL_YEAR + 1} GP$ budgets still to set for ${missing.length} of ${ams.length} Account Managers.`,
        to: "/budgets",
      });
    }
  }

  if (on("Sync failure alerts") && (isManagement || profile.role === "csr")) {
    for (const src of dataSources.filter((s) => s.status === "attention")) {
      alerts.push({ id: `sync-${src.name}`, icon: Plug, tone: "text-amber-600", text: `${src.name} sync needs attention (last sync ${src.lastSync}).`, to: "/settings" });
    }
  }

  if (profile.role === "assistant" && visibleReps.length > 0) {
    alerts.push({
      id: `shared-${visibleReps.join(",")}`,
      icon: Share2,
      tone: "text-brand-600",
      text: `${visibleReps.join(", ")} shared ${visibleReps.length === 1 ? "their Sales Dashboard" : "their Sales Dashboards"} with you.`,
      to: "/sales",
    });
  }

  return alerts;
}

function Notifications() {
  const navigate = useNavigate();
  const alerts = useAlerts();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const unread = alerts.filter((a) => !seen.includes(a.id)).length;

  return (
    <div className="relative">
      <button
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label={`Notifications${unread ? ` (${unread} new)` : ""}`}
        onClick={() => {
          setOpen((v) => !v);
          setSeen(alerts.map((a) => a.id));
        }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notifications</p>
            {alerts.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-400">You're all caught up.</p>
            ) : (
              alerts.map(({ id, icon: Icon, tone, text, to }) => (
                <button
                  key={id}
                  onClick={() => {
                    navigate(to);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Icon size={15} className={`mt-0.5 shrink-0 ${tone}`} />
                  <span>{text}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
