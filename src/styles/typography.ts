import { cn } from "@/lib/utils";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const typography = {
  label: cn(
    "text-[11px] font-medium uppercase tracking-widest text-text-subtle"
  ),

  metric: cn("text-2xl font-semibold text-text-primary"),

  sub: cn("text-xs text-text-subtle"),

  body: cn("text-sm text-text-secondary leading-relaxed"),

  small: cn("text-xs text-text-subtle leading-relaxed"),

  // ─── Typographie éditoriale ────────────────────────────────────────────────

  lexical: cn(
    "font-serif ",
    "text-[1.125rem] leading-[1.8]",
    "max-md:text-[1rem]"
  ),

  // ─── Échelle marketing ─────────────────────────────────────────────────────

  display: cn(
    "font-sans font-normal text-text-primary",
    "text-[5em] leading-[1.1]",
    "max-md:text-[3rem]"
  ),

  h1: cn(
    "font-sans font-normal text-text-primary",
    "text-[3.75em] leading-[1.2]",
    "max-md:text-[3rem]"
  ),

  h2: cn(
    "font-normal text-text-primary",
    "text-[3em] leading-[1.2]",
    "max-md:text-[2.5rem]"
  ),

  h3: cn(
    "font-sans font-normal text-text-primary",
    "text-[2.4375em] leading-[1.2]",
    "max-md:text-[2rem]"
  ),

  h4: cn(
    "text-[1.9375em] leading-[1.2]",
    "max-md:text-[1.5rem]"
  ),

  h5: cn(
    "font-sans font-normal text-text-primary",
    "text-[1.5625em] leading-[1.3]",
    "max-md:text-[1.1rem]"
  ),

  h6: cn(
    "font-sans font-normal text-text-primary",
    "text-[1.25em] leading-[1.3]",
    "max-md:text-[0.9rem]"
  ),

  xlarge: cn("font-sans text-text-secondary", "text-[2em] leading-[1.4]"),
  large: cn("font-sans text-text-secondary", "text-[1.5em] leading-[1.6]"),
  medium: cn("font-sans font-medium text-text-secondary", "text-[1rem] leading-[1.6]"),
  xsmall: cn("font-sans text-text-subtle", "text-[0.7rem] leading-[1.6]"),

  bold: "font-bold",
  italic: "italic",
  allcaps: "uppercase",
} as const;