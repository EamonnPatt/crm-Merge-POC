export type Role = "account_manager" | "assistant" | "csr" | "management" | "super_user";

/** Display order used in the access matrix, the demo user switcher, and role pickers. */
export const roleOrder: Role[] = ["management", "super_user", "account_manager", "assistant", "csr"];

export const roleLabel: Record<Role, string> = {
  account_manager: "Account Manager",
  assistant: "Assistant",
  csr: "CSR / Order Support",
  management: "Management",
  super_user: "Super User / Admin",
};

export const roleTone: Record<Role, "violet" | "sky" | "emerald" | "amber" | "slate"> = {
  super_user: "violet",
  management: "sky",
  account_manager: "emerald",
  assistant: "amber",
  csr: "slate",
};

export function initialsOf(name: string): string {
  return name
    .replace(/\./g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}
