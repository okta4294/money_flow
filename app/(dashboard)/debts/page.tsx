"use client";

import { useState } from "react";
import { useDebts } from "@/hooks/useDebts";
import { Debt } from "@/lib/firestore/debts";
import { DebtForm } from "@/components/debts/DebtForm";
import { DebtList } from "@/components/debts/DebtList";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { formatRupiah } from "@/lib/utils";
import { triggerSakugaPop } from "@/lib/sakuga";

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
            onClick={(e) => {
              triggerSakugaPop(e.currentTarget, "sparkle");
              setEditDebt(null);
              setShowForm(true);
            }}
            className="min-h-11 w-full sm:w-auto px-4 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline font-label-bold font-bold text-xs sm:text-sm shadow-[2px_2px_0_0_var(--theme-outline)] hover:opacity-95 active-press-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0 sketch-hatch"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Catat Hutang Baru</span>
          </button>
        }
        className="mb-0"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 min-w-0">
        {/* Kiri (7 Kolom): Kartu Hijau Total Beban Hidupmu Saat Ini */}
        <motion.section
          whileHover={{ y: -2 }}
          className="min-w-0 lg:col-span-7 bg-tertiary-container comic-card sketch-crosshatch p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between gap-3"
        >
          <div className="relative z-10 space-y-2">
            <h2 className="font-label-bold text-on-tertiary-container uppercase tracking-wider text-xs sm:text-sm font-extrabold">
              Total Beban Hidupmu Saat Ini
            </h2>
            <p className="text-4xl sm:text-5xl font-display-lg font-extrabold tracking-tight text-on-tertiary-container tabular-nums">
              {loading ? "..." : formatRupiah(totalDebt)}
            </p>
          </div>

          <div className="relative z-10 pt-2">
            <p className="font-label-bold font-semibold text-xs sm:text-sm text-on-tertiary-container flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-surface text-on-surface border-2 border-outline rounded-xl px-3 py-1 text-xs font-bold shadow-[2px_2px_0_0_var(--theme-outline)]">
                <span className="material-symbols-outlined text-sm text-error">
                  warning
                </span>
                <span>{activeDebts.length} Hutang Aktif</span>
              </span>
              <span className="opacity-95">
                &bull; Otomatis potong saat catat pengeluaran Hutang
              </span>
            </p>
          </div>
          <span aria-hidden="true" className="material-symbols-outlined absolute -right-4 -bottom-4 text-[110px] text-on-tertiary-container opacity-15 pointer-events-none rotate-12">
            credit_card
          </span>
        </motion.section>

        {/* Kanan (5 Kolom): Kartu Estimasi Tagihan Kedepan */}
        <motion.section
          whileHover={{ y: -2 }}
          className="lg:col-span-5 bg-surface comic-card p-5 sm:p-6 flex flex-col justify-start max-h-[300px] overflow-y-auto no-scrollbar"
        >
          <div className="flex items-center gap-2 mb-3 sticky top-0 bg-surface z-10 py-1">
            <span className="material-symbols-outlined text-primary text-lg">
              calendar_month
            </span>
            <h2 className="font-label-bold text-on-surface uppercase tracking-wider text-xs sm:text-sm font-extrabold">
              Estimasi Tagihan Kedepan
            </h2>
          </div>

          {loading ? (
            <p className="text-sm text-on-surface-variant">Memuat...</p>
          ) : upcomingMonths?.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4 bg-background border-2 border-dashed border-outline/60 rounded-xl text-center sketch-hatch">
              <p className="text-xs sm:text-sm font-body-md text-on-surface-variant">
                Tidak ada tagihan jatuh tempo terjadwal.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcomingMonths?.map((um) => (
                <details
                  key={um.month}
                  className="group bg-background rounded-xl border-2 border-outline/50 open:border-outline p-3 open:bg-surface-bright transition-colors"
                >
                  <summary className="font-label-bold text-on-surface cursor-pointer flex justify-between items-center outline-none">
                    <span className="text-xs sm:text-sm font-extrabold">
                      {um.month}
                    </span>
                    <span className="text-error text-xs sm:text-sm font-display-lg font-extrabold tabular-nums">
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
                        <span className="shrink-0 tabular-nums">
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

      {/* Kontainer Daftar Hutang & Progress Pelunasan */}
      <div className="bg-surface comic-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline-md text-base sm:text-lg font-extrabold text-on-surface">
            Daftar Hutang & Progress Pelunasan (Filter:{" "}
            {filter === "active"
              ? "Aktif"
              : filter === "paid"
              ? "Lunas"
              : "Semua"}
            )
          </h2>

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
                  className={`min-h-11 px-4 py-2 rounded-xl text-xs sm:text-sm font-label-bold whitespace-nowrap border-2 border-outline transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold sketch-hatch"
                      : "bg-background text-on-surface hover:bg-surface-bright font-semibold"
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
      
      <section className="bg-surface-container-high border-2 border-outline rounded-2xl p-5 border-dashed text-center sketch-hatch">
        <p className="italic font-body-md text-sm sm:text-base text-on-surface-variant font-bold">
          &ldquo;Bayar hutangmu sebelum malaikat menagihnya di akhirat.&rdquo;
        </p>
      </section>

      <DebtForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditDebt(null); }}
        editData={editDebt}
      />
    </div>
  );
}
