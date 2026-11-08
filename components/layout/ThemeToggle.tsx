"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${
          showLabel ? "w-full h-12" : "w-11 h-11"
        } rounded-xl bg-surface-container border-2 border-outline animate-pulse`}
      />
    );
  }

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-surface border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] text-on-surface hover:bg-surface-bright active-press-sm transition-all text-left cursor-pointer"
        aria-label="Ganti tema"
      >
        <span
          key={currentTheme}
          className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline flex items-center justify-center shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-label-bold text-xs uppercase text-on-surface leading-tight truncate">
            {isDark ? "Mode Malam Aktif" : "Mode Terang Aktif"}
          </p>
          <p className="font-body-sm text-[10px] text-on-surface-variant leading-tight truncate mt-0.5">
            {isDark ? "Ketuk untuk ganti ke Terang" : "Ketuk untuk ganti ke Malam"}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] hover:opacity-90 active-press-sm transition-all cursor-pointer"
      aria-label="Ganti tema"
      title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Malam"}
    >
      <span key={currentTheme} className="flex items-center justify-center w-full h-full">
        <span className="material-symbols-outlined text-[20px]">
          {isDark ? "light_mode" : "dark_mode"}
        </span>
      </span>
    </button>
  );
}
