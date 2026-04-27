"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

export function MobileShell({ children, className }: Props) {
  return (
    <div
      className={cn(
        "premium-noise relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden bg-[#FFF7ED] pb-10 dark:bg-zinc-950",
        className
      )}
    >
      <div className="premium-grid pointer-events-none absolute inset-0" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-4 pt-4"
      >
        {children}
      </motion.div>
    </div>
  );
}
