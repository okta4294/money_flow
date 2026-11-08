"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { deleteDebt, Debt } from "@/lib/firestore/debts";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah, formatDate } from "@/lib/utils";

interface DebtListProps {
  debts: Debt[];
  loading: boolean;
  onEdit: (debt: Debt) => void;
  filter: "active" | "paid" | "all";
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return dueDate < todayStr;
}

export function DebtList({ debts, loading, onEdit, filter }: DebtListProps) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (debt: Debt) => {
    if (!user || !confirm(`Hapus hutang "${debt.name}"?`)) return;
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
          <div key={i} className="bg-surface border-4 border-outline rounded-3xl p-5 animate-pulse flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-bright border-2 border-outline rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-bright rounded w-28" />
                <div className="h-3 bg-surface-bright rounded w-20" />
              </div>
            </div>
            <div className="h-6 bg-surface-bright border-2 border-outline rounded-full w-full mt-2" />
          </div>
        ))}
      </section>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-surface-container border-4 border-outline rounded-3xl flex items-center justify-center mb-4 shadow-[4px_4px_0_0_var(--theme-outline)]">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">
            {filter === "paid" ? "check_circle" : "celebration"}
          </span>
        </div>
        <p className="font-headline-md text-on-surface text-lg">
          {filter === "paid" ? "Belum ada hutang yang lunas" : "Tidak ada hutang aktif"}
        </p>
        <p className="font-body-md text-on-surface-variant mt-1">
          {filter === "paid" ? "Catatan hutang yang telah lunas akan tersimpan di sini" : "Hebat! Anda bebas dari beban hutang."}
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3.5">
      <AnimatePresence mode="popLayout">
        {debts.map((debt, idx) => {
          const pct =
            debt.totalAmount > 0
              ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100)
              : 0;
          const overdue = isOverdue(debt.dueDate);
          const isPaid = debt.status === "paid";

          const barColors = [
            "bg-tertiary-container",
            "bg-error-container",
            "bg-secondary-container",
            "bg-primary-container",
          ];
          const barColorClass = isPaid
            ? "bg-tertiary-container"
            : overdue
            ? "bg-error-container"
            : barColors[idx % barColors.length];

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key={debt.id}
              className="bg-background hover:bg-surface-bright border-2 border-outline rounded-2xl p-4 sm:p-5 shadow-[2px_2px_0_0_var(--theme-outline)] transition-all flex flex-col gap-3 group cursor-pointer"
              onClick={() => onEdit(debt)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border-2 border-outline flex items-center justify-center shrink-0 ${
                      isPaid
                        ? "bg-tertiary-container text-on-tertiary-container"
                        : overdue
                        ? "bg-error-container text-on-error-container"
                        : "bg-primary-container text-on-primary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isPaid ? "check_circle" : "credit_card"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <h4 className="font-label-bold text-sm sm:text-base font-extrabold text-on-surface truncate max-w-full">
                        {debt.name}
                      </h4>
                      {overdue && !isPaid && (
                        <span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container border border-outline text-[10px] font-label-bold uppercase shrink-0">
                          Lewat Jatuh Tempo
                        </span>
                      )}
                      {isPaid && (
                        <span className="px-2 py-0.5 rounded-md bg-tertiary-container text-on-tertiary-container border border-outline text-[10px] font-label-bold uppercase shrink-0">
                          Lunas
                        </span>
                      )}
                    </div>
                    {(debt.dueDate || debt.note) && (
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {debt.dueDate ? `Jatuh Tempo: ${formatDate(debt.dueDate)}` : ""}
                        {debt.dueDate && debt.note ? " • " : ""}
                        {debt.note || ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 min-w-0">
                  <span
                    className={`font-display-lg text-xs sm:text-sm md:text-base font-bold truncate ${
                      isPaid
                        ? "text-tertiary dark:text-tertiary-fixed"
                        : overdue
                        ? "text-error"
                        : "text-tertiary dark:text-tertiary-fixed"
                    }`}
                  >
                    Sisa {formatRupiah(debt.remainingAmount)} /{" "}
                    {formatRupiah(debt.totalAmount)} ({Math.round(pct)}%)
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(debt);
                      }}
                      title="Edit Hutang"
                      className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-bright border-2 border-outline text-on-surface flex items-center justify-center active-press-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(debt);
                      }}
                      disabled={deletingId === debt.id}
                      title="Hapus Hutang"
                      className="w-8 h-8 rounded-lg bg-error-container text-on-error-container border-2 border-outline flex items-center justify-center hover:opacity-90 active-press-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${barColorClass} border-r-2 border-outline transition-all duration-500`}
                  style={{ width: `${Math.max(pct, 6)}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
