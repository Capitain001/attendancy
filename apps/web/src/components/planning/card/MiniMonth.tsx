"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, getDay, isSameDay, format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";

interface MiniMonthProps {
  value: Date;
  onChange: (d: Date) => void;
}

const WEEK_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function MiniMonth({ value, onChange }: MiniMonthProps) {
  const [month, setMonth] = useState<Date>(startOfMonth(value));
  const monthStart = startOfMonth(month);
  const offset = (getDay(monthStart) + 6) % 7;
  const days = Array.from({ length: 35 }, (_, i) => addDays(monthStart, i - offset));

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => addDays(startOfMonth(m), -1))}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs font-semibold capitalize">
          {format(month, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          type="button"
          onClick={() => setMonth((m) => addDays(startOfMonth(m), 32))}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEK_LETTERS.map((w, i) => (
          <span key={i} className="text-center text-[10px] text-muted-foreground">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const selected = isSameDay(d, value);
          const inMonth = d.getMonth() === month.getMonth();
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(d)}
              className={cn(
                "flex h-6 items-center justify-center rounded-md text-[11px] transition-colors",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                selected ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
