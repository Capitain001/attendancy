"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { computeArcs } from "./geometry";
import type { AnalyticRingProps, RingSegment } from "./types";

/**
 * Menu circulaire à onglets : un anneau de segments colorés cliquables autour
 * d'une zone centrale dont le contenu est fourni par l'appelant.
 *
 * @example
 * <AnalyticRing
 *   segments={[
 *     { value: "mood", label: "Humeur", color: "#9CB380", icon: <Heart />, weight: 8.8 },
 *     { value: "sleep", label: "Sommeil", color: "#E5C07B", icon: <Moon /> },
 *   ]}
 *   defaultValue="mood"
 * >
 *   {(active) => (
 *     <>
 *       <span className="text-5xl font-semibold">{active?.label}</span>
 *       <span className="text-sm text-muted-foreground">détail…</span>
 *     </>
 *   )}
 * </AnalyticRing>
 */
export function AnalyticRing({
  segments,
  value,
  defaultValue,
  onValueChange,
  size = 320,
  thickness = 26,
  gap = 6,
  segmentGap = 12,
  iconBox,
  children,
  className,
}: AnalyticRingProps) {
  const ICON_BOX = iconBox ?? Math.round(thickness * 0.7);
  const baseId = useId();
  const firstEnabled = segments.find((s) => !s.disabled)?.value ?? null;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue ?? firstEnabled);
  const activeValue = isControlled ? value! : internal;

  const select = (next: string) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  const arcs = useMemo(
    () => computeArcs(segments.map((s) => s.weight ?? 1), size, thickness, gap, segmentGap),
    [segments, size, thickness, gap, segmentGap]
  );

  const active: RingSegment | null = segments.find((s) => s.value === activeValue) ?? null;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Anneau de segments */}
      <svg
        role="tablist"
        aria-orientation="horizontal"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="col-start-1 row-start-1 block overflow-visible"
      >
        {segments.map((seg, i) => {
          const arc = arcs[i];
          const isActive = seg.value === activeValue;
          const tabId = `${baseId}-tab-${seg.value}`;
          const panelId = `${baseId}-panel-${seg.value}`;

          return (
            <g
              key={seg.value}
              id={tabId}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              aria-disabled={seg.disabled}
              aria-label={seg.label}
              tabIndex={seg.disabled ? -1 : isActive ? 0 : -1}
              onClick={() => !seg.disabled && select(seg.value)}
              onKeyDown={(e) => {
                if (seg.disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(seg.value);
                }
              }}
              className="outline-none focus-visible:opacity-80"
              style={{
                cursor: seg.disabled ? "not-allowed" : "pointer",
                opacity: seg.disabled ? 0.35 : 1,
              }}
            >
              {/* Halo blanc derrière l'arc actif */}
              {isActive && (
                <path
                  d={arc.path}
                  fill="none"
                  stroke="white"
                  strokeWidth={thickness + 6}
                  strokeLinecap="round"
                />
              )}

              {/* Bordure semi-transparente : même couleur, plus large, opacité 0.1 */}
              <path
                d={arc.path}
                fill="none"
                stroke={seg.color}
                strokeOpacity={0.1}
                strokeWidth={(isActive ? thickness + 2 : thickness) + 2}
                strokeLinecap="round"
                style={{ transition: "stroke-width 150ms ease-out" }}
              />

              {/* Arc visible (effet jauge : trait épais, bouts ronds) */}
              <path
                d={arc.path}
                fill="none"
                stroke={seg.color}
                strokeWidth={isActive ? thickness + 3 : thickness}
                strokeLinecap="round"
                style={{ transition: "stroke-width 150ms ease-out" }}
              />

              {/* Cible de clic plus généreuse que le trait */}
              <path d={arc.path} fill="none" stroke="transparent" strokeWidth={thickness + 20} />

              {/* Icône ancrée près du début de l'arc, toujours droite */}
              {seg.icon && (
                <foreignObject
                  x={arc.iconX - ICON_BOX / 2}
                  y={arc.iconY - ICON_BOX / 2}
                  width={ICON_BOX}
                  height={ICON_BOX}
                  style={{ pointerEvents: "none" }}
                >
                  <div className={`flex h-full w-full items-center justify-center text-neutral-800   ${isActive ? "opacity-100" : "opacity-80"} `}>
                    {seg.icon}
                  </div>
                </foreignObject>
              )}

              <title>{seg.label}</title>
            </g>
          );
        })}
      </svg>

      {/* Zone centrale — contenu choisi par l'appelant */}
      <div
        className="col-start-1 row-start-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ width: "62%", height: "62%" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeValue ?? "empty"}
            id={active ? `${baseId}-panel-${active.value}` : undefined}
            role="tabpanel"
            aria-labelledby={active ? `${baseId}-tab-${active.value}` : undefined}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex flex-col items-center justify-center"
          >
            {typeof children === "function" ? children(active) : children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
