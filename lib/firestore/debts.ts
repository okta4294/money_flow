import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export type DebtStatus = "active" | "paid";

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string; // YYYY-MM-DD
  note?: string;
  status: DebtStatus;
  createdAt: Timestamp;
}

export interface DebtInput {
  name: string;
  totalAmount: number;
  dueDate?: string;
  note?: string;
}

const debtsRef = (userId: string) =>
  collection(db, "users", userId, "debts");

export function subscribeToDebts(
  userId: string,
  callback: (debts: Debt[]) => void
) {
  const q = query(debtsRef(userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const debts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Debt[];
    callback(debts);
  });
}

export async function addDebt(userId: string, data: DebtInput): Promise<string> {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  const ref = await addDoc(debtsRef(userId), {
    ...clean,
    paidAmount: 0,
    remainingAmount: data.totalAmount,
    status: "active" as DebtStatus,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateDebt(
  userId: string,
  id: string,
  data: Partial<DebtInput>
) {
  const ref = doc(db, "users", userId, "debts", id);
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if ((key === "dueDate" || key === "note") && value === "") {
      clean[key] = deleteField();
    } else {
      clean[key] = value;
    }
  }

  if (data.totalAmount !== undefined) {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const current = snap.data() as Debt;
      const newRemaining = data.totalAmount - current.paidAmount;
      await updateDoc(ref, {
        ...clean,
        remainingAmount: Math.max(0, newRemaining),
        status: (newRemaining <= 0 ? "paid" : "active") as DebtStatus,
      });
      return;
    }
  }
  await updateDoc(ref, clean);
}

export async function deleteDebt(userId: string, id: string) {
  const ref = doc(db, "users", userId, "debts", id);
  await deleteDoc(ref);
}

/**
 * Record a payment towards a debt, reducing remainingAmount.
 * Automatically marks status as "paid" when fully settled.
 */
export async function payDebt(
  userId: string,
  debtId: string,
  paymentAmount: number
) {
  const ref = doc(db, "users", userId, "debts", debtId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const debt = snap.data() as Debt;
  const newPaid = Math.max(0, (debt.paidAmount || 0) + paymentAmount);
  const newRemaining = Math.max(0, debt.totalAmount - newPaid);
  const newStatus: DebtStatus = newRemaining <= 0 ? "paid" : "active";

  await updateDoc(ref, {
    paidAmount: newPaid,
    remainingAmount: newRemaining,
    status: newStatus,
  });
}
