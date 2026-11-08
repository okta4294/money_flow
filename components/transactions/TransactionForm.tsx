"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/hooks/useCategories";
import { useDebts } from "@/hooks/useDebts";
import { useAccounts } from "@/hooks/useAccounts";
import { addTransaction, updateTransaction, Transaction, TransactionInput } from "@/lib/firestore/transactions";
import { payDebt } from "@/lib/firestore/debts";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah, formatRupiahInput } from "@/lib/utils";

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
  const { activeDebts } = useDebts();
  const { accounts } = useAccounts();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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
      } else {
        await addTransaction(user.uid, data);
        if (type !== "transfer" && showDebtDropdown && selectedDebtId && numericDebtPayment > 0) {
          await payDebt(user.uid, selectedDebtId, numericDebtPayment);
        }
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
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative bg-surface rounded-3xl border-4 border-outline p-6 shadow-[8px_8px_0_0_var(--theme-outline)] w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto z-10"
        >
        <div className="flex items-center justify-between mb-5 border-b-[3px] border-outline pb-3.5">
          <h2 className="font-display-lg text-xl sm:text-2xl text-on-surface uppercase tracking-normal">
            {editData ? "Edit Transaksi" : "Input Transaksi Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-error-container text-on-error-container border-2 border-outline rounded-xl w-9 h-9 flex items-center justify-center active-press-sm cursor-pointer shadow-[2px_2px_0_0_var(--theme-outline)]"
            aria-label="Tutup modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`py-2.5 rounded-xl font-label-bold uppercase text-xs border-2 border-outline transition-all active-press-sm cursor-pointer ${
              type === "expense"
                ? "bg-error-container text-on-error-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                : "bg-surface text-on-surface hover:bg-surface-bright"
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`py-2.5 rounded-xl font-label-bold uppercase text-xs border-2 border-outline transition-all active-press-sm cursor-pointer ${
              type === "income"
                ? "bg-tertiary-container text-on-tertiary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                : "bg-surface text-on-surface hover:bg-surface-bright"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`py-2.5 rounded-xl font-label-bold uppercase text-xs border-2 border-outline transition-all active-press-sm cursor-pointer ${
              type === "transfer"
                ? "bg-secondary-container text-on-secondary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                : "bg-surface text-on-surface hover:bg-surface-bright"
            }`}
          >
            Transfer Akun
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-background border-[3px] border-outline rounded-2xl p-3.5 shadow-[2px_2px_0_0_var(--theme-outline)]">
            <label
              htmlFor="transaction-amount"
              className="font-label-bold text-on-surface-variant uppercase tracking-wider text-[11px] block mb-1"
            >
              Nominal Transaksi (Rupiah)
            </label>
            <div className="relative flex items-center">
              <span className="font-display-lg text-on-surface text-xl sm:text-2xl mr-2">
                Rp
              </span>
              <input
                id="transaction-amount"
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(amount)}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-on-surface text-2xl sm:text-3xl font-display-lg font-black focus:outline-none"
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
                  <a
                    href="/categories"
                    className="text-on-primary-container font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-primary-container px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Kategori
                  </a>
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
                        {cat.icon && cat.icon.includes("fa-") ? (
                          <i className={`${cat.icon} text-base shrink-0`}></i>
                        ) : (
                          <span className="material-symbols-outlined text-base shrink-0">
                            {cat.icon || "category"}
                          </span>
                        )}
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
                  <a
                    href="/accounts"
                    className="text-on-primary-container font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-primary-container px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Akun
                  </a>
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
                  <a
                    href="/accounts"
                    className="text-on-primary-container font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-primary-container px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Akun
                  </a>
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

              {activeDebts.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-on-tertiary-container text-xs font-label-md">
                    Belum ada hutang aktif
                  </p>
                  <a
                    href="/debts"
                    className="text-on-surface font-label-bold uppercase text-xs mt-2 inline-block border-2 border-outline rounded-xl bg-surface px-3 py-1.5 active-press-sm"
                  >
                    + Tambah Hutang
                  </a>
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-label-bold text-on-tertiary-container uppercase tracking-wider text-xs block mb-1.5">
                      Hutang yang dibayar (opsional)
                    </label>
                    <select
                      id="debt-selector"
                      value={selectedDebtId}
                      onChange={(e) => setSelectedDebtId(e.target.value)}
                      className="w-full bg-surface border-2 border-outline rounded-xl px-3.5 py-2.5 text-on-surface font-label-bold uppercase text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">-- PILIH HUTANG --</option>
                      {activeDebts.map((debt) => (
                        <option key={debt.id} value={debt.id}>
                          {debt.name} (SISA {formatRupiah(debt.remainingAmount)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDebtId && (
                    <div>
                      <label className="font-label-bold text-on-tertiary-container uppercase tracking-wider text-xs block mb-1.5">
                        Nominal Dibayarkan
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display-lg text-on-surface text-base">
                          Rp
                        </span>
                        <input
                          id="debt-payment-amount"
                          type="text"
                          inputMode="numeric"
                          value={formatRupiahInput(debtPaymentAmount)}
                          onChange={(e) => setDebtPaymentAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-surface border-2 border-outline rounded-xl pl-10 pr-4 py-2.5 text-on-surface text-base font-display-lg focus:outline-none"
                        />
                      </div>
                      <p className="text-on-tertiary-container font-label-bold text-[10px] uppercase mt-1.5 flex items-center gap-1">
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
                className="font-label-bold text-on-surface uppercase tracking-wider text-xs block mb-1.5"
              >
                Tanggal
              </label>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border-2 border-outline rounded-xl px-3.5 py-2.5 text-on-surface font-label-bold uppercase text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-note"
                className="font-label-bold text-on-surface uppercase tracking-wider text-xs block mb-1.5"
              >
                Catatan (Opsional)
              </label>
              <input
                id="transaction-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Nasi Padang Siang..."
                className="w-full bg-background border-2 border-outline rounded-xl px-3.5 py-2.5 text-on-surface font-body-md text-xs sm:text-sm focus:outline-none placeholder:text-on-surface-variant"
              />
            </div>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container border-2 border-outline rounded-xl px-3.5 py-2.5 font-label-bold uppercase text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                warning
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t-[3px] border-outline">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-surface hover:bg-surface-bright text-on-surface font-label-bold text-xs uppercase tracking-wider border-2 border-outline active-press-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              id="save-transaction"
              type="submit"
              disabled={loading}
              className="flex-[1.6] py-3 rounded-2xl font-label-bold text-xs uppercase tracking-wider bg-tertiary-container text-on-tertiary-container border-[3px] border-outline shadow-[3px_3px_0_0_var(--theme-outline)] active-press-sm disabled:opacity-50 cursor-pointer"
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
