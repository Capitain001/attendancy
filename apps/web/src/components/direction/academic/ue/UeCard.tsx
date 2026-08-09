import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * UECard — fiche d'Unité d'Enseignement (variante C, "étiquette en coin").
 *
 * Règle de contenu : Obligatoire est la norme et ne se mentionne jamais.
 * Seule l'UE optionnelle porte une étiquette, en haut à droite.
 *
 * Uniquement des tokens shadcn/ui — aucune couleur en dur :
 *   bg-card / text-card-foreground   → surface de la carte
 *   text-foreground                  → intitulé
 *   text-muted-foreground            → code, département
 *   text-primary                     → marque "Optionnelle"
 *   border-border                    → contour
 *
 * Polices : font-serif pour l'intitulé, font-mono pour le code.
 * Pour retrouver le rendu "fiche de catalogue" (Fraunces / IBM Plex Mono),
 * mappe ces familles dans tailwind.config :
 *   fontFamily: {
 *     serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
 *     mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
 *   }
 */

export interface UE {
  id: string;
  name: string;
  code: string | null;
  departmentId: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  isOptional: boolean;
}

export interface UECardProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> {
  ue: UE;
}

export const UECard = React.forwardRef<HTMLAnchorElement, UECardProps>(
  ({ ue, className, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={`./ue/${ue.id}`}
        className={cn(
          "relative block h-[300px] w-[280px] rounded-xs border border-border bg-card p-5 text-card-foreground shadow-md transition-shadow duration-200 hover:shadow-lg",
          className
        )}
        {...props}
      >
        {ue.isOptional && (
          <span className="absolute right-5 top-5 text-[10px] font-semibold tracking-wider text-primary">
            OPTIONNELLE
          </span>
        )}

        <span className="font-mono text-xs text-muted-foreground/70">
          {ue.code ?? "—"}
        </span>

        <h3
          className={cn(
            "mt-4 font-serif text-xl font-medium leading-snug text-foreground",
            ue.isOptional && "max-w-[170px]"
          )}
        >
          {ue.name || "Intitulé non renseigné"}
        </h3>

        <p
          className={cn(
            "mt-5 text-sm",
            ue.department
              ? "text-muted-foreground"
              : "italic text-muted-foreground/60"
          )}
        >
          {ue.department?.name ?? "Département non renseigné"}
        </p>
      </Link>
    );
  }
);

UECard.displayName = "UECard";