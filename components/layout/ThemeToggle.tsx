"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { syncSakugaPalette } from "@/lib/sakuga";
import type { SakugaToggleElement } from "@/types/sakuga-vfx";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const toggleRef = useRef<SakugaToggleElement | null>(null);
  const pendingDarkRef = useRef<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  useEffect(() => {
    if (mounted) {
      syncSakugaPalette(isDark);
    }
  }, [mounted, isDark]);

  useEffect(() => {
    if (!mounted) return;
    const el = toggleRef.current;
    if (!el) return;

    const handleChange = () => {
      const nextIsDark = el.hasAttribute("checked") || Boolean(el.checked);
      pendingDarkRef.current = nextIsDark;
      setTheme(nextIsDark ? "dark" : "light");
      syncSakugaPalette(nextIsDark);
    };

    el.addEventListener("change", handleChange);
    return () => {
      el.removeEventListener("change", handleChange);
    };
  }, [mounted, setTheme, showLabel]);

  useEffect(() => {
    if (!mounted) return;
    const el = toggleRef.current;
    if (!el) return;

    if (pendingDarkRef.current !== null) {
      if (isDark === pendingDarkRef.current) {
        pendingDarkRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const syncChecked = () => {
      if (cancelled) return;
      if (Object.prototype.hasOwnProperty.call(el, "checked")) {
        delete (el as unknown as Record<string, unknown>).checked;
      }
      if (el.hasAttribute("checked") !== isDark) {
        el.toggleAttribute("checked", isDark);
      }
    };

    syncChecked();

    if (
      typeof customElements !== "undefined" &&
      !customElements.get("sakuga-toggle")
    ) {
      customElements.whenDefined("sakuga-toggle").then(() => {
        if (!cancelled) {
          syncChecked();
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [mounted, isDark, showLabel]);

  if (!mounted) {
    return (
      <div
        className={`${
          showLabel ? "w-full h-12" : "w-[62px] h-11"
        } rounded-xl bg-surface-container border-2 border-outline animate-pulse`}
      />
    );
  }

  const toggleControl = (
    <div
      className={`relative w-[62px] ${
        showLabel ? "h-[34px]" : "min-h-11 h-11"
      } shrink-0 flex items-center justify-center overflow-visible`}
      title={isDark ? "Mode Gelap aktif (klik untuk Mode Terang)" : "Mode Terang aktif (klik untuk Mode Gelap)"}
    >
      <sakuga-toggle
        ref={toggleRef}
        name="theme-dark-mode"
        label="Mode Gelap"
        className="sakuga-theme-toggle"
      />
    </div>
  );

  if (showLabel) {
    return (
      <div className="w-full min-h-12 flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-surface border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] text-on-surface overflow-visible">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container border-2 border-outline flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              {isDark ? "dark_mode" : "light_mode"}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-label-bold font-bold text-xs text-on-surface leading-tight truncate">
              Mode Gelap
            </p>
            <p className="font-body-sm text-[11px] text-on-surface-variant leading-tight truncate mt-0.5">
              {isDark ? "On • Tema Dark" : "Off • Tema Light"}
            </p>
          </div>
        </div>
        {toggleControl}
      </div>
    );
  }

  return toggleControl;
}
