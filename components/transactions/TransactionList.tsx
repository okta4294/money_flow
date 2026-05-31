"use client";

import { useState } from "react";
import { Pencil, Trash2, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { deleteTransaction, Transaction } from "@/lib/firestore/transactions";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (t: Transaction) => void;
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
  return transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

/** Hitung total pengeluaran dalam satu grup hari */
function getDailyExpense(txs: Transaction[]): number {
  return txs.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
}

/** Hitung total pemasukan dalam satu grup hari */
function getDailyIncome(txs: Transaction[]): number {
  return txs.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
}

export function TransactionList({ transactions, loading, onEdit }: TransactionListProps) {
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
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-800 rounded w-24" />
                <div className="h-2.5 bg-slate-800 rounded w-16" />
              </div>
              <div className="h-4 bg-slate-800 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-2xl">
          📭
        </div>
        <p className="text-slate-400 text-sm font-medium">Belum ada transaksi</p>
        <p className="text-slate-600 text-xs mt-1">Tambahkan transaksi pertama Anda</p>
      </div>
    );
  }

  const grouped = groupByDate(transactions);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      {sortedDates.map((date) => {
        const dayTxs = grouped[date];
        const dailyExpense = getDailyExpense(dayTxs);
        const dailyIncome = getDailyIncome(dayTxs);

        return (
          <div key={date}>
            {/* Date Header with daily summary */}
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-slate-500 text-xs font-medium">{formatDate(date)}</p>
              <div className="flex items-center gap-2">
                {dailyIncome > 0 && (
                  <span className="text-emerald-500 text-[11px] font-semibold">
                    +{formatRupiah(dailyIncome)}
                  </span>
                )}
                {dailyExpense > 0 && (
                  <span className="text-rose-400 text-[11px] font-semibold">
                    -{formatRupiah(dailyExpense)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {dayTxs.map((t) => (
                <div
                  key={t.id}
                  className="group bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 hover:border-slate-700 transition-all duration-200"
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      t.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : t.debtId
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? (
                      <TrendingUp size={16} />
                    ) : t.debtId ? (
                      <CreditCard size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.accountName && (
                        <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {t.accountName}
                        </span>
                      )}
                      {t.note && (
                        <p className="text-slate-500 text-xs truncate">{t.note}</p>
                      )}
                    </div>
                    {t.debtId && (
                      <p className="text-amber-500/70 text-[10px] flex items-center gap-1 mt-0.5">
                        <CreditCard size={9} />
                        Pembayaran hutang
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <span
                    className={`text-sm font-semibold flex-shrink-0 ${
                      t.type === "income" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatRupiah(t.amount)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(t)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white flex items-center justify-center transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
