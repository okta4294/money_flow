"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface SummaryCardsProps {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  loading?: boolean;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function SummaryCards({ initialBalance, totalIncome, totalExpense, loading }: SummaryCardsProps) {
  const finalBalance = initialBalance + totalIncome - totalExpense;
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = mounted && currentTheme === 'dark';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      {/* Total Balance Card */}
      <div className={`rounded-xl p-6 lg:p-8 col-span-1 md:col-span-2 relative overflow-hidden group shadow-sm transition-colors duration-200 ${isDark ? 'glass-panel border-white/10' : 'bg-white border border-slate-200'}`}>
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500 ${isDark ? 'bg-primary-fixed/5 group-hover:bg-primary-fixed/10' : 'bg-slate-100 group-hover:bg-slate-200'}`}></div>
        
        <h3 className="font-label-md font-medium text-slate-500 dark:text-on-surface-variant mb-2">Total Balance</h3>
        
        {loading ? (
          <div className="h-12 w-48 bg-slate-100 dark:bg-surface-bright rounded-lg animate-pulse mb-4 relative z-10" />
        ) : (
          <div className="font-display-lg text-4xl lg:text-5xl font-bold text-slate-900 dark:text-on-surface mb-4 relative z-10">
            {formatRupiah(finalBalance)}
          </div>
        )}
        
        <div className="flex items-center gap-2 relative z-10">
          <span className={`px-2 py-1 rounded-md font-label-sm flex items-center ${isDark ? 'bg-primary-fixed/10 text-primary-fixed' : 'bg-emerald-50 text-emerald-600'}`}>
            <span className="material-symbols-outlined text-sm mr-1">trending_up</span> Bulan ini
          </span>
          <span className="font-label-sm text-slate-500 dark:text-on-surface-variant">berdasarkan riwayat</span>
        </div>
      </div>

      {/* Income Summary */}
      <div className={`rounded-xl p-4 lg:p-6 flex flex-col justify-between transition-colors shadow-sm ${isDark ? 'glass-panel' : 'bg-white border border-slate-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-primary-fixed/10 text-primary-fixed' : 'bg-emerald-100 text-emerald-600'}`}>
            <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 dark:text-on-surface-variant opacity-50 cursor-pointer hover:opacity-100">more_horiz</span>
        </div>
        <div>
          <h4 className="font-label-md text-slate-500 dark:text-on-surface-variant mb-1">Income</h4>
          {loading ? (
            <div className="h-8 w-32 bg-slate-100 dark:bg-surface-bright rounded-lg animate-pulse" />
          ) : (
            <div className="font-headline-md text-2xl font-bold text-slate-900 dark:text-on-surface">{formatRupiah(totalIncome)}</div>
          )}
        </div>
      </div>

      {/* Expenses Summary */}
      <div className={`rounded-xl p-4 lg:p-6 flex flex-col justify-between transition-colors shadow-sm ${isDark ? 'glass-panel' : 'bg-white border border-slate-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-error/10 text-error' : 'bg-rose-100 text-rose-600'}`}>
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 dark:text-on-surface-variant opacity-50 cursor-pointer hover:opacity-100">more_horiz</span>
        </div>
        <div>
          <h4 className="font-label-md text-slate-500 dark:text-on-surface-variant mb-1">Expenses</h4>
          {loading ? (
            <div className="h-8 w-32 bg-slate-100 dark:bg-surface-bright rounded-lg animate-pulse" />
          ) : (
            <div className="font-headline-md text-2xl font-bold text-slate-900 dark:text-on-surface">{formatRupiah(totalExpense)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
