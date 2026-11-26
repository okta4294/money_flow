"use client";

import { useEffect, useRef } from "react";
import type { SakugaInputElement } from "@/types/sakuga-vfx";
import { syncSakugaPalette } from "@/lib/sakuga";

type SakugaInputType = "text" | "email" | "search" | "url" | "tel" | "password";

export interface SakugaInputProps {
  id?: string;
  name?: string;
  label: string;
  placeholder?: string;
  type?: SakugaInputType;
  value: string;
  onValueChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "search" | "url";
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function SakugaInput({
  id,
  name,
  label,
  placeholder,
  type = "text",
  value,
  onValueChange,
  autoComplete = "off",
  inputMode,
  maxLength,
  required,
  disabled,
  autoFocus,
  className = "",
}: SakugaInputProps) {
  const ref = useRef<SakugaInputElement | null>(null);
  const onChangeRef = useRef(onValueChange);

  useEffect(() => {
    onChangeRef.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleFocus = () => {
      syncSakugaPalette(document.documentElement.classList.contains("dark"));
    };

    const handleInput = (e: Event) => {
      const target = e.composedPath?.()[0] as HTMLInputElement | undefined;
      const nextVal =
        target && typeof target.value === "string" ? target.value : el.value;
      onChangeRef.current(nextVal ?? "");
    };

    el.addEventListener("focus", handleFocus);
    el.addEventListener("input", handleInput);
    el.addEventListener("change", handleInput);
    return () => {
      el.removeEventListener("focus", handleFocus);
      el.removeEventListener("input", handleInput);
      el.removeEventListener("change", handleInput);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;

    const syncInnerInput = () => {
      if (cancelled) return false;
      const isUpgraded =
        typeof customElements !== "undefined" &&
        Boolean(customElements.get("sakuga-input"));

      if (!isUpgraded) {
        el.setAttribute("value", value);
        return false;
      }

      if (Object.prototype.hasOwnProperty.call(el, "value")) {
        delete (el as unknown as Record<string, unknown>).value;
      }

      const inner = el.shadowRoot?.querySelector("input");
      if (!inner) return false;

      if (inner.type !== type) inner.type = type;
      if (inputMode) inner.inputMode = inputMode;
      else inner.removeAttribute("inputmode");
      if (typeof maxLength === "number") inner.maxLength = maxLength;
      else inner.removeAttribute("maxlength");
      inner.required = Boolean(required);
      inner.disabled = Boolean(disabled);
      if (inner.value !== value) {
        el.value = value;
      }
      return true;
    };

    if (!syncInnerInput() && typeof customElements !== "undefined") {
      customElements.whenDefined("sakuga-input").then(() => {
        if (!cancelled) {
          requestAnimationFrame(() => {
            syncInnerInput();
          });
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [type, inputMode, maxLength, required, disabled, value]);

  useEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  return (
    <sakuga-input
      ref={ref}
      id={id}
      name={name}
      type={type}
      label={label}
      placeholder={placeholder}
      autocomplete={autoComplete}
      disabled={disabled || undefined}
      className={`sakuga-field ${className}`.trim()}
    />
  );
}
