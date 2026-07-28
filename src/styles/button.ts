import { cn } from "@/lib/utils";

export const button = {
  primary: cn(
    "inline-flex items-center justify-center text-center",
    "rounded-md",
    "px-5 py-2 text-sm font-normal",
    "bg-primary text-primary-foreground",
    "transition-all duration-300 ease-out",
    "hover:shadow-[0_0_0_3px_var(--color-fill-subtle)]",
    "active:bg-primary-active active:shadow-none",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-fill-subtle)]"
  ),

  secondary: cn(
    "inline-flex items-center justify-center text-center",
    "rounded-md",
    "px-4 py-2 text-sm font-normal",
    "bg-muted text-text-secondary",
    "border border-border/30",
    "transition-all duration-200 ease-out",
    "hover:border-border/60 hover:bg-card",
    "active:bg-muted",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
  ),

  ghost: cn(
    "inline-flex items-center justify-center text-center",
    "rounded-md",
    "px-4 py-2 text-sm font-normal",
    "text-text-subtle",
    "transition-all duration-200",
    "hover:bg-fill-faint hover:text-text-secondary"
  ),

  fullWidth: "w-full",
} as const;
