"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgetRecommendation } from "@/hooks/useBudgetRecommendation";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { BudgetCard } from "@/components/dashboard/BudgetCard";

export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { transactions, loading: txLoading } = useTransactions(year, month);
  const {
    budget,
    dailyCheck,
    loading: budgetLoading,
  } = useBudgetRecommendation(year, month, transactions);

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-on-surface tracking-tight uppercase">
            ANGGARAN
          </h2>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1">
            Rekomendasi alokasi anggaran otomatis.
          </p>
        </div>
        <div className="bg-surface-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center p-1 rounded-xl w-full sm:w-auto">
          <MonthSelector
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 w-full">
        <BudgetCard
          budget={budget}
          dailyCheck={dailyCheck}
          loading={budgetLoading || txLoading}
          month={month}
          year={year}
        />
      </div>
    </>
  );
}
