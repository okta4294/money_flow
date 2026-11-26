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
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-background border-2 border-outline rounded-xl p-5 animate-pulse flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-surface-bright border-2 border-outline rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-bright rounded w-28" />
                <div className="h-3 bg-surface-bright rounded w-20" />
              </div>
            </div>
            <div className="h-5 bg-surface-bright border-2 border-outline rounded-lg w-full mt-2" />
          </div>
        ))}
      </section>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-background border-2 border-dashed border-outline/60 rounded-xl sketch-hatch px-4">
        <div className="w-16 h-16 bg-surface-container comic-subcard flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">
            {filter === "paid" ? "check_circle" : "celebration"}
          </span>
        </div>
        <p className="font-headline-md font-extrabold text-on-surface text-lg">
          {filter === "paid" ? "Belum ada hutang yang lunas" : "Tidak ada hutang aktif"}
        </p>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">
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
            "bg-primary-container",
            "bg-secondary-container",
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
              role="button"
              tabIndex={0}
              className="bg-background hover:bg-surface-bright border-2 border-outline/50 hover:border-outline rounded-xl p-4 sm:p-5 transition-all flex flex-col gap-3 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              onClick={() => onEdit(debt)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onEdit(debt);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2.5 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-xl border-2 border-outline flex items-center justify-center shrink-0 ${
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
                      <h3 className="font-label-bold text-base font-extrabold text-on-surface truncate max-w-full">
                        {debt.name}
                      </h3>
                      {overdue && !isPaid && (
                        <span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container border border-outline text-xs font-label-bold font-bold shrink-0">
                          Lewat Jatuh Tempo
                        </span>
                      )}
                      {isPaid && (
                        <span className="px-2 py-0.5 rounded-md bg-tertiary-container text-on-tertiary-container border border-outline text-xs font-label-bold font-bold shrink-0">
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

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(debt);
                    }}
                    title="Edit Hutang"
                    aria-label={`Edit ${debt.name}`}
                    className="w-11 h-11 rounded-xl bg-surface hover:bg-surface-bright border-2 border-outline text-on-surface flex items-center justify-center active-press-sm cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-base">
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
                    aria-label={`Hapus ${debt.name}`}
                    className="w-11 h-11 rounded-xl bg-error-container text-on-error-container border-2 border-outline flex items-center justify-center hover:opacity-90 active-press-sm cursor-pointer disabled:opacity-50"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-base">
                      {deletingId === debt.id ? "hourglass_top" : "delete"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-1.5 pt-2 border-t border-outline/15 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-label-bold font-semibold uppercase text-on-surface-variant">
                    Sisa:
                  </span>
                  <span
                    className={`font-display-lg text-base font-extrabold tabular-nums ${
                      isPaid
                        ? "text-tertiary dark:text-tertiary-fixed"
                        : overdue
                        ? "text-error"
                        : "text-on-surface"
                    }`}
                  >
                    {formatRupiah(debt.remainingAmount)}
                  </span>
                </div>

                <span className="text-xs font-label-bold font-semibold text-on-surface-variant tabular-nums">
                  Total {formatRupiah(debt.totalAmount)} ({Math.round(pct)}%)
                </span>
              </div>

              <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${barColorClass} sketch-hatch border-r-2 border-outline transition-all duration-500`}
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
