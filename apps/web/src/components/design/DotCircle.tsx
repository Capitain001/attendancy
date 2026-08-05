import { cn } from "@/lib/utils"

export interface DotCircleProps {
    children?: React.ReactNode;
    className?: string; // classes du conteneur
    pattern?: string;   // classes appliquées au calque du pattern
  }

export default function DotCircle({
    children,
    className,
    pattern,
  }: DotCircleProps) {
    return (
        <div className={cn("relative size-20 aspect-square rounded-full flex items-center justify-center", className)}>
            <div className={cn("absolute inset-0 dot-pattern bg-[length:8px_8px] rotate-[30deg] rounded-full -z-10", pattern)} />
            {children}
        </div>
    )
}