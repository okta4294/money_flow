"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah, formatRupiahInput, formatDate } from "@/lib/utils";
import { SavingsSummaryResult } from "@/lib/firestore/savings";
import { SavingsRecommendation } from "@/lib/budget-calculator";

interface BudgetSavingsCardProps {
  year: number;
  month: number;
  savingsSummary: SavingsSummaryResult;
  savingsRecommendation?: SavingsRecommendation;
  onSaveTarget: (target: number) => Promise<void>;
  onWithdraw?: (data: { amount: number; date?: string; note?: string }) => Promise<void>;
  onDeleteWithdrawal?: (id: string) => Promise<void>;
  loading?: boolean;
}

export function BudgetSavingsCard({
  year,
  month,
  savingsSummary,
  savingsRecommendation,
  onSaveTarget,
  onWithdraw,
  onDeleteWithdrawal,
  loading = false,
}: BudgetSavingsCardProps) {
  const {
    currentTargetAmount,
    hasCustomTargetThisMonth,
    cumulativeSavings,
    grossSavings = cumulativeSavings,
    totalWithdrawn = 0,
    previousMonthTarget,
    breakdown = [],
    withdrawals = [],
  } = savingsSummary;

  const [inputVal, setInputVal] = useState(
    currentTargetAmount > 0 ? String(currentTargetAmount) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [historyTab, setHistoryTab] = useState<"targets" | "withdrawals">("targets");

  // State untuk Modal Tarik Tabungan
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDate, setWithdrawDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [withdrawNote, setWithdrawNote] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [deletingWithdrawalId, setDeletingWithdrawalId] = useState<string | null>(null);

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

  const handleApplyRecommendation = (amount: number) => {
    setInputVal(String(amount));
  };

  const handleOpenWithdraw = () => {
    setWithdrawAmount("");
    setWithdrawNote("");
    setWithdrawDate(new Date().toISOString().split("T")[0]);
    setWithdrawError(null);
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(withdrawAmount.replace(/\D/g, "") || "0", 10);
    if (num <= 0) {
      setWithdrawError("Masukkan nominal penarikan lebih dari Rp 0.");
      return;
    }
    if (num > cumulativeSavings) {
      setWithdrawError(
        `Nominal penarikan melebihi sisa tabungan (${formatRupiah(cumulativeSavings)}).`
      );
      return;
    }

    if (!onWithdraw) return;

    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await onWithdraw({
        amount: num,
        date: withdrawDate,
        note: withdrawNote.trim(),
      });
      setShowWithdrawModal(false);
      setHistoryTab("withdrawals");
      setShowBreakdown(true);
    } catch (err: any) {
      setWithdrawError(err?.message || "Gagal memproses penarikan tabungan.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDeleteWithdrawal = async (id: string) => {
    if (!onDeleteWithdrawal) return;
    const ok = window.confirm("Hapus catatan penarikan tabungan ini?");
    if (!ok) return;

    setDeletingWithdrawalId(id);
    try {
      await onDeleteWithdrawal(id);
    } catch (err) {
      console.error("Gagal menghapus penarikan:", err);
    } finally {
      setDeletingWithdrawalId(null);
    }
  };

  return (
    <div className="bg-surface-container border-3 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
      {/* 1. Header Judul & Keterangan */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-secondary-container border-2 border-outline flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--theme-outline)]">
            <span className="material-symbols-outlined text-white text-xl">savings</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-label-bold text-sm sm:text-base uppercase text-on-surface tracking-wide">
                Target Tabungan / Saving
              </h3>
              {hasCustomTargetThisMonth ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-label-bold uppercase bg-primary-container text-on-primary-container border border-outline">
                  Kustom Bulan Ini
                </span>
              ) : previousMonthTarget > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-label-bold uppercase bg-tertiary-container text-on-tertiary-container border border-outline">
                  Auto Acuan
                </span>
              ) : null}
            </div>
            <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
              Tentukan nominal tabungan {currentMonthLabel} yang ingin disisihkan.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Kartu Status Saldo & Tombol Aksi (Tata Letak Mobile-Friendly) */}
      <div className="bg-surface border-2 border-outline rounded-xl p-3.5 sm:p-4 shadow-[2px_2px_0_0_var(--theme-outline)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] sm:text-xs uppercase font-label-bold text-on-surface-variant block tracking-wider">
              Sisa Saldo Tabungan
            </span>
            <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
              <span className="text-2xl sm:text-3xl font-display-lg font-bold text-secondary dark:text-secondary-fixed">
                {formatRupiah(cumulativeSavings)}
              </span>
              {totalWithdrawn > 0 && (
                <span className="text-[10px] sm:text-xs font-label-md text-error bg-error/10 border border-error/30 px-2 py-0.5 rounded-md">
                  Ditarik: {formatRupiah(totalWithdrawn)}
                </span>
              )}
            </div>
          </div>

          {/* Tombol Aksi Seimbang: 2 Kolom di Mobile, Sejajar di Desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline/15">
            <button
              type="button"
              onClick={handleOpenWithdraw}
              disabled={loading || cumulativeSavings <= 0}
              className="h-10 sm:h-9 px-3.5 rounded-xl text-xs font-label-bold uppercase flex items-center justify-center gap-1.5 bg-surface-container hover:bg-error/15 text-error border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)] active-press-sm transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Tarik dana dari akumulasi tabungan"
            >
              <span className="material-symbols-outlined text-base">payments</span>
              <span>Tarik</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBreakdown((prev) => !prev)}
              className="h-10 sm:h-9 px-3.5 rounded-xl text-xs font-label-bold uppercase flex items-center justify-center gap-1.5 bg-surface-container hover:bg-surface-bright text-on-surface border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)] active-press-sm transition-all cursor-pointer"
              title="Lihat riwayat target dan mutasi penarikan"
            >
              <span className="material-symbols-outlined text-base">
                {showBreakdown ? "expand_less" : "history"}
              </span>
              <span>{showBreakdown ? "Tutup" : "Riwayat"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Banner Rekomendasi Tabungan Aman */}
      {savingsRecommendation && (
        <div className="bg-secondary/10 dark:bg-secondary/15 border-2 border-outline rounded-xl p-3 sm:p-3.5 space-y-2 shadow-[1px_1px_0_0_var(--theme-outline)]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-lg">
                tips_and_updates
              </span>
              <h5 className="font-label-bold text-xs uppercase text-on-surface">
                Rekomendasi Tabungan Aman
              </h5>
            </div>
            {savingsRecommendation.hasFixedIncome && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-label-bold uppercase bg-surface border border-outline text-secondary shrink-0">
                Gaji Terdeteksi
              </span>
            )}
          </div>

          <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
            {savingsRecommendation.reason}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="bg-surface border-2 border-outline rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-[1px_1px_0_0_var(--theme-outline)]">
              <div>
                <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                  Saran Bulanan
                </span>
                <span className="text-sm sm:text-base font-display-lg font-bold text-secondary dark:text-secondary-fixed">
                  {formatRupiah(savingsRecommendation.monthlyRecommended)}
                </span>
              </div>
              {savingsRecommendation.monthlyRecommended > 0 && (
                <button
                  type="button"
                  onClick={() => handleApplyRecommendation(savingsRecommendation.monthlyRecommended)}
                  className="px-2.5 py-1.5 rounded-md text-[10px] font-label-bold uppercase bg-secondary text-white hover:bg-secondary/90 border border-outline active-press-sm transition-all"
                >
                  Pakai Bulanan
                </button>
              )}
            </div>

            <div className="bg-surface border-2 border-outline rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-[1px_1px_0_0_var(--theme-outline)]">
              <div>
                <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                  Saran Mingguan
                </span>
                <span className="text-sm sm:text-base font-display-lg font-bold text-secondary dark:text-secondary-fixed">
                  {formatRupiah(savingsRecommendation.weeklyRecommended)}
                </span>
              </div>
              {savingsRecommendation.weeklyRecommended > 0 && (
                <button
                  type="button"
                  onClick={() => handleApplyRecommendation(savingsRecommendation.weeklyRecommended)}
                  className="px-2.5 py-1.5 rounded-md text-[10px] font-label-bold uppercase bg-surface-container hover:bg-surface-bright text-on-surface border border-outline active-press-sm transition-all"
                >
                  Pakai Mingguan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Form Input Target Tabungan */}
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
              className={`flex-1 sm:flex-initial h-10 px-4 py-2 rounded-xl text-xs sm:text-sm font-label-bold uppercase flex items-center justify-center gap-1.5 border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] transition-all ${
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
                className="h-10 px-3 py-2 rounded-xl text-xs font-label-bold bg-surface-container hover:bg-error-container hover:text-on-error-container border-2 border-outline text-on-surface-variant transition-colors"
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
              className="px-2.5 py-1 rounded-lg text-[10px] font-label-bold uppercase bg-surface-container hover:bg-surface-bright text-on-surface border border-outline transition-colors active-press-sm"
            >
              +{amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000}k`}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Catatan Kunci Saldo */}
      <p className="font-label-md text-[11px] text-on-surface-variant leading-relaxed">
        <strong className="text-secondary dark:text-secondary-fixed">Kunci Saldo:</strong> Sisa saldo tabungan ({formatRupiah(cumulativeSavings)}) disisihkan dari batas belanja harian agar dana tersisa di akhir bulan.
      </p>

      {/* 6. Panel Riwayat & Mutasi (Expandable) */}
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
              {/* Header Tab Riwayat */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline/20">
                <div className="flex items-center gap-1 bg-surface-container border-2 border-outline rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setHistoryTab("targets")}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-label-bold uppercase transition-all ${
                      historyTab === "targets"
                        ? "bg-secondary text-white border border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Target Bulanan ({breakdown.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTab("withdrawals")}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-label-bold uppercase transition-all ${
                      historyTab === "withdrawals"
                        ? "bg-secondary text-white border border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Riwayat Penarikan ({withdrawals.length})
                  </button>
                </div>

                <div className="text-right text-[11px] font-label-md text-on-surface-variant">
                  Saldo Tabungan Bersih:{" "}
                  <strong className="text-secondary dark:text-secondary-fixed">
                    {formatRupiah(cumulativeSavings)}
                  </strong>
                </div>
              </div>

              {/* Tab 1: Breakdown Target Bulanan */}
              {historyTab === "targets" && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {breakdown.length === 0 ? (
                    <p className="text-xs text-on-surface-variant py-4 text-center italic">
                      Belum ada target tabungan yang tercatat.
                    </p>
                  ) : (
                    breakdown.map((item) => (
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
                            Akumulasi Target
                          </span>
                          <span className="text-xs sm:text-sm font-display-lg font-bold text-secondary dark:text-secondary-fixed">
                            {formatRupiah(item.runningCumulative)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Riwayat Penarikan */}
              {historyTab === "withdrawals" && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {withdrawals.length === 0 ? (
                    <div className="py-6 text-center text-on-surface-variant space-y-1">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant/60">
                        receipt
                      </span>
                      <p className="text-xs font-body-sm">Belum ada penarikan tabungan.</p>
                      <p className="text-[11px] text-on-surface-variant/70">
                        Klik tombol &ldquo;Tarik&rdquo; di atas jika Anda ingin mengambil uang tabungan.
                      </p>
                    </div>
                  ) : (
                    withdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-outline/30 bg-surface-container"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-error/15 border border-error/30 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-error text-sm">
                              remove
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-label-bold text-xs text-on-surface">
                                {formatDate(w.date)}
                              </span>
                              {w.note && (
                                <span className="text-[11px] text-on-surface-variant">
                                  &bull; {w.note}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-on-surface-variant block">
                              Ditarik: {formatRupiah(w.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs sm:text-sm font-display-lg font-bold text-error">
                            -{formatRupiah(w.amount)}
                          </span>

                          {onDeleteWithdrawal && (
                            <button
                              type="button"
                              onClick={() => handleDeleteWithdrawal(w.id)}
                              disabled={deletingWithdrawalId === w.id}
                              className="p-1.5 rounded-lg hover:bg-error-container hover:text-on-error-container text-on-surface-variant transition-colors"
                              title="Hapus catatan penarikan ini"
                            >
                              <span className="material-symbols-outlined text-sm">
                                {deletingWithdrawalId === w.id ? "hourglass_top" : "delete"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Ringkasan Total Mutasi */}
              <div className="pt-2 border-t border-outline/20 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-surface-container p-2.5 rounded-lg border border-outline/20">
                  <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                    Total Ditargetkan:
                  </span>
                  <span className="font-display-lg font-bold text-on-surface text-sm">
                    {formatRupiah(grossSavings)}
                  </span>
                </div>

                <div className="bg-surface-container p-2.5 rounded-lg border border-outline/20">
                  <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                    Total Telah Ditarik:
                  </span>
                  <span className="font-display-lg font-bold text-error text-sm">
                    {formatRupiah(totalWithdrawn)}
                  </span>
                </div>

                <div className="bg-secondary-container/20 p-2.5 rounded-lg border border-secondary/40">
                  <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                    Sisa Tabungan Bersih:
                  </span>
                  <span className="font-display-lg font-bold text-secondary dark:text-secondary-fixed text-sm">
                    {formatRupiah(cumulativeSavings)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Modal Tarik Tabungan */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-surface-container border-4 border-outline shadow-[5px_5px_0_0_var(--theme-outline)] rounded-2xl p-4 sm:p-5 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-outline/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-error-container border border-outline flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-error-container text-base">
                      payments
                    </span>
                  </div>
                  <div>
                    <h4 className="font-label-bold text-sm sm:text-base uppercase text-on-surface">
                      Tarik Dana Tabungan
                    </h4>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">
                      Sisa tabungan tersedia: <strong>{formatRupiah(cumulativeSavings)}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-lg border border-outline flex items-center justify-center text-on-surface-variant hover:bg-surface-bright active-press-sm"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleConfirmWithdraw} className="space-y-3.5">
                {withdrawError && (
                  <div className="p-2.5 rounded-xl bg-error-container text-on-error-container border border-outline text-xs">
                    {withdrawError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-label-bold uppercase text-on-surface-variant mb-1">
                    Nominal Penarikan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display-lg font-bold text-sm text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatRupiahInput(withdrawAmount)}
                      onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      autoFocus
                      required
                      className="w-full bg-surface border-2 border-outline rounded-xl pl-10 pr-3 py-2 text-sm sm:text-base font-display-lg font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-label-bold uppercase text-on-surface-variant mb-1">
                    Tanggal Penarikan
                  </label>
                  <input
                    type="date"
                    value={withdrawDate}
                    onChange={(e) => setWithdrawDate(e.target.value)}
                    required
                    className="w-full bg-surface border-2 border-outline rounded-xl px-3 py-2 text-xs sm:text-sm font-label-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-label-bold uppercase text-on-surface-variant mb-1">
                    Catatan / Keperluan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    placeholder="Contoh: Kebutuhan mendadak, servis kendaraan"
                    maxLength={80}
                    className="w-full bg-surface border-2 border-outline rounded-xl px-3 py-2 text-xs sm:text-sm font-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline/20">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    disabled={isWithdrawing}
                    className="h-10 px-4 py-2 rounded-xl text-xs font-label-bold uppercase bg-surface-container hover:bg-surface-bright text-on-surface border-2 border-outline transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isWithdrawing}
                    className="h-10 px-4 py-2 rounded-xl text-xs font-label-bold uppercase bg-error text-white hover:bg-error/90 border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] active-press flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isWithdrawing ? "hourglass_top" : "check"}
                    </span>
                    <span>{isWithdrawing ? "Memproses..." : "Konfirmasi Tarik"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
