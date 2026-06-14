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

function ProgressBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  return (
    <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-2.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,247,255,0.4)]"
        style={{
          width: `${pct}%`,
          background: pct >= 100
            ? "linear-gradient(90deg, #00dce5, #63f7ff)" // primary-fixed
            : pct > 50
            ? "linear-gradient(90deg, #6001d1, #d2bbff)" // secondary
            : "linear-gradient(90deg, #93000a, #ffb4ab)", // error
        }}
      />
    </div>
  );
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
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel border border-white/5 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-bright" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-surface-bright rounded w-28" />
                <div className="h-2.5 bg-surface-bright rounded w-20" />
              </div>
              <div className="h-5 bg-surface-bright rounded w-24" />
            </div>
            <div className="h-1.5 bg-surface-bright rounded-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-surface-container-high border border-white/5 rounded-2xl flex items-center justify-center mb-4 text-2xl">
          {filter === "paid" ? "✅" : "🎉"}
        </div>
        <p className="text-on-surface-variant text-sm font-medium">
          {filter === "paid" ? "Belum ada hutang yang lunas" : "Tidak ada hutang aktif"}
        </p>
        <p className="text-on-surface-variant/70 text-xs mt-1">
          {filter === "paid" ? "Bayar hutang untuk melihat riwayatnya" : "Tambah hutang/paylater Anda di sini"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {debts.map((debt) => {
        const pct = debt.totalAmount > 0
          ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100)
          : 0;
        const overdue = isOverdue(debt.dueDate);
        const isPaid = debt.status === "paid";

        return (
          <div
            key={debt.id}
            className={`group glass-panel border rounded-xl p-4 transition-all duration-200 ${
              isPaid
                ? "border-primary-fixed/20 hover:border-primary-fixed/40"
                : overdue
                ? "border-error/30 hover:border-error/50"
                : "border-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                isPaid ? "bg-primary-fixed/10 border-primary-fixed/20 text-primary-fixed shadow-[0_0_10px_rgba(99,247,255,0.2)]" : overdue ? "bg-error/10 border-error/20 text-error shadow-[0_0_10px_rgba(255,180,171,0.2)]" : "bg-white/5 border-white/10 text-white"
              }`}>
                {isPaid
                  ? <i className="fa-solid fa-circle-check text-lg"></i>
                  : overdue
                  ? <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                  : <i className="fa-solid fa-credit-card text-lg"></i>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{debt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {debt.dueDate && (
                        <span className={`flex items-center gap-1 text-[11px] ${
                          overdue && !isPaid ? "text-error" : "text-on-surface-variant"
                        }`}>
                          <i className="fa-solid fa-clock text-[10px]"></i>
                          {formatDate(debt.dueDate)}
                          {overdue && !isPaid && " · Terlambat!"}
                        </span>
                      )}
                      {debt.note && (
                        <span className="text-on-surface-variant/70 text-[11px] truncate max-w-[140px]">{debt.note}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(debt)}
                      className="w-7 h-7 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-white flex items-center justify-center transition-all border border-transparent hover:border-white/10"
                    >
                      <i className="fa-solid fa-pencil text-[13px]"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(debt)}
                      disabled={deletingId === debt.id}
                      className="w-7 h-7 rounded-lg hover:bg-error/20 text-on-surface-variant hover:text-error flex items-center justify-center transition-all border border-transparent hover:border-error/20"
                    >
                      <i className="fa-solid fa-trash text-[13px]"></i>
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-baseline justify-between mt-2.5">
                  <div>
                    <span className="text-on-surface-variant text-[10px]">Sudah bayar </span>
                    <span className="text-primary-fixed-dim text-xs font-semibold drop-shadow-[0_0_5px_rgba(0,220,229,0.3)]">
                      {formatRupiah(debt.paidAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-on-surface-variant text-[10px]">Sisa </span>
                    <span className={`text-sm font-bold ${isPaid ? "text-primary-fixed-dim drop-shadow-[0_0_5px_rgba(0,220,229,0.3)]" : "text-white"}`}>
                      {formatRupiah(debt.remainingAmount)}
                    </span>
                    <span className="text-on-surface-variant/70 text-[10px]"> / {formatRupiah(debt.totalAmount)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar paid={debt.paidAmount} total={debt.totalAmount} />

                {/* Percentage */}
                <div className="flex justify-between mt-1">
                  <span className="text-on-surface-variant/70 text-[10px]">
                    {isPaid ? "✓ Lunas" : `${Math.round(pct)}% terbayar`}
                  </span>
                  {isPaid && (
                    <span className="text-primary-fixed text-[10px] font-medium">Selesai</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
