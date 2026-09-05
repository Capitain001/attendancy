import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridPattern } from '@/components/ui/grid-pattern';
import type { ProgramUECourses, UeCourseDTO } from '@/services/ue/types';

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}


export type MenuAction = {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
};

export function ActionMenu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative z-10">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1 rounded-sm text-muted-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-colors"
        title="Actions"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5"  cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-30 min-w-[160px] bg-background border border-dashed border-foreground/20 shadow-lg overflow-hidden"
          >
             {actions.map((action, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setOpen(false); action.onClick(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors text-left
                  ${action.danger
                    ? 'text-red-400 hover:bg-red-400/10'
                    : 'text-foreground hover:bg-foreground/[0.05]'
                  }`}
              >
                <span className="size-3.5 shrink-0">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void;
  title: string; subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />
          <motion.div key="panel"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={  { opacity: 0, scale: 0.97, y: 8  }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-md border border-dashed border-foreground/25 bg-background shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="relative overflow-hidden px-5 pt-5 pb-4 border-b border-dashed border-foreground/15">
                <GridDeco />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
                    {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
                  </div>
                  <button onClick={onClose}
                    className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3.5">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />
          <motion.div key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={  { opacity: 0, scale: 0.96, y: 6  }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-sm border border-dashed border-red-400/30 bg-background shadow-2xl overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3 flex items-start gap-3">
                <div className="shrink-0 size-8 flex items-center justify-center rounded-full bg-red-400/10 mt-0.5">
                  <svg className="size-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[14px] font-medium">{title}</h3>
                  {description && (
                    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
                  )}
                </div>
              </div>
              <div className="px-5 pb-5 pt-2 flex gap-2 justify-end">
                <button onClick={onClose}
                  className="h-8 px-4 text-[12px] text-muted-foreground border border-dashed border-foreground/20 rounded-sm hover:border-foreground/40 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="h-8 px-4 text-[12px] font-medium bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const IconTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-full">
    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function GridDeco() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-foreground/2 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
        <GridPattern width={22} height={22} x={-12} y={4} strokeDasharray="3"
          className="stroke-foreground/20 absolute inset-0 h-full w-full mix-blend-overlay" />
      </div>
    </div>
  );
}

// CollapseSection — redirigé vers le composant canonique unique
export { CollapseSection } from '@/components/layout/CollapseSection';


export function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="currentColor">
      <circle cx="4" cy="3"  r="1.1" /><circle cx="10" cy="3"  r="1.1" />
      <circle cx="4" cy="7"  r="1.1" /><circle cx="10" cy="7"  r="1.1" />
      <circle cx="4" cy="11" r="1.1" /><circle cx="10" cy="11" r="1.1" />
    </svg>
  );
}

export function OrderHandle({
  order,
  dragProps,
  title,
  isEditing = true,
}: {
  order: string | number;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
  title?: string;
  isEditing?: boolean;
}) {
  if (!isEditing || !dragProps) {
    return (
      <div className="flex items-center justify-center w-full h-full select-none">
        <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground/50">
          {order}
        </span>
      </div>
    );
  }

  return (
    <div
      {...dragProps}
      className="flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing select-none touch-none group relative"
      title={title}
    >
      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground/50
         group-hover:opacity-0 transition-opacity">
        {order}
      </span>
      <DragHandleIcon className="
        size-3 text-muted-foreground/30
        sm:absolute sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity
        block sm:hidden
      " />
      <DragHandleIcon className="
        size-3 text-muted-foreground/30
        hidden sm:block absolute opacity-0 group-hover:opacity-100 transition-opacity
      " />
    </div>
  );
}

export function DropLine() {
  return (
    <div className="absolute inset-x-0 -top-px h-[2px] bg-blue-500 z-20 pointer-events-none">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 size-2 rounded-full bg-blue-500" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 size-2 rounded-full bg-blue-500" />
    </div>
  );
}

export function UEGhost({ ue }: { ue: ProgramUECourses }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 border border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/60 opacity-95 shadow-md">
      <DragHandleIcon className="size-3 text-blue-400 flex-shrink-0" />
      <span className="text-[12px] font-medium text-blue-700 dark:text-blue-300 truncate flex-1">{ue.ue.name}</span>
      <span className="text-[9px] font-mono text-blue-500/60">{ue.ue.code}</span>
    </div>
  );
}

export function CourseGhost({ course }: { course: UeCourseDTO }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 ml-4 border border-dashed border-violet-400 bg-violet-50 dark:bg-violet-950/60 opacity-95 shadow-md">
      <DragHandleIcon className="size-3 text-violet-400 flex-shrink-0" />
      <span className="text-[12px] text-violet-700 dark:text-violet-300 truncate flex-1">{course.name}</span>
      <span className="text-[9px] font-mono text-violet-500/60">{course.code}</span>
    </div>
  );
}




const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ children, className, loading, loadingText, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "h-8 px-3 text-[12px] font-medium border border-dashed border-foreground/30 rounded-sm hover:bg-foreground/[0.05] disabled:opacity-50 transition-colors",
          className
        )}
        {...props}
      >
        {loading ? (loadingText || "Chargement…") : children}
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";

export { ActionButton };
