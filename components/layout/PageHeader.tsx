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
        <h2 className="font-display-lg text-2xl sm:text-3xl md:text-4xl text-on-surface tracking-tight uppercase leading-none">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1.5">
            {subtitle}
          </p>
        )}
      </div>

      {(hasMonthSelector || action) && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-end gap-2.5 w-full sm:w-auto shrink-0">
          {hasMonthSelector && (
            <div className="h-11 w-full sm:w-auto bg-surface-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center px-1 rounded-xl shrink-0">
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

