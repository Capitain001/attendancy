"use client";

import { useEffect } from "react";
import { CalendarDays, ArrowRight, Check } from "lucide-react";
import type { ScheduleMoveChange } from "../utils";

export type ToastAction = {
  label: string;
  onClick: () => void | Promise<void>;
};

export type ActionScheduleToastProps = {
  open: boolean;
  title: string;
  description?: string;
  change?: ScheduleMoveChange;
  confirm: ToastAction;
  cancel: ToastAction;
  onClose?: () => void;
};

export function ActionScheduleToast({
  open,
  title,
  description,
  change,
  confirm,
  cancel,
  onClose,
}: ActionScheduleToastProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel.onClick();
        onClose?.();
      }
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, cancel, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 pointer-events-none opacity-70 bg-black/10 backdrop-blur-xs" />
      <div className="absolute bottom-6 left-20 w-[360px] rounded-xl border bg-card shadow-lg p-3.5 flex flex-col gap-3">
        {change ? (
          <>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <p className="truncate text-[13px] font-semibold">{change.courseName}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[12px]">
              {change.fromDay && (
                <>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground line-through decoration-muted-foreground/40">{change.fromDay}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{change.fromTime}</span>
                  </div>
                  <ArrowRight className="mx-1 size-4 shrink-0 text-primary" />
                </>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{change.toDay}</span>
                <span className="font-mono text-[11px] text-foreground/70">{change.toTime}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground whitespace-pre-line">{description}</p>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 [&>button]:flex-1">
          <button
            onClick={async () => { await cancel.onClick(); onClose?.(); }}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
          >
            {cancel.label}
          </button>
          <button
            onClick={async () => { await confirm.onClick(); onClose?.(); }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Check className="size-4" />
            {confirm.label}
          </button>
        </div>
      </div>
    </div>
  );
}
