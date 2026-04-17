import type { FirestoreTimestamp } from "./schema";

/**
 * Convert a FirestoreTimestamp to a JS Date.
 */
export function toDate(timestamp: FirestoreTimestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  if (typeof timestamp === "object" && "toDate" in timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  return new Date(timestamp as string);
}

/**
 * Human-readable relative time (e.g., "5m ago", "2d ago").
 */
export function timeAgo(timestamp: FirestoreTimestamp | null | undefined): string {
  const date = toDate(timestamp);
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
