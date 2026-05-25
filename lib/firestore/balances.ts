import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Balance {
  initialBalance: number;
  updatedAt: Timestamp;
}

function balanceDocRef(userId: string, year: number, month: number) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  return doc(db, "users", userId, "balances", key);
}

export async function setInitialBalance(
  userId: string,
  year: number,
  month: number,
  amount: number
) {
  const ref = balanceDocRef(userId, year, month);
  await setDoc(ref, {
    initialBalance: amount,
    updatedAt: Timestamp.now(),
  });
}

export async function getInitialBalance(
  userId: string,
  year: number,
  month: number
): Promise<number> {
  const ref = balanceDocRef(userId, year, month);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;
  return (snap.data() as Balance).initialBalance;
}
