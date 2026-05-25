"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeToTransactionsByMonth,
  Transaction,
} from "@/lib/firestore/transactions";

export function useTransactions(year: number, month: number) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToTransactionsByMonth(
      user.uid,
      year,
      month,
      (data) => {
        setTransactions(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, year, month]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { transactions, loading, totalIncome, totalExpense };
}
