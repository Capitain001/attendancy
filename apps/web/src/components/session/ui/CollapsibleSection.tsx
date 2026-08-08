"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-2.5 text-left",
          "transition-colors duration-150",
          "hover:bg-muted/40 active:bg-muted/60",
          "rounded-lg"
        )}
      >
        {title ? (
          <span
            className={cn(
              "text-[11px] font-medium uppercase tracking-widest text-muted-foreground",
              "transition-all duration-300",
              open ? "opacity-0" : "opacity-100"
            )}
          >
            {title}
          </span>
        ) : (
          <span />
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)]",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
