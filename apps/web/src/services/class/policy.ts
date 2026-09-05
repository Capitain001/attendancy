// src/services/class/policy.ts

// ─────────────────────────────────────────────────────────────────────────────
// TERMINOLOGIE
// ─────────────────────────────────────────────────────────────────────────────
//
// Dans l'interface utilisateur, l'entité `Class` est désignée par le terme
// « Promotion ».
//
// Le terme « Classe » ne doit pas être utilisé dans l'UI pour désigner cette
// entité.
//
// Cette terminologie correspond au contexte universitaire : une promotion
// regroupe les étudiants d'une même filière, d'un même niveau et d'une même
// année d'entrée.
//
// Exemples :
//   Class → Promotion
//   Class 2026 → Promotion 2026
//   Students of a Class → Étudiants de la promotion
//
// Cette convention concerne le vocabulaire affiché à l'utilisateur.
// Le nom technique `Class` pourra être renommé progressivement dans le code.
// 
// ─────────────────────────────────────────────────────────────────────────────

export const CLASS_LABEL = "Promotion";
