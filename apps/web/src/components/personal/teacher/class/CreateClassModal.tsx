// src/components/personal/teacher/class/CreateClassModal.tsx
import { Plus, X } from "lucide-react";
import type { ClassType } from "@/generated/prisma/client";
import { createClassFormAction } from "@/services/class/form";

// ═══ DONNÉES ════════════════════════════════════════════════════════════

// Sans type : modal générique (étape 1 puis 2). Avec type : raccourci, étape 2 seule.
export const createClassModalId = (type?: ClassType) =>
  type ? `create-class-${type.toLowerCase()}` : "create-class";

// Valeurs alignées sur l'enum ClassType (COHORT | THEMATIC). Les classes
// Tailwind restent des littéraux complets pour être détectées.
const CLASS_TYPES = [
  {
    value: "COHORT",
    label: "Cohorte",
    hint: "Une promotion d'élèves",
    title: "Nouvelle cohorte",
    peer: "peer/cohort",
    titleClass: "hidden peer-checked/cohort:block",
  },
  {
    value: "THEMATIC",
    label: "Thématique",
    hint: "Un groupe autour d'une matière",
    title: "Nouvelle classe thématique",
    peer: "peer/thematic",
    titleClass: "hidden peer-checked/thematic:block",
  },
] as const satisfies readonly {
  value: ClassType;
  label: string;
  hint: string;
  title: string;
  peer: string;
  titleClass: string;
}[];

// Préfixe distinct de tous les ids de popover (pas de collision d'id).
const radioId = (modalId: string, value: ClassType) => `radio-${modalId}-${value.toLowerCase()}`;

// ═══ LOGIQUE (technique : ne pas toucher pour un changement visuel) ═════
//
// Radios name="type" = état du formulaire :
//   aucun coché -> étape 1 · un coché -> étape 2, et sa valeur est envoyée.
// Ils sont suivis des titres, qui se règlent sur le radio coché (peer-checked :
// seuls les frères SUIVANTS sont ciblés). Ce composant doit donc rester le
// PREMIER enfant du <form>. Fragment : radios et titres restent frères directs.
function StepState({ modalId, type }: { modalId: string; type?: ClassType }) {
  return (
    <>
      {CLASS_TYPES.map((option) => (
        <input
          key={option.value}
          type="radio"
          name="type"
          value={option.value}
          id={radioId(modalId, option.value)}
          defaultChecked={option.value === type}
          className={`sr-only ${option.peer}`}
        />
      ))}
      {CLASS_TYPES.map((option) => (
        <h2 key={option.value} className={`${title} ${option.titleClass}`}>
          {option.title}
        </h2>
      ))}
    </>
  );
}

// Visibilité des deux vues : `group/form` (sur le <form>) + `has-[:checked]`.
// Indépendant de l'ordre : TypeStep et NameStep se placent où l'on veut.
const showWhenUnchosen = "group-has-[:checked]/form:hidden";
const showWhenChosen = "hidden group-has-[:checked]/form:grid";

// ═══ STYLES ═════════════════════════════════════════════════════════════

// Plein écran : le popover natif est déjà fixed + inset-0, on lui donne
// toute la taille du viewport. Pas de `display` ici : il rendrait le
// popover toujours visible.
const modal =
  "m-0 h-dvh w-dvw max-h-none max-w-none overflow-y-auto border-0 bg-background p-0 text-foreground";

const content =
  "group/form mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-5 py-16";

const title = "text-2xl font-bold tracking-tight";

const typeOption =
  "grid cursor-pointer gap-0.5 rounded-md border border-foreground/10 p-3 transition-colors hover:border-primary/50 hover:bg-primary/5";

const secondaryButton =
  "h-10 cursor-pointer rounded-md px-4 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground/80";

// ═══ VUES (visuel pur : à améliorer librement) ══════════════════════════

// Croix de fermeture, en haut à droite.
function CloseButton({ modalId }: { modalId: string }) {
  return (
    <button
      type="button"
      popoverTarget={modalId}
      popoverTargetAction="hide"
      aria-label="Fermer"
      className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground/70"
    >
      <X aria-hidden="true" className="size-5" />
    </button>
  );
}

// Vue 1 : le type seul.
function TypeStep({ modalId }: { modalId: string }) {
  return (
    <div className={`grid gap-6 ${showWhenUnchosen}`}>
      <h2 className={title}>Quel type de classe ?</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {CLASS_TYPES.map((option) => (
          <label key={option.value} htmlFor={radioId(modalId, option.value)} className={typeOption}>
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-foreground/45">{option.hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Vue 2 : le nom seul (le titre vient de StepState).
// Type connu (raccourci) : « Annuler » ferme. Sinon : « Retour » ramène à la vue 1.
function NameStep({ modalId, type }: { modalId: string; type?: ClassType }) {
  return (
    <div className={`gap-12 ${showWhenChosen}`}>
      <label className="grid gap-1.5 text-xs font-medium text-foreground/60">
        Nom de la classe
        <input
          name="name"
          required
          maxLength={100}
          autoFocus
          placeholder="Ex. Terminale S1"
          className="h-11 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-primary/50"
        />
      </label>

      <div className="flex justify-end gap-2">
        {type ? (
          <button
            type="button"
            popoverTarget={modalId}
            popoverTargetAction="hide"
            className={secondaryButton}
          >
            Annuler
          </button>
        ) : (
          // reset décoche le radio : retour à la vue 1
          <button type="reset" className={secondaryButton}>
            Retour
          </button>
        )}
        <button
          type="submit"
          className="h-10 cursor-pointer rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

// ═══ EXPORTS ════════════════════════════════════════════════════════════

// Déclencheur du modal générique : le plus visible de la page.
export function CreateClassTrigger() {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        popoverTarget={createClassModalId()}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus aria-hidden="true" className="size-4" />
        Ajouter une classe
      </button>
    </div>
  );
}

// Popover seul. `type` fourni = radio déjà coché : la vue 1 n'est jamais affichée.
export function CreateClassModal({ type }: { type?: ClassType }) {
  const modalId = createClassModalId(type);

  return (
    <div id={modalId} popover="" className={modal}>
      <CloseButton modalId={modalId} />
      <form action={createClassFormAction} className={content}>
        <StepState modalId={modalId} type={type} />
        <TypeStep modalId={modalId} />
        <NameStep modalId={modalId} type={type} />
      </form>
    </div>
  );
}