"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/hooks/useCategories";
import { useDebts } from "@/hooks/useDebts";
import { useAccounts } from "@/hooks/useAccounts";
import { addTransaction, updateTransaction, Transaction, TransactionInput } from "@/lib/firestore/transactions";
import { payDebt } from "@/lib/firestore/debts";

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  editData?: Transaction | null;
}

function formatRupiah(value: string) {
  const num = value.replace(/\D/g, "");
  return num ? parseInt(num).toLocaleString("id-ID") : "";
}

function formatRupiahNum(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Cek apakah nama kategori mengandung kata 'hutang' atau 'paylater' */
function isDebtCategory(categoryName: string): boolean {
  const lower = categoryName.toLowerCase();
  return lower.includes("hutang") || lower.includes("paylater") || lower.includes("pay later");
}

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

  // Debt payment state
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

  // Reset category & debt fields when type changes
  useEffect(() => {
    if (!editData) {
      setCategoryId("");
      setSelectedDebtId("");
      setDebtPaymentAmount("");
      setDestinationAccountId("");
    }
  }, [type]);

  // Reset debt fields when category changes away from debt category
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const showDebtDropdown = type === "expense" && selectedCategory && isDebtCategory(selectedCategory.name);

  useEffect(() => {
    if (!showDebtDropdown) {
      setSelectedDebtId("");
      setDebtPaymentAmount("");
    }
  }, [showDebtDropdown]);

  // Sinkronkan nominal pembayaran hutang dengan jumlah pengeluaran secara otomatis
  useEffect(() => {
    if (showDebtDropdown && amount) {
      setDebtPaymentAmount(amount.replace(/\D/g, ""));
    }
  }, [amount, showDebtDropdown]);

  if (!open) return null;

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
        // ponytail: transfer tidak pakai category/categoryId, kosongkan saja
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface neo-brutalist-border p-6 neo-brutalist-shadow w-full sm:max-w-md max-h-[90vh] overflow-y-auto z-10 animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b-4 border-black dark:border-white pb-4">
          <h2 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter">
            {editData ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <button onClick={onClose} className="bg-error text-on-error neo-brutalist-border p-1 w-8 h-8 flex items-center justify-center active-press">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-2 font-label-bold uppercase text-sm border-2 border-black dark:border-white transition-all duration-200 active-press ${
              type === "expense"
                ? "bg-tertiary text-on-tertiary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                : "bg-surface text-on-surface"
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-2 font-label-bold uppercase text-sm border-2 border-black dark:border-white transition-all duration-200 active-press ${
              type === "income"
                ? "bg-primary text-on-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                : "bg-surface text-on-surface"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`flex-1 py-2 font-label-bold uppercase text-sm border-2 border-black dark:border-white transition-all duration-200 active-press ${
              type === "transfer"
                ? "bg-secondary text-on-secondary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                : "bg-surface text-on-surface"
            }`}
          >
            Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="font-label-bold text-on-surface uppercase tracking-widest text-xs block mb-2">Jumlah</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display-lg text-on-surface text-xl">Rp</span>
              <input
                id="transaction-amount"
                type="text"
                inputMode="numeric"
                value={formatRupiah(amount)}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-surface-container neo-brutalist-border pl-12 pr-4 py-3 text-on-surface text-xl font-display-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-primary-container focus:text-on-primary-container transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          {type !== "transfer" && (
          <div>
            <label className="font-label-bold text-on-surface uppercase tracking-widest text-xs block mb-2">Kategori</label>
            {categories.length === 0 ? (
              <div className="neo-brutalist-border border-dashed p-4 text-center bg-surface-container">
                <p className="text-on-surface-variant font-label-md">Belum ada kategori</p>
                <a href="/categories" className="text-primary font-label-bold uppercase text-xs mt-2 inline-block neo-brutalist-border bg-surface px-2 py-1 active-press">
                  + Tambah Kategori
                </a>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto p-2 neo-brutalist-border bg-surface-container">
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-2 p-2 border-2 border-black dark:border-white font-label-bold text-[10px] uppercase transition-transform active-press ${
                        categoryId === cat.id
                          ? "bg-primary text-on-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                          : "bg-surface text-on-surface hover:bg-surface-variant"
                      }`}
                    >
                      <i className={`${cat.icon && cat.icon.includes("fa-") ? cat.icon : "fa-solid fa-circle"} text-lg`}></i>
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Transfer UI */}
          {type === "transfer" ? (
            <div className="bg-secondary-container border-4 border-black dark:border-white p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-black dark:border-white pb-2">
                <i className="fa-solid fa-right-left text-on-secondary-container"></i>
                <span className="text-on-secondary-container font-label-bold uppercase tracking-widest">Transfer Antar Akun</span>
              </div>
              {accounts.length < 2 ? (
                <div className="text-center py-2">
                  <p className="text-on-secondary-container font-label-md">Butuh minimal 2 akun</p>
                  <a href="/accounts" className="text-secondary font-label-bold uppercase text-xs mt-2 inline-block neo-brutalist-border bg-surface px-2 py-1 active-press">+ Tambah Akun</a>
                </div>
              ) : (
                <>
                  {/* Sumber */}
                  <div>
                    <label className="font-label-bold text-on-secondary-container uppercase tracking-widest text-xs block mb-2">Dari Akun <span className="text-error">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setAccountId(acc.id)}
                          className={`flex items-center gap-2 p-2 border-2 border-black dark:border-white font-label-bold text-[10px] uppercase transition-transform active-press ${
                            accountId === acc.id
                              ? "bg-secondary text-on-secondary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                              : destinationAccountId === acc.id
                              ? "bg-surface opacity-50 cursor-not-allowed"
                              : "bg-surface text-on-surface hover:bg-surface-variant"
                          }`}
                          disabled={destinationAccountId === acc.id}
                        >
                          <span className="w-3 h-3 border border-black dark:border-white" style={{ backgroundColor: acc.color }} />
                          <span className="truncate flex-1 text-left">{acc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <i className="fa-solid fa-arrow-down text-on-secondary-container text-xl"></i>
                  </div>
                  {/* Tujuan */}
                  <div>
                    <label className="font-label-bold text-on-secondary-container uppercase tracking-widest text-xs block mb-2">Ke Akun <span className="text-error">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setDestinationAccountId(acc.id)}
                          className={`flex items-center gap-2 p-2 border-2 border-black dark:border-white font-label-bold text-[10px] uppercase transition-transform active-press ${
                            destinationAccountId === acc.id
                              ? "bg-secondary text-on-secondary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                              : accountId === acc.id
                              ? "bg-surface opacity-50 cursor-not-allowed"
                              : "bg-surface text-on-surface hover:bg-surface-variant"
                          }`}
                          disabled={accountId === acc.id}
                        >
                          <span className="w-3 h-3 border border-black dark:border-white" style={{ backgroundColor: acc.color }} />
                          <span className="truncate flex-1 text-left">{acc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
          <div>
            <label className="font-label-bold text-on-surface uppercase tracking-widest text-xs block mb-2">
              {type === "income" ? "Sumber Dana (opsional)" : "Rekening (opsional)"}
            </label>
            {accounts.length === 0 ? (
              <div className="neo-brutalist-border border-dashed p-4 text-center bg-surface-container">
                <p className="text-on-surface-variant font-label-md">Belum ada akun/rekening</p>
                <a href="/accounts" className="text-primary font-label-bold uppercase text-xs mt-2 inline-block neo-brutalist-border bg-surface px-2 py-1 active-press">
                  + Tambah Akun
                </a>
              </div>
            ) : (
              <div className="max-h-32 overflow-y-auto p-2 neo-brutalist-border bg-surface-container">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountId("")}
                    className={`flex items-center gap-2 p-2 border-2 border-black dark:border-white font-label-bold text-[10px] uppercase transition-transform active-press ${
                      accountId === ""
                        ? "bg-primary text-on-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                        : "bg-surface text-on-surface hover:bg-surface-variant"
                    }`}
                  >
                    <span className="w-3 h-3 border border-black dark:border-white bg-on-surface-variant" />
                    <span className="truncate flex-1 text-left">Kosong</span>
                  </button>

                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={`flex items-center gap-2 p-2 border-2 border-black dark:border-white font-label-bold text-[10px] uppercase transition-transform active-press ${
                        accountId === acc.id
                          ? "bg-primary text-on-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px] translate-x-[-2px]"
                          : "bg-surface text-on-surface hover:bg-surface-variant"
                      }`}
                    >
                      <span
                        className="w-3 h-3 border border-black dark:border-white"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="truncate flex-1 text-left">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Debt Payment Section */}
          {showDebtDropdown && (
            <div className="bg-tertiary-container border-4 border-black dark:border-white p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-black dark:border-white pb-2">
                <i className="fa-solid fa-credit-card text-on-tertiary-container"></i>
                <span className="text-on-tertiary-container font-label-bold uppercase tracking-widest">Pembayaran Hutang</span>
              </div>

              {activeDebts.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-on-tertiary-container font-label-md">Belum ada hutang aktif</p>
                  <a href="/debts" className="text-tertiary font-label-bold uppercase text-xs mt-2 inline-block neo-brutalist-border bg-surface px-2 py-1 active-press">
                    + Tambah Hutang
                  </a>
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-label-bold text-on-tertiary-container uppercase tracking-widest text-xs block mb-2">
                      Hutang yang dibayar (opsional)
                    </label>
                    <select
                      id="debt-selector"
                      value={selectedDebtId}
                      onChange={(e) => setSelectedDebtId(e.target.value)}
                      className="w-full bg-surface neo-brutalist-border px-4 py-3 text-on-surface font-label-bold uppercase text-xs focus:outline-none focus:ring-2 focus:ring-tertiary appearance-none cursor-pointer"
                    >
                      <option value="">-- PILIH HUTANG --</option>
                      {activeDebts.map((debt) => (
                        <option key={debt.id} value={debt.id}>
                          {debt.name} (SISA {formatRupiahNum(debt.remainingAmount)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDebtId && (
                    <div>
                      <label className="font-label-bold text-on-tertiary-container uppercase tracking-widest text-xs block mb-2">
                        Nominal Dibayarkan
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display-lg text-on-surface text-lg">Rp</span>
                        <input
                          id="debt-payment-amount"
                          type="text"
                          inputMode="numeric"
                          value={formatRupiah(debtPaymentAmount)}
                          onChange={(e) => setDebtPaymentAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-surface neo-brutalist-border pl-12 pr-4 py-3 text-on-surface text-lg font-display-lg focus:outline-none focus:ring-2 focus:ring-tertiary transition-colors"
                        />
                      </div>
                      <p className="text-on-tertiary-container font-label-bold text-[10px] uppercase mt-2">
                        <i className="fa-solid fa-triangle-exclamation mr-1"></i> Sisa hutang akan berkurang otomatis
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="font-label-bold text-on-surface uppercase tracking-widest text-xs block mb-2">Tanggal</label>
            <input
              id="transaction-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container neo-brutalist-border px-4 py-3 text-on-surface font-label-bold uppercase text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:bg-primary-container focus:text-on-primary-container transition-colors cursor-pointer"
            />
          </div>

          {/* Note */}
          <div>
            <label className="font-label-bold text-on-surface uppercase tracking-widest text-xs block mb-2">Catatan (opsional)</label>
            <input
              id="transaction-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="TAMBAHKAN CATATAN..."
              className="w-full bg-surface-container neo-brutalist-border px-4 py-3 text-on-surface font-label-bold uppercase text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-primary-container focus:text-on-primary-container transition-colors placeholder:text-on-surface-variant"
            />
          </div>

          {error && (
            <div className="bg-error text-on-error neo-brutalist-border px-4 py-3 font-label-bold uppercase text-xs flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          <div className="flex gap-4 pt-4 mt-8 border-t-4 border-black dark:border-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-surface-container text-on-surface font-label-bold uppercase tracking-widest neo-brutalist-border active-press"
            >
              Batal
            </button>
            <button
              id="save-transaction"
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 font-label-bold uppercase tracking-widest text-white neo-brutalist-border active-press disabled:opacity-50 ${
                type === "expense"
                  ? "bg-tertiary text-on-tertiary"
                  : type === "transfer"
                  ? "bg-secondary text-on-secondary"
                  : "bg-primary text-on-primary"
              }`}
            >
              {loading ? "Menyimpan..." : editData ? "Perbarui" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
