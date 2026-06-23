"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { deleteDebt, Debt } from "@/lib/firestore/debts";

interface DebtListProps {
  debts: Debt[];
  loading: boolean;
  onEdit: (debt: Debt) => void;
  filter: "active" | "paid" | "all";
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
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toISOString().split("T")[0]);
}

export function DebtList({ debts, loading, onEdit, filter }: DebtListProps) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (debt: Debt) => {
    if (!user || !confirm(`Delete debt "${debt.name}"?`)) return;
    setDeletingId(debt.id);
    try {
      await deleteDebt(user.uid, debt.id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface neo-brutalist-border rounded-lg p-5 animate-pulse flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-bright neo-brutalist-border rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-bright rounded w-28" />
                <div className="h-3 bg-surface-bright rounded w-20" />
              </div>
            </div>
            <div className="h-6 bg-surface-bright neo-brutalist-border rounded-full w-full mt-2" />
          </div>
        ))}
      </section>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-surface-container neo-brutalist-border rounded-2xl flex items-center justify-center mb-4 neo-brutalist-shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">
            {filter === "paid" ? "check_circle" : "celebration"}
          </span>
        </div>
        <p className="font-headline-md text-on-surface text-lg">
          {filter === "paid" ? "No paid debts yet" : "No active debts"}
        </p>
        <p className="font-body-md text-on-surface-variant mt-1">
          {filter === "paid" ? "Pay a debt to see it here" : "You're debt free!"}
        </p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {debts.map((debt, idx) => {
        const pct = debt.totalAmount > 0
          ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100)
          : 0;
        const overdue = isOverdue(debt.dueDate);
        const isPaid = debt.status === "paid";

        // Assign a pseudo-random color/icon based on index or debt properties
        const colors = [
          "bg-secondary-container text-white",
          "bg-primary-fixed text-on-primary-fixed",
          "bg-tertiary text-white",
          "bg-primary-container text-on-primary-container"
        ];
        const barColors = [
          "bg-secondary-container",
          "bg-primary-fixed",
          "bg-tertiary",
          "bg-primary-container"
        ];
        const icons = ["shopping_cart", "person", "credit_card", "payments"];
        
        const colorClass = colors[idx % colors.length];
        const barColorClass = barColors[idx % barColors.length];
        const iconName = icons[idx % icons.length];

        return (
          <div
            key={debt.id}
            className="bg-surface neo-brutalist-border rounded-lg p-5 neo-brutalist-shadow-sm hover:neo-brutalist-shadow transition-all flex flex-col gap-4 group cursor-pointer"
            onClick={() => onEdit(debt)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${colorClass} neo-brutalist-border rounded-lg flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-3xl">{iconName}</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-body-lg text-on-background line-clamp-1">{debt.name}</h3>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {debt.dueDate && (
                      <span className={`font-label-bold text-[11px] flex items-center gap-1 ${overdue && !isPaid ? 'text-error' : 'text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {formatDate(debt.dueDate)}
                        {overdue && !isPaid && " (Overdue)"}
                      </span>
                    )}
                    {debt.note && <p className="text-on-surface-variant text-[11px] font-label-bold line-clamp-1">{debt.note}</p>}
                  </div>
                </div>
              </div>
              <span className={`${isPaid ? "bg-primary-container" : overdue ? "bg-error-container" : "bg-surface-container-highest"} neo-brutalist-border rounded-full px-3 py-1 text-[10px] font-bold uppercase`}>
                {isPaid ? "Paid" : overdue ? "Urgent" : "Active"}
              </span>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-end mb-1">
                 <div>
                   <p className="text-[10px] font-label-bold text-on-surface-variant uppercase tracking-wider">Sudah Bayar</p>
                   <p className="font-label-bold text-sm text-primary-fixed">{formatRupiah(debt.paidAmount)}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-label-bold text-on-surface-variant uppercase tracking-wider">Sisa</p>
                   <p className="font-label-bold text-sm text-on-surface">{formatRupiah(debt.remainingAmount)} <span className="text-[10px] opacity-60">/ {formatRupiah(debt.totalAmount)}</span></p>
                 </div>
              </div>
              <div className="flex justify-between font-label-bold text-on-background text-xs">
                <span>Progress</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div className="h-6 w-full bg-surface-container neo-brutalist-border rounded-full overflow-hidden relative">
                <div className={`h-full ${barColorClass} border-r-[3px] border-on-background transition-all duration-500`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(debt); }}
                  disabled={deletingId === debt.id}
                  className="bg-error-container neo-brutalist-border p-2 rounded-lg hover:bg-error hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(debt); }}
                    className="bg-primary-container neo-brutalist-border p-3 rounded-full neo-brutalist-shadow-sm active-press flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-background" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isPaid ? "check" : "edit"}
                  </span>
                </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
