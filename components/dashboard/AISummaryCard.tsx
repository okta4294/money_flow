"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Transaction } from "@/lib/firestore/transactions";
import { useAuth } from "@/lib/auth-context";
import { checkAiLimit, markAiUsage, isSuperUser } from "@/lib/firestore/ai-usage";

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
    <div className="ai-glow rounded-2xl p-stack-lg h-full flex flex-col relative z-10 overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <i className="fa-solid fa-robot text-primary-fixed drop-shadow-[0_0_8px_rgba(99,247,255,0.6)] text-2xl"></i>
        <h3 className="font-headline-md text-headline-md text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">AI Roaster</h3>
      </div>
      
      <div className="flex-1 text-on-surface font-body-md mb-6 leading-relaxed bg-surface-container-lowest/40 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
        {!summary && !loading && !error && (
          <p className="text-center italic opacity-80">
            Dapatkan analisis untuk pengeluaranmu yang banyak tapi pemasukan sedikit itu... Biarkan AI memasak Anda.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-error bg-error/10 p-3 rounded-lg border border-error/20 mt-2 text-sm shadow-[0_0_10px_rgba(255,180,171,0.2)]">
            <i className="fa-solid fa-triangle-exclamation text-[16px]"></i>
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3 w-full">
            <div className="h-4 w-3/4 bg-surface-bright rounded-md animate-pulse" />
            <div className="h-4 w-1/2 bg-surface-bright rounded-md animate-pulse" />
            <div className="h-4 w-5/6 bg-surface-bright rounded-md animate-pulse" />
            <div className="flex items-center justify-center gap-2 mt-4 text-primary-fixed font-label-sm animate-pulse drop-shadow-[0_0_5px_rgba(99,247,255,0.4)]">
              <i className="fa-solid fa-wand-magic-sparkles text-[16px] animate-pulse"></i>
              Mengorek aib finansialmu...
            </div>
          </div>
        )}

        {summary && !loading && (
          <div className="text-sm max-w-none leading-relaxed [&_h1]:text-white [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-3 [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mb-2 [&_h2]:mt-4 [&_h3]:text-white [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_strong]:text-primary-fixed [&_strong]:drop-shadow-[0_0_5px_rgba(99,247,255,0.3)] [&_strong]:font-semibold overflow-y-auto max-h-[300px] no-scrollbar pr-2">
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
        className={`w-full font-label-md text-label-md py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
          isAnonymous || limitReached
            ? "bg-surface-variant text-on-surface-variant cursor-not-allowed border border-white/5"
            : "bg-gradient-to-r from-secondary-container to-primary-fixed text-white hover:shadow-[0_0_20px_rgba(96,1,209,0.5)] border-none"
        }`}
      >
        {checkingLimit ? (
          <span className="flex items-center gap-2">Memeriksa...</span>
        ) : isAnonymous ? (
          <><i className="fa-solid fa-lock text-[18px]"></i> Login untuk mencoba</>
        ) : limitReached ? (
          <><i className="fa-solid fa-shield-halved text-[18px]"></i> Jatah Habis</>
        ) : (
          <><i className="fa-solid fa-wand-magic-sparkles text-[18px]"></i> {summary ? "Analisis Ulang" : "Analisis Sekarang"} {isSuper && "✨"}</>
        )}
      </button>
    </div>
  );
}
