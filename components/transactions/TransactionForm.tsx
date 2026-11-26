"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/hooks/useCategories";
import { useDebts } from "@/hooks/useDebts";
import { useGlobalData } from "@/lib/data-context";
import { addTransaction, updateTransaction, Transaction, TransactionInput } from "@/lib/firestore/transactions";
import { payDebt } from "@/lib/firestore/debts";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah, formatRupiahInput, getLocalDateString, normalizeCategoryIcon } from "@/lib/utils";
import { triggerSakugaPop, showSakugaToast } from "@/lib/sakuga";
import { SakugaInput } from "@/components/ui/SakugaInput";

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  editData?: Transaction | null;
}

import { isDebtCategoryName } from "@/lib/firestore/categories";

const getAccountIcon = (type: string) => {
  switch (type) {
    case "bank": return "account_balance";
    case "ewallet": return "account_balance_wallet";
    case "cash": return "payments";
    default: return "help";
  }
};

export function TransactionForm({ open, onClose, editData }: TransactionFormProps) {
  const { user } = useAuth();
  const { incomeCategories, expenseCategories } = useCategories();
  const { debts, activeDebts } = useDebts();
  const { accounts, accountBalances } = useGlobalData();

  const selectableDebts =
    editData?.debtId && !activeDebts.some((d) => d.id === editData.debtId)
      ? [
          ...debts.filter((d) => d.id === editData.debtId),
          ...activeDebts,
        ]
      : activeDebts;

  const today = getLocalDateString();

  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedDebtId, setSelectedDebtId] = useState("");
  const [debtPaymentAmount, setDebtPaymentAmount] = useState("");

  const categories = type === "income" ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setAmount(editData.amount.toString());
      setCategoryId(editData.categoryId);
      setAccountId(editData.accountId || "");
      setDestinationAccountId(editData.destinationAccountId || "");
      setNote(editData.note || "");
      setDate(editData.date);
      setSelectedDebtId(editData.debtId || "");
      setDebtPaymentAmount(editData.debtPaymentAmount?.toString() || "");
    } else {
      setType("expense");
      setAmount("");
      setCategoryId("");
      setAccountId("");
      setDestinationAccountId("");
      setNote("");
      setDate(today);
      setSelectedDebtId("");
      setDebtPaymentAmount("");
    }
  }, [editData, open]);

  useEffect(() => {
    if (!editData) {
      setCategoryId("");
      setSelectedDebtId("");
      setDebtPaymentAmount("");
      setDestinationAccountId("");
    }
  }, [type]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const showDebtDropdown = type === "expense" && selectedCategory && isDebtCategoryName(selectedCategory.name);

  useEffect(() => {
    if (!showDebtDropdown) {
      setSelectedDebtId("");
      setDebtPaymentAmount("");
    }
  }, [showDebtDropdown]);

  useEffect(() => {
    if (showDebtDropdown && amount) {
      setDebtPaymentAmount(amount.replace(/\D/g, ""));
    }
  }, [amount, showDebtDropdown]);

  const numericAmount = parseInt(amount.replace(/\D/g, "") || "0");
  const numericDebtPayment = parseInt(debtPaymentAmount.replace(/\D/g, "") || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (numericAmount <= 0) { setError("Masukkan jumlah yang valid"); return; }

    if (type === "transfer") {
      if (!accountId) { setError("Pilih akun sumber"); return; }
      if (!destinationAccountId) { setError("Pilih akun tujuan"); return; }
      if (accountId === destinationAccountId) { setError("Akun sumber dan tujuan tidak boleh sama"); return; }
    } else {
      if (!categoryId) { setError("Pilih kategori"); return; }
      if (showDebtDropdown && selectedDebtId && numericDebtPayment <= 0) {
        setError("Masukkan nominal pembayaran hutang");
        return;
      }
    }

    setError("");
    setLoading(true);
    try {
      const selectedAccount = accounts.find((a) => a.id === accountId);
      const selectedDestAccount = accounts.find((a) => a.id === destinationAccountId);

      const data: TransactionInput = {
        amount: numericAmount,
        type,
        category: type === "transfer" ? "Transfer" : (selectedCategory?.name || ""),
        categoryId: type === "transfer" ? "" : categoryId,
        note,
        date,
        ...(accountId ? { accountId, accountName: selectedAccount?.name } : {}),
        ...(type === "transfer" && destinationAccountId
          ? { destinationAccountId, destinationAccountName: selectedDestAccount?.name }
          : {}),
        ...(type !== "transfer" && showDebtDropdown && selectedDebtId
          ? { debtId: selectedDebtId, debtPaymentAmount: numericDebtPayment }
          : {}),
      };

      if (editData) {
        await updateTransaction(user.uid, editData.id, data);
        showSakugaToast("Transaksi diperbarui!");
      } else {
        await addTransaction(user.uid, data);
        if (type !== "transfer" && showDebtDropdown && selectedDebtId && numericDebtPayment > 0) {
          await payDebt(user.uid, selectedDebtId, numericDebtPayment);
        }
        showSakugaToast("Transaksi tersimpan!");
      }
      onClose();
    } catch {
      setError("Gagal menyimpan transaksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
    {open && (
      <div role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative bg-surface comic-modal p-6 w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto z-10"
        >
        <div className="flex items-center justify-between mb-5 border-b-[3px] border-outline pb-3.5">
          <h2 id="transaction-modal-title" className="font-display-lg font-extrabold text-xl sm:text-2xl text-on-surface tracking-tight">
            {editData ? "Edit Transaksi" : "Input Transaksi Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-error-container text-on-error-container border-2 border-outline rounded-xl w-11 h-11 flex items-center justify-center active-press-sm cursor-pointer shadow-[2px_2px_0_0_var(--theme-outline)]"
            aria-label="Tutup modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`min-h-11 py-2 rounded-xl font-label-bold font-bold text-xs border-2 border-outline transition-all active-press-sm cursor-pointer ${
              type === "expense"
                ? "bg-error-container text-on-error-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold sketch-hatch"
                : "bg-surface text-on-surface hover:bg-surface-bright"
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`min-h-11 py-2 rounded-xl font-label-bold font-bold text-xs border-2 border-outline transition-all active-press-sm cursor-pointer ${
              type === "income"
                ? "bg-tertiary-container text-on-tertiary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold sketch-hatch"
                : "bg-surface text-on-surface hover:bg-surface-bright"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`min-h-11 py-2 rounded-xl font-label-bold font-bold text-xs border-2 border-outline transition-all active-press-sm cursor-pointer ${
              type === "transfer"
                ? "bg-secondary-container text-on-secondary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold sketch-hatch"
                : "bg-surface text-on-surface hover:bg-surface-bright"
            }`}
          >
            Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-background border-2 border-outline rounded-xl p-3.5 shadow-[2px_2px_0_0_var(--theme-outline)]">
            <label
              htmlFor="transaction-amount"
              className="font-label-bold font-bold text-on-surface-variant uppercase tracking-wider text-xs block mb-1"
            >
              Nominal Transaksi (Rupiah)
            </label>
            <div className="relative flex items-center">
              <span className="font-display-lg font-extrabold text-on-surface text-xl sm:text-2xl mr-2 shrink-0">
                Rp
              </span>
              <SakugaInput
                id="transaction-amount"
                name="amount"
                label="Nominal Transaksi (Rupiah)"
                inputMode="numeric"
                autoFocus={!editData}
                value={formatRupiahInput(amount)}
                onValueChange={setAmount}
                placeholder="0"
                className="sakuga-field--hero-amount"
              />
            </div>
          </div>

          {type !== "transfer" && (
            <div>
              <label className="font-label-bold text-on-surface uppercase tracking-wider text-xs block mb-2">
                Pilih Kategori Pos {type === "expense" ? "Pengeluaran" : "Pemasukan"}
              </label>
              {categories.length === 0 ? (
                <div className="border-2 border-dashed border-outline rounded-2xl p-4 text-center bg-background">
                  <p className="text-on-surface-variant text-xs font-label-md">
                    Belum ada kategori
                  </p>
                  <Link
                    href="/categories"
                    onClick={onClose}
                    className="text-on-primary-container font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-primary-container px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Kategori
                  </Link>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto p-2 border-2 border-outline rounded-2xl bg-background">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-outline font-label-bold text-[11px] uppercase transition-all active-press-sm cursor-pointer ${
                          categoryId === cat.id
                            ? "bg-secondary-container text-on-secondary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                            : "bg-surface text-on-surface hover:bg-surface-bright"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base shrink-0">
                          {normalizeCategoryIcon(cat.icon)}
                        </span>
                        <span className="truncate flex-1 text-left">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "transfer" ? (
            <div className="bg-background border-2 border-outline rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b-2 border-outline/20 pb-2">
                <span className="material-symbols-outlined text-secondary text-lg">
                  swap_horiz
                </span>
                <span className="text-on-surface font-label-bold text-xs uppercase tracking-wider">
                  Transfer Antar Akun
                </span>
              </div>
              {accounts.length < 2 ? (
                <div className="text-center py-2">
                  <p className="text-on-surface-variant text-xs font-label-md">
                    Butuh minimal 2 akun dompet/rekening
                  </p>
                  <Link
                    href="/accounts"
                    onClick={onClose}
                    className="text-on-primary-container font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-primary-container px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Akun
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-label-bold text-on-surface uppercase tracking-wider text-xs block mb-1.5">
                      Dari Akun Sumber <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setAccountId(acc.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-outline font-label-bold text-[11px] uppercase transition-all active-press-sm cursor-pointer ${
                            accountId === acc.id
                              ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                              : destinationAccountId === acc.id
                              ? "bg-surface opacity-40 cursor-not-allowed"
                              : "bg-surface text-on-surface hover:bg-surface-bright"
                          }`}
                          disabled={destinationAccountId === acc.id}
                        >
                          <span className="material-symbols-outlined text-base">
                            {getAccountIcon(acc.type)}
                          </span>
                          <span className="truncate flex-1 text-left">
                            {acc.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-xl">
                      arrow_downward
                    </span>
                  </div>
                  <div>
                    <label className="font-label-bold text-on-surface uppercase tracking-wider text-xs block mb-1.5">
                      Ke Akun Tujuan <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setDestinationAccountId(acc.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-outline font-label-bold text-[11px] uppercase transition-all active-press-sm cursor-pointer ${
                            destinationAccountId === acc.id
                              ? "bg-secondary-container text-on-secondary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                              : accountId === acc.id
                              ? "bg-surface opacity-40 cursor-not-allowed"
                              : "bg-surface text-on-surface hover:bg-surface-bright"
                          }`}
                          disabled={accountId === acc.id}
                        >
                          <span className="material-symbols-outlined text-base">
                            {getAccountIcon(acc.type)}
                          </span>
                          <span className="truncate flex-1 text-left">
                            {acc.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <label className="font-label-bold text-on-surface uppercase tracking-wider text-xs block mb-2">
                Pilih Sumber Rekening / Dompet (Opsional)
              </label>
              {accounts.length === 0 ? (
                <div className="border-2 border-dashed border-outline rounded-2xl p-4 text-center bg-background">
                  <p className="text-on-surface-variant text-xs font-label-md">
                    Belum ada akun/rekening
                  </p>
                  <Link
                    href="/accounts"
                    onClick={onClose}
                    className="text-on-primary-container font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-primary-container px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Akun
                  </Link>
                </div>
              ) : (
                <div className="max-h-32 overflow-y-auto p-2 border-2 border-outline rounded-2xl bg-background">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountId("")}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-outline font-label-bold text-[11px] uppercase transition-all active-press-sm cursor-pointer ${
                        accountId === ""
                          ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                          : "bg-surface text-on-surface hover:bg-surface-bright"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        money_off
                      </span>
                      <span className="truncate flex-1 text-left">
                        Tanpa Akun
                      </span>
                    </button>

                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={`flex items-center gap-1.5 p-2.5 rounded-xl border-2 border-outline font-label-bold text-[11px] uppercase transition-all active-press-sm cursor-pointer ${
                          accountId === acc.id
                            ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                            : "bg-surface text-on-surface hover:bg-surface-bright"
                        }`}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base shrink-0">
                          {getAccountIcon(acc.type)}
                        </span>
                        <div className="min-w-0 flex-1 text-left">
                          <span className="truncate block text-xs">{acc.name}</span>
                          <span className="text-xs font-medium opacity-80 normal-case tabular-nums truncate block">
                            {formatRupiah(accountBalances[acc.id] ?? 0)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showDebtDropdown && (
            <div className="bg-tertiary-container border-2 border-outline rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-outline/30 pb-2">
                <span className="material-symbols-outlined text-on-tertiary-container text-lg">
                  credit_card
                </span>
                <span className="text-on-tertiary-container font-label-bold text-xs uppercase tracking-wider">
                  Pembayaran Hutang / Paylater
                </span>
              </div>

              {selectableDebts.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-on-tertiary-container text-xs font-label-md">
                    Belum ada hutang aktif
                  </p>
                  <Link
                    href="/debts"
                    onClick={onClose}
                    className="text-on-surface font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-surface px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Hutang
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="debt-selector" className="font-label-bold font-bold text-on-tertiary-container uppercase tracking-wider text-xs block mb-1.5">
                      Hutang yang dibayar (opsional)
                    </label>
                    <select
                      id="debt-selector"
                      value={selectedDebtId}
                      onChange={(e) => setSelectedDebtId(e.target.value)}
                      className="w-full min-h-11 bg-surface border-2 border-outline rounded-xl px-3.5 py-2.5 text-on-surface font-label-bold font-bold text-base sm:text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Pilih Hutang --</option>
                      {selectableDebts.map((debt) => (
                        <option key={debt.id} value={debt.id}>
                          {debt.name} ({debt.remainingAmount <= 0 ? "Lunas" : `Sisa ${formatRupiah(debt.remainingAmount)}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDebtId && (
                    <div>
                      <label htmlFor="debt-payment-amount" className="font-label-bold font-bold text-on-tertiary-container uppercase tracking-wider text-xs block mb-1.5">
                        Nominal Dibayarkan
                      </label>
                      <div className="relative">
                        <span aria-hidden="true" className="pointer-events-none z-10 absolute left-3.5 top-1/2 -translate-y-1/2 font-display-lg font-extrabold text-on-surface text-base">
                          Rp
                        </span>
                        <SakugaInput
                          id="debt-payment-amount"
                          name="debtPaymentAmount"
                          label="Nominal Dibayarkan"
                          inputMode="numeric"
                          value={formatRupiahInput(debtPaymentAmount)}
                          onValueChange={setDebtPaymentAmount}
                          placeholder="0"
                          className="sakuga-field--surface sakuga-field--pl-rp"
                        />
                      </div>
                      <p className="text-on-tertiary-container font-label-bold font-semibold text-xs mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          check_circle
                        </span>
                        <span>Sisa hutang akan berkurang otomatis</span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="transaction-date"
                className="font-label-bold font-bold text-on-surface uppercase tracking-wider text-xs block mb-1.5"
              >
                Tanggal
              </label>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-11 bg-background border-2 border-outline rounded-xl px-3.5 py-2.5 text-on-surface font-label-bold font-semibold text-base sm:text-sm focus:outline-none cursor-pointer"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-note"
                className="font-label-bold font-bold text-on-surface uppercase tracking-wider text-xs block mb-1.5"
              >
                Catatan (Opsional)
              </label>
              <SakugaInput
                id="transaction-note"
                name="note"
                label="Catatan (Opsional)"
                value={note}
                onValueChange={setNote}
                placeholder="Contoh: Nasi Padang Siang..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container border-2 border-outline rounded-xl px-3.5 py-2.5 font-label-bold font-bold text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                warning
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t-[3px] border-outline">
            <sakuga-button
              variant="secondary"
              onClick={onClose}
              className="flex-1 sakuga-cancel-btn"
            >
              Batal
            </sakuga-button>
            <button
              id="save-transaction"
              type="submit"
              disabled={loading}
              onClick={(e) => triggerSakugaPop(e.currentTarget, "impact")}
              className="flex-[1.6] min-h-11 py-3 rounded-xl font-label-bold font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-tertiary-container text-on-tertiary-container border-2 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] active-press-sm disabled:opacity-50 cursor-pointer sketch-hatch"
            >
              {loading
                ? "Menyimpan..."
                : editData
                ? "Perbarui Transaksi"
                : "Simpan"}
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
}
