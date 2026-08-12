"use client";

/**
 * ActionMenu
 * ----------
 * Dropdown contextuel qui remplace le bouton ⋯ en mode Direction.
 *
 * - Sur une ligne UE   : "Ajouter un cours" + "Délier cette UE"
 * - Sur une ligne Cours: "Supprimer ce cours"
 *
 * Utilisé par UEBlock et SortableCourseRow via useEditHandlers().
 * Si le contexte est null (mode lecture), le bouton ⋯ original s'affiche.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type MenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
};

export function ActionMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`size-5 sm:size-6 rounded-sm border border-dashed flex items-center justify-center transition-colors
          ${open
            ? 'border-foreground/40 bg-foreground/5 text-foreground/70'
            : 'border-foreground/20 text-muted-foreground/40 hover:border-foreground/40 hover:text-muted-foreground'
          }`}
      >
        <svg className="size-2.5 sm:size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1 z-30 min-w-[160px] bg-background border border-dashed border-foreground/25 shadow-md py-1"
            onClick={e => e.stopPropagation()}
          >
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors
                  ${item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-foreground/70 hover:bg-foreground/5'
                  }`}
              >
                <span className="size-3.5 flex items-center justify-center shrink-0">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== ICON HELPERS ====================

export const IconPlus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
    <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
  </svg>
);

export const IconUnlink = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round"/>
  </svg>
);

export const IconTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" strokeLinecap="round"/>
    <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);