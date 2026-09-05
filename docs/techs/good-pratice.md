# Bonnes Pratiques d'Architecture et de Clean Code

Ce document recense les règles d'or et bonnes pratiques adoptées sur le projet pour garantir un code maintenable, lisible et robuste.

## 1. Types : Single Source of Truth
Ne redéfinissez jamais un type manuellement si une source de vérité existe déjà (par exemple, un DTO d'API ou un modèle Prisma).
- **Pourquoi ?** Éviter la dérive des types. Si le backend modifie une propriété, le frontend doit réagir immédiatement avec une erreur TypeScript, au lieu d'avoir un type statique obsolète.
- **Comment ?** Utiliser des utilitaires comme `Pick`, `Omit`, ou des inférences (`ReturnType<typeof ...>`) sur les types générés (ex: `GetClassesDto`, `GetEnrolledStudentsDto`).
  ```ts
  // ❌ MAUVAIS
  type ClassItem = { id: string; name: string; programTrack?: { name: string } };
  
  // ✅ BON
  type ClassItem = Pick<GetClassesDto[number], "id" | "name" | "programTrack">;
  ```

## 2. État : Single Source of Truth UI
L'état de l'application doit provenir d'une seule source (URL, Context, ou Props). Ne dupliquez pas l'état.
- **Pourquoi ?** Éviter les désynchronisations, les boucles de rendu infinies et les comportements imprévisibles.
- **Comment ?** Si un paramètre est piloté par l'URL (ex: `?classId=...`), le composant enfant ne doit pas stocker de variable d'état interne locale (`internalValue`). Il doit lire directement depuis ses `props` (qui découlent de l'URL).

## 3. Lisibilité du JSX et Séparation Logique/Vue
Le JSX (la vue) doit rester le plus déclaratif possible. La logique complexe de sélection ou de comptage doit être résolue *avant* le `return`.
- **Pourquoi ?** Un JSX propre est plus facile à maintenir et à faire évoluer sans casser l'interface.
- **Comment ?** Éviter les conditions ternaires imbriquées (`A ? B : C ? D : E`) directement dans la vue. Extraire la logique de calcul en haut du composant.
  ```tsx
  // ✅ BON
  const count = selectedClassId ? students?.length : totalStudents;
  
  return (
    <span>
      {count} étudiant{count !== 1 ? "s" : ""}
      {!selectedClassId && " au total"}
    </span>
  );
  ```

## 4. Séparation des Responsabilités (Separation of Concerns)
La logique métier complexe (comme la génération d'un PDF, l'export Excel) ne doit pas polluer les Hooks React ou les Composants.
- **Pourquoi ?** Faciliter les tests unitaires purs, réutiliser le code métier n'importe où, et garder les fichiers courts.
- **Comment ?** Extraire la logique dans des dossiers dédiés (ex: `src/lib/export/programs`) et décomposer en petits fichiers (`pdf.ts`, `xlsx.ts`, `csv.ts`). Le Hook ou le Composant ne doit s'occuper que de gérer le cycle de vie React (statuts `loading`, `error`, `done`).

## 5. Strict Type-Checking & Zéro `any`
L'utilisation de `any` est formellement interdite. 
- **Pourquoi ?** Un cast `any` est le symptôme d'un problème de conception qui repousse les bugs à l'exécution (runtime).
- **Comment ?** Trouver le type correct via les génériques existants, l'inférence ou la création d'interfaces adaptées, et laisser le compilateur assurer la sécurité.
