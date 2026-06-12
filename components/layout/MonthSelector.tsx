"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };

  const next = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  return (
    <div className="flex items-center gap-2">
      <button
        id="month-prev"
        onClick={prev}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center px-2">
        <span className="font-label-md text-on-surface font-semibold whitespace-nowrap">
          {MONTHS[month - 1]} {year}
        </span>
        {isCurrentMonth && (
          <span className="bg-primary-container/20 text-primary-fixed-dim text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-2 hidden sm:inline-block">
            Bulan Ini
          </span>
        )}
      </div>

      <button
        id="month-next"
        onClick={next}
        disabled={isCurrentMonth}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
