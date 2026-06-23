"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAccounts } from "@/hooks/useAccounts";
import { addAccount, updateAccount, deleteAccount, AccountInput, AccountType } from "@/lib/firestore/accounts";
import { collection, query, where, getAggregateFromServer, sum, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"
];

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "bank", label: "Bank", icon: "account_balance" },
  { value: "ewallet", label: "E-Wallet", icon: "account_balance_wallet" },
  { value: "cash", label: "Cash", icon: "payments" },
  { value: "other", label: "Other", icon: "help" },
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
      
      await Promise.all(accounts.map(async (acc) => {
        const transactionsRef = collection(db, "users", user.uid, "transactions");
        
        const qIncome = query(transactionsRef, where("accountId", "==", acc.id), where("type", "==", "income"));
        const qExpense = query(transactionsRef, where("accountId", "==", acc.id), where("type", "==", "expense"));
        const qTransferOut = query(transactionsRef, where("accountId", "==", acc.id), where("type", "==", "transfer"));
        const qTransferIn = query(transactionsRef, where("destinationAccountId", "==", acc.id));

        const [snapIncome, snapExpense, snapTrOut, snapTrIn] = await Promise.all([
          getAggregateFromServer(qIncome, { total: sum("amount") }),
          getAggregateFromServer(qExpense, { total: sum("amount") }),
          getDocs(qTransferOut),
          getDocs(qTransferIn),
        ]);

        const income = snapIncome.data().total || 0;
        const expense = snapExpense.data().total || 0;
        const transferOut = snapTrOut.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
        const transferIn = snapTrIn.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

        newBalances[acc.id] = income - expense - transferOut + transferIn;
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
    if (!user || !confirm("Delete this account?")) return;
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
    const iconClass = config?.icon || "help";
    return <span className="material-symbols-outlined text-2xl">{iconClass}</span>;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-surface-bright neo-brutalist-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const bgColors = [
    "bg-primary-container text-on-primary-container",
    "bg-secondary-container text-on-secondary-container",
    "bg-tertiary-container text-on-tertiary-container",
    "bg-secondary-fixed-dim text-on-secondary-fixed",
  ];

  return (
    <div>
      {/* Account List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Button */}
        <button
          onClick={handleOpenNew}
          className="aspect-[2/1] rounded-lg border-[3px] border-dashed border-on-background bg-surface hover:bg-surface-bright flex flex-col items-center justify-center gap-2 transition-all group active-press"
        >
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest neo-brutalist-border flex items-center justify-center transition-colors">
             <span className="material-symbols-outlined text-on-background text-2xl">add</span>
          </div>
          <span className="font-label-bold text-on-surface-variant">Add Account</span>
        </button>

        {accounts.map((acc, idx) => {
           const colorClass = bgColors[idx % bgColors.length];
           return (
            <div
              key={acc.id}
              className={`group relative aspect-[2/1] neo-brutalist-border rounded-lg p-5 flex flex-col justify-between items-start text-left neo-brutalist-shadow-sm hover:neo-brutalist-shadow transition-all ${colorClass}`}
            >
              <div className="flex w-full justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white neo-brutalist-border rounded-xl flex items-center justify-center text-black">
                    {getIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="font-headline-md text-lg leading-tight line-clamp-1">{acc.name}</h3>
                    <p className="font-label-bold text-sm opacity-80 uppercase tracking-wider mt-0.5">
                      {ACCOUNT_TYPES.find((t) => t.value === acc.type)?.label}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="w-8 h-8 rounded-lg bg-white neo-brutalist-border text-black flex items-center justify-center hover:bg-slate-200 active-press"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="w-8 h-8 rounded-lg bg-error text-on-error neo-brutalist-border flex items-center justify-center hover:opacity-90 active-press"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              {balances[acc.id] !== undefined && (
                <div className="mt-4">
                  <p className="text-xs font-label-bold uppercase tracking-widest opacity-80 mb-1">Balance</p>
                  <p className="font-display-lg text-3xl tracking-tighter">
                    {formatRupiah(balances[acc.id])}
                  </p>
                </div>
              )}
            </div>
           );
        })}
      </div>

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-surface rounded-2xl w-full max-w-md p-6 neo-brutalist-border neo-brutalist-shadow z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-lg text-on-background tracking-tighter">
                {editingId ? "Edit Account" : "New Account"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-on-surface-variant font-label-bold block mb-1.5 uppercase tracking-widest text-xs">Account Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="BCA, Gopay, Wallet..."
                  className="w-full bg-surface-container-lowest neo-brutalist-border rounded-xl px-4 py-3 text-on-background font-body-md focus:outline-none focus:neo-brutalist-shadow-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-label-bold block mb-1.5 uppercase tracking-widest text-xs">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl font-label-bold transition-all neo-brutalist-border ${
                        type === t.value 
                          ? "bg-primary-container text-on-primary-container neo-brutalist-shadow-sm -translate-y-0.5 -translate-x-0.5" 
                          : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-bright"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-surface neo-brutalist-border text-on-background font-label-bold transition-all hover:bg-surface-bright active-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-primary-container neo-brutalist-border text-on-primary-container font-label-bold transition-all disabled:opacity-50 active-press neo-brutalist-shadow-sm hover:neo-brutalist-shadow"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
