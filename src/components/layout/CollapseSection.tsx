"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapseSectionProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}

export function CollapseSection({
  label,
  children,
  defaultOpen = true,
  count,
}: CollapseSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-3 text-left"
      >
        <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
          {count !== undefined && (
            <span className="ml-1.5 text-muted-foreground/50">({count})</span>
          )}
        </span>
        <div className="flex-1 border-t border-dashed border-foreground/15" />
        <svg
          className={`size-3 flex-shrink-0 text-muted-foreground/50 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
