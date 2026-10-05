import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  auditLogSeed,
  budgetSeed,
  customerSeed,
  dashboardShareSeed,
  metricLabel,
  orderIssueSeed,
  pipelineDealSeed,
  projectStatusLabel,
  projectTrackerSeed,
  prospectSeed,
  referralPartnerSeed,
  teamSeed,
  type AuditLogEntry,
  type Budget,
  type Customer,
  type DashboardShare,
  type Metric,
  type OrderIssue,
  type PipelineDeal,
  type ProjectTrackerEntry,
  type Prospect,
  type ReferralPartner,
  type Source,
  type TeamMember,
} from "../data/mockData";
import { FISCAL_YEAR, MONTHS, businessCalendar, defaultBusinessDays, nowStamp, todayIso, type BusinessCalendar } from "../lib/calendar";
import type { PerfInputs } from "../lib/performance";
import { currency } from "../components/ui";
import { roleLabel } from "../lib/roles";

/** Management's override of the holiday-aware business-day count per month. */
export interface BusinessDaysOverride {
  fiscalYear: number;
  monthly: number[];
  updatedBy: string;
  updatedAt: string;
}

export interface IntegrationConfig {
  method: string;
  schedule: string;
  /** Drive folder / share path for SmartBooks reports, or the API base URL for Syncore. */
  location: string;
  apiKey: string;
}

export interface DemoSettings {
  /** Order Excellence spreadsheet: link to open it, and a published/embed link for the in-app tab. */
  orderSheetUrl: string;
  orderSheetEmbedUrl: string;
  /** Q-7: Account Managers can see and edit their own Project Tracker entries. */
  amProjectAccess: boolean;
  /** Q-8: Account Managers see every Account Manager's order issues (read-only), not just their own. */
  amSeeAllOrderIssues: boolean;
  notifications: Record<string, boolean>;
  security: Record<string, boolean>;
  integrations: Record<Source, IntegrationConfig>;
}

/**
 * Stand-in for the future database. Holds everything users can create or edit in the demo and
 * saves it to this browser's localStorage so changes survive a page refresh.
 */
interface DemoData {
  budgets: Budget[];
  businessDays: BusinessDaysOverride[];
  accounts: Customer[];
  team: TeamMember[];
  shares: DashboardShare[];
  orderIssues: OrderIssue[];
  projects: ProjectTrackerEntry[];
  prospects: Prospect[];
  deals: PipelineDeal[];
  partners: ReferralPartner[];
  settings: DemoSettings;
  auditLog: AuditLogEntry[];
}

/** Who performed an action, for the audit trail. RoleProfile satisfies this. */
export interface Actor {
  name: string;
  label: string;
}

export type OrderIssueInput = Omit<OrderIssue, "id" | "openedOn" | "resolvedOn" | "updatedBy" | "updatedAt"> & {
  id?: string;
  openedOn?: string;
};
export type ProjectInput = Omit<ProjectTrackerEntry, "id" | "updatedBy" | "updatedAt"> & { id?: string };
export type AccountActivityPatch = Partial<Pick<Customer, "notes" | "weeklyActivityLogged" | "monthlyActivityLogged">>;

interface DemoDataContextValue extends DemoData {
  /** Business days per month for the current fiscal year, after overrides. */
  calendar: BusinessCalendar;
  perfInputs: (metric: Metric) => PerfInputs;
  saveBudget: (input: { rep: string; fiscalYear: number; metric: Metric; monthly?: number[]; notes?: string }, actor: Actor) => void;
  importBudgets: (rows: { rep: string; fiscalYear: number; metric: Metric; monthly: number[] }[], fileName: string, actor: Actor) => void;
  saveBusinessDays: (fiscalYear: number, monthly: number[] | null, actor: Actor) => void;
  addAccount: (input: Omit<Customer, "id">, actor: Actor) => Customer;
  updateAccountActivity: (id: string, patch: AccountActivityPatch, actor: Actor) => void;
  addTeamMember: (input: Omit<TeamMember, "id">, actor: Actor) => TeamMember;
  setDashboardShare: (owner: string, assistant: string, shared: boolean, actor: Actor) => void;
  saveOrderIssue: (input: OrderIssueInput, actor: Actor) => OrderIssue;
  importOrderIssues: (rows: OrderIssueInput[], fileName: string, actor: Actor) => { created: number; updated: number };
  saveProject: (input: ProjectInput, actor: Actor) => ProjectTrackerEntry;
  addProspect: (input: Omit<Prospect, "id">, actor: Actor) => Prospect;
  addDeal: (input: Omit<PipelineDeal, "id">, actor: Actor) => PipelineDeal;
  addPartner: (input: Omit<ReferralPartner, "id">, actor: Actor) => ReferralPartner;
  updateSettings: (patch: Partial<DemoSettings>, actor: Actor, audit?: { action: string; entity: string; details: string }) => void;
  logActivity: (actor: Actor, action: string, entity: string, details: string) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = "add-impact-demo-data-v3";

const defaultSettings = (): DemoSettings => ({
  orderSheetUrl: "",
  orderSheetEmbedUrl: "",
  amProjectAccess: true,
  amSeeAllOrderIssues: false,
  notifications: {
    "New order issue logged": true,
    "Order Excellence not updated in 24 hours": true,
    "Deal moves to Negotiation": true,
    "Daily sales summary email": false,
    "Sync failure alerts": true,
  },
  security: {
    "Require SSO login": true,
    "Restrict access to office network": false,
    "Two-factor authentication": true,
  },
  integrations: {
    "ASI SmartBooks": { method: "Scheduled report to shared drive", schedule: "Daily 6:00 AM", location: "", apiKey: "" },
    "Facilis Syncore": { method: "Syncore API v2", schedule: "Nightly 2:00 AM", location: "https://api.syncore.app/v2/orders", apiKey: "" },
  },
});

const seedData = (): DemoData => ({
  budgets: budgetSeed,
  businessDays: [],
  accounts: customerSeed,
  team: teamSeed,
  shares: dashboardShareSeed,
  orderIssues: orderIssueSeed(),
  projects: projectTrackerSeed,
  prospects: prospectSeed,
  deals: pipelineDealSeed,
  partners: referralPartnerSeed,
  settings: defaultSettings(),
  auditLog: auditLogSeed,
});

function loadData(): DemoData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<DemoData>;
      const seed = seedData();
      return { ...seed, ...saved, settings: { ...seed.settings, ...saved.settings } };
    }
  } catch {
    // Storage unavailable or corrupt: fall back to the seed data.
  }
  return seedData();
}

function nextId(prefix: string, ids: string[]): string {
  const max = ids.reduce((acc, id) => Math.max(acc, Number(id.replace(/\D/g, "")) || 0), 0);
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

function describeMonthlyChange(before: number[], after: number[], format: (v: number) => string = currency): string {
  const changes = MONTHS.flatMap((month, m) => (before[m] === after[m] ? [] : [`${month}: ${format(before[m])} → ${format(after[m])}`]));
  if (changes.length === 0) return "";
  const shown = changes.slice(0, 3).join("; ");
  return changes.length > 3 ? `${shown}; and ${changes.length - 3} more month(s).` : `${shown}.`;
}

/** "Status: Open → Resolved; Assigned to: K. Sanders → T. Reyes." for the fields that changed. */
function describeChanges<T>(before: T, after: T, fields: [keyof T, string, ((v: T[keyof T]) => string)?][]): string {
  const changes = fields.flatMap(([key, label, format = (v) => String(v ?? "—") || "—"]) =>
    before[key] === after[key] ? [] : [`${label}: ${format(before[key])} → ${format(after[key])}`]
  );
  return changes.length ? `${changes.join("; ")}.` : "No changes.";
}

const issueStatusText: Record<OrderIssue["status"], string> = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Private mode / storage blocked: the demo still works, it just won't persist.
    }
  }, [data]);

  const log = (entries: AuditLogEntry[], actor: Actor, action: string, entity: string, details: string) => [
    { id: nextId("AL-", entries.map((e) => e.id)), timestamp: nowStamp(), user: actor.name, role: actor.label, action, entity, details },
    ...entries,
  ];
  const stamp = (actor: Actor) => ({ updatedBy: actor.name, updatedAt: nowStamp() });

  const calendar = businessCalendar(data.businessDays.find((o) => o.fiscalYear === FISCAL_YEAR)?.monthly);

  const value: DemoDataContextValue = {
    ...data,
    calendar,
    perfInputs: (metric) => ({ budgets: data.budgets, metric, calendar }),

    saveBudget: ({ rep, fiscalYear, metric, monthly, notes }, actor) =>
      setData((d) => {
        const existing = d.budgets.find((b) => b.rep === rep && b.fiscalYear === fiscalYear);
        const entity = `${rep} — FY${fiscalYear} budget`;
        const before = existing?.[metric];
        const changes: string[] = [];
        if (monthly) {
          changes.push(
            before
              ? describeMonthlyChange(before, monthly)
              : `${metricLabel[metric]} budget set to ${currency(monthly.reduce((a, v) => a + v, 0))} for the year.`
          );
        }
        if (notes !== undefined && notes !== (existing?.notes ?? "")) changes.push(notes ? `Note: "${notes}"` : "Note removed.");
        const details = changes.filter(Boolean).join(" ");
        if (!details && existing) return d;
        const patch = { ...(monthly ? { [metric]: monthly } : {}), ...(notes !== undefined ? { notes } : {}), ...stamp(actor) };
        const action = before || (!monthly && existing) ? `Updated ${metricLabel[metric]} budget` : `Created ${metricLabel[metric]} budget`;
        return {
          ...d,
          budgets: existing
            ? d.budgets.map((b) => (b === existing ? { ...b, ...patch } : b))
            : [...d.budgets, { id: `B-${fiscalYear}-${rep}`, rep, fiscalYear, ...patch }],
          auditLog: log(d.auditLog, actor, action, entity, details || "No changes."),
        };
      }),

    importBudgets: (rows, fileName, actor) =>
      setData((d) => {
        let budgets = d.budgets;
        for (const { rep, fiscalYear, metric, monthly } of rows) {
          const existing = budgets.find((b) => b.rep === rep && b.fiscalYear === fiscalYear);
          budgets = existing
            ? budgets.map((b) => (b === existing ? { ...b, [metric]: monthly, ...stamp(actor) } : b))
            : [...budgets, { id: `B-${fiscalYear}-${rep}`, rep, fiscalYear, [metric]: monthly, ...stamp(actor) }];
        }
        const summary = rows.map((r) => `${r.rep} FY${r.fiscalYear} ${metricLabel[r.metric]} ${currency(r.monthly.reduce((a, v) => a + v, 0))}`);
        return {
          ...d,
          budgets,
          auditLog: log(d.auditLog, actor, "Imported budgets", fileName, `${rows.length} budget(s) imported: ${summary.join("; ")}.`),
        };
      }),

    saveBusinessDays: (fiscalYear, monthly, actor) =>
      setData((d) => {
        const before = d.businessDays.find((o) => o.fiscalYear === fiscalYear)?.monthly ?? defaultBusinessDays(fiscalYear);
        const after = monthly ?? defaultBusinessDays(fiscalYear);
        const others = d.businessDays.filter((o) => o.fiscalYear !== fiscalYear);
        return {
          ...d,
          businessDays: monthly ? [...others, { fiscalYear, monthly, ...stamp(actor) }] : others,
          auditLog: log(
            d.auditLog,
            actor,
            monthly ? "Updated business days" : "Reset business days",
            `FY${fiscalYear} business days per month`,
            describeMonthlyChange(before, after, (v) => `${v}d`) || (monthly ? "No changes." : "Back to the company holiday calendar.")
          ),
        };
      }),

    addAccount: (input, actor) => {
      const account: Customer = { ...input, id: nextId("C-", data.accounts.map((a) => a.id)) };
      setData((d) => ({
        ...d,
        accounts: [account, ...d.accounts],
        auditLog: log(
          d.auditLog,
          actor,
          "Created account",
          `${account.id} — ${account.company}`,
          `New account created and assigned to ${account.accountManager}, priority set to ${account.priority}.`
        ),
      }));
      return account;
    },

    updateAccountActivity: (id, patch, actor) =>
      setData((d) => {
        const before = d.accounts.find((a) => a.id === id);
        if (!before) return d;
        const after = { ...before, ...patch };
        const tick = (v: unknown) => (v ? "logged" : "not logged");
        return {
          ...d,
          accounts: d.accounts.map((a) => (a.id === id ? after : a)),
          auditLog: log(
            d.auditLog,
            actor,
            patch.notes !== undefined ? "Updated account note" : "Logged account activity",
            `${before.id} — ${before.company}`,
            describeChanges(before, after, [
              ["weeklyActivityLogged", "Weekly activity", tick],
              ["monthlyActivityLogged", "Monthly activity", tick],
              ["notes", "Notes"],
            ])
          ),
        };
      }),

    addTeamMember: (input, actor) => {
      const member: TeamMember = { ...input, id: nextId("U-", data.team.map((m) => m.id)) };
      const supports = member.supports?.length ? ` Supports ${member.supports.join(", ")}.` : "";
      setData((d) => ({
        ...d,
        team: [...d.team, member],
        auditLog: log(d.auditLog, actor, "Created user", member.name, `New ${roleLabel[member.role]} user invited (${member.email}).${supports}`),
      }));
      return member;
    },

    setDashboardShare: (owner, assistant, shared, actor) =>
      setData((d) => {
        const exists = d.shares.some((s) => s.owner === owner && s.assistant === assistant);
        if (exists === shared) return d;
        return {
          ...d,
          shares: shared
            ? [...d.shares, { owner, assistant, sharedAt: todayIso() }]
            : d.shares.filter((s) => !(s.owner === owner && s.assistant === assistant)),
          auditLog: log(
            d.auditLog,
            actor,
            shared ? "Shared sales dashboard" : "Stopped sharing sales dashboard",
            `${owner} — Sales Dashboard`,
            shared ? `Shared read-only with assistant ${assistant}.` : `Access removed for assistant ${assistant}.`
          ),
        };
      }),

    saveOrderIssue: (input, actor) => {
      const existing = input.id ? data.orderIssues.find((i) => i.id === input.id) : undefined;
      const issue = buildIssue(input, existing, data.orderIssues, actor);
      setData((d) => ({
        ...d,
        orderIssues: existing ? d.orderIssues.map((i) => (i.id === issue.id ? issue : i)) : [issue, ...d.orderIssues],
        auditLog: log(
          d.auditLog,
          actor,
          existing ? "Updated order issue" : "Logged order issue",
          `${issue.id} — ${issue.customer}`,
          existing
            ? describeIssueChange(existing, issue)
            : `${issue.issueType} on ${issue.order}, ${issue.severity} severity, assigned to ${issue.assignedTo}. In-hand date ${issue.inHandDate || "—"}.`
        ),
      }));
      return issue;
    },

    importOrderIssues: (rows, fileName, actor) => {
      let issues = data.orderIssues;
      let created = 0;
      let updated = 0;
      for (const row of rows) {
        const existing = row.id ? issues.find((i) => i.id === row.id) : undefined;
        const issue = buildIssue(row, existing, issues, actor);
        if (existing) updated++;
        else created++;
        issues = existing ? issues.map((i) => (i.id === issue.id ? issue : i)) : [issue, ...issues];
      }
      setData((d) => ({
        ...d,
        orderIssues: issues,
        auditLog: log(d.auditLog, actor, "Imported order issues", fileName, `${created} issue(s) added and ${updated} updated from the spreadsheet.`),
      }));
      return { created, updated };
    },

    saveProject: (input, actor) => {
      const existing = input.id ? data.projects.find((p) => p.id === input.id) : undefined;
      const project: ProjectTrackerEntry = {
        ...input,
        id: existing?.id ?? nextId("PT-", data.projects.map((p) => p.id)),
        ...stamp(actor),
      };
      let details = `${projectStatusLabel[project.status]} project for ${project.accountManager}, ${project.month}, target ${currency(project.targetValue)}.`;
      if (existing) {
        const fieldChanges = describeChanges(existing, project, [
          ["accountName", "Account"],
          ["accountManager", "Account Manager"],
          ["month", "Month"],
          ["targetValue", "Target value", (v) => currency(Number(v))],
          ["status", "Status", (v) => projectStatusLabel[v as ProjectTrackerEntry["status"]]],
          ["potentialProjects", "Potential projects"],
          ["historicalProjects", "Historical projects"],
          ["notes", "Notes"],
        ]);
        const linksChanged = JSON.stringify(existing.links) !== JSON.stringify(project.links);
        const linkText = `Links: ${project.links.map((l) => l.label).join(", ") || "none"}.`;
        details = linksChanged ? (fieldChanges === "No changes." ? linkText : `${fieldChanges} ${linkText}`) : fieldChanges;
      }
      setData((d) => ({
        ...d,
        projects: existing ? d.projects.map((p) => (p.id === project.id ? project : p)) : [project, ...d.projects],
        auditLog: log(d.auditLog, actor, existing ? "Updated project" : "Added project", `${project.id} — ${project.accountName}`, details),
      }));
      return project;
    },

    addProspect: (input, actor) => {
      const prospect: Prospect = { ...input, id: nextId("P-", data.prospects.map((p) => p.id)) };
      setData((d) => ({
        ...d,
        prospects: [prospect, ...d.prospects],
        auditLog: log(d.auditLog, actor, "Added prospect", `${prospect.id} — ${prospect.company}`, `${prospect.name}, est. ${currency(prospect.estValue)}, owner ${prospect.owner}.`),
      }));
      return prospect;
    },

    addDeal: (input, actor) => {
      const deal: PipelineDeal = { ...input, id: nextId("D-", data.deals.map((p) => p.id)) };
      setData((d) => ({
        ...d,
        deals: [...d.deals, deal],
        auditLog: log(d.auditLog, actor, "Added deal", `${deal.id} — ${deal.company}`, `${deal.name}, ${currency(deal.value)}, owner ${deal.owner}, close ${deal.closeDate}.`),
      }));
      return deal;
    },

    addPartner: (input, actor) => {
      const partner: ReferralPartner = { ...input, id: nextId("R-", data.partners.map((p) => p.id)) };
      setData((d) => ({
        ...d,
        partners: [...d.partners, partner],
        auditLog: log(d.auditLog, actor, "Added referral partner", `${partner.id} — ${partner.name}`, `Contact ${partner.contact}.`),
      }));
      return partner;
    },

    updateSettings: (patch, actor, audit) =>
      setData((d) => ({
        ...d,
        settings: { ...d.settings, ...patch },
        auditLog: audit ? log(d.auditLog, actor, audit.action, audit.entity, audit.details) : d.auditLog,
      })),

    logActivity: (actor, action, entity, details) => setData((d) => ({ ...d, auditLog: log(d.auditLog, actor, action, entity, details) })),

    resetDemoData: () => setData(seedData()),
  };

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

function buildIssue(input: OrderIssueInput, existing: OrderIssue | undefined, all: OrderIssue[], actor: Actor): OrderIssue {
  const fields = { ...input };
  delete fields.id;
  delete fields.openedOn;
  const resolvedOn =
    fields.status === "resolved" ? (existing?.status === "resolved" ? existing.resolvedOn : todayIso()) : undefined;
  return {
    ...fields,
    id: existing?.id ?? input.id ?? nextId("OI-", all.map((i) => i.id)),
    openedOn: existing?.openedOn ?? input.openedOn ?? todayIso(),
    resolvedOn,
    updatedBy: actor.name,
    updatedAt: nowStamp(),
  };
}

function describeIssueChange(before: OrderIssue, after: OrderIssue): string {
  return describeChanges(before, after, [
    ["status", "Status", (v) => issueStatusText[v as OrderIssue["status"]]],
    ["severity", "Severity"],
    ["assignedTo", "Assigned to"],
    ["issueType", "Type"],
    ["inHandDate", "In-hand date"],
    ["order", "Order"],
    ["customer", "Customer"],
    ["notes", "Notes"],
  ]);
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within a DemoDataProvider");
  return ctx;
}
