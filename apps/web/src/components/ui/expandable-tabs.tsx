// @ts-nocheck
"use client";

import * as React from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type TabItem =
  | {
      type?: "tab";
      title: string;
      icon: LucideIcon;
    }
  | {
      type: "separator";
      title?: string;
      icon?: LucideIcon;
    };

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  selected?: number | null;
}

const buttonVariants = {
  initial: {
    gap: 0,
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition: Transition = {
  delay: 0.1,
  type: "spring",
  bounce: 0,
  duration: 0.6,
};

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
  selected: controlledSelected,
}: ExpandableTabsProps) {
  const isControlled = controlledSelected !== undefined;
  const [internalSelected, setInternalSelected] =
    React.useState<number | null>(null);

  const selected = isControlled
    ? controlledSelected
    : internalSelected;

  const outsideClickRef = React.useRef(null);

  useOnClickOutside(outsideClickRef, () => {
    if (!isControlled) {
      setInternalSelected(null);
      onChange?.(null);
    }
  });

  const handleSelect = (index: number) => {
    if (!isControlled) setInternalSelected(index);
    onChange?.(index);
  };

  const Separator = () => (
    <div
      className="mx-0.5 md:mx-0.5 h-[20px] md:h-[20px] w-[1px] shrink-0 bg-border"
      aria-hidden="true"
    />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex items-center rounded-xl md:rounded-xl border bg-background shadow-sm",
        "p-0.5 md:p-0.5 gap-0.5 md:gap-1",
        "overflow-x-auto",
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;

        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={selected === index}
            onClick={() => handleSelect(index)}
            transition={transition}
            className={cn(
              "relative flex shrink-0 items-center rounded-lg md:rounded-lg",
              "px-2 py-1.5 text-xs md:text-[13px] font-medium transition-colors duration-300",
              selected === index
                ? cn("bg-muted md:px-3", activeColor)
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={16} className="md:hidden" />
            <Icon size={17} className="hidden md:block" />

            <AnimatePresence initial={false}>
              {selected === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
