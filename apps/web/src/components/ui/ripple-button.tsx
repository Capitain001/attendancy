// components/ui/ripple-button.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export const rippleButtonClasses = cn(
  // couleurs dérivées des tokens (s'adaptent au dark mode)
  "[--ripple:color-mix(in_oklab,var(--foreground),var(--background)_15%)]",
  "[--ripple-active:color-mix(in_oklab,var(--foreground),var(--background)_30%)]",

  // base
  "bg-foreground text-background bg-center",
  "cursor-pointer rounded-md px-4.5 py-3 text-base font-medium shadow-xs",
  "transition-[background] duration-700",
  "[-webkit-tap-highlight-color:transparent]",

  // desktop : l'onde s'étend au survol
  "hover:bg-(--ripple) hover:bg-[radial-gradient(circle,transparent_1%,var(--ripple)_1%)] hover:bg-size-[15000%]",

  // tactile
  "[@media(hover:none)]:bg-[radial-gradient(circle,transparent_1%,var(--ripple)_1%)]",
  "[@media(hover:none)]:not-active:bg-size-[15000%]",

  // active
  "active:bg-(--ripple-active) active:bg-size-[100%] active:duration-0",

  // accessibilité / états
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:opacity-50"
)

export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button ref={ref} className={cn(rippleButtonClasses, className)} {...props}>
    {children}
  </button>
))

RippleButton.displayName = "RippleButton"