"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export type MobileNavItem<To extends string = string> = {
  heading: string;
  to: To;
};

export type MobileNavLinkProps<To extends string = string> = {
  to: To;
  onNavigate: () => void;
  className: string;
  children: ReactNode;
};

export type MobileNavMenuProps<To extends string = string> = {
  navItems: MobileNavItem<To>[];
  renderLink: (props: MobileNavLinkProps<To>) => ReactNode;
};

export function MobileNavMenu<To extends string>({
  navItems,
  renderLink,
}: MobileNavMenuProps<To>) {
  const [isActive, setIsActive] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsActive((value) => !value)}
        aria-label={isActive ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={isActive}
        className="fixed right-0 top-[20%] z-50 flex size-8 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-border bg-background text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-accent"
      >
        <ChevronLeft
          className={`h-5 w-5 transition-transform duration-500 ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            initial={{ x: "calc(100% + 100px)" }}
            animate={{
              x: 0,
              transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
            }}
            exit={{
              x: "calc(100% + 100px)",
              transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
            }}
            className="fixed right-0 top-0 z-40 h-100dvh w-[min(22rem,85vw)] bg-background text-foreground shadow-2xl"
          >
            <div className="flex h-full flex-col justify-between overflow-y-auto pb-8 pt-9">
              <div className="flex flex-col gap-3 px-8">
                <div className="border-b border-border pb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Navigation
                </div>

                <div className="space-y-2 pt-3">
                  {navItems.map((item, index) => {
                    const className =
                      "group flex items-center border-b border-border py-3 transition-opacity hover:opacity-70";
                    const children = (
                      <>
                        <span className="mr-3 font-mono text-xs font-medium text-muted-foreground">
                          {index < 9 ? `0${index + 1}` : index + 1}.
                        </span>
                        <span className="text-base font-medium tracking-[0.1em] text-foreground uppercase">
                          {item.heading}
                        </span>
                      </>
                    );

                    return (
                      <div key={item.to}>
                        {renderLink({
                          to: item.to,
                          onNavigate: () => setIsActive(false),
                          className,
                          children,
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
