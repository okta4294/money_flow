"use client";

import { useState } from "react";
import { Pencil, Trash2, CreditCard, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
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
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: pct >= 100
            ? "linear-gradient(90deg, #10b981, #059669)"
            : pct > 50
            ? "linear-gradient(90deg, #f59e0b, #d97706)"
            : "linear-gradient(90deg, #ef4444, #dc2626)",
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
          <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-800 rounded w-28" />
                <div className="h-2.5 bg-slate-800 rounded w-20" />
              </div>
              <div className="h-5 bg-slate-800 rounded w-24" />
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-2xl">
          {filter === "paid" ? "✅" : "🎉"}
        </div>
        <p className="text-slate-400 text-sm font-medium">
          {filter === "paid" ? "Belum ada hutang yang lunas" : "Tidak ada hutang aktif"}
        </p>
        <p className="text-slate-600 text-xs mt-1">
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
            className={`group bg-slate-900/50 border rounded-xl p-4 hover:border-slate-700 transition-all duration-200 ${
              isPaid
                ? "border-emerald-500/20"
                : overdue
                ? "border-red-500/30"
                : "border-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isPaid ? "bg-emerald-500/10" : overdue ? "bg-red-500/10" : "bg-amber-500/10"
              }`}>
                {isPaid
                  ? <CheckCircle2 size={18} className="text-emerald-400" />
                  : overdue
                  ? <AlertTriangle size={18} className="text-red-400" />
                  : <CreditCard size={18} className="text-amber-400" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{debt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {debt.dueDate && (
                        <span className={`flex items-center gap-1 text-xs ${
                          overdue && !isPaid ? "text-red-400" : "text-slate-500"
                        }`}>
                          <Clock size={10} />
                          {formatDate(debt.dueDate)}
                          {overdue && !isPaid && " · Terlambat!"}
                        </span>
                      )}
                      {debt.note && (
                        <span className="text-slate-600 text-xs truncate max-w-[140px]">{debt.note}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(debt)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white flex items-center justify-center transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(debt)}
                      disabled={deletingId === debt.id}
                      className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-baseline justify-between mt-2.5">
                  <div>
                    <span className="text-slate-500 text-[10px]">Sudah bayar </span>
                    <span className="text-emerald-400 text-xs font-semibold">
                      {formatRupiah(debt.paidAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px]">Sisa </span>
                    <span className={`text-sm font-bold ${isPaid ? "text-emerald-400" : "text-amber-400"}`}>
                      {formatRupiah(debt.remainingAmount)}
                    </span>
                    <span className="text-slate-600 text-[10px]"> / {formatRupiah(debt.totalAmount)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar paid={debt.paidAmount} total={debt.totalAmount} />

                {/* Percentage */}
                <div className="flex justify-between mt-1">
                  <span className="text-slate-600 text-[10px]">
                    {isPaid ? "✓ Lunas" : `${Math.round(pct)}% terbayar`}
                  </span>
                  {isPaid && (
                    <span className="text-emerald-500 text-[10px] font-medium">Selesai</span>
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
