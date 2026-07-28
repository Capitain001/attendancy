"use client";

// Primitives de table « record » — réplique fidèle du formalisme Twenty
// (twenty.com playground : table-ui), portée en Tailwind sur tokens de thème.
// Proportions exactes (ligne 32px, police 13px, padding 8px, ViewBar 40px,
// chip 20px, avatar 16px, footer Calculate). AUCUNE couleur en dur : surfaces,
// bordures et texte = tokens (bg-card, border-border, text-foreground,
// text-muted-foreground, foreground/[0.04]…). Les teintes d'accent (avatar/tag)
// restent pilotées par la donnée (inline), comme dans le repo.

import type { ComponentType, ReactNode } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ListFilter,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Align = "left" | "right";
type SortDir = "asc" | "desc" | null;
type IconType = ComponentType<{ className?: string }>;

/* ─────────────────────────── shell ─────────────────────────── */

export function RecordTable({ children, className }: { children: ReactNode; className?: string }) {
  // w-full + min-w-0 : la table reste dans son conteneur (le scroll-x vit dans
  // RecordScroll, pas sur la page).
  return (
    <div className={cn("w-full min-w-0 overflow-hidden rounded-lg border bg-card text-[13px] text-foreground", className)}>
      {children}
    </div>
  );
}

export function RecordScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("scrollbar-fine overflow-auto", className)}>
      <table className="w-full border-separate border-spacing-0">{children}</table>
    </div>
  );
}

/* ─────────────────────────── view bar ─────────────────────────── */

const BAR_BASE = "flex h-10 items-center justify-between gap-2 pl-3 pr-2";
const BAR_BTN =
  "inline-flex h-7 items-center gap-1 rounded px-2 text-muted-foreground transition-colors hover:bg-foreground/[0.04]";

export function ViewBar({
  name,
  count,
  search,
  actions = true,
  extra,
  filter,
}: {
  name: string;
  count?: number;
  search?: { value: string; onValueChange: (v: string) => void; placeholder?: string };
  actions?: boolean;
  /** Actions supplémentaires (ex. bouton Éditer), placées avec Trier/Options. */
  extra?: ReactNode;
  /** Rend le bouton Filtrer interactif : dropdown + badge du nombre de filtres actifs. */
  filter?: { content: ReactNode; activeCount?: number };
}) {
  return (
    <div className={cn(BAR_BASE, "border-b border-border")}>
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate font-medium text-foreground">{name}</span>
        {count !== undefined && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-foreground/[0.04] px-1 text-[11px] text-muted-foreground">
            {count}
          </span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground/70" />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {search && (
          <span className={cn(BAR_BTN, "cursor-text")}>
            <Search className="size-3.5" />
            <input
              className="w-40 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70"
              placeholder={search.placeholder ?? "Rechercher"}
              value={search.value}
              onChange={(e) => search.onValueChange(e.target.value)}
            />
          </span>
        )}
        {actions && (
          <>
            {filter ? (
              <Popover>
                <PopoverTrigger
                  className={cn(BAR_BTN, filter.activeCount && "bg-foreground/[0.06] text-foreground")}
                >
                  <ListFilter className="size-3.5" /> Filtrer
                  {!!filter.activeCount && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {filter.activeCount}
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  {filter.content}
                </PopoverContent>
              </Popover>
            ) : (
              <button type="button" className={BAR_BTN}><ListFilter className="size-3.5" /> Filtrer</button>
            )}
            <button type="button" className={BAR_BTN}><ArrowUpDown className="size-3.5" /> Trier</button>
            {extra}
            <button type="button" className={BAR_BTN}><MoreHorizontal className="size-3.5" /> Options</button>
          </>
        )}
      </div>
    </div>
  );
}

/** Barre du bas (même chrome que la ViewBar, bordure en haut). */
export function RecordBottomBar({ children }: { children: ReactNode }) {
  return <div className={cn(BAR_BASE, "border-t border-border text-[11px] text-muted-foreground")}>{children}</div>;
}

export function RecordBarButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        BAR_BTN,
        active && "bg-foreground/[0.06] text-foreground",
        "disabled:opacity-40 disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────── header ─────────────────────────── */

const TH_BASE =
  "sticky top-0 z-10 h-8 border-b border-r border-border bg-card px-2 text-left align-middle " +
  "font-medium text-muted-foreground/70 whitespace-nowrap";

const SORT_GLYPH: Record<"asc" | "desc" | "none", string> = { asc: "↑", desc: "↓", none: "↕" };

export function HeaderCell({
  label,
  icon: Icon,
  align = "left",
  pinned,
  width,
  sortable,
  sortDirection = null,
  onSort,
  leading,
  trailing,
}: {
  label?: string;
  icon?: IconType;
  align?: Align;
  pinned?: boolean;
  width?: number;
  sortable?: boolean;
  sortDirection?: SortDir;
  onSort?: () => void;
  leading?: ReactNode;
  /** Contenu en fin de cellule (ex. bouton masquer en mode édition). */
  trailing?: ReactNode;
}) {
  return (
    <th
      className={cn(TH_BASE, pinned && "sticky left-0 z-20", sortable && "cursor-pointer select-none hover:text-muted-foreground")}
      style={width ? { width, minWidth: width } : undefined}
      onClick={sortable ? onSort : undefined}
    >
      <div className={cn("flex h-full items-center gap-1", align === "right" && "justify-end")}>
        {leading}
        {Icon && <Icon className="size-3.5" />}
        {label && <span>{label}</span>}
        {sortable && <span className="ml-0.5 text-[11px] text-muted-foreground/70">{SORT_GLYPH[sortDirection ?? "none"]}</span>}
        {trailing && <span className="ml-auto">{trailing}</span>}
      </div>
    </th>
  );
}

/* ─────────────────────────── rows & cells ─────────────────────────── */

export function RecordRow({
  children,
  selected,
  onClick,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      data-selected={selected ? "true" : undefined}
      onClick={onClick}
      className={cn("group", onClick && "cursor-pointer", className)}
    >
      {children}
    </tr>
  );
}

// Fond posé sur la cellule pour que la colonne épinglée suive hover/sélection.
const TD_BASE =
  "h-8 border-b border-r border-border bg-card px-2 align-middle whitespace-nowrap " +
  "transition-colors group-hover:bg-muted group-data-[selected=true]:bg-muted";

export function Cell({
  children,
  align = "left",
  pinned,
  width,
  className,
  onClick,
}: {
  children: ReactNode;
  align?: Align;
  pinned?: boolean;
  width?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td
      onClick={onClick}
      style={width ? { width, minWidth: width } : undefined}
      className={cn(TD_BASE, align === "right" && "text-right", pinned && "sticky left-0 z-10", className)}
    >
      {children}
    </td>
  );
}

export function PinnedCellContent({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-w-0 items-center gap-1">{children}</div>;
}

/* ─────────────────────────── atoms ─────────────────────────── */

export function Checkbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  label?: string;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange();
      }}
      className={cn(
        "grid size-3.5 shrink-0 cursor-pointer place-items-center rounded-[3px] border transition-colors",
        checked
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-muted-foreground/50 text-transparent group-hover:border-muted-foreground",
      )}
    >
      <Check className="size-2.5" strokeWidth={3} />
    </span>
  );
}

export function Avatar({
  initials,
  tone,
  round,
}: {
  initials: string;
  tone: string;
  round?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[2px] text-[9px] font-medium leading-none text-white",
        round && "rounded-full",
      )}
      style={{ background: tone }}
    >
      {initials}
    </span>
  );
}

/** Chip entité (1re colonne) : avatar carré + libellé, fond gris très subtil. */
export function EntityChip({
  label,
  tone,
  initials,
  href,
  trailing,
}: {
  label: string;
  tone: string;
  initials: string;
  href?: ReactNode; // si fourni, remplace le <span> du label (ex. <Link>)
  trailing?: ReactNode;
}) {
  return (
    <span className="inline-flex h-5 min-w-0 max-w-full items-center gap-1 rounded bg-foreground/[0.04] px-1">
      <Avatar initials={initials} tone={tone} />
      {href ?? <span className="truncate">{label}</span>}
      {trailing}
    </span>
  );
}

/** Chip personne : avatar rond + nom (variante transparente = sans fond). */
export function PersonChip({
  name,
  tone,
  initials,
  variant = "highlighted",
}: {
  name: string;
  tone: string;
  initials: string;
  variant?: "highlighted" | "transparent";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-0 max-w-full items-center gap-1 rounded px-1",
        variant === "highlighted" ? "bg-foreground/[0.04]" : "pl-0",
      )}
    >
      <Avatar initials={initials} tone={tone} round />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function LinkPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-0 max-w-full items-center gap-1 truncate rounded-full border border-border bg-card px-2">
      {children}
    </span>
  );
}

export function Tag({ label, color }: { label: string; color?: string }) {
  if (!color) {
    return (
      <span className="inline-flex h-5 max-w-full items-center truncate rounded-full bg-foreground/[0.04] px-2 text-muted-foreground">
        {label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 max-w-full items-center truncate rounded-full px-2 font-medium"
      style={{ backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
    >
      {label}
    </span>
  );
}

export function BooleanCell({ value }: { value: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-foreground">
      {value ? <Check className="size-3" /> : <X className="size-3" />}
      {value ? "Oui" : "Non"}
    </span>
  );
}

/** Pied « Calculate ⌄ » (cellule épinglée, pleine largeur). */
export function FooterCalculate({ label = "Calculer" }: { label?: string }) {
  return (
    <div className="flex h-8 items-center gap-1 pl-7 text-muted-foreground/70">
      {label} <ChevronDown className="size-3" />
    </div>
  );
}
