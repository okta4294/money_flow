import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  getAggregateFromServer,
  sum,
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
  const targetKey = `${year}-${String(month).padStart(2, "0")}`;
  const targetRef = balanceDocRef(userId, year, month);
  const targetSnap = await getDoc(targetRef);
  
  if (targetSnap.exists()) {
    return (targetSnap.data() as Balance).initialBalance;
  }

  const balancesRef = collection(db, "users", userId, "balances");
  const snap = await getDocs(balancesRef);
  
  let closestOverride: { key: string, balance: number } | null = null;
  for (const doc of snap.docs) {
    if (doc.id < targetKey) {
      if (!closestOverride || doc.id > closestOverride.key) {
        closestOverride = { key: doc.id, balance: doc.data().initialBalance };
      }
    }
  }

  const baseBalance = closestOverride ? closestOverride.balance : 0;
  const startDate = closestOverride ? `${closestOverride.key}-01` : "2000-01-01";
  const endDate = `${targetKey}-01`;

  const transactionsRef = collection(db, "users", userId, "transactions");
  
  const incomeQuery = query(
    transactionsRef,
    where("date", ">=", startDate),
    where("date", "<", endDate),
    where("type", "==", "income")
  );
  
  const expenseQuery = query(
    transactionsRef,
    where("date", ">=", startDate),
    where("date", "<", endDate),
    where("type", "==", "expense")
  );

  const [incomeSnap, expenseSnap] = await Promise.all([
    getAggregateFromServer(incomeQuery, { total: sum("amount") }),
    getAggregateFromServer(expenseQuery, { total: sum("amount") })
  ]);

  return baseBalance + (incomeSnap.data().total || 0) - (expenseSnap.data().total || 0);
}
