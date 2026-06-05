"use client";

import { useState } from "react";
import { Sparkles, BrainCircuit, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Transaction } from "@/lib/firestore/transactions";

interface AISummaryCardProps {
  transactions: Transaction[];
  month: number;
  year: number;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export function AISummaryCard({
  transactions,
  month,
  year,
  initialBalance,
  totalIncome,
  totalExpense,
}: AISummaryCardProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
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
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal menghasilkan analisis.");
      }

      setSummary(data.text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 lg:p-8 mt-6 shadow-sm dark:shadow-none">
      {/* Background glowing gradients */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-slate-900 dark:text-white font-bold text-lg">AI Financial Roasting</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Biar Gemini yang nge-judge pengeluaranmu bulan ini.</p>
            </div>
          </div>

          {!summary && !loading && !error && (
            <p className="text-slate-700 dark:text-slate-300 text-sm max-w-2xl leading-relaxed">
              Dapatkan analisis tajam dan blak-blakan mengenai kebiasaan belanjamu. Temukan kebocoran dana dan dapatkan saran konkret untuk bulan depan!
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-3 pt-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="flex items-center gap-2 mt-4 text-indigo-400 text-sm font-medium animate-pulse">
                <Sparkles size={16} className="animate-spin-slow" />
                Mengorek aib finansialmu...
              </div>
            </div>
          )}

          {summary && !loading && (
            <div className="text-slate-700 dark:text-slate-300 text-sm max-w-none pt-4 leading-relaxed [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-3 [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mb-2 [&_h2]:mt-4 [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_strong]:text-indigo-500 dark:[&_strong]:text-indigo-400 [&_strong]:font-semibold">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Sparkles size={16} />
            {summary ? "Analisis Ulang" : "Analisis Sekarang"}
          </button>
        </div>
      </div>
    </div>
  );
}
