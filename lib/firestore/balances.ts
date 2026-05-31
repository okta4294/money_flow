import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { getMonthAggregates } from "./transactions";

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
  month: number,
  depth: number = 0
): Promise<number> {
  // Prevent infinite recursion in case data goes too far back (limit to 60 months = 5 years backwards)
  if (depth > 60) return 0;

  const ref = balanceDocRef(userId, year, month);
  const snap = await getDoc(ref);
  
  // If user explicitly set an initial balance for this month, use it.
  if (snap.exists()) {
    return (snap.data() as Balance).initialBalance;
  }

  // Otherwise, calculate from the previous month
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  // Get previous month's initial balance
  const prevInitialBalance = await getInitialBalance(userId, prevYear, prevMonth, depth + 1);

  // If this is deep recursion and previous balance is 0, we can stop if we want to optimize, 
  // but we also need to account for months that have NO initial balance but HAVE transactions.
  // To avoid hitting limits, the depth limit is 60.

  // Get previous month's aggregates
  const { income, expense } = await getMonthAggregates(userId, prevYear, prevMonth);

  // If there's no data at all in the previous month and prev balance is 0, we could potentially stop.
  // But calculating this way guarantees correctness up to 5 years ago.
  
  return prevInitialBalance + income - expense;
}
