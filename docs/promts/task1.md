Contexte : projet V2 (attendancy) déjà migré vers Next.js 16.2.10 avec un
starter qui implémente la nouvelle architecture (patterns "use cache",
src/cache/client + src/cache/server, naming remove/delete, tokens de style,
service-module-pattern). Le projet V1 (ancien, fonctionnel en production)
sert uniquement de référence pour retrouver la logique métier d'origine.

V2 (projet actuel) : C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy
V1 (référence) : C:\PROJECTS\DEV\ULTIMATE\attendancy-sys

IMPORTANT — Périmètre strict de la tâche :
- Ceci N'EST PAS une migration complète. Ne retouche AUCUN fichier V2 qui
  fonctionne déjà correctement selon les patterns actuels, même s'il utilise
  encore un ancien pattern (unstable_cache, classes Tailwind inline, etc.).
- Le seul travail attendu : (1) détecter les régressions/pertes de données
  entre V1 et V2, (2) reconnecter les éléments de V1 qui sont absents,
  cassés, mal typés, ou non branchés dans V2 (fichiers utils manquants,
  types manquants, fonctions de service manquantes).
- Si un module V1 existe déjà en V2 sous une forme différente mais
  fonctionnelle (même avec un ancien pattern de cache/style), NE LE TOUCHE
  PAS — ce n'est pas une régression, juste une différence de style non
  prioritaire ici.

Travaille en autonomie jusqu'au bout, sans t'arrêter pour validation
intermédiaire. Je veux un seul rapport final.

---

ÉTAPE 1 — Audit des régressions et manques (interne)

1. Compare chaque module de src/services/ entre V1 et V2. Pour chaque
   module V1, vérifie si l'équivalent V2 existe et si TOUTES ses fonctions
   (queries, mutations) ont un équivalent fonctionnel en V2 — peu importe
   le pattern de cache utilisé, seule l'existence et la correction comptent.

2. Compare le schéma Prisma V1 vs V2 : liste tout champ, table, ou relation
   présent en V1 mais absent en V2 → risque de perte de données.

3. Identifie les fichiers utils/helpers de V1 (tryConstraint, getScopeRef,
   assertGroupInClass, etc.) qui n'ont pas d'équivalent en V2 alors qu'ils
   sont nécessaires à une fonction déjà migrée (import cassé, fonction
   manquante, type "any" ou manquant à la place d'un type V1 précis).

4. Repère tout endroit où le typage V2 est manquant, incomplet, ou en
   décalage avec le schéma Prisma actuel, en particulier sur les fonctions
   reconnectées.

---

ÉTAPE 2 — Reconnexion (uniquement ce qui manque ou est cassé)

Pour chaque élément manquant/cassé identifié en étape 1 :
- Reprends la logique métier de V1 comme référence, mais écris le code
  selon les patterns déjà utilisés ailleurs dans V2 pour ce type de fichier
  (cohérence locale, pas de réécriture de ce qui existe déjà autour).
- Respecte service-module-pattern pour tout fichier créé.
- Ajoute uniquement les champs Prisma non-cassants nécessaires pour combler
  un manque réel — ne restructure pas le schéma au-delà de ce qui est requis.
- Ne touche à AUCUN fichier fonctionnel existant sous prétexte qu'il
  n'utilise pas encore le dernier pattern.

Si un cas est ambigu (logique métier changée, décision de schéma
potentiellement cassante), ne devine pas : prends l'option la plus prudente
et note-la dans le rapport final pour arbitrage.

---

ÉTAPE 3 — Validation

Après les corrections :
1. `bun run check:ts`
2. `bun run lint`
3. Corrige si erreurs, relance, jusqu'à ce que ça passe — dans la continuité
   de la même session, sans redémarrer l'analyse depuis zéro.

---

ÉTAPE 4 — Rapport final unique

- Tableau : module | statut avant | manque(s) trouvé(s) | action prise
- Liste des fichiers créés/modifiés (uniquement ceux liés à un manque réel)
- Risques de perte de données détectés dans le schéma Prisma
- Points ambigus tranchés prudemment, à valider par moi
- Confirmation check:ts / lint OK
- Éléments de V1 non reconnectés (avec raison)

Commence l'étape 1.