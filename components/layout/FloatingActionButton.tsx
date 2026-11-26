"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { triggerSakugaPop } from "@/lib/sakuga";

interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
  icon?: string;
  id?: string;
}

export function FloatingActionButton({
  onClick,
  label,
  icon = "add",
  id,
}: FloatingActionButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <motion.button
      id={id}
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={(e) => {
        triggerSakugaPop(e.currentTarget, "impact");
        onClick();
      }}
      aria-label={label}
      title={label}
      className="fixed bottom-24 right-4 sm:right-6 md:bottom-10 md:right-10 w-14 h-14 sm:w-16 sm:h-16 bg-secondary-container text-on-secondary-container border-[3px] border-outline shadow-[4px_4px_0_0_var(--theme-outline)] flex items-center justify-center z-40 rounded-2xl cursor-pointer active-press sketch-hatch"
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-3xl sm:text-4xl icon-filled"
      >
        {icon}
      </span>
    </motion.button>,
    document.body
  );
}
