// components/notification/notification-history/states.tsx
"use client";

import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2.5 py-14 text-center text-muted-foreground">
      <Bell className="size-8" strokeWidth={1.5} />
      <p className="text-[13px]">Aucune notification pour le moment</p>
    </div>
  );
}

export function NotificationHistorySkeleton() {
  return (
    <div className="space-y-3 px-2 py-1">
      <Skeleton className="mx-auto h-4 w-28" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-1 py-1">
          <Skeleton className="size-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
