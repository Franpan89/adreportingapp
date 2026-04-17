/**
 * Read-only helpers for wmm-os Firestore data.
 *
 * These functions let any workspace app read team roster, roles, departments,
 * clients, and priorities from wmm-os without needing its own copy.
 *
 * All reads go through the secondary Firebase app (see wmm-os-firebase.ts).
 * Workspaces should NEVER write to wmm-os Firestore.
 */

import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { wmmOsDb } from "./wmm-os-firebase";
import { USE_MOCK } from "./firebase";

// ---------------------------------------------------------------------------
// Collection names (match wmm-os Firestore schema)
// ---------------------------------------------------------------------------
const COLLECTIONS = {
  TEAM_ROSTER: "team_roster",
  CLIENTS: "clients",
} as const;

// ---------------------------------------------------------------------------
// Types (minimal — mirrors wmm-os/web/lib/types.ts)
// ---------------------------------------------------------------------------
export type RoleTier = "owner" | "super_admin" | "manager" | "team";

export type PositionType =
  | "ceo"
  | "software_architect"
  | "project_manager"
  | "account_manager"
  | "media_buyer"
  | "creative_designer"
  | "web_tracking"
  | "automation_crm"
  | "hr_finance";

export interface WmmOsTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  role_tier: RoleTier;
  chat_id: string;
}

// ---------------------------------------------------------------------------
// Hardcoded lookups (from wmm-os/web/lib/types.ts — these rarely change)
// ---------------------------------------------------------------------------

/** Email → person_id mapping. */
const EMAIL_TO_PERSON: Record<string, string> = {
  "fran@webmymoney.com": "fran",
  "admin@webmymoney.com": "fran",
  "mariag@webmymoney.com": "mariag",
  "sabina@webmymoney.com": "sabi",
  "pia@webmymoney.com": "pia",
  "john@webmymoney.com": "john",
  "daniel@webmymoney.com": "dani",
  "juan@webmymoney.com": "juan",
  "camilo@webmymoney.com": "camilo",
  "milan@webmymoney.com": "milan",
  "henry@webmymoney.com": "henry",
  "liz@webmymoney.com": "liz",
  "jaz@webmymoney.com": "jaz",
  "franr@webmymoney.com": "franr",
  "nahir@webmymoney.com": "nahir",
  "brenda@webmymoney.com": "brenda",
  "sthephania@webmymoney.com": "sthephania",
  "pancho@webmymoney.com": "pancho",
  "vanessa@webmymoney.com": "vanessa",
  "megan@webmymoney.com": "megan",
  "mariamant@webmymoney.com": "mariamant",
  "victoria@webmymoney.com": "victoria",
  "paulamorales@webmymoney.com": "paula",
  "manuel@webmymoney.com": "manuel",
  "junior@webmymoney.com": "junior",
};

/** person_id → role tier. Defaults to "team". */
const ROLE_TIERS: Record<string, RoleTier> = {
  fran: "owner",
  manuel: "owner",
  mariag: "super_admin",
  sabi: "super_admin",
  pia: "super_admin",
  john: "manager",
  mariamant: "manager",
};

/** person_id → position type. */
const PERSON_POSITION: Record<string, PositionType> = {
  fran: "ceo",
  manuel: "software_architect",
  mariag: "project_manager",
  sabi: "account_manager",
  megan: "account_manager",
  john: "media_buyer",
  pancho: "media_buyer",
  vanessa: "media_buyer",
  pia: "creative_designer",
  jaz: "creative_designer",
  franr: "creative_designer",
  nahir: "creative_designer",
  brenda: "creative_designer",
  sthephania: "creative_designer",
  paula: "creative_designer",
  victoria: "account_manager",
  juan: "web_tracking",
  dani: "automation_crm",
  camilo: "automation_crm",
  milan: "web_tracking",
  junior: "web_tracking",
  henry: "web_tracking",
  liz: "web_tracking",
  mariamant: "hr_finance",
};

/** Department groupings. */
const DEPARTMENTS: Record<string, string[]> = {
  Dev: ["manuel", "juan", "dani", "camilo", "milan", "junior", "henry", "mariag", "liz"],
  "Design & Content": ["pia", "jaz", "franr", "nahir", "brenda", "sthephania", "paula"],
  Performance: ["john", "pancho", "vanessa"],
  Sales: ["sabi", "megan", "victoria"],
  "HR & Finance": ["mariamant"],
};

/** Daily priorities per position. */
const DAILY_PRIORITIES: Record<PositionType, string[]> = {
  ceo: [
    "Review team blockers — clear path for execution",
    "Check pipeline & revenue status — flag concerns",
    "Log strategic decisions — update team direction",
  ],
  software_architect: [
    "Review pending PRs — approve or request changes",
    "Check CI/CD pipeline — ensure deploys are healthy",
    "Document architecture decisions (ADRs)",
  ],
  project_manager: [
    "Update sprint board — move tickets, flag blockers",
    "Check-in with blocked team members — unblock ASAP",
    "Prepare for next ceremony (daily/retro/planning)",
  ],
  account_manager: [
    "Check client inbox — respond to all pending messages",
    "Update CRM pipeline — log interactions, move deals",
    "Follow up on pending proposals & deliverables",
  ],
  media_buyer: [
    "Check campaign performance — flag budget/ROAS anomalies",
    "Optimize underperforming ad sets — pause/adjust",
    "Update client-facing performance dashboards",
  ],
  creative_designer: [
    "Review & respond to design feedback/revision requests",
    "Deliver scheduled assets — ensure deadlines are met",
    "Organize project files — version, hand off to team",
  ],
  web_tracking: [
    "Verify all client tracking pixels are firing correctly",
    "Review GTM/analytics for anomalies or broken events",
    "Complete assigned web/CRO tasks for the day",
  ],
  automation_crm: [
    "Monitor active automations — check for failures/errors",
    "Process CRM integration queue — sync data across platforms",
    "Review and update workflow triggers",
  ],
  hr_finance: [
    "Review payroll & invoices — flag discrepancies",
    "Check team attendance & time tracking",
    "Update compliance docs & HR records",
  ],
};

// ---------------------------------------------------------------------------
// Public API — identity helpers (no Firestore needed)
// ---------------------------------------------------------------------------

/** Resolve a @webmymoney.com email to a person_id. Returns null if unknown. */
export function emailToPersonId(email: string): string | null {
  return EMAIL_TO_PERSON[email.toLowerCase()] ?? null;
}

/** Get role tier for a person_id. Defaults to "team". */
export function getRoleTier(personId: string): RoleTier {
  return ROLE_TIERS[personId] ?? "team";
}

/** Get position type for a person_id. */
export function getPosition(personId: string): PositionType | null {
  return PERSON_POSITION[personId] ?? null;
}

/** Get department name for a person_id. */
export function getDepartment(personId: string): string | null {
  for (const [dept, ids] of Object.entries(DEPARTMENTS)) {
    if (ids.includes(personId)) return dept;
  }
  // CEO is not in any department
  if (personId === "fran") return "CEO";
  return null;
}

/** Get daily priorities for a person_id based on their position. */
export function getDailyPriorities(personId: string): string[] {
  const position = getPosition(personId);
  if (!position) return [];
  return DAILY_PRIORITIES[position];
}

/** Permission checks. */
export function isOwner(personId: string): boolean {
  return getRoleTier(personId) === "owner";
}
export function isSuperAdmin(personId: string): boolean {
  return getRoleTier(personId) === "super_admin";
}
export function isManager(personId: string): boolean {
  return getRoleTier(personId) === "manager";
}
export function canManage(personId: string): boolean {
  const tier = getRoleTier(personId);
  return tier === "owner" || tier === "super_admin" || tier === "manager";
}

// ---------------------------------------------------------------------------
// Public API — Firestore reads (live wmm-os data)
// ---------------------------------------------------------------------------

/** Fetch team roster from wmm-os Firestore. */
export async function fetchTeamRoster(): Promise<WmmOsTeamMember[]> {
  if (USE_MOCK) return [];
  const snap = await getDocs(collection(wmmOsDb, COLLECTIONS.TEAM_ROSTER));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WmmOsTeamMember));
}

/** Subscribe to team roster changes (real-time). Returns unsubscribe function. */
export function subscribeTeamRoster(
  onData: (members: WmmOsTeamMember[]) => void,
): () => void {
  if (USE_MOCK) {
    onData([]);
    return () => {};
  }
  return onSnapshot(
    collection(wmmOsDb, COLLECTIONS.TEAM_ROSTER),
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WmmOsTeamMember)));
    },
  );
}

/** Fetch a single team member by person_id from wmm-os. */
export async function fetchTeamMember(personId: string): Promise<WmmOsTeamMember | null> {
  if (USE_MOCK) return null;
  const ref = doc(wmmOsDb, COLLECTIONS.TEAM_ROSTER, personId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as WmmOsTeamMember;
}
