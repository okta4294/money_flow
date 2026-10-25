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
  where,
  getDocs,
  getAggregateFromServer,
  sum,
} from "firebase/firestore";
import { db } from "../firebase";

export type AccountType = "bank" | "cash" | "ewallet" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  createdAt: Timestamp;
  isBudgetAccount?: boolean;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  color: string;
  isBudgetAccount?: boolean;
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
    name: data.name,
    type: data.type,
    color: data.color,
    ...(typeof data.isBudgetAccount === "boolean" ? { isBudgetAccount: data.isBudgetAccount } : {}),
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
  const payload: Record<string, any> = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.type !== undefined ? { type: data.type } : {}),
    ...(data.color !== undefined ? { color: data.color } : {}),
    ...(typeof data.isBudgetAccount === "boolean" ? { isBudgetAccount: data.isBudgetAccount } : {}),
  };
  await updateDoc(ref, payload);
}

export async function deleteAccount(userId: string, id: string) {
  const ref = doc(db, "users", userId, "accounts", id);
  await deleteDoc(ref);
}

/**
 * Peta saldo per akun: { [accountId]: saldo }
 * Rumus identik dengan AccountManager: pemasukan - pengeluaran - transfer keluar + transfer masuk
 */
export async function getAccountBalances(
  userId: string,
  accountIds: string[]
): Promise<Record<string, number>> {
  if (accountIds.length === 0) return {};
  const transactionsRef = collection(db, "users", userId, "transactions");

  const transferSnap = await getDocs(query(transactionsRef, where("type", "==", "transfer")));
  const transferOut: Record<string, number> = {};
  const transferIn: Record<string, number> = {};
  transferSnap.docs.forEach((d) => {
    const data = d.data();
    const amt = data.amount || 0;
    if (data.accountId) transferOut[data.accountId] = (transferOut[data.accountId] || 0) + amt;
    if (data.destinationAccountId) transferIn[data.destinationAccountId] = (transferIn[data.destinationAccountId] || 0) + amt;
  });

  const record: Record<string, number> = {};
  await Promise.all(
    accountIds.map(async (id) => {
      const [inc, exp] = await Promise.all([
        getAggregateFromServer(
          query(transactionsRef, where("accountId", "==", id), where("type", "==", "income")),
          { total: sum("amount") }
        ),
        getAggregateFromServer(
          query(transactionsRef, where("accountId", "==", id), where("type", "==", "expense")),
          { total: sum("amount") }
        ),
      ]);
      record[id] =
        (inc.data().total || 0) -
        (exp.data().total || 0) -
        (transferOut[id] || 0) +
        (transferIn[id] || 0);
    })
  );
  return record;
}

/**
 * Jumlah saldo seluruh akun, rumus identik dengan AccountManager:
 * pemasukan - pengeluaran - transfer keluar + transfer masuk (per akun, semua waktu).
 */
export async function getTotalAccountBalance(userId: string, accountIds: string[]): Promise<number> {
  const record = await getAccountBalances(userId, accountIds);
  return Object.values(record).reduce((s, b) => s + b, 0);
}
