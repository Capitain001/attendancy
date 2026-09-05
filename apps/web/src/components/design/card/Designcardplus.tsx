import React from "react";
import { cn } from "@/lib/utils";

type CornerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface CornerPlusProps extends React.SVGProps<SVGSVGElement> {
  /** Size in pixels of the plus icon */
  size?: number;
  /** Stroke color, accepts any valid CSS color */
  color?: string;
  /** Stroke thickness */
  strokeWidth?: number;
}

export function CornerPlus({
  size = 18,
  color = "currentColor",
  strokeWidth = 1.5,
  className,
  ...props
}: CornerPlusProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M9 1V17M1 9H17"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

const CORNER_POSITION_CLASSES: Record<CornerPosition, string> = {
  "top-left": "-top-2 -left-2",
  "top-right": "-top-2 -right-2",
  "bottom-left": "-bottom-2 -left-2",
  "bottom-right": "-bottom-2 -right-2",
};

const DEFAULT_CORNERS: CornerPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export interface DesignCardPlusProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Which corners get a plus mark. Defaults to all four. */
  corners?: CornerPosition[];
  /** Size in pixels of each plus icon */
  plusSize?: number;
  /** Color of the plus icons */
  plusColor?: string;
  /** Stroke thickness of the plus icons */
  plusStrokeWidth?: number;
  /** Extra classes applied to each corner plus icon */
  cornerClassName?: string;
  /** Extra classes applied to the inner content wrapper */
  contentClassName?: string;
}

export default function DesignCardPlus({
  corners = DEFAULT_CORNERS,
  plusSize = 18,
  plusColor = "white",
  plusStrokeWidth = 1.5,
  cornerClassName,
  className,
  contentClassName = "",
  children,
  ...props
}: DesignCardPlusProps) {
  return (
    <div
      className={cn("relative border border-white/15", className)}
      {...props}
    >
      {corners.map((corner) => (
        <CornerPlus
          key={corner}
          size={plusSize}
          color={plusColor}
          strokeWidth={plusStrokeWidth}
          className={cn(
            "absolute",
            CORNER_POSITION_CLASSES[corner],
            cornerClassName
          )}
        />
      ))}

      <div className={contentClassName}>{children}</div>
    </div>
  );
}
