"use client";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      {/* Total Balance Card */}
      <div className="glass-panel rounded-2xl p-stack-lg col-span-1 md:col-span-2 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-fixed/10 rounded-full blur-3xl group-hover:bg-primary-fixed/20 transition-all duration-500"></div>
        <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-secondary-container/10 rounded-full blur-3xl group-hover:bg-secondary-container/20 transition-all duration-500"></div>
        
        <h3 className="font-label-md text-label-md text-primary-fixed/80 mb-2 relative z-10">Total Balance</h3>
        
        {loading ? (
          <div className="h-12 w-48 bg-surface-bright rounded-lg animate-pulse mb-4 relative z-10" />
        ) : (
          <div className="font-display-lg text-display-lg text-white mb-4 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {formatRupiah(finalBalance)}
          </div>
        )}
        
        <div className="flex items-center gap-2 relative z-10">
          <span className="bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 px-2 py-1 rounded-md font-label-sm text-label-sm flex items-center shadow-[0_0_10px_rgba(99,247,255,0.2)]">
            <i className="fa-solid fa-arrow-trend-up text-sm mr-1"></i> Bulan ini
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">berdasarkan riwayat</span>
        </div>
      </div>

      {/* Income Summary */}
      <div className="glass-panel rounded-2xl p-stack-md flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/5 rounded-full blur-2xl"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-primary-fixed/20 border border-primary-fixed/40 flex items-center justify-center text-primary-fixed shadow-[0_0_15px_rgba(99,247,255,0.3)]">
            <i className="fa-solid fa-arrow-down text-lg"></i>
          </div>
          <i className="fa-solid fa-ellipsis text-on-surface-variant opacity-50 cursor-pointer hover:opacity-100 hover:text-primary-fixed transition-colors"></i>
        </div>
        <div className="relative z-10">
          <h4 className="font-label-md text-label-md text-primary-fixed/70">Income</h4>
          {loading ? (
            <div className="h-8 w-32 bg-surface-bright rounded-lg animate-pulse mt-1" />
          ) : (
            <div className="font-headline-md text-headline-md text-white mt-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
              {formatRupiah(totalIncome)}
            </div>
          )}
        </div>
      </div>

      {/* Expenses Summary */}
      <div className="glass-panel rounded-2xl p-stack-md flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-full blur-2xl"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-error/20 border border-error/40 flex items-center justify-center text-error shadow-[0_0_15px_rgba(255,180,171,0.3)]">
            <i className="fa-solid fa-arrow-up text-lg"></i>
          </div>
          <i className="fa-solid fa-ellipsis text-on-surface-variant opacity-50 cursor-pointer hover:opacity-100 hover:text-primary-fixed transition-colors"></i>
        </div>
        <div className="relative z-10">
          <h4 className="font-label-md text-label-md text-error/70">Expenses</h4>
          {loading ? (
            <div className="h-8 w-32 bg-surface-bright rounded-lg animate-pulse mt-1" />
          ) : (
            <div className="font-headline-md text-headline-md text-white mt-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
              {formatRupiah(totalExpense)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
