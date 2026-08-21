"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CollapseItemProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapseItem({
  children,
  defaultOpen = true,
  className,
}: CollapseItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("relative flex flex-col", className)}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center mt-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-6 w-10 items-center justify-center rounded-sm border border-dashed border-foreground/30 bg-transparent text-muted-foreground transition-colors hover:border-foreground/50 hover:bg-foreground/[0.03]"
          aria-label={open ? "Réduire" : "Développer"}
        >
          <svg
            className={`size-3.5 transition-transform duration-200 ${
              open ? "" : "rotate-180"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
