// apps/web/src/components/theme/theme-selector.tsx
"use client";

import { useThemeSelector } from "@/hooks/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ThemeSelectorProps = {
  className?: string;
};

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { mounted, options } = useThemeSelector();

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {options.map((option) => (
          <Skeleton key={option.name} className="size-6 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex items-center gap-3", className)}>
        {options.map((option) => (
          <Tooltip key={option.name}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={option.select}
                className="relative flex size-6 items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ backgroundColor: option.color }}
              >
                {option.isActive && (
                  <span className="size-2 rounded-full bg-white shadow-sm" />
                )}
                <span className="sr-only">{option.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {option.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}