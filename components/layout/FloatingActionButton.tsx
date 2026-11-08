"use client";

import { motion } from "framer-motion";

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
  return (
    <motion.button
      id={id}
      type="button"
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 sm:w-16 sm:h-16 bg-secondary-container text-on-secondary-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] flex items-center justify-center z-40 rounded-full cursor-pointer"
    >
      <span
        className="material-symbols-outlined text-3xl sm:text-4xl icon-filled"
      >
        {icon}
      </span>
    </motion.button>
  );
}

