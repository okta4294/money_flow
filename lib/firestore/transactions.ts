import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { payDebt } from "./debts";

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryId: string;
  note: string;
  date: string; // ISO date string YYYY-MM-DD
  createdAt: Timestamp;
  debtId?: string;
  debtPaymentAmount?: number;
  accountId?: string;             // ID akun sumber dana
  accountName?: string;           // Nama akun sumber dana
  destinationAccountId?: string;  // ID akun tujuan (transfer)
  destinationAccountName?: string; // Nama akun tujuan (transfer)
}

export interface TransactionInput {
  amount: number;
  type: TransactionType;
  category: string;
  categoryId: string;
  note: string;
  date: string;
  debtId?: string;              // ID hutang yang dibayar (opsional)
  debtPaymentAmount?: number;   // Nominal yang dialokasikan untuk hutang ini
  accountId?: string;
  accountName?: string;
  destinationAccountId?: string;
  destinationAccountName?: string;
}

const transactionsRef = (userId: string) =>
  collection(db, "users", userId, "transactions");

export function subscribeToTransactionsByMonth(
  userId: string,
  year: number,
  month: number,
  callback: (transactions: Transaction[]) => void
) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const q = query(
    transactionsRef(userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    transactions.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    callback(transactions);
  });
}

const transactionMonthCache = new Map<string, Transaction[]>();
const transactionMutationListeners = new Map<string, Set<() => void>>();

export function subscribeToTransactionMutations(
  userId: string,
  listener: () => void
): () => void {
  if (!transactionMutationListeners.has(userId)) {
    transactionMutationListeners.set(userId, new Set());
  }
  const set = transactionMutationListeners.get(userId)!;
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

function notifyTransactionMutated(userId: string) {
  const set = transactionMutationListeners.get(userId);
  if (set) {
    set.forEach((fn) => fn());
  }
}

export function clearTransactionCache(userId?: string, dateStr?: string) {
  if (!userId) {
    transactionMonthCache.clear();
    return;
  }
  if (dateStr && /^\d{4}-\d{2}/.test(dateStr)) {
    const parts = dateStr.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    transactionMonthCache.delete(`${userId}-${y}-${m}`);
    return;
  }
  for (const key of transactionMonthCache.keys()) {
    if (key.startsWith(userId)) transactionMonthCache.delete(key);
  }
}

function sortTransactionsDesc(transactions: Transaction[]): Transaction[] {
  return transactions.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

export async function getTransactionsByMonth(
  userId: string,
  year: number,
  month: number
): Promise<Transaction[]> {
  const cacheKey = `${userId}-${year}-${month}`;
  if (transactionMonthCache.has(cacheKey)) {
    return transactionMonthCache.get(cacheKey)!;
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const q = query(
    transactionsRef(userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  const transactions = sortTransactionsDesc(
    snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[]
  );

  transactionMonthCache.set(cacheKey, transactions);
  return transactions;
}

/**
 * Mengambil transaksi untuk beberapa bulan sekaligus hanya dengan 1 query rentang tanggal
 * untuk bulan-bulan yang belum ada di cache memori.
 */
export async function getTransactionsForMonths(
  userId: string,
  months: Array<{ year: number; month: number }>
): Promise<Transaction[]> {
  if (months.length === 0) return [];

  const missingMonths = months.filter(
    ({ year, month }) => !transactionMonthCache.has(`${userId}-${year}-${month}`)
  );

  if (missingMonths.length > 0) {
    const startDates = missingMonths.map(
      ({ year, month }) => `${year}-${String(month).padStart(2, "0")}-01`
    );
    const endDates = missingMonths.map(
      ({ year, month }) => `${year}-${String(month).padStart(2, "0")}-31`
    );
    const minStart = startDates.reduce((a, b) => (a < b ? a : b));
    const maxEnd = endDates.reduce((a, b) => (a > b ? a : b));

    const q = query(
      transactionsRef(userId),
      where("date", ">=", minStart),
      where("date", "<=", maxEnd),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);
    const allFetched = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    missingMonths.forEach(({ year, month }) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}-`;
      const monthTxs = sortTransactionsDesc(
        allFetched.filter((t) => typeof t.date === "string" && t.date.startsWith(prefix))
      );
      transactionMonthCache.set(`${userId}-${year}-${month}`, monthTxs);
    });
  }

  return months.flatMap(
    ({ year, month }) => transactionMonthCache.get(`${userId}-${year}-${month}`) || []
  );
}

export async function addTransaction(userId: string, data: TransactionInput) {
  clearTransactionCache(userId, data.date);
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  const ref = await addDoc(transactionsRef(userId), {
    ...clean,
    createdAt: Timestamp.now(),
  });
  notifyTransactionMutated(userId);
  return ref.id;
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: Partial<TransactionInput>
) {
  const ref = doc(db, "users", userId, "transactions", id);
  const snap = await getDoc(ref);
  const oldTx = snap.exists() ? (snap.data() as Transaction) : null;

  const payload: Record<string, unknown> = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  if (oldTx?.debtId && !data.debtId) {
    payload.debtId = deleteField();
    payload.debtPaymentAmount = deleteField();
  }

  clearTransactionCache(userId);
  await updateDoc(ref, payload);

  const oldDebtId =
    oldTx?.type === "expense" && oldTx.debtId ? oldTx.debtId : undefined;
  const oldPaid = oldDebtId
    ? Math.max(0, oldTx?.debtPaymentAmount ?? oldTx?.amount ?? 0)
    : 0;

  const effectiveType = data.type ?? oldTx?.type;
  const newDebtId =
    effectiveType === "expense" && data.debtId ? data.debtId : undefined;
  const newPaid = newDebtId
    ? Math.max(0, data.debtPaymentAmount ?? data.amount ?? 0)
    : 0;

  if (oldDebtId && oldDebtId === newDebtId) {
    const delta = newPaid - oldPaid;
    if (delta !== 0) {
      await payDebt(userId, oldDebtId, delta);
    }
  } else {
    if (oldDebtId && oldPaid > 0) {
      await payDebt(userId, oldDebtId, -oldPaid);
    }
    if (newDebtId && newPaid > 0) {
      await payDebt(userId, newDebtId, newPaid);
    }
  }

  notifyTransactionMutated(userId);
}

export async function deleteTransaction(userId: string, id: string) {
  const ref = doc(db, "users", userId, "transactions", id);
  const snap = await getDoc(ref);
  const oldTx = snap.exists() ? (snap.data() as Transaction) : null;

  clearTransactionCache(userId);
  await deleteDoc(ref);

  if (oldTx?.type === "expense" && oldTx.debtId) {
    const oldPaid = Math.max(0, oldTx.debtPaymentAmount ?? oldTx.amount ?? 0);
    if (oldPaid > 0) {
      await payDebt(userId, oldTx.debtId, -oldPaid);
    }
  }

  notifyTransactionMutated(userId);
}


