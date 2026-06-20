"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeToDebts, Debt } from "@/lib/firestore/debts";

export function useDebts() {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDebts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToDebts(user.uid, (data) => {
      setDebts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const activeDebts = debts.filter((d) => d.status === "active");
  const paidDebts = debts.filter((d) => d.status === "paid");
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

  // Estimasi hutang jatuh tempo bulan depan — hanya yang ada dueDate
  const now = new Date();
  const nextMonth = now.getMonth() + 2; // getMonth() 0-indexed, bulan depan = +2
  const nextYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
  const normalizedNextMonth = nextMonth > 12 ? 1 : nextMonth;
  const nextMonthDebtEstimate = activeDebts
    .filter((d) => {
      if (!d.dueDate) return false;
      const due = new Date(d.dueDate + "T00:00:00");
      return due.getFullYear() === nextYear && due.getMonth() + 1 === normalizedNextMonth;
    })
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  return { debts, activeDebts, paidDebts, totalDebt, nextMonthDebtEstimate, loading };
}
