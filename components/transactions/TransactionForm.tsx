"use client";

import { useState, useEffect } from "react";
import { X, Plus, CreditCard } from "lucide-react";
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

  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
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
      setNote(editData.note || "");
      setDate(editData.date);
      setSelectedDebtId(editData.debtId || "");
      setDebtPaymentAmount(editData.debtPaymentAmount?.toString() || "");
    } else {
      setType("expense");
      setAmount("");
      setCategoryId("");
      setAccountId("");
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
    if (!categoryId) { setError("Pilih kategori"); return; }
    if (showDebtDropdown && selectedDebtId && numericDebtPayment <= 0) {
      setError("Masukkan nominal pembayaran hutang");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const selectedAccount = accounts.find((a) => a.id === accountId);

      const data: TransactionInput = {
        amount: numericAmount,
        type,
        category: selectedCategory?.name || "",
        categoryId,
        note,
        date,
        ...(accountId ? { accountId, accountName: selectedAccount?.name } : {}),
        ...(showDebtDropdown && selectedDebtId
          ? { debtId: selectedDebtId, debtPaymentAmount: numericDebtPayment }
          : {}),
      };

      if (editData) {
        await updateTransaction(user.uid, editData.id, data);
      } else {
        await addTransaction(user.uid, data);
        // Pay down the selected debt if chosen
        if (showDebtDropdown && selectedDebtId && numericDebtPayment > 0) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700/50 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">
            {editData ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-slate-800/60 rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              type === "expense"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              type === "income"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pemasukan
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Jumlah</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
              <input
                id="transaction-amount"
                type="text"
                inputMode="numeric"
                value={formatRupiah(amount)}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-base font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Kategori</label>
            {categories.length === 0 ? (
              <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
                <p className="text-slate-500 text-xs">Belum ada kategori</p>
                <a href="/categories" className="text-emerald-400 text-xs hover:underline mt-1 block">
                  + Tambah kategori dulu
                </a>
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto pr-1 border border-slate-800 rounded-xl p-2 bg-slate-950/20">
                <div className="grid grid-cols-3 gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-all duration-150 ${
                        categoryId === cat.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Source / Destination */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">
              {type === "income" ? "Sumber Dana (opsional)" : "Rekening (opsional)"}
            </label>
            {accounts.length === 0 ? (
              <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
                <p className="text-slate-500 text-xs">Belum ada akun/rekening</p>
                <a href="/accounts" className="text-emerald-400 text-xs hover:underline mt-1 block">
                  + Tambah akun dulu
                </a>
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto pr-1 border border-slate-800 rounded-xl p-2 bg-slate-950/20">
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Option to unselect account */}
                  <button
                    type="button"
                    onClick={() => setAccountId("")}
                    className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-all duration-150 ${
                      accountId === ""
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="truncate w-full text-center">Kosong</span>
                  </button>

                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-all duration-150 ${
                        accountId === acc.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="truncate w-full text-center">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Debt Payment Section — shown when category contains "hutang"/"paylater" */}
          {showDebtDropdown && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={14} className="text-amber-400" />
                <span className="text-amber-400 text-xs font-semibold">Pembayaran Hutang</span>
              </div>

              {activeDebts.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-slate-500 text-xs">Belum ada hutang aktif</p>
                  <a href="/debts" className="text-amber-400 text-xs hover:underline mt-1 block">
                    + Tambah hutang dulu
                  </a>
                </div>
              ) : (
                <>
                  {/* Debt Selector */}
                  <div>
                    <label className="text-slate-400 text-xs font-medium block mb-1.5">
                      Hutang yang dibayar (opsional)
                    </label>
                    <select
                      id="debt-selector"
                      value={selectedDebtId}
                      onChange={(e) => setSelectedDebtId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all appearance-none"
                    >
                      <option value="">-- Pilih hutang --</option>
                      {activeDebts.map((debt) => (
                        <option key={debt.id} value={debt.id}>
                          {debt.name} (sisa {formatRupiahNum(debt.remainingAmount)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment amount */}
                  {selectedDebtId && (
                    <div className="animate-in fade-in duration-150">
                      <label className="text-slate-400 text-xs font-medium block mb-1.5">
                        Nominal yang dibayarkan ke hutang ini
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                        <input
                          id="debt-payment-amount"
                          type="text"
                          inputMode="numeric"
                          value={formatRupiah(debtPaymentAmount)}
                          onChange={(e) => setDebtPaymentAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                        />
                      </div>
                      {selectedDebtId && (
                        <p className="text-slate-600 text-[10px] mt-1.5">
                          Sisa hutang akan berkurang sebesar nominal yang dimasukkan
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Tanggal</label>
            <input
              id="transaction-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Catatan (opsional)</label>
            <input
              id="transaction-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-all"
            >
              Batal
            </button>
            <button
              id="save-transaction"
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-lg disabled:opacity-50 ${
                type === "expense"
                  ? "bg-rose-500 hover:bg-rose-400 shadow-rose-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
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
