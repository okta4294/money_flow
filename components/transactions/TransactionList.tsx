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

function isToday(dateStr: string) {
  const today = new Date();
  const date = new Date(dateStr + "T00:00:00");
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function isYesterday(dateStr: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = new Date(dateStr + "T00:00:00");
  return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
}

function getDayLabel(dateStr: string) {
  if (isToday(dateStr)) return "Today, " + formatDate(dateStr);
  if (isYesterday(dateStr)) return "Yesterday, " + formatDate(dateStr);
  return formatDate(dateStr) + ", " + new Date(dateStr + "T00:00:00").getFullYear();
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
     if (t.type === "income") return "bg-primary-container";
     if (t.type === "transfer") return "bg-secondary-container";
     return "bg-tertiary-container";
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

  const grouped = groupByDate(transactions);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-10">
      {sortedDates.map((date, index) => {
        const dayTxs = grouped[date];

        return (
          <section key={date} className="mb-10">
            {/* Date Header */}
            <div className={`mb-4 inline-block px-4 py-1 neo-brutalist-border rounded-lg neo-brutalist-shadow-sm ${index % 2 === 0 ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
              <h2 className="font-label-bold text-label-bold uppercase text-on-background">{getDayLabel(date)}</h2>
            </div>
            
            <div className="space-y-6">
              <AnimatePresence>
                {dayTxs.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface neo-brutalist-border rounded-lg p-4 flex items-center gap-4 neo-brutalist-shadow active-press cursor-pointer group relative overflow-hidden"
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
                        {t.note && ` • ${t.note}`}
                      </p>
                    </div>
                    <div className="text-right z-10 relative flex flex-col items-end">
                      <p className={`font-headline-md text-lg md:text-xl font-bold whitespace-nowrap ${
                        t.type === "income" ? "text-[#2e7d32] dark:text-primary-fixed" : 
                        t.type === "transfer" ? "text-secondary-fixed-dim" : 
                        "text-error dark:text-tertiary-fixed"
                      }`}>
                        {t.type === "income" ? "+" : t.type === "transfer" ? "" : "-"}{formatRupiah(t.amount)}
                      </p>
                      
                      {/* Delete button appears on hover */}
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
          </section>
        );
      })}
    </div>
  );
}
