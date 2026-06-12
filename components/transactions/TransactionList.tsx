"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { deleteTransaction, Transaction } from "@/lib/firestore/transactions";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (t: Transaction) => void;
  variant?: "list" | "table";
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const sorted = [...transactions].sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  return sorted.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

function getDailyExpense(txs: Transaction[]): number {
  return txs.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
}

function getDailyIncome(txs: Transaction[]): number {
  return txs.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
}

export function TransactionList({ transactions, loading, onEdit, variant = "list" }: TransactionListProps) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);
    try {
      await deleteTransaction(user.uid, id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    if (variant === "table") {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 dark:bg-surface-bright/50 rounded-lg animate-pulse" />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:glass-panel border border-slate-200 dark:border-white/5 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-bright" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-100 dark:bg-surface-bright rounded w-24" />
                <div className="h-2.5 bg-slate-100 dark:bg-surface-bright rounded w-16" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-surface-bright rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 bg-slate-100 dark:bg-surface-container-high rounded-2xl flex items-center justify-center mb-4 text-2xl">
          📭
        </div>
        <p className="font-label-md text-slate-500 dark:text-on-surface-variant font-medium">Belum ada transaksi</p>
        <p className="font-label-sm text-slate-400 dark:text-on-surface-variant/70 mt-1">Tambahkan transaksi pertama Anda</p>
      </motion.div>
    );
  }

  if (variant === "table") {
    const recentTransactions = [...transactions].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    }).slice(0, 5);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-on-surface-variant font-label-sm">
              <th className="pb-3 font-medium whitespace-nowrap">Transaction</th>
              <th className="pb-3 font-medium whitespace-nowrap">Category</th>
              <th className="pb-3 font-medium whitespace-nowrap">Date</th>
              <th className="pb-3 font-medium text-right whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody className="text-slate-900 dark:text-on-surface font-body-md">
            {recentTransactions.map((t) => (
              <tr 
                key={t.id} 
                onClick={() => onEdit(t)}
                className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <td className="py-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    t.type === "income" 
                      ? "bg-emerald-50 dark:bg-primary-fixed/10 text-emerald-500 dark:text-primary-fixed" 
                      : t.debtId
                        ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                        : "bg-rose-50 dark:bg-surface-container-high text-rose-500 dark:text-on-surface-variant"
                  }`}>
                    {t.type === "income" ? (
                      <span className="material-symbols-outlined text-[20px]">trending_up</span>
                    ) : t.debtId ? (
                      <span className="material-symbols-outlined text-[20px]">credit_card</span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">restaurant</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-[120px]">
                    <span className="font-semibold block truncate">{t.category}</span>
                    {t.note && <span className="text-[11px] text-slate-500 dark:text-on-surface-variant truncate">{t.note}</span>}
                  </div>
                </td>
                <td className="py-4 text-slate-500 dark:text-on-surface-variant">
                  {t.type === "income" ? "Income" : "Expense"}
                </td>
                <td className="py-4 text-slate-500 dark:text-on-surface-variant whitespace-nowrap">
                  {formatDate(t.date)}
                </td>
                <td className={`py-4 text-right font-medium whitespace-nowrap ${
                  t.type === "income" ? "text-emerald-500 dark:text-primary-fixed" : "text-slate-900 dark:text-on-surface"
                }`}>
                  {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const grouped = groupByDate(transactions);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dayTxs = grouped[date];
        const dailyExpense = getDailyExpense(dayTxs);
        const dailyIncome = getDailyIncome(dayTxs);

        return (
          <div key={date}>
            {/* Date Header */}
            <div className="flex justify-between items-end mb-3 border-b border-slate-200 dark:border-outline-variant/10 pb-2">
              <h3 className="font-label-sm text-slate-500 dark:text-on-surface-variant">{formatDate(date)}</h3>
              <div className="flex gap-3 font-label-sm">
                {dailyIncome > 0 && (
                  <span className="text-emerald-500 dark:text-[#10b981]">+{formatRupiah(dailyIncome)}</span>
                )}
                {dailyExpense > 0 && (
                  <span className="text-rose-500 dark:text-[#ef4444]">- {formatRupiah(dailyExpense)}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {dayTxs.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:glass-panel border border-slate-200 dark:border-transparent rounded-xl p-3 flex items-center justify-between hover:border-slate-300 dark:hover:bg-surface-container-high/50 transition-colors cursor-pointer group shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shrink-0 ${
                          t.type === "income"
                            ? "bg-emerald-50 dark:bg-[#10b981]/10 text-emerald-500 dark:text-[#10b981]"
                            : t.debtId
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                            : "bg-rose-50 dark:bg-[#ef4444]/10 text-rose-500 dark:text-[#ef4444]"
                        }`}
                      >
                        {t.type === "income" ? (
                          <span className="material-symbols-outlined text-[20px]">trending_up</span>
                        ) : t.debtId ? (
                          <span className="material-symbols-outlined text-[20px]">credit_card</span>
                        ) : (
                          <span className="material-symbols-outlined text-[20px]">trending_down</span>
                        )}
                      </div>
                      <div>
                        <p className="font-body-md font-semibold text-slate-900 dark:text-on-surface">{t.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.accountName && (
                            <span className="bg-slate-100 dark:bg-surface-variant text-slate-600 dark:text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded font-medium">
                              {t.accountName}
                            </span>
                          )}
                          {t.note && (
                            <span className="font-label-sm text-slate-500 dark:text-on-surface-variant/70">
                              {t.note}
                            </span>
                          )}
                        </div>
                        {t.debtId && (
                          <p className="text-amber-500/80 dark:text-amber-500/70 text-[10px] flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[12px]">credit_card</span>
                            Pembayaran hutang
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <p
                        className={`font-body-md font-semibold ${
                          t.type === "income" ? "text-emerald-500 dark:text-[#10b981]" : "text-rose-500 dark:text-[#ef4444]"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatRupiah(t.amount)}
                      </p>
                      
                      {/* Actions (visible on hover) */}
                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity mt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-variant text-slate-400 hover:text-slate-700 dark:text-on-surface-variant dark:hover:text-on-surface flex items-center justify-center transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                          disabled={deletingId === t.id}
                          className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-error-container/20 text-slate-400 hover:text-rose-600 dark:text-on-surface-variant dark:hover:text-error flex items-center justify-center transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
