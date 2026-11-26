"use client";

interface SakugaPalette {
  fill: string;
  shade: string;
  line: string;
  accent: string;
  ink: string;
  sfx: [string, string];
}

interface SakugaFXApi {
  P: SakugaPalette;
  calm: boolean;
  at: (el: Element, fx?: number, fy?: number) => { x: number; y: number; w: number; h: number };
  burst: (x: number, y: number, opts?: Record<string, unknown>) => void;
  puff: (x: number, y: number, opts?: Record<string, unknown>) => void;
  ticks: (x: number, y: number, opts?: Record<string, unknown>) => void;
  kira: (x: number, y: number, opts?: Record<string, unknown>) => void;
  shards: (x: number, y: number, opts?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    SakugaFX?: SakugaFXApi;
  }
}

export function syncSakugaPalette(isDark: boolean): void {
  if (typeof window === "undefined" || !window.SakugaFX?.P) return;
  const p = window.SakugaFX.P;
  if (isDark) {
    p.fill = "#2a2d3e";
    p.shade = "#ffc107";
    p.line = "#e2dacb";
    p.accent = "#ff8585";
    p.ink = "#fdfbf7";
    p.sfx = ["#ffc107", "#191b26"];
  } else {
    p.fill = "#fdfbf7";
    p.shade = "#efc44e";
    p.line = "#2b2720";
    p.accent = "#c84332";
    p.ink = "#24211c";
    p.sfx = ["#24211c", "#fdfbf7"];
  }
}

export function showSakugaToast(message: string): void {
  if (typeof window === "undefined") return;

  const invoke = () => {
    const isDark = document.documentElement.classList.contains("dark");
    syncSakugaPalette(isDark);

    const el = document.getElementById("app-sakuga-toast") as
      | (HTMLElement & { show?: (text?: string) => void })
      | null;
    if (el && typeof el.show === "function") {
      el.show(message);
      return true;
    }
    return false;
  };

  if (invoke()) return;

  if (typeof customElements !== "undefined") {
    customElements.whenDefined("sakuga-toast").then(() => {
      invoke();
    });
  }
}

export function triggerSakugaPop(target: Element | null | undefined, variant: "impact" | "sparkle" = "impact"): void {
  if (typeof window === "undefined" || !target) return;
  const fx = window.SakugaFX;
  if (!fx || fx.calm) return;

  const isDark = document.documentElement.classList.contains("dark");
  syncSakugaPalette(isDark);

  const c = fx.at(target);
  if (variant === "sparkle") {
    fx.kira(c.x, c.y - c.h * 0.2, { r: 16, life: 0.7 });
    fx.ticks(c.x, c.y - c.h * 0.45, { dir: -Math.PI / 2, n: 3, r: 6, len: 14, fan: 0.6, life: 0.45 });
    return;
  }

  fx.ticks(c.x - c.w * 0.35, c.y - c.h * 0.4, { dir: -2.3, n: 2, r: 5, len: 16, life: 0.4 });
  fx.ticks(c.x + c.w * 0.35, c.y - c.h * 0.4, { dir: -0.8, n: 2, r: 5, len: 16, life: 0.4 });
  fx.puff(c.x - c.w * 0.4, c.y + c.h * 0.2, { size: 10, n: 4, vx: -28, vy: -12, life: 0.65 });
  fx.puff(c.x + c.w * 0.4, c.y + c.h * 0.2, { size: 10, n: 4, vx: 28, vy: -12, life: 0.65 });
  fx.shards(c.x, c.y, { n: 6, speed: 170, size: 6, life: 0.65, arc: 6.28, grav: 280 });
}
