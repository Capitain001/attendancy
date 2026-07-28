import { cn } from "@/lib/utils";

export const input = {
  base: cn(
    "min-h-[2.5rem] w-full",
    "rounded-lg",
    "border border-border/30",
    "bg-input-surface text-text-primary",
    "px-4 py-2 text-sm",
    "placeholder:text-text-disabled",
    "transition-all duration-150",
    "focus:border-border focus:ring-1 focus:ring-fill-subtle",
    "focus-visible:outline-none"
  ),

  textarea: cn("min-h-[8rem] pt-3"),

  label: cn("mb-1.5 block text-xs text-text-subtle"),
} as const;
