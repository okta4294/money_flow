"use client";

import { useState } from "react";
import { useDebts } from "@/hooks/useDebts";
import { Debt } from "@/lib/firestore/debts";
import { DebtForm } from "@/components/debts/DebtForm";
import { DebtList } from "@/components/debts/DebtList";
import { PageHeader } from "@/components/layout/PageHeader";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { motion } from "framer-motion";
import { formatRupiah } from "@/lib/utils";

export default function DebtsPage() {
  const { debts, activeDebts, paidDebts, totalDebt, loading, upcomingMonths } = useDebts();
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<"active" | "paid" | "all">("active");

  const handleEdit = (debt: Debt) => {
    setEditDebt(debt);
    setShowForm(true);
  };

  const filteredDebts =
    filter === "active" ? activeDebts : filter === "paid" ? paidDebts : debts;

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Beban Hidupmu"
        subtitle="Udah tau miskin masih ngutang"
        action={
          <button
            type="button"
            onClick={() => {
              setEditDebt(null);
              setShowForm(true);
            }}
            className="h-11 w-full sm:w-auto px-4 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline font-label-bold text-xs uppercase shadow-[2px_2px_0_0_var(--theme-outline)] hover:opacity-95 active-press-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Catat Hutang Baru</span>
          </button>
        }
        className="mb-0"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 min-w-0">
        {/* Kiri (7 Kolom): Kartu Hijau Total Beban Hidupmu Saat Ini sesuai FigCraft Frame 07 */}
        <motion.section
          whileHover={{ y: -2 }}
          className="min-w-0 lg:col-span-7 bg-tertiary-container border-4 border-outline rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] relative overflow-hidden flex flex-col justify-between gap-3"
        >
          <div className="relative z-10 space-y-2">
            <p className="font-label-bold text-on-tertiary-container uppercase tracking-wider text-xs sm:text-sm font-extrabold">
              Total Beban Hidupmu Saat Ini
            </p>
            <h2 className="text-4xl sm:text-5xl font-display-lg font-black tracking-tight text-on-tertiary-container">
              {loading ? "..." : formatRupiah(totalDebt)}
            </h2>
          </div>

          <div className="relative z-10 pt-2">
            <p className="font-label-bold text-xs sm:text-sm text-on-tertiary-container flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-surface text-on-surface border-2 border-outline rounded-xl px-3 py-1 text-xs shadow-[1.5px_1.5px_0_0_var(--theme-outline)]">
                <span className="material-symbols-outlined text-sm text-error">
                  warning
                </span>
                <span>{activeDebts.length} Hutang Aktif</span>
              </span>
              <span className="opacity-90">
                &bull; Otomatis potong saat catat pengeluaran Hutang
              </span>
            </p>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[110px] text-on-tertiary-container opacity-15 pointer-events-none rotate-12">
            credit_card
          </span>
        </motion.section>

        {/* Kanan (5 Kolom): Kartu Estimasi Tagihan Kedepan sesuai FigCraft Frame 07 */}
        <motion.section
          whileHover={{ y: -2 }}
          className="lg:col-span-5 bg-surface border-4 border-outline rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] flex flex-col justify-start max-h-[300px] overflow-y-auto no-scrollbar"
        >
          <div className="flex items-center gap-2 mb-3 sticky top-0 bg-surface z-10 py-1">
            <span className="material-symbols-outlined text-primary text-lg">
              calendar_month
            </span>
            <p className="font-label-bold text-on-surface uppercase tracking-wider text-xs font-extrabold">
              Estimasi Tagihan Kedepan
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-on-surface-variant">Memuat...</p>
          ) : upcomingMonths?.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4 bg-background border-2 border-dashed border-outline rounded-2xl text-center">
              <p className="text-xs font-body-md text-on-surface-variant">
                Tidak ada tagihan jatuh tempo terjadwal.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcomingMonths?.map((um) => (
                <details
                  key={um.month}
                  className="group bg-background rounded-xl border-2 border-outline p-3 shadow-[2px_2px_0_0_var(--theme-outline)] open:bg-surface-bright transition-colors"
                >
                  <summary className="font-label-bold text-on-surface cursor-pointer flex justify-between items-center outline-none">
                    <span className="text-xs sm:text-sm font-extrabold">
                      {um.month}
                    </span>
                    <span className="text-error text-xs sm:text-sm font-display-lg font-bold">
                      {formatRupiah(um.total)}
                    </span>
                  </summary>
                  <ul className="mt-2.5 space-y-1.5 border-t-2 border-outline/20 border-dashed pt-2.5">
                    {um.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-xs font-body-md text-on-surface-variant font-bold"
                      >
                        <span className="truncate mr-2">{item.name}</span>
                        <span className="shrink-0">
                          {formatRupiah(item.remainingAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Kontainer Daftar Hutang & Progress Pelunasan sesuai FigCraft Frame 07 */}
      <div className="bg-surface border-4 border-outline rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-headline-md text-sm sm:text-base uppercase font-extrabold text-on-surface">
            Daftar Hutang & Progress Pelunasan (Filter:{" "}
            {filter === "active"
              ? "Aktif"
              : filter === "paid"
              ? "Lunas"
              : "Semua"}
            )
          </h3>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(["active", "paid", "all"] as const).map((f) => {
              const isSelected = filter === f;
              const label =
                f === "active"
                  ? `Aktif (${activeDebts.length})`
                  : f === "paid"
                  ? `Lunas (${paidDebts.length})`
                  : `Semua (${debts.length})`;
              return (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-label-bold uppercase whitespace-nowrap border-2 border-outline transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                      : "bg-background text-on-surface hover:bg-surface-bright"
                  }`}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <DebtList
          debts={filteredDebts}
          loading={loading}
          onEdit={handleEdit}
          filter={filter}
        />
      </div>
      
      <motion.section whileHover={{ rotate: 1 }} className="bg-surface-container-high border-2 border-outline rounded-3xl p-6 border-dashed text-center mt-10">
        <p className="italic font-body-md text-on-surface-variant font-bold">"Bayar hutangmu sebelum malaikat menagihnya di akhirat."</p>
      </motion.section>

      <DebtForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditDebt(null); }}
        editData={editDebt}
      />

      <FloatingActionButton
        id="add-debt-fab"
        label="Tambah Hutang"
        onClick={() => {
          setEditDebt(null);
          setShowForm(true);
        }}
      />
    </div>
  );
}
