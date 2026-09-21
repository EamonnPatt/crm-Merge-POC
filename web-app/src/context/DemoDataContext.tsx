import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  auditLogSeed,
  budgetSeed,
  customerSeed,
  dashboardShareSeed,
  teamSeed,
  type AuditLogEntry,
  type Budget,
  type Customer,
  type DashboardShare,
  type TeamMember,
} from "../data/mockData";
import { MONTHS, nowStamp, todayIso } from "../lib/calendar";
import { currency } from "../components/ui";
import { roleLabel } from "../lib/roles";

/**
 * Stand-in for the future database. Holds everything users can create or edit in the demo and
 * saves it to this browser's localStorage so changes survive a page refresh.
 */
interface DemoData {
  budgets: Budget[];
  accounts: Customer[];
  team: TeamMember[];
  shares: DashboardShare[];
  auditLog: AuditLogEntry[];
}

/** Who performed an action, for the audit trail. RoleProfile satisfies this. */
export interface Actor {
  name: string;
  label: string;
}

interface DemoDataContextValue extends DemoData {
  saveBudget: (input: { rep: string; fiscalYear: number; monthly: number[] }, actor: Actor) => void;
  addAccount: (input: Omit<Customer, "id">, actor: Actor) => Customer;
  addTeamMember: (input: Omit<TeamMember, "id">, actor: Actor) => TeamMember;
  setDashboardShare: (owner: string, assistant: string, shared: boolean, actor: Actor) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = "add-impact-demo-data-v2";

const seedData = (): DemoData => ({
  budgets: budgetSeed,
  accounts: customerSeed,
  team: teamSeed,
  shares: dashboardShareSeed,
  auditLog: auditLogSeed,
});

function loadData(): DemoData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...seedData(), ...(JSON.parse(raw) as Partial<DemoData>) };
  } catch {
    // Storage unavailable or corrupt: fall back to the seed data.
  }
  return seedData();
}

function nextId(prefix: string, ids: string[]): string {
  const max = ids.reduce((acc, id) => Math.max(acc, Number(id.replace(/\D/g, "")) || 0), 0);
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

function describeBudgetChange(before: number[], after: number[]): string {
  const changes = MONTHS.flatMap((month, m) =>
    before[m] === after[m] ? [] : [`${month}: ${currency(before[m])} → ${currency(after[m])}`]
  );
  if (changes.length === 0) return "No changes.";
  const shown = changes.slice(0, 3).join("; ");
  return changes.length > 3 ? `${shown}; and ${changes.length - 3} more month(s).` : `${shown}.`;
}

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

  const value: DemoDataContextValue = {
    ...data,

    saveBudget: ({ rep, fiscalYear, monthly }, actor) =>
      setData((d) => {
        const existing = d.budgets.find((b) => b.rep === rep && b.fiscalYear === fiscalYear);
        const entity = `${rep} — FY${fiscalYear} GP$ budget`;
        const stamp = { updatedBy: actor.name, updatedAt: nowStamp() };
        if (existing) {
          return {
            ...d,
            budgets: d.budgets.map((b) => (b === existing ? { ...b, monthly, ...stamp } : b)),
            auditLog: log(d.auditLog, actor, "Updated budget", entity, describeBudgetChange(existing.monthly, monthly)),
          };
        }
        const total = monthly.reduce((a, v) => a + v, 0);
        return {
          ...d,
          budgets: [...d.budgets, { id: `B-${fiscalYear}-${rep}`, rep, fiscalYear, monthly, ...stamp }],
          auditLog: log(d.auditLog, actor, "Created budget", entity, `Annual GP$ budget set to ${currency(total)}.`),
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

    resetDemoData: () => setData(seedData()),
  };

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within a DemoDataProvider");
  return ctx;
}
