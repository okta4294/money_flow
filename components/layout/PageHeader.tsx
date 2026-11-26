"use client";

import { ReactNode } from "react";
import { MonthSelector } from "./MonthSelector";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  year?: number;
  month?: number;
  onMonthChange?: (year: number, month: number) => void;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  year,
  month,
  onMonthChange,
  action,
  className = "mb-0",
}: PageHeaderProps) {
  const hasMonthSelector =
    typeof year === "number" &&
    typeof month === "number" &&
    typeof onMonthChange === "function";

  return (
    <header
      className={`flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 sm:gap-4 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-on-surface tracking-[-0.025em] leading-[1.08] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1.5 leading-relaxed max-w-[60ch] text-pretty">
            {subtitle}
          </p>
        )}
      </div>

      {(hasMonthSelector || action) && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-end gap-2.5 w-full sm:w-auto shrink-0">
          {hasMonthSelector && (
            <div className="min-h-11 w-full sm:w-auto bg-surface-container comic-subcard flex items-center justify-center p-1 shrink-0">
              <MonthSelector
                year={year}
                month={month}
                onChange={onMonthChange}
              />
            </div>
          )}
          {action}
        </div>
      )}
    </header>
  );
}

