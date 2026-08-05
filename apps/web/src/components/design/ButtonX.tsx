"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BackgroundPattern } from "@/components/design/BackgroundPattern";

interface ButtonXProps extends React.ComponentProps<typeof Button> {
  children?: React.ReactNode;
  href?: string;
}

export function ButtonX({
  children,
  className,
  href,
  ...props
}: ButtonXProps) {
  return (
    <Button
      // asChild={!!href}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card px-4 py-2",
        "text-sm font-medium text-foreground",
        "transition-all duration-200",
        "hover:bg-background/70 hover:backdrop-blur-sm",
        "active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <>
        {/* Background UNIQUE */}
        <BackgroundPattern className="absolute inset-0 opacity-20 dark:opacity-10" />

        {href ? (
          <Link href={href} className="relative z-10 flex items-center gap-2">
            {children}
          </Link>
        ) : (
          <span className="relative z-10 flex items-center gap-2">
            {children}
          </span>
        )}
      </>
    </Button>
  );
}