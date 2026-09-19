"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Transaction, getTransactionsByMonth } from "@/lib/firestore/transactions";
import { useAuth } from "@/lib/auth-context";
import { checkAiLimit, markAiUsage } from "@/lib/firestore/ai-usage";

interface AISummaryCardProps {
  transactions: Transaction[];
  month: number;
  year: number;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  activeDebts: any[];
  totalDebt: number;
  prevMonthData?: {
    month: number;
    year: number;
    transactions: Transaction[];
    totalIncome: number;
    totalExpense: number;
  };
}

export function AISummaryCard({
  transactions,
  month,
  year,
  initialBalance,
  totalIncome,
  totalExpense,
  activeDebts,
  totalDebt,
  prevMonthData,
}: AISummaryCardProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAnonymous = user?.isAnonymous;

  const [limitReached, setLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function initLimit() {
      if (!user || user.isAnonymous) {
        if (mounted) setCheckingLimit(false);
        return;
      }
      setCheckingLimit(true);
      try {
        const canUse = await checkAiLimit(user.uid);
        if (mounted) setLimitReached(!canUse);
      } catch (err) {
        console.error("Gagal mengecek limit AI:", err);
      } finally {
        if (mounted) setCheckingLimit(false);
      }
    }
    initLimit();
    return () => { mounted = false; };
  }, [user]);

  const handleGenerate = async () => {
    if (!user || user.isAnonymous) return;

    setLoading(true);
    setError(null);
    try {
      const canUse = await checkAiLimit(user.uid);
      if (!canUse && !isSuper) {
        setLimitReached(true);
        throw new Error("Batas penggunaan harian (1x/hari) telah tercapai. Silakan coba lagi besok");
      }

      let effectivePrevMonthData = prevMonthData;
      if (!effectivePrevMonthData) {
        const prevDate = new Date(year, month - 2);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        const prevTxs = await getTransactionsByMonth(user.uid, prevYear, prevMonth);
        if (prevTxs.length > 0) {
          const prevTotalIncome = prevTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const prevTotalExpense = prevTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          effectivePrevMonthData = {
            month: prevMonth,
            year: prevYear,
            transactions: prevTxs,
            totalIncome: prevTotalIncome,
            totalExpense: prevTotalExpense,
          };
        }
      }

      const idToken = await user.getIdToken();
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          month,
          year,
          initialBalance,
          totalIncome,
          totalExpense,
          transactions,
          activeDebts,
          totalDebt,
          prevMonthData: effectivePrevMonthData,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal menghasilkan analisis.");
      }

      setSummary(data.text);
      if (data.isSuper) {
        setIsSuper(true);
      } else {
        await markAiUsage(user.uid);
        const canStillUse = await checkAiLimit(user.uid);
        setLimitReached(!canStillUse);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative z-10 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <i className="fa-solid fa-brain text-on-tertiary-container text-xl"></i>
        <h3 className="font-headline-md text-xl text-on-tertiary-container font-bold uppercase tracking-tight">AI Roaster</h3>
      </div>
      
      <div className="flex-1 text-on-surface font-body-md mb-4 leading-relaxed bg-surface border-2 border-outline p-4 rounded-2xl shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col justify-center">
        {!summary && !loading && !error && (
          <p className="text-center italic opacity-80 text-on-surface-variant text-sm">
            Dapatkan analisis untuk pengeluaranmu yang banyak tapi pemasukan sedikit itu... Biarkan AI memasak Anda.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-on-error-container bg-error-container border-2 border-outline p-3 rounded-xl mt-2 text-xs font-label-bold">
            <i className="fa-solid fa-triangle-exclamation text-base"></i>
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3 w-full">
            <div className="h-4 w-3/4 bg-surface-bright rounded-md animate-pulse" />
            <div className="h-4 w-1/2 bg-surface-bright rounded-md animate-pulse" />
            <div className="h-4 w-5/6 bg-surface-bright rounded-md animate-pulse" />
            <div className="flex items-center justify-center gap-2 mt-4 text-on-surface font-label-sm">
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Mengorek catatan finansialmu...
            </div>
          </div>
        )}

        {summary && !loading && (
          <div className="text-sm max-w-none leading-relaxed [&_h1]:text-on-surface [&_h1]:font-bold [&_h1]:text-lg [&_h1]:mb-2 [&_h2]:text-on-surface [&_h2]:font-bold [&_h2]:text-base [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-on-surface [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_p]:text-on-surface-variant [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2.5 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2.5 [&_strong]:text-on-surface [&_strong]:font-bold overflow-y-auto max-h-[280px] no-scrollbar pr-2">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || isAnonymous || limitReached || checkingLimit}
        title={
          isAnonymous 
            ? "Daftar akun gratis untuk menggunakan fitur AI" 
            : limitReached 
              ? "Batas penggunaan harian tercapai" 
              : isSuper 
                ? "Anda menggunakan Super Akun (Tanpa Batas)" 
                : "Sisa jatah harian: 1x"
        }
        className={`w-full font-label-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-2 border-outline transition-all active-press ${
          isAnonymous || limitReached
            ? "bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-60"
            : "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] hover:shadow-[4px_4px_0_0_var(--theme-outline)]"
        }`}
      >
        {checkingLimit ? (
          <span className="flex items-center gap-2">Memeriksa...</span>
        ) : isAnonymous ? (
          <><i className="fa-solid fa-lock text-[16px]"></i> Login untuk mencoba</>
        ) : limitReached ? (
          <><i className="fa-solid fa-shield-halved text-[16px]"></i> Jatah Habis</>
        ) : (
          <><i className="fa-solid fa-chart-pie text-[16px]"></i> {summary ? "Analisis Ulang" : "Analisis Sekarang"}</>
        )}
      </button>
    </div>
  );
}
