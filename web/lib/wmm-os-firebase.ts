/**
 * Secondary Firebase app for reading wmm-os data.
 *
 * Workspace apps have their OWN Firebase project for local data + auth,
 * but need READ access to wmm-os Firestore for roles, team, clients, etc.
 *
 * This uses Firebase's named app pattern: initializeApp(config, "wmm-os")
 * so it doesn't conflict with the workspace's primary Firebase app.
 *
 * ⚠️  SECURITY NOTE — MIGRATION REQUIRED:
 * Direct client-side Firestore reads using NEXT_PUBLIC_WMM_OS_* vars expose
 * the wmm-os project config to any browser. Any user who can inspect the app
 * can see the wmm-os Firebase project credentials and potentially read
 * collections that Firestore rules don't lock down properly.
 *
 * PREFERRED PATTERN: Replace direct Firestore calls from wmm-os-data.ts with
 * calls to the wmm-os API route:
 *   GET https://wmm-os.webmymoney.com/api/shared/roster
 *   Authorization: Bearer <Firebase ID token>
 *
 * The API route verifies the caller's Firebase Auth token server-side before
 * returning any data. No NEXT_PUBLIC_WMM_OS_* vars needed.
 *
 * TODO: Migrate fetchTeamRoster / subscribeTeamRoster in wmm-os-data.ts to
 * call /api/shared/roster instead of reading wmmOsDb directly.
 *
 * Required env vars (add to .env.local) — only needed until migration is done:
 *   NEXT_PUBLIC_WMM_OS_API_KEY
 *   NEXT_PUBLIC_WMM_OS_AUTH_DOMAIN
 *   NEXT_PUBLIC_WMM_OS_PROJECT_ID       (webmymoney-dev or webmymoney-prod)
 *   NEXT_PUBLIC_WMM_OS_STORAGE_BUCKET
 *   NEXT_PUBLIC_WMM_OS_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_WMM_OS_APP_ID
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const WMM_OS_APP_NAME = "wmm-os";

const wmmOsConfig = {
  apiKey: process.env.NEXT_PUBLIC_WMM_OS_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_WMM_OS_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_WMM_OS_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_WMM_OS_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_WMM_OS_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_WMM_OS_APP_ID,
};

function getWmmOsApp() {
  const existing = getApps().find((app) => app.name === WMM_OS_APP_NAME);
  if (existing) return existing;
  return initializeApp(wmmOsConfig, WMM_OS_APP_NAME);
}

/** Firestore instance pointing at wmm-os project (read-only by convention). */
export const wmmOsDb = getFirestore(getWmmOsApp());
