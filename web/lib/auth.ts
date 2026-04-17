/**
 * Auth helpers — WMM SSO pattern.
 *
 * All WMM internal apps use Google OAuth with @webmymoney.com domain lock.
 * This ensures only team members can sign in.
 *
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Firebase Auth handles OAuth with hd: "webmymoney.com" restriction
 * 3. App receives firebaseUser.email
 * 4. App maps email → local user record (Firestore or hardcoded)
 * 5. User context is built with role, permissions, etc.
 */

import { signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

/** Sign in with Google (restricted to @webmymoney.com) */
export async function signIn(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email || "";

  // Double-check domain (belt + suspenders — provider already restricts)
  if (!email.endsWith("@webmymoney.com")) {
    await firebaseSignOut(auth);
    throw new Error("Only @webmymoney.com accounts are allowed.");
  }

  return result.user;
}

/** Sign out */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Check if an email is a WMM team member */
export function isWmmEmail(email: string): boolean {
  return email.endsWith("@webmymoney.com");
}
