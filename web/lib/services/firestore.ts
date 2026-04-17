/**
 * Shared Firestore helpers — used by all service modules.
 */

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Subscribe to a Firestore collection with real-time updates.
 * Returns an unsubscribe function.
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onData: (docs: T[]) => void,
  constraints: QueryConstraint[] = [],
): () => void {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
  });
}

/**
 * One-time fetch of all docs in a collection path.
 */
export async function fetchCollection<T>(path: string): Promise<T[]> {
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

/**
 * Add a document with automatic server timestamps.
 */
export async function addDocument(
  collectionName: string,
  data: DocumentData,
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

export { orderBy, limit };
