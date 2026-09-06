"use client";

import { useGlobalData } from "@/lib/data-context";
import { Debt } from "@/lib/firestore/debts";

export function useDebts() {
  const { debts, debtsLoading: loading } = useGlobalData();

  const activeDebts = debts.filter((d) => d.status === "active");
  const paidDebts = debts.filter((d) => d.status === "paid");
  const totalDebt = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

  // Estimasi hutang bulan-bulan ke depan (ponytail: minimum abstraction)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const upcomingDebtsByMonth = activeDebts
    .filter((d) => d.dueDate && d.dueDate.substring(0, 7) > currentMonthStr)
    .reduce((acc, d) => {
      const monthStr = d.dueDate!.substring(0, 7);
      if (!acc[monthStr]) acc[monthStr] = { total: 0, items: [] };
      acc[monthStr].total += d.remainingAmount;
      acc[monthStr].items.push(d);
      return acc;
    }, {} as Record<string, { total: number, items: Debt[] }>);

  const upcomingMonths = Object.keys(upcomingDebtsByMonth)
    .sort()
    .map((m) => ({
      month: m, // Format: YYYY-MM
      total: upcomingDebtsByMonth[m].total,
      items: upcomingDebtsByMonth[m].items,
    }));

  return { debts, activeDebts, paidDebts, totalDebt, upcomingMonths, loading };
}
