"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah, formatRupiahInput } from "@/lib/utils";
import { SavingsSummaryResult } from "@/lib/firestore/savings";

interface BudgetSavingsCardProps {
  year: number;
  month: number;
  savingsSummary: SavingsSummaryResult;
  onSaveTarget: (target: number) => Promise<void>;
  loading?: boolean;
}

export function BudgetSavingsCard({
  year,
  month,
  savingsSummary,
  onSaveTarget,
  loading = false,
}: BudgetSavingsCardProps) {
  const {
    currentTargetAmount,
    hasCustomTargetThisMonth,
    cumulativeSavings,
    previousMonthTarget,
    breakdown = [],
  } = savingsSummary;

  const [inputVal, setInputVal] = useState(
    currentTargetAmount > 0 ? String(currentTargetAmount) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    setInputVal(currentTargetAmount > 0 ? String(currentTargetAmount) : "");
  }, [currentTargetAmount, year, month]);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const currentMonthLabel = `${monthNames[month - 1]} ${year}`;

  const handleSave = async (amountToSave?: number) => {
    const rawNum =
      typeof amountToSave === "number"
        ? amountToSave
        : parseInt(inputVal.replace(/\D/g, "") || "0", 10);

    setIsSaving(true);
    try {
      await onSaveTarget(rawNum);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPreset = (addon: number) => {
    const cur = parseInt(inputVal.replace(/\D/g, "") || "0", 10);
    const updated = cur + addon;
    setInputVal(String(updated));
  };

  const handleReset = () => {
    setInputVal("0");
    handleSave(0);
  };

  return (
    <div className="bg-surface-container border-3 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-secondary-container border-2 border-outline flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-xl">savings</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-label-bold text-sm sm:text-base uppercase text-on-surface">
                Target Tabungan / Saving
              </h4>
              {hasCustomTargetThisMonth ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-label-bold uppercase bg-primary-container text-on-primary-container border border-outline">
                  Kustom Bulan Ini
                </span>
              ) : previousMonthTarget > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-label-bold uppercase bg-tertiary-container text-on-tertiary-container border border-outline">
                  Auto Acuan Bulan Lalu
                </span>
              ) : null}
            </div>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Tentukan nominal tabungan {currentMonthLabel} yang ingin disisihkan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowBreakdown((prev) => !prev)}
          className="bg-surface border-2 border-outline rounded-xl px-3 py-2 text-right shadow-[1px_1px_0_0_var(--theme-outline)] hover:shadow-[3px_3px_0_0_var(--theme-outline)] transition-all shrink-0 group active-press-sm cursor-pointer"
          title="Klik untuk melihat rincian akumulasi bulanan"
        >
          <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
            Akumulasi Total Tabungan
          </span>
          <span className="text-base sm:text-lg font-display-lg font-bold text-secondary dark:text-secondary-fixed block">
            {formatRupiah(cumulativeSavings)}
          </span>
          <span className="text-[10px] text-secondary font-label-bold flex items-center justify-end gap-0.5 mt-0.5">
            <span>{showBreakdown ? "Tutup Riwayat" : "Lihat Riwayat"}</span>
            <span className="material-symbols-outlined text-[12px]">
              {showBreakdown ? "expand_less" : "expand_more"}
            </span>
          </span>
        </button>
      </div>

      <div className="bg-surface border-2 border-outline rounded-xl p-3 sm:p-3.5 space-y-3 shadow-[1px_1px_0_0_var(--theme-outline)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display-lg font-bold text-sm text-on-surface-variant">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatRupiahInput(inputVal)}
              onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              disabled={loading || isSaving}
              className="w-full bg-surface-container border-2 border-outline rounded-xl pl-10 pr-3 py-2 text-sm sm:text-base font-display-lg font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => handleSave()}
              disabled={loading || isSaving}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-label-bold uppercase flex items-center justify-center gap-1.5 border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] transition-all ${
                savedSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-secondary text-on-secondary hover:bg-secondary/90 active-press"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {savedSuccess ? "check_circle" : isSaving ? "hourglass_top" : "save"}
              </span>
              <span>{savedSuccess ? "Tersimpan!" : isSaving ? "Menyimpan..." : "Simpan Target"}</span>
            </motion.button>

            {parseInt(inputVal || "0", 10) > 0 && (
              <button
                type="button"
                onClick={handleReset}
                title="Reset target bulan ini jadi Rp 0"
                className="px-2.5 py-2 rounded-xl text-xs font-label-bold bg-surface-container hover:bg-error-container hover:text-on-error-container border-2 border-outline text-on-surface-variant transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-outline/20">
          <span className="text-[10px] font-label-bold uppercase text-on-surface-variant mr-1">
            Tambah Cepat:
          </span>
          {[100000, 250000, 500000, 1000000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleAddPreset(amt)}
              className="px-2 py-0.5 rounded-lg text-[10px] font-label-bold uppercase bg-surface-container hover:bg-surface-bright text-on-surface border border-outline transition-colors active-press-sm"
            >
              +{amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000}k`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="font-label-md text-[11px] text-on-surface-variant leading-relaxed flex-1">
          <strong className="text-secondary dark:text-secondary-fixed">Kunci Saldo:</strong> Akumulasi tabungan ({formatRupiah(cumulativeSavings)}) disisihkan dari batas belanja harian agar dana tersisa di akhir bulan.
        </p>
        <button
          type="button"
          onClick={() => setShowBreakdown((prev) => !prev)}
          className="text-[11px] font-label-bold text-secondary dark:text-secondary-fixed hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center"
        >
          <span className="material-symbols-outlined text-sm">
            {showBreakdown ? "visibility_off" : "receipt_long"}
          </span>
          <span>{showBreakdown ? "Tutup Rincian" : "Lihat Rincian Akumulasi"}</span>
        </button>
      </div>

      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-surface border-2 border-outline rounded-xl p-3 sm:p-4 space-y-3 shadow-[1px_1px_0_0_var(--theme-outline)]">
              <div className="flex items-center justify-between pb-2 border-b border-outline/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">
                    savings
                  </span>
                  <h5 className="font-label-bold text-xs uppercase text-on-surface">
                    Rincian Akumulasi Tiap Bulan
                  </h5>
                </div>
                <span className="text-[11px] font-label-md text-on-surface-variant">
                  {breakdown.length} Bulan Tercatat
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {breakdown.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      item.isCurrentMonth
                        ? "bg-secondary-container/15 border-secondary shadow-[1px_1px_0_0_var(--theme-outline)]"
                        : "bg-surface-container border-outline/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 ${
                          item.isCurrentMonth
                            ? "bg-secondary text-white border-outline"
                            : "bg-surface text-on-surface border-outline/40"
                        }`}
                      >
                        {item.month}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-label-bold text-xs text-on-surface">
                            {item.monthLabel}
                          </span>
                          {item.isCurrentMonth && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-secondary text-white">
                              Bulan Ini
                            </span>
                          )}
                          {!item.isCustom && item.isCurrentMonth && (
                            <span className="text-[9px] text-on-surface-variant italic">
                              (Acuan Otomatis)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant block">
                          Target: {formatRupiah(item.targetAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] uppercase font-label-bold text-on-surface-variant block">
                        Akumulasi
                      </span>
                      <span className="text-xs sm:text-sm font-display-lg font-bold text-secondary dark:text-secondary-fixed">
                        {formatRupiah(item.runningCumulative)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-outline/20 flex justify-between items-center text-xs">
                <span className="font-label-bold uppercase text-on-surface-variant">
                  Total Akumulasi:
                </span>
                <span className="font-display-lg font-bold text-secondary dark:text-secondary-fixed text-sm">
                  {formatRupiah(cumulativeSavings)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
