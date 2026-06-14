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
    return <div className="w-10 h-10 rounded-full glass-panel border border-white/5 animate-pulse" />;
  }

  const currentTheme = resolvedTheme || theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-10 h-10 rounded-full glass-panel text-on-surface-variant hover:text-primary-fixed hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
      aria-label="Toggle theme"
    >
      <span key={currentTheme} className="flex items-center justify-center w-full h-full">
        {currentTheme === "dark" ? <i className="fa-regular fa-sun text-[20px]"></i> : <i className="fa-regular fa-moon text-[20px]"></i>}
      </span>
    </button>
  );
}
