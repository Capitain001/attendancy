//src/styles/card.ts
import { cn } from "@/lib/utils";

export const card = {
  base: cn(
    "rounded-md",
    "border border-border/30",
    "bg-card text-card-foreground",
    "p-4"
  ),

  soft: cn(
    "rounded-lg",
    "bg-muted text-card-foreground",
    "p-4"
  ),

  stat: cn(
    "rounded-lg ",
    "bg-muted/80 ",
    "p-4",
    "transition-colors"
  ),
  lexical: cn(
    "rounded-lg border border-dashed border-border/60",
    "bg-card/10",
        "hover:bg-card/15",
    "p-4",
    "transition-colors"
  ),
  statInteractive: cn(
    "rounded-lg",
    "bg-muted/80",
    "p-4",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-muted",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "focus-visible:ring-offset-2"
  ),

  interactive: cn(
    "group relative block overflow-hidden",
    "rounded-lg",
    "border border-border/30",
    "bg-card text-card-foreground",
    "p-4 cursor-pointer",
    "transition-all duration-200 ease-out",
    "hover:border-border/60",
    "hover:shadow-[var(--shadow-card)]",
    "hover:bg-fill-hover"
  ),

  glass: cn(
    "rounded-lg",
    "border border-border/30",
    "bg-background/60",
    "backdrop-blur-xl",
    "p-4"
  ),

  elevated: cn(
    "rounded-lg",
    "bg-card",
    "shadow-[var(--shadow-card)]",
    "p-4"
  ),

  media: cn(
    "relative overflow-hidden",
    "rounded-lg"
  ),
} as const;
