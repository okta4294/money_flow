"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl bg-surface-container border-2 border-outline animate-pulse" />;
  }

  const currentTheme = resolvedTheme || theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] text-on-surface hover:bg-surface-bright active-press-sm transition-all"
      aria-label="Toggle theme"
    >
      <span key={currentTheme} className="flex items-center justify-center w-full h-full">
        {currentTheme === "dark" ? <i className="fa-regular fa-sun text-[18px]"></i> : <i className="fa-regular fa-moon text-[18px]"></i>}
      </span>
    </button>
  );
}
