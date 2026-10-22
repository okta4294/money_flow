"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useGlobalData } from "@/lib/data-context";
import { Transaction, getTransactionsByMonth } from "@/lib/firestore/transactions";
import {
  calculateBudgetRecommendation,
  evaluateDailySpendingLimit,
  BudgetRecommendationResult,
  DailyLimitCheckResult,
} from "@/lib/budget-calculator";

function getAdjacentMonths(
  year: number,
  month: number
): {
  prevMonths: Array<{ year: number; month: number }>;
  nextMonth: { year: number; month: number };
} {
  const prevMonths: Array<{ year: number; month: number }> = [];
  let y = year;
  let m = month;

  for (let i = 0; i < 3; i++) {
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    prevMonths.push({ year: y, month: m });
  }

  let ny = year;
  let nm = month + 1;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }

  return { prevMonths, nextMonth: { year: ny, month: nm } };
}

export function useBudgetRecommendation(
  year: number,
  month: number,
  currentTransactions: Transaction[]
) {
  const { user } = useAuth();
  const { categories, debts, categoriesLoading, debtsLoading } = useGlobalData();

  const [historicalExpenses, setHistoricalExpenses] = useState<Transaction[]>([]);
  const [historicalIncomes, setHistoricalIncomes] = useState<Transaction[]>([]);
  const [adjacentTransactions, setAdjacentTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Ambil data transaksi 1-3 bulan sebelumnya dan 1 bulan setelahnya untuk rentang siklus gajian
  useEffect(() => {
    if (!user) {
      setHistoricalExpenses([]);
      setHistoricalIncomes([]);
      setAdjacentTransactions([]);
      setHistoryLoading(false);
      return;
    }

    let isMounted = true;
    setHistoryLoading(true);

    const { prevMonths, nextMonth } = getAdjacentMonths(year, month);
    const monthsToFetch = [...prevMonths, nextMonth];

    Promise.all(
      monthsToFetch.map((pm) => getTransactionsByMonth(user.uid, pm.year, pm.month))
    )
      .then((monthlyResults) => {
        if (!isMounted) return;
        const allFlat = monthlyResults.flat();
        setHistoricalExpenses(allFlat.filter((t) => t.type === "expense"));
        setHistoricalIncomes(allFlat.filter((t) => t.type === "income"));
        setAdjacentTransactions(allFlat);
        setHistoryLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setHistoricalExpenses([]);
        setHistoricalIncomes([]);
        setAdjacentTransactions([]);
        setHistoryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid, year, month]);

  const todayDateStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const allTransactions = useMemo(() => {
    const map = new Map<string, Transaction>();
    adjacentTransactions.forEach((t) => map.set(t.id, t));
    currentTransactions.forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [adjacentTransactions, currentTransactions]);

  const activeDebts = useMemo(() => {
    return debts.filter((d) => d.status === "active" && d.remainingAmount > 0);
  }, [debts]);

  const budget = useMemo<BudgetRecommendationResult | null>(() => {
    if (categoriesLoading || debtsLoading) return null;

    return calculateBudgetRecommendation({
      year,
      month,
      todayDateStr,
      currentTransactions,
      historicalExpenses,
      historicalIncomes,
      categories,
      activeDebts,
      allTransactions,
    });
  }, [
    year,
    month,
    todayDateStr,
    currentTransactions,
    historicalExpenses,
    historicalIncomes,
    categories,
    activeDebts,
    allTransactions,
    categoriesLoading,
    debtsLoading,
  ]);

  const todayTransactions = useMemo(() => {
    return allTransactions.filter((t) => t.date === todayDateStr);
  }, [allTransactions, todayDateStr]);

  const dailyCheck = useMemo<DailyLimitCheckResult | null>(() => {
    if (!budget) return null;

    return evaluateDailySpendingLimit({
      todayTransactions,
      categories,
      dailyBudget: budget.dailyBudget,
      dailyEssentialBudget: budget.dailyEssentialBudget,
      dailyDiscretionaryBudget: budget.dailyDiscretionaryBudget,
    });
  }, [budget, todayTransactions, categories]);

  const loading = historyLoading || categoriesLoading || debtsLoading;

  return {
    budget,
    dailyCheck,
    loading,
    todayTransactions,
  };
}
