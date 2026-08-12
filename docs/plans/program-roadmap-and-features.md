# Plan de feuille de route & fonctionnalités — Gestion des Programmes (Maquettes Pédagogiques)

Ce document identifie les évolutions et implémentations à réaliser pour compléter le système de gestion des programmes pédagogiques (`Program`), en se basant sur les spécifications `docs/references/ues/program.md`, `docs/references/ues/ues_usages.md`, la vision produit `docs/visions/roles/direction.md` et les schémas Prisma.

---

## 📋 Synthèse des opportunités d'implémentation

```
                               ┌──────────────────────────────────────────┐
                               │       Feuille de route Programme         │
                               └────────────────────┬─────────────────────┘
                                                    │
         ┌──────────────────────┬───────────────────┼───────────────────┬──────────────────────┐
         ▼                      ▼                   ▼                   ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 1. Horaires CM   │  │ 2. Métadonnées   │  │ 3. Import du  │  │ 4. Duplication / │  │ 5. Liaison aux   │
│    TD / TP       │  │    pédagogiques  │  │    référentiel│  │    Clonage       │  │    Classes       │
└──────────────────┘  └──────────────────┘  └───────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 1. Détail des Volumes Horaires (CM / TD / TP / PROJET / STAGE)

### Besoins & Contexte
Les cours (`UECourse`) disposent d'un volume horaire total (`duration`), mais le schéma Prisma et la spécification `docs/references/ues/program.md` prévoient une répartition fine dans le champ `settings`:
```json
{
  "hours": {
    "CM": 10,
    "TD": 15,
    "TP": 5,
    "PROJET": 0,
    "STAGE": 0
  }
}
```

### Évolution à implémenter
1. **Helper TypeScript `getHoursFromSettings`** dans `@/utils/hours.ts` :
   - Extrait et calcule le total ainsi que le libellé d'affichage (`CM: 10h | TD: 15h | TP: 5h`).
2. **Formulaires de création / édition de cours (`UECourseForm` / `create-uecourse-dialog`)** :
   - Champs de saisie dédiés pour CM, TD, TP avec calcul automatique du total `duration`.
3. **Tableau des semestres (`SemesterTable.tsx` / `UEBlock.tsx`)** :
   - Colonne ou tooltip ventilé montrant la répartition des heures (CM/TD/TP) par cours et le total ventilé par semestre.

---

## 2. Métadonnées Pédagogiques du Programme (Profil, Compétences, Débouchés)

### Besoins & Contexte
Un programme d'études ne se limite pas à sa grille d'UEs : il définit le profil des étudiants visés, les compétences acquises et les débouchés professionnels (champs `profile`, `competencies`, `outcomes`).

### Évolution à implémenter
1. **Bannière d'en-tête enrichie (`ProgramHero.tsx`)** :
   - Section rétractable (Accordion/Modal) affichant le profil d'entrée, les compétences visées et les débouchés.
2. **Formulaire d'édition des métadonnées du programme (`ProgramForm.tsx` / `updateProgramAction`)** :
   - Ajout des champs texte/textarea pour modifier ces informations au niveau Direction.

---

## 3. Import & Instanciation depuis les Référentiels Nationaux

### Besoins & Contexte
Le service `ue-template` permet d'importer des modèles nationaux issus de `referential.prisma` (`applyProgramTemplate`).

### Évolution à implémenter
1. **Bouton & Modal "Importer un modèle national"** dans la page `/direction/academic/programs` :
   - Permet à la Direction de choisir un modèle du référentiel (ex: Togo MESRS 2022) et d'instancier automatiquement un `Program` avec toutes ses UEs, ses cours, ses crédits et ses heures pré-remplis.
2. **Action d'importation côté serveur (`importProgramFromReferentialAction`)** :
   - Transaction idempotente créant le `Program`, les `ProgramUE`, les `UE` et les `UECourse` correspondants dans le contexte de l'établissement (`orgId`).

---

## 4. Duplication & Clonage de Programme (`duplicateProgram`)

### Besoins & Contexte
Lors de l'ouverture d'une nouvelle année académique ou d'un nouveau parcours, la Direction doit pouvoir dupliquer une maquette existante sans réécrire l'intégralité des UEs et cours.

### Évolution à implémenter
1. **Server Action `duplicateProgramAction({ programId, newName, programTrackId })`** dans `services/program` :
   - Copie intégrale de la structure de semestres (`ProgramUE`) et des liaisons de cours.
2. **Action UI "Dupliquer la maquette"** dans les options de la page `/direction/academic/programs/[programId]`.

---

## 5. Gestion de la Liaison et Affectation aux Classes

### Besoins & Contexte
Un `Program` peut être rattaché à une ou plusieurs classes (`Class.programId`).

### Évolution à implémenter
1. **Onglet / Section "Classes associées" sur la page `/direction/academic/programs/[programId]`** :
   - Liste des classes rattachées à ce programme (niveau, année académique, effectif).
   - Action "Associer à une classe" permettant de relier directement le programme à une classe existante via `linkProgramToClassAction`.
2. **Contrôle d'intégrité à la suppression** :
   - Avertissement et blocage de la suppression si des classes actives sont encore rattachées à la maquette.

---

## 6. Export PDF & Excel Synthétique de la Maquette Pédagogique

### Besoins & Contexte
La Direction et le responsable pédagogique doivent pouvoir imprimer ou exporter la maquette officielle pour accréditation ou diffusion aux étudiants.

### Évolution à implémenter
1. **Composant `ProgramExportButton.tsx`** :
   - Génération PDF structurée avec logo de l'établissement, grille des semestres, UEs, crédits ECTS et volumes horaires.
   - Export CSV / Excel des volumes horaires par département et enseignement.

---

## 📅 Chronologie recommandée d'exécution

| Phase | Description | Impact |
|---|---|---|
| **Phase 1** | Ventillation CM/TD/TP (`settings.hours`) dans le tableau & formulaires | 🔴 Élevé (métier) |
| **Phase 2** | Importation depuis les Référentiels Nationaux (`ue-template`) | 🔴 Élevé (gain de temps) |
| **Phase 3** | Section "Classes associées" & Liaison de classe depuis le programme | 🟡 Moyen |
| **Phase 4** | Duplication & Clonage de maquette (`duplicateProgram`) | 🟡 Moyen |
| **Phase 5** | Métadonnées pédagogiques enrichies & Export PDF/Excel | 🟢 Faible / Finition |
