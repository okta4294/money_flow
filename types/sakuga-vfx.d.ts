import type { DetailedHTMLProps, HTMLAttributes } from "react";

export interface SakugaToastElement extends HTMLElement {
  show: (text?: string) => void;
  hide: () => void;
  readonly open: boolean;
}

export interface SakugaButtonElement extends HTMLElement {
  disabled: boolean;
  readonly primary: boolean;
  impact: () => void;
  done: (hold?: number) => void;
}

export interface SakugaInputElement extends HTMLElement {
  value: string;
  disabled: boolean;
}

export interface SakugaToggleElement extends HTMLElement {
  checked: boolean;
  disabled: boolean;
  readonly value: string;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sakuga-toast": DetailedHTMLProps<
        HTMLAttributes<SakugaToastElement> & {
          duration?: string | number;
          message?: string;
        },
        SakugaToastElement
      >;
      "sakuga-button": DetailedHTMLProps<
        HTMLAttributes<SakugaButtonElement> & {
          variant?: "primary" | "secondary";
          type?: "button" | "submit";
          disabled?: boolean;
        },
        SakugaButtonElement
      >;
      "sakuga-input": DetailedHTMLProps<
        HTMLAttributes<SakugaInputElement> & {
          type?: "text" | "email" | "search" | "url" | "tel" | "password";
          value?: string;
          label?: string;
          placeholder?: string;
          name?: string;
          autocomplete?: string;
          disabled?: boolean;
        },
        SakugaInputElement
      >;
      "sakuga-toggle": DetailedHTMLProps<
        HTMLAttributes<SakugaToggleElement> & {
          label?: string;
          name?: string;
          checked?: boolean;
          disabled?: boolean;
        },
        SakugaToggleElement
      >;
    }
  }
}
