"use client";

import { useState } from "react";
import { useDebts } from "@/hooks/useDebts";
import { Debt } from "@/lib/firestore/debts";
import { DebtForm } from "@/components/debts/DebtForm";
import { DebtList } from "@/components/debts/DebtList";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function DebtsPage() {
  const { debts, activeDebts, paidDebts, totalDebt, nextMonthDebtEstimate, loading } = useDebts();
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<"active" | "paid" | "all">("active");

  const handleEdit = (debt: Debt) => {
    setEditDebt(debt);
    setShowForm(true);
  };

  const filteredDebts =
    filter === "active" ? activeDebts : filter === "paid" ? paidDebts : debts;

  const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-fixed/70">Hutang & Paylater</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Pantau sisa tagihan Anda</p>
        </div>
        <button
          id="add-debt-btn"
          onClick={() => { setEditDebt(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-secondary-container to-primary-fixed text-white font-label-md transition-all shadow-[0_0_15px_rgba(99,247,255,0.3)] hover:scale-[1.02] border border-white/10"
        >
          <i className="fa-solid fa-plus text-base"></i>
          Tambah Hutang
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Total Sisa */}
        <div className="glass-panel border-t border-t-error/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-error/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="font-label-sm text-on-surface-variant">Total Sisa Hutang</span>
            <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center border border-error/20">
              <i className="fa-solid fa-credit-card text-error text-lg"></i>
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-surface-bright rounded-lg animate-pulse relative z-10" />
          ) : (
            <span className="font-headline-md font-bold text-error drop-shadow-[0_0_10px_rgba(255,180,171,0.5)] relative z-10">{formatRupiah(totalDebt)}</span>
          )}
          <p className="font-label-sm text-on-surface-variant/70 mt-1 relative z-10">{activeDebts.length} hutang aktif</p>
        </div>

        {/* Total Sudah Dibayar */}
        <div className="glass-panel border-t border-t-primary-fixed-dim/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary-fixed-dim/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="font-label-sm text-on-surface-variant">Total Terbayar</span>
            <div className="w-9 h-9 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center border border-primary-fixed-dim/20">
              <i className="fa-solid fa-arrow-trend-down text-primary-fixed-dim text-lg"></i>
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-surface-bright rounded-lg animate-pulse relative z-10" />
          ) : (
            <span className="font-headline-md font-bold text-primary-fixed-dim drop-shadow-[0_0_10px_rgba(0,220,229,0.5)] relative z-10">{formatRupiah(totalPaid)}</span>
          )}
          <p className="font-label-sm text-on-surface-variant/70 mt-1 relative z-10">{paidDebts.length} hutang lunas</p>
        </div>

        {/* Total Semua Hutang */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden border border-white/5">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="font-label-sm text-on-surface-variant">Total Semua Hutang</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center border border-white/10">
              <i className="fa-solid fa-credit-card text-white text-lg"></i>
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-surface-bright rounded-lg animate-pulse relative z-10" />
          ) : (
            <span className="font-headline-md font-bold text-white relative z-10">{formatRupiah(totalOriginal)}</span>
          )}
          <p className="font-label-sm text-on-surface-variant/70 mt-1 relative z-10">{debts.length} total hutang tercatat</p>
        </div>

        {/* Estimasi Tagihan Bulan Depan */}
        <div className="glass-panel border-t border-t-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="font-label-sm text-on-surface-variant">Estimasi Bulan Depan</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <i className="fa-solid fa-calendar-days text-amber-400 text-lg"></i>
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-surface-bright rounded-lg animate-pulse relative z-10" />
          ) : nextMonthDebtEstimate > 0 ? (
            <span className="font-headline-md font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] relative z-10">{formatRupiah(nextMonthDebtEstimate)}</span>
          ) : (
            <span className="font-headline-md font-bold text-on-surface-variant relative z-10">Rp 0</span>
          )}
          <p className="font-label-sm text-on-surface-variant/70 mt-1 relative z-10">
            {nextMonthDebtEstimate > 0 ? "hutang jatuh tempo bulan depan" : "tidak ada jatuh tempo"}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["active", "paid", "all"] as const).map((f) => (
          <button
            key={f}
            id={`debt-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-label-md transition-all border whitespace-nowrap ${
              filter === f
                ? "bg-secondary-container/80 text-on-secondary-container border-secondary-container/50 shadow-[0_0_12px_rgba(96,1,209,0.4)]"
                : "glass-panel border-white/5 text-on-surface-variant hover:text-white"
            }`}
          >
            {f === "active" ? `Aktif (${activeDebts.length})` : f === "paid" ? `Lunas (${paidDebts.length})` : `Semua (${debts.length})`}
          </button>
        ))}
      </div>

      {/* Debt List */}
      <DebtList
        debts={filteredDebts}
        loading={loading}
        onEdit={handleEdit}
        filter={filter}
      />

      {/* Modals */}
      <DebtForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditDebt(null); }}
        editData={editDebt}
      />
    </div>
  );
}
