// apps/web/src/components/settings/appearance-section.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Palette,
  Type,
  SunMedium,
  Sparkles,
  Play,
  Image as ImageIcon,
} from "lucide-react";

import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AppearanceSectionProps = {
  className?: string;
};

export function AppearanceSection({ className }: AppearanceSectionProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeOptions = [
    { key: "light", label: "Light", variant: "light" },
    { key: "dark", label: "Dark", variant: "dark" },
    { key: "system", label: "Auto", variant: "auto" },
  ] as const;

  return (
    <div className={cn("w-full max-w-lg space-y-6 text-foreground", className)}>
      {/* 1. Appearance Header & Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sun className="size-4" />
          <span>Appearance</span>
        </div>

        {!mounted ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((item) => {
              const isActive = theme === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTheme(item.key)}
                  className="flex flex-col items-center gap-2 group focus:outline-none"
                >
                  <div
                    className={cn(
                      "relative aspect-[4/3] w-full rounded-2xl border-2 p-2.5 transition-all flex flex-col justify-between overflow-hidden",
                      item.variant === "light"
                        ? "bg-zinc-300/40 border-zinc-700/30"
                        : "bg-zinc-900 border-zinc-800",
                      isActive
                        ? "border-zinc-400 ring-2 ring-zinc-500/50"
                        : "opacity-60 group-hover:opacity-100"
                    )}
                  >
                    <div className="flex gap-1">
                      <div className="size-1 rounded-full bg-zinc-500/50" />
                      <div className="size-1 rounded-full bg-zinc-500/50" />
                      <div className="size-1 rounded-full bg-zinc-500/50" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-6 rounded-full shrink-0",
                          item.variant === "light"
                            ? "bg-zinc-400"
                            : "bg-zinc-800 border border-zinc-700"
                        )}
                      />
                      <div className="space-y-1.5 w-full">
                        <div
                          className={cn(
                            "h-1 w-3/4 rounded-full",
                            item.variant === "light"
                              ? "bg-zinc-500"
                              : "bg-zinc-700"
                          )}
                        />
                        <div
                          className={cn(
                            "h-1 w-1/2 rounded-full",
                            item.variant === "light"
                              ? "bg-zinc-400"
                              : "bg-zinc-800"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Réglages en liste épurée (Colonne unique verticale) */}
      <div className="space-y-4 pt-2">
        {/* Accent Color */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Palette className="size-4" />
            <span>Accent color</span>
          </div>
          <ThemeSelector />
        </div>

        {/* Text Size */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Type className="size-4" />
            <span>Text size</span>
          </div>
          <div className="flex items-center gap-3 w-36">
            <span className="text-xs text-muted-foreground font-medium">A</span>
            <div className="relative flex-1 h-1 bg-zinc-800 rounded-full flex items-center">
              <div className="absolute left-1/2 -translate-x-1/2 size-3.5 bg-zinc-200 rounded-full shadow-md cursor-pointer" />
            </div>
            <span className="text-base text-muted-foreground font-medium">A</span>
          </div>
        </div>

        {/* Brightness */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SunMedium className="size-4" />
            <span>Brightness</span>
          </div>
          <div className="relative w-36 h-7 bg-zinc-900 rounded-lg overflow-hidden flex items-center px-3 border border-zinc-800">
            <div className="absolute inset-y-0 left-0 w-[80%] bg-zinc-800/80" />
            <span className="relative text-xs font-medium text-zinc-300">80%</span>
          </div>
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4" />
            <span>Reduce motion</span>
          </div>
          <div className="w-8 h-4.5 bg-zinc-800 rounded-full p-0.5 cursor-pointer">
            <div className="size-3.5 bg-zinc-500 rounded-full" />
          </div>
        </div>

        {/* Auto Play */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Play className="size-4" />
            <span>Auto play</span>
          </div>
          <div className="w-8 h-4.5 bg-zinc-800 rounded-full p-0.5 cursor-pointer">
            <div className="size-3.5 bg-zinc-500 rounded-full" />
          </div>
        </div>

        {/* High Quality Photo */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="size-4" />
            <span>High quality photo</span>
          </div>
          <div className="w-8 h-4.5 bg-zinc-700 rounded-full p-0.5 cursor-pointer flex justify-end">
            <div className="size-3.5 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}