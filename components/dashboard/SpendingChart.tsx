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
  "#63f7ff", // primary-fixed
  "#a855f7", // vivid purple
  "#00dce5", // primary-fixed-dim
  "#d2bbff", // secondary
  "#6001d1", // secondary-container
  "#00f5ff", // primary-container
  "#c9aeff", // on-secondary-container
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
              color: "#dae2fd", // on-surface
              padding: 12,
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "rgba(11, 19, 38, 0.9)",
            borderColor: "rgba(99, 247, 255, 0.2)",
            borderWidth: 1,
            titleColor: "#ffffff",
            bodyColor: "#b9caca",
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
            backgroundColor: "rgba(99, 247, 255, 0.4)", // primary-fixed with alpha
            borderColor: "#63f7ff",
            borderWidth: 1.5,
            borderRadius: 6,
          },
          {
            label: "Pengeluaran",
            data: allLabels.map((l) => expenseByCategory[l] || 0),
            backgroundColor: "rgba(255, 180, 171, 0.4)", // error with alpha
            borderColor: "#ffb4ab",
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
              color: "#dae2fd",
              font: { size: 11 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: "rgba(11, 19, 38, 0.9)",
            borderColor: "rgba(99, 247, 255, 0.2)",
            borderWidth: 1,
            titleColor: "#ffffff",
            bodyColor: "#b9caca",
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
            ticks: { color: "#b9caca", font: { size: 10 } },
            grid: { color: "rgba(255, 255, 255, 0.05)" },
          },
          y: {
            ticks: {
              color: "#b9caca",
              font: { size: 10 },
              callback: (v) =>
                new Intl.NumberFormat("id-ID", { notation: "compact" }).format(v as number),
            },
            grid: { color: "rgba(255, 255, 255, 0.05)" },
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mt-4">
      {/* Doughnut */}
      <div className="glass-panel rounded-2xl p-stack-lg flex flex-col relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl"></div>
        <h3 className="font-headline-md text-headline-md text-white mb-6 relative z-10">Pengeluaran per Kategori</h3>
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center relative min-h-[250px] z-10 text-on-surface-variant font-label-md">
            Belum ada data transaksi
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center relative min-h-[250px] z-10">
            <canvas ref={doughnutRef} className="chart-glow" />
          </div>
        )}
      </div>

      {/* Bar */}
      <div className="glass-panel rounded-2xl p-stack-lg flex flex-col relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary-fixed/10 rounded-full blur-3xl"></div>
        <h3 className="font-headline-md text-headline-md text-white mb-6 relative z-10">Pemasukan vs Pengeluaran</h3>
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center relative min-h-[250px] z-10 text-on-surface-variant font-label-md">
            Belum ada data transaksi
          </div>
        ) : (
          <div className="flex-1 flex items-end justify-between gap-2 min-h-[250px] pb-4 border-b border-white/10 relative z-10">
            <canvas ref={barRef} className="chart-glow" />
          </div>
        )}
      </div>
    </div>
  );
}
