import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  titleClassName?: string;
}

export default function AccordionSection({
  title,
  children,
  defaultOpen = false,
  className,
  titleClassName,
}: Props) {
  return (
    <details
      open={defaultOpen}
      className={cn("group rounded-lg border", className)}
    >
      <summary
        className={cn(
          "cursor-pointer list-none px-4 py-3 font-medium flex items-center justify-between select-none hover:bg-muted/50 transition-colors",
          titleClassName
        )}
      >
        <span className="italic">{title}</span>
        <span className="transition-transform group-open:rotate-180">⌄</span>
      </summary>

      <div className="p-2">{children}</div>
    </details>
  );
}
