// src/components/session/widget/NextSessionWidgetPopover.tsx
"use client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNextSchedule } from "@/hooks/data/sessions/useNextSchedule";
import { NextSessionWidget } from "./NextSessionWidget";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export function NextSessionWidgetPopover({ teacherId }: { teacherId: string }) {
  const { schedule } = useNextSchedule({ teacherId });
  const isActive = schedule?.session?.status === "ACTIVE";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
            "bg-card text-muted-foreground hover:text-foreground hover:border-border",
            isActive && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
          )}
        >
          <Radio className={cn("size-3", isActive && "animate-pulse")} />
          {schedule
            ? isActive
              ? "En cours"
              : new Date(schedule.startTime).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
            : "Aucun cours"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto p-0 border-0 shadow-lg"
      >
        <NextSessionWidget teacherId={teacherId} />
      </PopoverContent>
    </Popover>
  );
}
