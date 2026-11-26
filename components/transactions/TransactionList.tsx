"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { deleteTransaction, Transaction } from "@/lib/firestore/transactions";
import { useCategories } from "@/hooks/useCategories";
import { formatRupiah, formatDate, getTransactionIcon } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (t: Transaction) => void;
}

const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

function getDayLabel(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  
  if (diffDays === 0 || diffDays === -1) {
    const rel = rtf.format(diffDays, 'day');
    return rel.charAt(0).toUpperCase() + rel.slice(1) + ", " + formatDate(dateStr);
  }
  return formatDate(dateStr) + ", " + date.getFullYear();
}

export function TransactionList({ transactions, loading, onEdit }: TransactionListProps) {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { categoryById, categoryByName } = useMemo(() => {
    const byId = new Map<string, (typeof categories)[number]>();
    const byName = new Map<string, (typeof categories)[number]>();
    for (const c of categories) {
      byId.set(c.id, c);
      byName.set(c.name, c);
    }
    return { categoryById: byId, categoryByName: byName };
  }, [categories]);

  const getCategoryIcon = (t: Transaction) => {
    const cat = categoryById.get(t.categoryId) || categoryByName.get(t.category);
    return getTransactionIcon({
      type: t.type,
      categoryIcon: cat?.icon,
      categoryName: cat?.name || t.category,
      note: t.note,
      debtId: t.debtId,
    });
  };

  const getCategoryColor = (t: Transaction) => {
     if (t.type === "income") return "bg-tertiary-container text-on-tertiary-container";
     if (t.type === "transfer") return "bg-secondary-container text-on-secondary-container";
     return "bg-error-container text-on-error-container";
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);
    try {
      await deleteTransaction(user.uid, id);
    } finally {
      setDeletingId(null);
    }
  };

  const groupedDays = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    for (const t of transactions) {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    }

    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map((dateStr) => {
        const dayTxs = [...grouped[dateStr]].sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        let dayIncome = 0;
        let dayExpense = 0;
        for (const t of dayTxs) {
          if (t.type === "income") dayIncome += t.amount;
          else if (t.type === "expense") dayExpense += t.amount;
        }
        return { dateStr, dayTxs, dayIncome, dayExpense };
      });
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface comic-card p-4 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-surface-bright rounded-xl border-2 border-outline"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-bright rounded w-24"></div>
              <div className="h-3 bg-surface-bright rounded w-16"></div>
            </div>
            <div className="h-5 bg-surface-bright rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-surface comic-card sketch-hatch px-6">
        <div className="w-16 h-16 bg-surface-container comic-subcard flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">inbox</span>
        </div>
        <p className="font-headline-md font-extrabold text-lg text-on-surface">Belum ada transaksi.</p>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">Mulai catat transaksi pertama Anda bulan ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface comic-card p-4 sm:p-6 space-y-6">
      {groupedDays.map(({ dateStr, dayTxs, dayIncome, dayExpense }) => (
          <div key={dateStr} className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b-2 border-outline/20 pb-2 px-1">
              <h2 className="font-label-bold text-secondary uppercase tracking-wider text-xs sm:text-sm font-extrabold">
                {getDayLabel(dateStr)}
              </h2>
              <div className="flex gap-3 text-xs sm:text-sm font-label-bold font-bold tabular-nums">
                {dayIncome > 0 && (
                  <span className="text-tertiary dark:text-tertiary-fixed">
                    Masuk: +{formatRupiah(dayIncome)}
                  </span>
                )}
                {dayExpense > 0 && (
                  <span className="text-error">
                    Keluar: -{formatRupiah(dayExpense)}
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-outline/15">
                {dayTxs.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onEdit(t)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onEdit(t);
                      }
                    }}
                    className="hover:bg-surface-container/75 rounded-xl px-2.5 py-3 sm:px-3.5 sm:py-3.5 flex items-center gap-3.5 cursor-pointer group relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-xl border-2 border-outline/60 ${getCategoryColor(
                        t
                      )}`}
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-xl icon-filled">
                        {getCategoryIcon(t)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-label-bold text-sm sm:text-base text-on-surface font-bold leading-tight truncate">
                        {t.note || t.category || "Transaksi"}
                      </p>
                      <p className="font-body-sm text-on-surface-variant text-xs truncate mt-0.5">
                        {t.type === "transfer"
                          ? `Transfer Antar Akun (${t.accountName || "?"} -> ${
                              t.destinationAccountName || "?"
                            })`
                          : `${t.category || "Tanpa Kategori"}${
                              t.accountName ? ` • ${t.accountName}` : ""
                            }`}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-2.5 shrink-0 pl-2">
                      <p
                        className={`font-display-lg text-sm sm:text-base font-extrabold whitespace-nowrap tabular-nums ${
                          t.type === "income"
                            ? "text-tertiary dark:text-tertiary-fixed"
                            : t.type === "transfer"
                            ? "text-secondary"
                            : "text-error"
                        }`}
                      >
                        {t.type === "income"
                          ? "+"
                          : t.type === "transfer"
                          ? ""
                          : "-"}
                        {formatRupiah(t.amount)}
                      </p>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(t.id);
                        }}
                        disabled={deletingId === t.id}
                        className="w-11 h-11 rounded-xl border-2 border-outline/40 hover:border-outline bg-surface hover:bg-error-container text-on-surface-variant hover:text-on-error-container flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                        aria-label="Hapus transaksi"
                        title="Hapus transaksi"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base">
                          {deletingId === t.id ? "hourglass_top" : "delete"}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
      ))}
    </div>
  );
}
