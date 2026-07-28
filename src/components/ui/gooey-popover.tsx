"use client";

import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useClickOutside } from "@/hooks";

const MEASURE_DELAY_SHORT = 100;
const MEASURE_DELAY_LONG = 500;

const DEFAULT_TRIGGER_SIZE = 44;
const DEFAULT_CONTENT_WIDTH = 240;
const DEFAULT_SIDE_OFFSET = 24;
const DEFAULT_SPEED = 0.25;

const GOO_STD_DEVIATION = 10;
const GOO_MATRIX_ALPHA_MULTIPLIER = 24;
const GOO_MATRIX_ALPHA_OFFSET = -10;

const CONTENT_BORDER_RADIUS = 18;

export type GooeyPopoverProps = {
  children: React.ReactNode;
  trigger?: React.ReactNode;

  triggerSize?: number;

  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  side?: "top" | "bottom";
  sideOffset?: number;

  contentWidth?: number;
  speed?: number;

  bgClassName?: string;
  contentClassName?: string;
  className?: string;
};

export default function GooeyPopover({
  children,
  trigger,

  triggerSize = DEFAULT_TRIGGER_SIZE,

  isOpen: controlledIsOpen,
  onOpenChange,

  side = "top",
  sideOffset = DEFAULT_SIDE_OFFSET,

  contentWidth = DEFAULT_CONTENT_WIDTH,
  speed = DEFAULT_SPEED,

  bgClassName = cn(
    "bg-popover/95",
    "border border-border/60",
    "shadow-xl shadow-black/5 dark:shadow-black/20",
    "backdrop-blur-xl",
  ),

  contentClassName,
  className,
}: GooeyPopoverProps) {
  const filterId = useId();

  const isControlled = controlledIsOpen !== undefined;

  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = isControlled
    ? controlledIsOpen
    : internalIsOpen;

  const [isVisible, setIsVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const measureRef = useRef<HTMLDivElement>(null);

  const filteredContentRef = useRef<HTMLDivElement>(null);

  const unfilteredContentRef = useRef<HTMLDivElement>(null);

  const innerContentRef = useRef<HTMLDivElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [contentHeight, setContentHeight] = useState(0);

  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState(false);

  // ────────────────────────────────────────────────────────────────────────────
  // Reduced motion
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const mq = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mq.addEventListener("change", handler);

    return () => {
      mq.removeEventListener("change", handler);
    };
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // Open state
  // ────────────────────────────────────────────────────────────────────────────

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(open);
      }

      onOpenChange?.(open);
    },
    [isControlled, onOpenChange],
  );

  const handleClose = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, setIsOpen]);

  useClickOutside(containerRef, handleClose);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, setIsOpen]);

  // ────────────────────────────────────────────────────────────────────────────
  // Measure content
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const measureHeight = () => {
      if (!measureRef.current) {
        return;
      }

      const height = measureRef.current.scrollHeight;

      if (height > 0) {
        setContentHeight(height);
      }
    };

    const timeout1 = setTimeout(
      measureHeight,
      MEASURE_DELAY_SHORT,
    );

    const timeout2 = setTimeout(
      measureHeight,
      MEASURE_DELAY_LONG,
    );

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [children]);

  // ────────────────────────────────────────────────────────────────────────────
  // Geometry
  // ────────────────────────────────────────────────────────────────────────────

  const triggerRadius = triggerSize / 2;

  const translateY =
    side === "top"
      ? -(contentHeight + sideOffset)
      : triggerSize + sideOffset;

  const contentLeft =
    triggerRadius - contentWidth / 2;

  // ────────────────────────────────────────────────────────────────────────────
  // GSAP animation
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (contentHeight === 0) {
      return;
    }

    timelineRef.current?.kill();

    const filteredTarget =
      filteredContentRef.current;

    const unfilteredTarget =
      unfilteredContentRef.current;

    const innerTarget = innerContentRef.current;

    if (!(unfilteredTarget && innerTarget)) {
      return;
    }

    // Reduced motion
    if (prefersReducedMotion) {
      if (isOpen) {
        setIsVisible(true);

        gsap.set(unfilteredTarget, {
          width: contentWidth,
          height: contentHeight,
          borderRadius: CONTENT_BORDER_RADIUS,
          x: contentLeft,
          y: translateY,
          opacity: 1,
        });

        gsap.set(innerTarget, {
          opacity: 1,
          y: 0,
        });
      } else {
        gsap.set(unfilteredTarget, {
          width: triggerSize,
          height: triggerSize,
          borderRadius: triggerRadius,
          x: 0,
          y: 0,
          opacity: 0,
        });

        gsap.set(innerTarget, {
          opacity: 0,
          y: 0,
        });

        setIsVisible(false);
      }

      return;
    }

    // OPEN
    if (isOpen) {
      setIsVisible(true);

      const startProps = {
        width: triggerSize,
        height: triggerSize,
        borderRadius: triggerRadius,
        x: 0,
        y: 0,
        opacity: 1,
      };

      if (filteredTarget) {
        gsap.set(filteredTarget, startProps);
      }

      gsap.set(unfilteredTarget, startProps);

      gsap.set(innerTarget, {
        opacity: 0,
        y: 16,
      });

      const tl = gsap.timeline();

      if (filteredTarget) {
        tl.to(
          filteredTarget,
          {
            width: contentWidth,
            height: contentHeight,
            borderRadius: 0,
            x: contentLeft,
            y: translateY,
            duration: speed,
            ease: "power1.in",
          },
          0,
        );
      }

      tl.to(
        unfilteredTarget,
        {
          width: contentWidth,
          height: contentHeight,
          borderRadius: CONTENT_BORDER_RADIUS,
          x: contentLeft,
          y: translateY,
          duration: speed,
          ease: "power1.in",
        },
        0,
      );

      tl.to(
        innerTarget,
        {
          opacity: 1,
          y: 0,
          duration: speed * 0.75,
          ease: "power1.out",
        },
        speed * 0.575,
      );

      timelineRef.current = tl;
    }

    // CLOSE
    else {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
        },
      });

      tl.to(innerTarget, {
        opacity: 0,
        y: 8,
        duration: speed * 0.4,
        ease: "power1.in",
      });

      const targets = [
        filteredTarget,
        unfilteredTarget,
      ].filter(Boolean);

      tl.to(
        targets,
        {
          width: triggerSize,
          height: triggerSize,
          borderRadius: triggerRadius,
          x: 0,
          y: 0,
          duration: speed,
          ease: "power1.in",
        },
        speed * 0.2,
      );

      tl.to(
        targets,
        {
          opacity: 0,
          duration: speed * 0.3,
          ease: "power1.in",
        },
        `-=${speed * 0.3}`,
      );

      timelineRef.current = tl;
    }

    return () => {
      timelineRef.current?.kill();
    };
  }, [
    isOpen,
    contentHeight,
    contentWidth,
    triggerSize,
    triggerRadius,
    contentLeft,
    translateY,
    speed,
    prefersReducedMotion,
  ]);

  // ────────────────────────────────────────────────────────────────────────────
  // Default trigger
  // ────────────────────────────────────────────────────────────────────────────

  const defaultTriggerIcon = (
    <svg
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={20}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn("relative inline-flex", className)}
      ref={containerRef}
    >
      {/* SVG goo filter */}
      <svg
        aria-hidden="true"
        className="absolute"
        style={{ width: 0, height: 0 }}
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur
              in="SourceGraphic"
              result="blur"
              stdDeviation={GOO_STD_DEVIATION}
            />

            <feColorMatrix
              in="blur"
              result="goo"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${String(GOO_MATRIX_ALPHA_MULTIPLIER)} ${String(GOO_MATRIX_ALPHA_OFFSET)}`}
            />

            <feComposite
              in="SourceGraphic"
              in2="goo"
              operator="atop"
            />
          </filter>
        </defs>
      </svg>

      {/* Measurement */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        ref={measureRef}
        style={{
          width: contentWidth,
          top: -9999,
          left: -9999,
          visibility: "hidden",
        }}
      >
        <div
          className={cn("p-4", contentClassName)}
        >
          {children}
        </div>
      </div>

      {/* Filtered goo layer */}
      {!prefersReducedMotion &&
        (isOpen || isVisible) && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              filter: `url(#${filterId})`,
            }}
          >
            {/* trigger blob */}
            <div
              className={cn(
                "absolute rounded-full",
                bgClassName,
              )}
              style={{
                width: triggerSize,
                height: triggerSize,
                top: 0,
                left: 0,
              }}
            />

            {/* morphing content */}
            <div
              className={cn(
                "absolute",
                bgClassName,
              )}
              ref={filteredContentRef}
              style={{
                top: 0,
                left: 0,
                width: triggerSize,
                height: triggerSize,
                borderRadius: triggerRadius,
                opacity: 0,
              }}
            />
          </div>
        )}

      {/* Trigger */}
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "relative z-10",
          "flex items-center justify-center",
          "rounded-full",

          "text-foreground",
          "transition-all duration-200",
          "hover:scale-105",
          "active:scale-95",

          bgClassName,
        )}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: triggerSize,
          height: triggerSize,
        }}
        type="button"
      >
        {trigger ?? defaultTriggerIcon}
      </button>

      {/* Content */}
      {(isOpen || isVisible) && (
        <div
          className={cn(
            "absolute z-10 overflow-hidden",

            "text-foreground",
            "backdrop-blur-xl",

            bgClassName,
          )}
          ref={unfilteredContentRef}
          role="dialog"
          style={{
            top: 0,
            left: 0,
            width: triggerSize,
            height: triggerSize,
            borderRadius: triggerRadius,
            opacity: 0,
          }}
        >
          <div
            className={cn(
              "p-4",
              contentClassName,
            )}
            ref={innerContentRef}
            style={{
              opacity: 0,
              transform: "translateY(16px)",
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}


/* DEMO

"use client"
import GooeyPopover from '@/components/ui/gooey-popover'
import UserIcon from '@/components/users/UserIcon'

import { useState } from "react";

export default function page() {
  type Member = {
    id: string;
    name: string;
    role: string;
    email: string;
    avatarUrl?: string;
    online: boolean;
  };

  const MEMBERS: Member[] = [
    {
      id: "u1",
      name: "Ama Dede",
      role: "Étudiante L3",
      email: "a.dede@uni.edu",
      online: true,
    },
    {
      id: "u2",
      name: "Kofi Mensah",
      role: "Lead frontend",
      email: "k.mensah@uni.edu",
      online: true,
    },
    {
      id: "u3",
      name: "Fatou Balde",
      role: "Designer UI",
      email: "f.balde@uni.edu",
      online: false,
    },
    {
      id: "u4",
      name: "Yao Agbeko",
      role: "Dev backend",
      email: "y.agbeko@uni.edu",
      online: true,
    },
  ];

  const member = MEMBERS[0]; // Exemple avec le premier membre

  const [open, setOpen] = useState(false)
  return (
    <div className='m-20 flex justify-center'>
      <div className="relative p-10">
        <GooeyPopover
          isOpen={open}
          onOpenChange={setOpen}
          trigger={
            <UserIcon
              id={member.id}
              name={member.name}
              avatarUrl={member.avatarUrl}

            />
          }
          triggerSize={44}
          contentWidth={220}
        >
          <div>
            Input
          </div>
        </GooeyPopover>
      </div>
    </div>
  )
}


*/