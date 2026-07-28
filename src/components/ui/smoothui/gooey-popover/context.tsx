"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GooeyPopoverContextValue = {
  /** ID of the currently open popover, or null when all are closed. */
  openId: string | null;
  /** Open a specific popover by id. If another is open, it closes first. */
  open: (id: string) => void;
  /** Close whatever is currently open. */
  close: () => void;
  /** Toggle: opens if closed, closes if already this id. */
  toggle: (id: string) => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const GooeyPopoverContext = createContext<GooeyPopoverContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function GooeyPopoverProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const open = useCallback((id: string) => setOpenId(id), []);

  const close = useCallback(() => setOpenId(null), []);

  const toggle = useCallback(
    (id: string) => setOpenId((prev) => (prev === id ? null : id)),
    []
  );

  return (
    <GooeyPopoverContext.Provider value={{ openId, open, close, toggle }}>
      {children}
    </GooeyPopoverContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useGooeyPopover(): GooeyPopoverContextValue {
  const ctx = useContext(GooeyPopoverContext);
  if (!ctx) {
    throw new Error(
      "useGooeyPopover must be used inside <GooeyPopoverProvider>"
    );
  }
  return ctx;
}

/**
 * Scoped hook for a single card/item.
 *
 * @example
 * const { isOpen, toggle } = useGooeyPopoverItem(card.id);
 *
 * <GooeyPopover isOpen={isOpen} onOpenChange={(open) => { if (!open) toggle(); }}>
 *   ...
 * </GooeyPopover>
 */
export function useGooeyPopoverItem(id: string) {
  const { openId, open, close, toggle } = useGooeyPopover();
  return {
    isOpen: openId === id,
    open:   () => open(id),
    close,
    toggle: () => toggle(id),
  };
}
