import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useDemoData } from "./DemoDataContext";
import { initialsOf, roleLabel, type Role } from "../lib/roles";

export type { Role } from "../lib/roles";

export interface RoleProfile {
  userId: string;
  role: Role;
  label: string;
  name: string;
  initials: string;
  /** For account_manager: the exact "owner"/"rep" name used to scope records to only this person's accounts. */
  ownerName?: string;
}

interface RoleContextValue {
  profile: RoleProfile;
  setUser: (userId: string) => void;
  /** Account Managers whose sales performance this user may see (company-wide for Management). */
  visibleReps: string[];
  canViewCompanyMetrics: boolean;
  canViewSalesDashboard: boolean;
  canShareDashboard: boolean;
  canViewBudgets: boolean;
  canEditBudgets: boolean;
  canCreateAccounts: boolean;
  canManageUsers: boolean;
  canViewCpr: boolean;
  canViewReports: boolean;
  canViewProjectTracker: boolean;
  canViewAuditTrail: boolean;
  canEditOrderExcellence: boolean;
  canConfigureSystem: boolean;
}

const DEFAULT_USER_ID = "U-02";
const USER_KEY = "add-impact-demo-user";

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { team, shares } = useDemoData();
  const [userId, setUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(USER_KEY) ?? DEFAULT_USER_ID;
    } catch {
      return DEFAULT_USER_ID;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(USER_KEY, userId);
    } catch {
      // Storage blocked: the chosen user just won't be remembered.
    }
  }, [userId]);

  const member = team.find((m) => m.id === userId) ?? team.find((m) => m.id === DEFAULT_USER_ID) ?? team[0];
  const role = member.role;
  const profile: RoleProfile = {
    userId: member.id,
    role,
    label: roleLabel[role],
    name: member.name,
    initials: initialsOf(member.name),
    ownerName: role === "account_manager" ? member.name : undefined,
  };

  const isManagement = role === "management" || role === "super_user";
  const accountManagers = team.filter((m) => m.role === "account_manager").map((m) => m.name);
  const visibleReps = isManagement
    ? accountManagers
    : role === "account_manager"
    ? [member.name]
    : role === "assistant"
    ? shares.filter((s) => s.assistant === member.name).map((s) => s.owner)
    : [];

  const value: RoleContextValue = {
    profile,
    setUser: setUserId,
    visibleReps,
    canViewCompanyMetrics: isManagement,
    canViewSalesDashboard: isManagement || role === "account_manager" || role === "assistant",
    canShareDashboard: role === "account_manager",
    canViewBudgets: isManagement || role === "account_manager",
    canEditBudgets: isManagement,
    canCreateAccounts: isManagement,
    canManageUsers: isManagement,
    canViewCpr: isManagement || role === "account_manager",
    canViewReports: isManagement || role === "account_manager",
    canViewProjectTracker: isManagement,
    canViewAuditTrail: isManagement,
    canEditOrderExcellence: role === "csr" || isManagement,
    canConfigureSystem: role === "super_user",
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
