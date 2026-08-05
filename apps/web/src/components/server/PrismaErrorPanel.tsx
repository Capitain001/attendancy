"use client";

import { useEffect, useState } from "react";
import type { PrismaDebugPayload } from "@/utils/server/debug";

const COOKIE = "__prisma_debug";

export function PrismaErrorPanel() {
  const [error, setError] = useState<PrismaDebugPayload | null>(null);

  useEffect(() => {
    const entry = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE}=`));
    if (!entry) return;
    try {
      setError(JSON.parse(decodeURIComponent(entry.slice(COOKIE.length + 1))));
    } catch {}
  }, []);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-red-950 border border-red-700 text-red-100 p-4 rounded-xl font-mono text-sm max-w-sm shadow-xl">
      <p className="font-bold text-base mb-2">🔥 Prisma {error.code}</p>
      <dl className="space-y-0.5">
        <div className="flex gap-2">
          <dt className="opacity-60 w-16 shrink-0">model</dt>
          <dd>{error.model}</dd>
        </div>
        {error.target && (
          <div className="flex gap-2">
            <dt className="opacity-60 w-16 shrink-0">target</dt>
            <dd>{error.target}</dd>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <dt className="opacity-60 w-16 shrink-0 text-xs">msg</dt>
          <dd className="text-xs opacity-80 break-all">{error.message}</dd>
        </div>
      </dl>
    </div>
  );
}
