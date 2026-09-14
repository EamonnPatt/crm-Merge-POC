import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "account_manager" | "csr" | "management" | "super_user";

export interface RoleProfile {
  role: Role;
  label: string;
  name: string;
  initials: string;
  /** For account_manager: the exact "owner"/"rep" name used to scope records to only this person's accounts. */
  ownerName?: string;
}

export const roleProfiles: RoleProfile[] = [
  { role: "account_manager", label: "Account Manager", name: "M. Alvarez", initials: "MA", ownerName: "M. Alvarez" },
  { role: "csr", label: "CSR / Order Support", name: "K. Sanders", initials: "KS" },
  { role: "management", label: "Management", name: "Jane Doe", initials: "JD" },
  { role: "super_user", label: "Super User / Admin", name: "John Doe", initials: "JD" },
];

interface RoleContextValue {
  profile: RoleProfile;
  setRole: (role: Role) => void;
  canViewAllAccounts: boolean;
  canEditBudgets: boolean;
  canViewProjectTracker: boolean;
  canViewAuditTrail: boolean;
  canEditOrderExcellence: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("management");
  const profile = roleProfiles.find((p) => p.role === role) ?? roleProfiles[2];

  const value: RoleContextValue = {
    profile,
    setRole: setRoleState,
    canViewAllAccounts: role === "management" || role === "super_user",
    canEditBudgets: role === "management" || role === "super_user",
    canViewProjectTracker: role === "management" || role === "super_user",
    canViewAuditTrail: role === "management" || role === "super_user",
    canEditOrderExcellence: role === "csr" || role === "super_user",
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
