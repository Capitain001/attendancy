'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function CollapseSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-3 text-left mb-3"
      >
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 border-t border-dashed border-foreground/15" />
        <svg
          className={`size-3 text-muted-foreground/50 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
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
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
