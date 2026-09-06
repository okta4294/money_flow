"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { deleteTransaction, Transaction } from "@/lib/firestore/transactions";
import { useCategories } from "@/hooks/useCategories";
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
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

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

export function TransactionList({ transactions, loading, onEdit, variant = "list" }: TransactionListProps) {
  const { user } = useAuth();
  const { incomeCategories, expenseCategories } = useCategories();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCategoryIcon = (t: Transaction) => {
    if (t.type === "transfer") return "swap_horiz";
    const allCategories = [...incomeCategories, ...expenseCategories];
    const cat = allCategories.find((c) => c.id === t.categoryId || c.name === t.category);
    if (cat?.icon && !cat.icon.includes("fa-")) return cat.icon;
    if (t.type === "income") return "payments";
    if (t.debtId) return "credit_card";
    return "receipt";
  };

  const getCategoryColor = (t: Transaction) => {
     if (t.type === "income") return "bg-tertiary-container";
     if (t.type === "transfer") return "bg-secondary-container";
     return "bg-error-container";
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Delete this transaction?")) return;
    setDeletingId(id);
    try {
      await deleteTransaction(user.uid, id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface neo-brutalist-border rounded-lg p-4 flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 bg-surface-bright rounded-xl neo-brutalist-border"></div>
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-surface-container neo-brutalist-border rounded-2xl flex items-center justify-center mb-4 neo-brutalist-shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">inbox</span>
        </div>
        <p className="font-headline-md text-on-surface">No hits yet.</p>
        <p className="font-body-md text-on-surface-variant mt-1">Make a move and record your first transaction.</p>
      </div>
    );
  }

  const grouped = transactions.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {sortedDates.map((dateStr) => {
        const dayTxs = [...grouped[dateStr]].sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        const dayIncome = dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const dayExpense = dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

        return (
          <div key={dateStr} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-outline pb-2 px-2">
              <h3 className="font-headline-md text-on-surface text-lg">
                {getDayLabel(dateStr)}
              </h3>
              <div className="flex gap-4">
                <span className="font-label-bold text-xs uppercase text-tertiary">
                  In: {formatRupiah(dayIncome)}
                </span>
                <span className="font-label-bold text-xs uppercase text-error">
                  Out: {formatRupiah(dayExpense)}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {dayTxs.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="bg-surface neo-brutalist-border rounded-xl p-4 flex items-center gap-4 neo-brutalist-shadow cursor-pointer group relative overflow-hidden"
                >
                  <div className={`w-14 h-14 flex items-center justify-center rounded-xl neo-brutalist-border ${getCategoryColor(t)} z-10 relative text-black`}>
                    {(() => {
                      const cat = [...incomeCategories, ...expenseCategories].find((c) => c.id === t.categoryId || c.name === t.category);
                      if (cat?.icon?.includes("fa-")) return <i className={`fa-solid ${cat.icon} text-2xl`}></i>;
                      return (
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {getCategoryIcon(t)}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex-1 z-10 relative" onClick={() => onEdit(t)}>
                    <p className="font-headline-md text-body-lg text-on-background leading-tight line-clamp-1">{t.note || t.category}</p>
                    <p className="font-body-md text-on-surface-variant text-sm">
                      {t.type === "transfer" ? `${t.accountName || "?"} → ${t.destinationAccountName || "?"}` : (t.category || "Uncategorized")}
                    </p>
                  </div>
                  <div className="text-right z-10 relative flex flex-col items-end">
                    <p className={`font-headline-md text-lg md:text-xl font-bold whitespace-nowrap ${
                      t.type === "income" ? "text-tertiary" : 
                      t.type === "transfer" ? "text-secondary-fixed-dim" : 
                      "text-error"
                    }`}>
                      {t.type === "income" ? "+" : t.type === "transfer" ? "" : "-"}{formatRupiah(t.amount)}
                    </p>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                        disabled={deletingId === t.id}
                        className="mt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-error hover:text-error-container transition-opacity"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
