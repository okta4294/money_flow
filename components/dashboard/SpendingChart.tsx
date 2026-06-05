"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  BarElement,
  CategoryScale,
  LinearScale,
  BarController,
} from "chart.js";
import { Transaction } from "@/lib/firestore/transactions";
import { Category } from "@/lib/firestore/categories";

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  BarElement,
  CategoryScale,
  LinearScale,
  BarController
);

interface SpendingChartProps {
  transactions: Transaction[];
  categories: Category[];
}

const CHART_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#0ea5e9",
];

export function SpendingChart({ transactions, categories }: SpendingChartProps) {
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const doughnutInstance = useRef<Chart | null>(null);
  const barInstance = useRef<Chart | null>(null);

  // Doughnut: expense by category
  useEffect(() => {
    if (!doughnutRef.current) return;

    const expenses = transactions.filter((t) => t.type === "expense");
    const byCategory: Record<string, number> = {};
    expenses.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(byCategory);
    const data = Object.values(byCategory);

    if (doughnutInstance.current) doughnutInstance.current.destroy();

    if (labels.length === 0) return;

    doughnutInstance.current = new Chart(doughnutRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map(
              (_, i) => CHART_COLORS[i % CHART_COLORS.length] + "cc"
            ),
            borderColor: labels.map(
              (_, i) => CHART_COLORS[i % CHART_COLORS.length]
            ),
            borderWidth: 1.5,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#94a3b8",
              padding: 12,
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw as number;
                return ` ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val)}`;
              },
            },
          },
        },
      },
    });

    return () => {
      doughnutInstance.current?.destroy();
    };
  }, [transactions]);

  // Bar: income vs expense by category
  useEffect(() => {
    if (!barRef.current) return;

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === "income") {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    });

    const allLabels = [...new Set([
      ...Object.keys(incomeByCategory),
      ...Object.keys(expenseByCategory),
    ])];

    if (barInstance.current) barInstance.current.destroy();

    if (allLabels.length === 0) return;

    barInstance.current = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels: allLabels,
        datasets: [
          {
            label: "Pemasukan",
            data: allLabels.map((l) => incomeByCategory[l] || 0),
            backgroundColor: "#10b98166",
            borderColor: "#10b981",
            borderWidth: 1.5,
            borderRadius: 6,
          },
          {
            label: "Pengeluaran",
            data: allLabels.map((l) => expenseByCategory[l] || 0),
            backgroundColor: "#ef444466",
            borderColor: "#ef4444",
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#94a3b8",
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw as number;
                return ` ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#64748b", font: { size: 10 } },
            grid: { color: "#1e293b" },
          },
          y: {
            ticks: {
              color: "#64748b",
              font: { size: 10 },
              callback: (v) =>
                new Intl.NumberFormat("id-ID", { notation: "compact" }).format(v as number),
            },
            grid: { color: "#1e293b" },
          },
        },
      },
    });

    return () => {
      barInstance.current?.destroy();
    };
  }, [transactions]);

  const hasData = transactions.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Doughnut */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-4">Pengeluaran per Kategori</h3>
        {!hasData ? (
          <div className="h-56 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
            Belum ada data transaksi
          </div>
        ) : (
          <div className="h-56 relative">
            <canvas ref={doughnutRef} />
          </div>
        )}
      </div>

      {/* Bar */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-4">Pemasukan vs Pengeluaran</h3>
        {!hasData ? (
          <div className="h-56 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
            Belum ada data transaksi
          </div>
        ) : (
          <div className="h-56 relative">
            <canvas ref={barRef} />
          </div>
        )}
      </div>
    </div>
  );
}
