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

  return { debts, activeDebts, paidDebts, totalDebt, loading };
}
