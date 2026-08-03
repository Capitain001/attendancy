import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function CardBackground({ children, className }: CardBackgroundProps) {
  return (
    <div
      className={cn(
        "w-full    p-1.5 rounded-2xl relative isolate overflow-hidden",
        "bg-white/5 dark:bg-black/90",
        "bg-gradient-to-br from-black/5 to-black/[0.02] dark:from-white/5 dark:to-white/[0.02]",
        "backdrop-blur-xl backdrop-saturate-[180%]",
        "border border-black/10 dark:border-white/10",
        "shadow-[0_8px_16px_rgb(0_0_0_/_0.15)] dark:shadow-[0_8px_16px_rgb(0_0_0_/_0.25)]",
        "will-change-transform translate-z-0",
        className
      )}
    >
      {children}
    </div>
  );
}
