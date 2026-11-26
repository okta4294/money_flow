"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { syncSakugaPalette } from "@/lib/sakuga";

const SAKUGA_SCRIPTS: Array<{ tag: string; src: string }> = [
  { tag: "sakuga-button", src: "/sakuga-vfx/button.js" },
  { tag: "sakuga-toast", src: "/sakuga-vfx/toast.js" },
  { tag: "sakuga-input", src: "/sakuga-vfx/input.js" },
  { tag: "sakuga-toggle", src: "/sakuga-vfx/toggle.js" },
];

function ensureSakugaScriptsLoaded(nonce?: string) {
  if (typeof window === "undefined" || typeof customElements === "undefined") return;

  for (const { tag, src } of SAKUGA_SCRIPTS) {
    if (customElements.get(tag)) continue;
    const alreadyInjected = document.querySelector(`script[data-sakuga-runtime="${tag}"]`);
    if (alreadyInjected) continue;

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.sakugaRuntime = tag;
    if (nonce) script.nonce = nonce;
    document.body.appendChild(script);
  }
}

export function SakugaToastHost({ nonce }: { nonce?: string }) {
  const { resolvedTheme, theme } = useTheme();

  useEffect(() => {
    ensureSakugaScriptsLoaded(nonce);
  }, [nonce]);

  useEffect(() => {
    const isDark = (resolvedTheme || theme) === "dark";
    syncSakugaPalette(isDark);
  }, [resolvedTheme, theme]);

  return <sakuga-toast id="app-sakuga-toast" duration="2.6" />;
}
