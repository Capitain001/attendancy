import * as React from "react"

import { cn } from "@/lib/utils"

export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
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

        // tactile : l'état "onde étendue" devient l'état de repos,
        // pour que le relâchement ait quelque chose à animer
        "[@media(hover:none)]:bg-[radial-gradient(circle,transparent_1%,var(--ripple)_1%)]",
        "[@media(hover:none)]:not-active:bg-size-[15000%]",

        // active : flash instantané, l'onde se joue au relâchement
        "active:bg-(--ripple-active) active:bg-size-[100%] active:duration-0",

        // accessibilité / états
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})

RippleButton.displayName = "RippleButton"