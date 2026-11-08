"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Transaction, getTransactionsByMonth } from "@/lib/firestore/transactions";
import { useAuth } from "@/lib/auth-context";
import { checkAiLimit } from "@/lib/firestore/ai-usage";

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

      const todayStr = new Date().toISOString().split("T")[0];
      const sessionKey = `ai_limit_${user.uid}_${todayStr}`;

      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem(sessionKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (mounted) {
              setIsSuper(Boolean(parsed.isSuper));
              setLimitReached(Boolean(parsed.limitReached));
              setCheckingLimit(false);
            }
            return;
          } catch {}
        }
      }

      setCheckingLimit(true);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/summary", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.success) {
            const superUser = Boolean(data.isSuper);
            const reached = !data.canUse;
            setIsSuper(superUser);
            setLimitReached(reached);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(
                sessionKey,
                JSON.stringify({ isSuper: superUser, limitReached: reached })
              );
            }
            return;
          }
        }
        // Fallback jika GET gagal
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
      if (!isSuper && limitReached) {
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
      const todayStr = new Date().toISOString().split("T")[0];
      const sessionKey = `ai_limit_${user.uid}_${todayStr}`;
      if (data.isSuper) {
        setIsSuper(true);
        setLimitReached(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionKey, JSON.stringify({ isSuper: true, limitReached: false }));
        }
      } else {
        setLimitReached(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionKey, JSON.stringify({ isSuper: false, limitReached: true }));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between relative z-10 overflow-hidden gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-tertiary-container text-xl">
            local_fire_department
          </span>
          <h3 className="font-headline-md text-base sm:text-lg text-on-tertiary-container font-extrabold uppercase tracking-tight">
            Roasting Keuangan AI
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline text-[10px] font-label-bold uppercase shadow-[1.5px_1.5px_0_0_var(--theme-outline)] shrink-0">
          {isAnonymous
            ? "MODE TAMU"
            : isSuper
            ? "SUPER UNLIMITED"
            : limitReached
            ? "KUOTA 0/1 HARI INI"
            : "KUOTA 1/1 HARI INI"}
        </span>
      </div>

      <div className="flex-1 text-on-surface font-body-md leading-relaxed bg-surface border-[3px] border-outline p-4 rounded-2xl shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col justify-center">
        {!summary && !loading && !error && (
          <div className="space-y-2">
            <p className="font-label-bold text-xs sm:text-sm text-on-surface leading-snug">
              &ldquo;Uang masih seuprit, tapi ngopi tiap hari? Sadar diri aja kak kalau masih miskin mah&rdquo;
            </p>
            <p className="italic text-on-surface-variant text-xs">
              Dompetmu butuh pertolongan pertama, bukan es kopi susu lagi.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-on-error-container bg-error-container border-2 border-outline p-3 rounded-xl text-xs font-label-bold">
            <span className="material-symbols-outlined text-base shrink-0">
              warning
            </span>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="space-y-2.5 w-full">
            <div className="h-3.5 w-3/4 bg-surface-container-high rounded-md animate-pulse" />
            <div className="h-3.5 w-1/2 bg-surface-container-high rounded-md animate-pulse" />
            <div className="h-3.5 w-5/6 bg-surface-container-high rounded-md animate-pulse" />
            <div className="flex items-center justify-center gap-2 pt-2 text-on-surface text-xs font-label-bold">
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
              <span>Mengorek catatan finansialmu...</span>
            </div>
          </div>
        )}

        {summary && !loading && (
          <div className="text-xs sm:text-sm max-w-none leading-relaxed [&_h1]:text-on-surface [&_h1]:font-bold [&_h1]:text-base [&_h1]:mb-1.5 [&_h2]:text-on-surface [&_h2]:font-bold [&_h2]:text-sm [&_h2]:mb-1.5 [&_h2]:mt-2 [&_h3]:text-on-surface [&_h3]:font-bold [&_h3]:mb-1 [&_p]:text-on-surface [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_li]:mb-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_strong]:text-on-surface [&_strong]:font-extrabold overflow-y-auto max-h-[220px] no-scrollbar pr-1">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || isAnonymous || (!isSuper && limitReached) || checkingLimit}
        title={
          isAnonymous
            ? "Daftar akun gratis untuk menggunakan fitur AI"
            : isSuper
            ? "Anda menggunakan Super Akun (Akses Tanpa Batas)"
            : limitReached
            ? "Batas penggunaan harian tercapai"
            : "Sisa jatah harian: 1x"
        }
        className={`w-full font-label-bold text-xs uppercase tracking-wider py-3 px-4 rounded-2xl flex items-center justify-center gap-2 border-[3px] border-outline transition-all active-press cursor-pointer ${
          isAnonymous || (!isSuper && limitReached)
            ? "bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70"
            : "bg-error-container text-on-error-container shadow-[3px_3px_0_0_var(--theme-outline)] hover:opacity-95"
        }`}
      >
        {checkingLimit ? (
          <span className="flex items-center gap-2">Memeriksa Kuota...</span>
        ) : isAnonymous ? (
          <>
            <span className="material-symbols-outlined text-base">lock</span>
            <span>Masuk Akun untuk Roasting AI</span>
          </>
        ) : !isSuper && limitReached ? (
          <>
            <span className="material-symbols-outlined text-base">lock_clock</span>
            <span>Jatah Roasting Hari Ini Habis</span>
          </>
        ) : isSuper ? (
          <>
            <span className="material-symbols-outlined text-base">bolt</span>
            <span>{summary ? "Minta Roasting Baru (Super)" : "Minta Roasting Baru Sekarang"}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">local_fire_department</span>
            <span>{summary ? "Minta Roasting Ulang" : "Minta Roasting Baru Sekarang"}</span>
          </>
        )}
      </button>
    </div>
  );
}
