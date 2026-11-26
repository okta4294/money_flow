"use client";


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
    <div className="flex items-center justify-between sm:justify-center gap-1.5 w-full sm:w-auto">
      <button
        id="month-prev"
        type="button"
        onClick={prev}
        aria-label="Bulan sebelumnya"
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-bright text-on-surface border-2 border-outline transition-colors active-press-sm cursor-pointer shrink-0"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-lg leading-none">
          chevron_left
        </span>
      </button>

      <div className="flex items-center justify-center px-3 min-w-[136px]">
        <span className="font-label-bold font-bold text-sm text-on-surface tracking-tight whitespace-nowrap tabular-nums">
          {MONTHS[month - 1]} {year}
        </span>
      </div>

      <button
        id="month-next"
        type="button"
        onClick={next}
        disabled={isCurrentMonth}
        aria-label="Bulan berikutnya"
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-bright text-on-surface border-2 border-outline transition-colors disabled:opacity-35 disabled:cursor-not-allowed active-press-sm cursor-pointer shrink-0"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-lg leading-none">
          chevron_right
        </span>
      </button>
    </div>
  );
}
