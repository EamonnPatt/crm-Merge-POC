import type { OrderIssue } from "../data/mockData";
import { daysBetween, hoursSince, todayIso } from "./calendar";

export const severityTone: Record<OrderIssue["severity"], "rose" | "amber" | "slate"> = { high: "rose", medium: "amber", low: "slate" };
export const severityRank: Record<OrderIssue["severity"], number> = { high: 0, medium: 1, low: 2 };
export const issueStatusTone: Record<OrderIssue["status"], "rose" | "sky" | "emerald"> = { open: "rose", in_progress: "sky", resolved: "emerald" };
export const issueStatusLabel: Record<OrderIssue["status"], string> = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };
export const severityLabel: Record<OrderIssue["severity"], string> = { high: "High", medium: "Medium", low: "Low" };

export function daysOpen(issue: OrderIssue): number {
  return daysBetween(issue.openedOn, issue.resolvedOn ?? todayIso());
}

/** CSRs are expected to update the tracker daily; more than 24 hours without a change gets flagged. */
export const STALE_AFTER_HOURS = 24;

export function lastTrackerUpdate(issues: OrderIssue[]): { by: string; at: string; stale: boolean } | null {
  const latest = issues.reduce<OrderIssue | null>((acc, i) => (!acc || i.updatedAt > acc.updatedAt ? i : acc), null);
  if (!latest) return null;
  return { by: latest.updatedBy, at: latest.updatedAt, stale: hoursSince(latest.updatedAt) > STALE_AFTER_HOURS };
}
