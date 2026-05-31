import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export type AccountType = "bank" | "cash" | "ewallet" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  createdAt: Timestamp;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  color: string;
}

const accountsRef = (userId: string) =>
  collection(db, "users", userId, "accounts");

export function subscribeToAccounts(
  userId: string,
  callback: (accounts: Account[]) => void
) {
  const q = query(accountsRef(userId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const accounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Account[];
    callback(accounts);
  });
}

export async function addAccount(userId: string, data: AccountInput) {
  const ref = await addDoc(accountsRef(userId), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateAccount(
  userId: string,
  id: string,
  data: Partial<AccountInput>
) {
  const ref = doc(db, "users", userId, "accounts", id);
  await updateDoc(ref, data);
}

export async function deleteAccount(userId: string, id: string) {
  const ref = doc(db, "users", userId, "accounts", id);
  await deleteDoc(ref);
}
