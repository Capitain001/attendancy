import { cn } from "@/lib/utils";

export const layout = {
  // Marketing container (max-w large, em padding)
  page: cn(
    "mx-auto w-full",
    "max-w-[1416px]",
    "px-[6em] max-lg:px-[3em] max-md:px-[5vw]"
  ),

  // Dashboard section rhythm
  section: cn("py-6"),

  // Marketing section rhythm
  sectionLg: cn("py-[8em]"),

  // Tight dashboard stack
  stack: cn("flex flex-col gap-4"),

  // Marketing / looser stack
  stackLg: cn("flex flex-col gap-6"),

  center: cn("flex items-center justify-center"),

  centerCol: cn("flex flex-col items-center justify-center"),

  // Dense dashboard grid (auto-fill, gap-1)
  grid: cn("grid w-full gap-1"),

  // Marketing grid (gap 1.5em)
  gridLg: cn("grid w-full gap-[1.5em]"),
} as const;
