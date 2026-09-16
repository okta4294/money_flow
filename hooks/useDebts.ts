"use client";

import { useMemo } from "react";
import { useGlobalData } from "@/lib/data-context";
import { Debt } from "@/lib/firestore/debts";

export function useDebts() {
  const { debts, debtsLoading: loading } = useGlobalData();

  const { activeDebts, paidDebts, totalDebt, upcomingMonths, nextMonthDebtEstimate } = useMemo(() => {
    const active = debts.filter((d) => d.status === "active");
    const paid = debts.filter((d) => d.status === "paid");
    const total = active.reduce((sum, d) => sum + d.remainingAmount, 0);

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Estimasi hutang bulan kalender berikutnya (sesuai spesifikasi AGENTS.md)
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    const nextMonthEst = active
      .filter((d) => d.dueDate && d.dueDate.substring(0, 7) === nextMonthStr)
      .reduce((sum, d) => sum + d.remainingAmount, 0);

    const upcomingDebtsByMonth = active
      .filter((d) => d.dueDate && d.dueDate.substring(0, 7) > currentMonthStr)
      .reduce((acc, d) => {
        const monthStr = d.dueDate!.substring(0, 7);
        if (!acc[monthStr]) acc[monthStr] = { total: 0, items: [] };
        acc[monthStr].total += d.remainingAmount;
        acc[monthStr].items.push(d);
        return acc;
      }, {} as Record<string, { total: number, items: Debt[] }>);

    const upcoming = Object.keys(upcomingDebtsByMonth)
      .sort()
      .map((m) => ({
        month: m, // Format: YYYY-MM
        total: upcomingDebtsByMonth[m].total,
        items: upcomingDebtsByMonth[m].items,
      }));

    return {
      activeDebts: active,
      paidDebts: paid,
      totalDebt: total,
      upcomingMonths: upcoming,
      nextMonthDebtEstimate: nextMonthEst,
    };
  }, [debts]);

  return { debts, activeDebts, paidDebts, totalDebt, upcomingMonths, nextMonthDebtEstimate, loading };
}
