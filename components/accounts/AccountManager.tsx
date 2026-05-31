"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Landmark, Wallet, Banknote, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAccounts } from "@/hooks/useAccounts";
import { addAccount, updateAccount, deleteAccount, AccountInput, AccountType } from "@/lib/firestore/accounts";
import { collection, query, where, getAggregateFromServer, sum } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"
];

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ElementType }[] = [
  { value: "bank", label: "Bank", icon: Landmark },
  { value: "ewallet", label: "E-Wallet", icon: Wallet },
  { value: "cash", label: "Cash / Tunai", icon: Banknote },
  { value: "other", label: "Lainnya", icon: HelpCircle },
];

export function AccountManager() {
  const { user } = useAuth();
  const { accounts, loading } = useAccounts();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [color, setColor] = useState(COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user || accounts.length === 0) return;

    const fetchBalances = async () => {
      const newBalances: Record<string, number> = {};
      
      // Calculate balances sequentially or concurrently
      await Promise.all(accounts.map(async (acc) => {
        const transactionsRef = collection(db, "users", user.uid, "transactions");
        
        // Income for this account
        const qIncome = query(transactionsRef, where("accountId", "==", acc.id), where("type", "==", "income"));
        const snapIncome = await getAggregateFromServer(qIncome, { total: sum("amount") });
        const income = snapIncome.data().total || 0;

        // Expense for this account
        const qExpense = query(transactionsRef, where("accountId", "==", acc.id), where("type", "==", "expense"));
        const snapExpense = await getAggregateFromServer(qExpense, { total: sum("amount") });
        const expense = snapExpense.data().total || 0;

        newBalances[acc.id] = income - expense;
      }));

      setBalances(newBalances);
    };

    fetchBalances();
  }, [user, accounts]);

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setType("bank");
    setColor(COLORS[0]);
    setIsOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setColor(acc.color);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSubmitting(true);
    try {
      const data: AccountInput = { name: name.trim(), type, color };
      if (editingId) {
        await updateAccount(user.uid, editingId, data);
      } else {
        await addAccount(user.uid, data);
      }
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Hapus akun ini?")) return;
    await deleteAccount(user.uid, id);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getIcon = (accType: string) => {
    const config = ACCOUNT_TYPES.find((t) => t.value === accType);
    const Icon = config?.icon || HelpCircle;
    return <Icon size={16} />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Account List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Add Button */}
        <button
          onClick={handleOpenNew}
          className="h-24 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
            <Plus size={16} />
          </div>
          <span className="text-sm font-medium">Tambah Akun</span>
        </button>

        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden transition-all hover:border-slate-700"
          >
            {/* Color accent line */}
            <div 
              className="absolute top-0 left-0 bottom-0 w-1.5"
              style={{ backgroundColor: acc.color }}
            />
            
            <div className="flex items-start justify-between pl-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                >
                  {getIcon(acc.type)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{acc.name}</h3>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <p className="text-slate-500 text-xs">
                      {ACCOUNT_TYPES.find((t) => t.value === acc.type)?.label}
                    </p>
                    {balances[acc.id] !== undefined && (
                      <p className={`text-xs font-semibold ${balances[acc.id] >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatRupiah(balances[acc.id])}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(acc)}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? "Edit Akun" : "Tambah Akun"}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Nama Akun</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="BCA, Gopay, Dompet..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Tipe Akun</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        type === t.value 
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <t.icon size={16} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Warna</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        color === c ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
              >
                {submitting ? "Menyimpan..." : "Simpan Akun"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
