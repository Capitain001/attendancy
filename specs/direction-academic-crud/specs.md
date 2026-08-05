# Specs : Direction — CRUD Ressources Académiques

## Contexte

Les pages de liste existent déjà (lecture seule). La direction ne peut pas encore
créer, modifier ni supprimer de ressources depuis l'interface. Ce feature ajoute
toutes les mutations UI sur les ressources académiques.

## Périmètre

Ressources concernées (par ordre de dépendance) :

| Ressource | Service | Route actuelle | Dépend de |
|-----------|---------|----------------|-----------|
| AcademicYear | academic-year | — | rien |
| Department | department | /academic/departments | rien |
| Room | room | /schedule/rooms | rien |
| ProgramTrack | program-track | /academic/programs | Department |
| Class | class | /academic/classes | AcademicYear + ProgramTrack |
| UE | ue | /academic/courses | Department |

**Hors périmètre MVP** : Program (maquette), UECourse (matière), gestion des groupes.

---

## User Stories

### US1 — Gestion des années académiques (P1)

**En tant que** Direction,  
**Je veux** créer une année académique et en définir une comme "courante",  
**Afin de** contextualiser toutes les données de l'établissement.

**Critères d'acceptation :**
- [ ] Formulaire de création (nom de l'année)
- [ ] Action "Définir comme courante" sur une année existante
- [ ] Action "Archiver" une année
- [ ] Indicateur visuel de l'année courante dans la liste
- [ ] Contrainte unique `[name, orgId]` remonte un message clair

**Edge case :** L'année courante ne peut pas être archivée directement (warning).

---

### US2 — Gestion des départements (P1)

**En tant que** Direction,  
**Je veux** créer, renommer et supprimer des départements,  
**Afin de** structurer l'organisation académique.

**Critères d'acceptation :**
- [ ] Bouton "+ Département" sur la page `/academic/departments`
- [ ] Formulaire inline ou modal : champ `name`
- [ ] Renommer un département (édition inline ou modal)
- [ ] Supprimer avec confirmation (bloqué si des filières/enseignants/UEs sont attachés)
- [ ] Contrainte unique `[name, orgId]` → message clair

**Edge case :** Suppression bloquée par FK → afficher "Retirez les filières d'abord".

---

### US3 — Gestion des salles (P2)

**En tant que** Direction,  
**Je veux** ajouter et retirer des salles,  
**Afin de** alimenter le planning des séances.

**Critères d'acceptation :**
- [ ] Bouton "+ Salle" sur la page `/schedule/rooms`
- [ ] Formulaire : `name` (requis), `capacity` (optionnel), `equipment` (tags)
- [ ] Retirer une salle (soft delete, confirmation)
- [ ] Contrainte unique `[name, orgId]` → message clair

---

### US4 — Gestion des filières (P2)

**En tant que** Direction,  
**Je veux** créer des filières rattachées à un département,  
**Afin de** permettre la création de classes.

**Critères d'acceptation :**
- [ ] Bouton "+ Filière" sur la page `/academic/programs`
- [ ] Formulaire : `name` (requis), `departmentId` (select depuis la liste)
- [ ] Renommer / archiver une filière
- [ ] Contrainte unique `[name, departmentId]` → message clair
- [ ] Si aucun département → afficher "Créez d'abord un département"

**Dépendance :** US2 doit être complète pour alimenter le select département.

---

### US5 — Gestion des classes (P3)

**En tant que** Direction,  
**Je veux** créer des classes pour l'année en cours,  
**Afin d'y** inscrire des étudiants et planifier des séances.

**Critères d'acceptation :**
- [ ] Bouton "+ Classe" sur la page `/academic/classes`
- [ ] Formulaire : `name` (requis), `level` (enum L1…D3), `programTrackId` (select)
- [ ] Année académique courante auto-sélectionnée (non éditable)
- [ ] Archiver une classe (soft delete)
- [ ] Contrainte unique `[programTrackId, name, academicYearId]` → message clair

**Dépendances :** US1 (année courante) + US4 (filières) nécessaires.

---

### US6 — Gestion des UEs (P3)

**En tant que** Direction,  
**Je veux** créer des Unités d'Enseignement,  
**Afin de** structurer les programmes.

**Critères d'acceptation :**
- [ ] Section UEs accessible (intégrer à `/academic/courses`)
- [ ] Formulaire : `code` (requis, unique), `name` (requis), `credits`, `departmentId` (optionnel)
- [ ] Archiver une UE
- [ ] Contraintes uniques → messages clairs

---

## Contraintes transverses

- Stack : Next.js 16 PPR, React 19, Valibot, shadcn/ui, Tailwind v4
- Pattern mutations : hooks React Query dans `src/hooks/data/<domain>/`
- Composants clients → jamais d'appel direct à une server action
- Toast via `@/lib/toast/custom-toast`
- Formulaires = Valibot côté client pour validation immédiate
- ActionResponse pattern : `{ data }` | `{ error: string }`, narrowing `'error' in result`
