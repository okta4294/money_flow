"use client";

import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

interface SummaryCardsProps {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  loading?: boolean;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  loading?: boolean;
}

function Card({ label, value, icon, colorClass, bgClass, borderClass, loading }: CardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderClass} bg-slate-900/50 backdrop-blur-sm p-5 flex flex-col gap-4`}>
      {/* Background glow */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl ${bgClass}`} />

      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${bgClass} bg-opacity-15 flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
      ) : (
        <span className={`text-2xl font-bold ${colorClass}`}>
          {formatRupiah(value)}
        </span>
      )}
    </div>
  );
}

export function SummaryCards({ initialBalance, totalIncome, totalExpense, loading }: SummaryCardsProps) {
  const finalBalance = initialBalance + totalIncome - totalExpense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card
        label="Saldo Awal"
        value={initialBalance}
        icon={<PiggyBank size={18} />}
        colorClass="text-slate-300"
        bgClass="bg-slate-500"
        borderClass="border-slate-700/50"
        loading={loading}
      />
      <Card
        label="Total Pemasukan"
        value={totalIncome}
        icon={<TrendingUp size={18} />}
        colorClass="text-emerald-400"
        bgClass="bg-emerald-500"
        borderClass="border-emerald-500/20"
        loading={loading}
      />
      <Card
        label="Total Pengeluaran"
        value={totalExpense}
        icon={<TrendingDown size={18} />}
        colorClass="text-rose-400"
        bgClass="bg-rose-500"
        borderClass="border-rose-500/20"
        loading={loading}
      />
      <Card
        label="Saldo Akhir"
        value={finalBalance}
        icon={<Wallet size={18} />}
        colorClass={finalBalance >= 0 ? "text-blue-400" : "text-rose-400"}
        bgClass={finalBalance >= 0 ? "bg-blue-500" : "bg-rose-500"}
        borderClass={finalBalance >= 0 ? "border-blue-500/20" : "border-rose-500/20"}
        loading={loading}
      />
    </div>
  );
}
