// src/hooks/utils/use-selection.ts
"use client";

import { useCallback, useMemo, useState } from "react";

export function useSelection() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const replace = useCallback((ids: Iterable<string>) => setSelected(new Set(ids)), []);
  const clear = useCallback(() => setSelected(new Set()), []);
  const has = useCallback((id: string) => selected.has(id), [selected]);
  const ids = useMemo(() => [...selected], [selected]);

  return { ids, count: selected.size, has, toggle, replace, clear };
}