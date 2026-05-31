import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export type TransactionType = "income" | "expense";

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
}

export interface TransactionInput {
  amount: number;
  type: TransactionType;
  category: string;
  categoryId: string;
  note: string;
  date: string;
  debtId?: string;           // ID hutang yang dibayar (opsional)
  debtPaymentAmount?: number; // Nominal yang dialokasikan untuk hutang ini
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
    callback(transactions);
  });
}

export async function getTransactionsByMonth(
  userId: string,
  year: number,
  month: number
): Promise<Transaction[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const q = query(
    transactionsRef(userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Transaction[];
}

export async function addTransaction(userId: string, data: TransactionInput) {
  const ref = await addDoc(transactionsRef(userId), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: Partial<TransactionInput>
) {
  const ref = doc(db, "users", userId, "transactions", id);
  await updateDoc(ref, data);
}

export async function deleteTransaction(userId: string, id: string) {
  const ref = doc(db, "users", userId, "transactions", id);
  await deleteDoc(ref);
}
