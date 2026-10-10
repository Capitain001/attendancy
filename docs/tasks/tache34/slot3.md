# Task 34 — Slot 3 : porter l’accueil quotidien `/teacher`

**Lot parent :** Lot 3 — Porter l’accueil quotidien `/teacher`  
**Statut :** Esquisse — dépend des Slots 0, 1 et 2

## But

Porter la page `/personal/$slug/teacher`, qui rend
`TeacherDailyOverviewScreen`, dans Desktop en séparant le chargement des
séances, le calcul des états métier et le rendu présentatif.

## Défis techniques à résoudre

- La fonction Web de planning n’est pas encore dans le registre RPC; son
  exposition affecte le contrat partagé et requiert les générateurs officiels
  du package RPC et des types. Ne jamais éditer les sorties générées à la main.
- L’action est actuellement mockée. Il faut décider explicitement si Desktop
  reproduit l’état de démonstration ou si les données réelles sont un travail
  séparé; une nouvelle action RPC ne supprime pas ce blocage métier.
- Le `teacherId` est résolu depuis l’utilisateur authentifié côté serveur et
  ne doit pas être fourni par le client.
- Les statuts de séance dépendent d’une policy et d’une horloge côté Web.
  Copier le calcul dans le package UI risquerait de diverger du comportement
  métier.
- Le panneau de détails dépend de primitives absentes du package UI et d’un
  DTO métier; déterminer s’il faut extraire une UI pure ou construire un
  adaptateur Desktop.

## Esquisse d’implémentation

### Contrat RPC à exposer

1. Vérifier la signature de `getTeacherDailyScheduleAction` et son schéma
   d’entrée dans `apps/web/src/services/schedule/`.
2. Si le Slot 0 confirme que cette action est le contrat convenable pour
   Desktop :
   - l’ajouter au registre `apps/web/src/lib/rpc/actions.ts`;
   - générer les wrappers avec le script `gen` de `@attendancy/rpc`;
   - regénérer le contrat de types `@attendancy/types`;
   - ne modifier manuellement ni `packages/rpc/src/generated/*` ni
     `packages/types/dist/*`.
3. Utiliser dans Desktop le proxy typé `api` de
   `apps/desktop/src/lib/api.ts`, et déduire le DTO via `ApiOutput` plutôt que
   de dupliquer le type serveur.
4. Respecter le résultat `{ data } | { error }` avec `'error' in result`.
   Laisser les erreurs de transport remonter comme exceptions afin que React
   Query conserve ses données mises en cache.

### Hook et vue

- Créer un hook de données Desktop sous
  `apps/desktop/src/hooks/` avec une clé React Query contenant l’action et le
  jour demandé.
- Appeler l’action sans `teacherId` fourni par le client : l’action Web
  résout le profil enseignant depuis la session authentifiée.
- Extraire une présentation UI recevant un DTO présentatif et des callbacks;
  maintenir dans Desktop l’état de sélection et d’ouverture du détail.
- N’extraire les statistiques temporelles que si elles sont sans dépendance
  métier serveur et si la règle de calcul est partagée explicitement. Ne pas
  recopier aveuglément la policy Web.
- Séparer les états de chargement, erreur, journée vide et séances disponibles.

## Point bloquant à confirmer

Au moment de la reconnaissance, `getTeacherDailyScheduleAction` renvoie
`mockGetTeacherDailySchedule` et l’appel à la base est commenté. Décider si ce
lot affiche les mêmes données de démonstration ou s’il faut un lot métier
distinct pour réactiver et valider la donnée réelle. Ne pas présenter des mocks
comme une intégration de données de production.

## Fichiers pressentis

- `apps/web/src/lib/rpc/actions.ts` et les artefacts générés par les scripts,
  si l’action est ajoutée au contrat.
- `apps/desktop/src/hooks/data/schedule/useTeacherDailySchedule.ts` (ou le
  dossier de hooks Desktop équivalent confirmé au Slot 0).
- Vue route Desktop de `/personal/$slug/teacher`.
- Composants présentatifs dans `packages/ui/src/components/teacher/`.
- Tests du hook/action et de la vue, selon les conventions existantes.

## Tests d’acceptation

- [ ] La requête est typée depuis `@attendancy/types`.
- [ ] Aucun `teacherId` n’est accepté depuis une valeur client non fiable.
- [ ] Le résultat vide, le chargement et les erreurs sont rendus explicitement.
- [ ] Une séance sélectionnable ouvre ses détails et le panneau se ferme via
  son callback.
- [ ] Les règles de statut et l’horloge ne sont ni dupliquées ni altérées sans
  décision de domaine.
- [ ] La source Web demeure inchangée et opérationnelle.
