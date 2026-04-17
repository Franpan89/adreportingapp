/**
 * Firestore collection schemas for {{APP_NAME}}.
 *
 * This is the single source of truth for what lives in Firestore.
 * Every document type is defined here with proper TypeScript types.
 *
 * Convention: snake_case for collection names and field names.
 */

import type { Timestamp } from "firebase/firestore";

// Firestore docs return Timestamp objects, mock data uses ISO strings.
export type FirestoreTimestamp = Timestamp | string;

// ---------------------------------------------------------------------------
// Example collection — replace with your actual collections
// ---------------------------------------------------------------------------
// export interface ExampleDoc {
//   id: string;
//   name: string;
//   status: "active" | "archived";
//   created_at: FirestoreTimestamp;
//   updated_at: FirestoreTimestamp;
// }

// ---------------------------------------------------------------------------
// Collection name constants — single source of truth
// ---------------------------------------------------------------------------
export const COLLECTIONS = {
  // EXAMPLE: "example_collection",
} as const;
