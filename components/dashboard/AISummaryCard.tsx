"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Transaction } from "@/lib/firestore/transactions";
import { useAuth } from "@/lib/auth-context";
import { checkAiLimit, markAiUsage, isSuperUser } from "@/lib/firestore/ai-usage";
import { useTheme } from "next-themes";

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

  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = mounted && currentTheme === 'dark';

  useEffect(() => {
    let mounted = true;
    async function initLimit() {
      if (!user || user.isAnonymous) {
        if (mounted) setCheckingLimit(false);
        return;
      }
      setCheckingLimit(true);
      try {
        const canUse = await checkAiLimit(user.uid, user.email);
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
      const canUse = await checkAiLimit(user.uid, user.email);
      if (!canUse) {
        setLimitReached(true);
        throw new Error("Batas penggunaan harian (1x/hari) telah tercapai. Silakan coba lagi besok");
      }

      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          initialBalance,
          totalIncome,
          totalExpense,
          transactions,
          activeDebts,
          totalDebt,
          prevMonthData,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal menghasilkan analisis.");
      }

      setSummary(data.text);
      await markAiUsage(user.uid, user.email);
      
      const canStillUse = await checkAiLimit(user.uid, user.email);
      setLimitReached(!canStillUse);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isSuper = isSuperUser(user?.email);

  return (
    <div className={`rounded-xl p-6 h-full flex flex-col transition-colors duration-200 z-10 ${isDark ? 'ai-glow glass-panel' : 'bg-indigo-50 border border-indigo-100'}`}>
      <div className="flex items-center gap-2 mb-6">
        <span className={`material-symbols-outlined ${isDark ? 'text-secondary-container' : 'text-indigo-600'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          smart_toy
        </span>
        <h3 className="font-headline-md text-2xl font-bold text-slate-900 dark:text-on-surface">AI Roaster</h3>
      </div>
      
      <div className="flex-1 text-slate-600 dark:text-on-surface-variant font-body-md mb-6 leading-relaxed flex flex-col justify-center">
        {!summary && !loading && !error && (
          <p className="text-center italic opacity-80">
            Dapatkan analisis untuk pengeluaranmu yang banyak tapi pemasukan sedikit itu... Biarkan AI memasak Anda.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-rose-600 dark:text-error bg-rose-100 dark:bg-error-container/20 p-3 rounded-lg border border-rose-200 dark:border-error-container mt-2 text-sm">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3 w-full">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-surface-bright rounded-md animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-surface-bright rounded-md animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-surface-bright rounded-md animate-pulse" />
            <div className="flex items-center justify-center gap-2 mt-4 text-indigo-500 dark:text-secondary-fixed-dim font-label-sm animate-pulse">
              <span className="material-symbols-outlined text-[16px] animate-spin-slow">auto_awesome</span>
              Mengorek aib finansialmu...
            </div>
          </div>
        )}

        {summary && !loading && (
          <div className="text-sm max-w-none leading-relaxed [&_h1]:text-slate-900 dark:[&_h1]:text-on-surface [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-3 [&_h2]:text-slate-900 dark:[&_h2]:text-on-surface [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mb-2 [&_h2]:mt-4 [&_h3]:text-slate-900 dark:[&_h3]:text-on-surface [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_strong]:text-indigo-600 dark:[&_strong]:text-secondary-fixed-dim [&_strong]:font-semibold overflow-y-auto max-h-[300px] no-scrollbar pr-2">
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
        className={`w-full font-label-md font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
          isAnonymous || limitReached
            ? "bg-slate-300 text-slate-500 dark:bg-surface-variant dark:text-on-surface-variant cursor-not-allowed"
            : isDark ? "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80" : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {checkingLimit ? (
          <span className="flex items-center gap-2">Memeriksa...</span>
        ) : isAnonymous ? (
          <><span className="material-symbols-outlined text-[18px]">lock</span> Login untuk mencoba</>
        ) : limitReached ? (
          <><span className="material-symbols-outlined text-[18px]">gpp_maybe</span> Jatah Habis</>
        ) : (
          <><span className="material-symbols-outlined text-[18px]">auto_awesome</span> {summary ? "Analisis Ulang" : "Analisis Sekarang"} {isSuper && "✨"}</>
        )}
      </button>
    </div>
  );
}
