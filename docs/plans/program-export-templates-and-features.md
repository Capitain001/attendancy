# Plan d'implémentation — Modèles d'Exportation & Évolutions Avancées des Programmes

Ce document définit l'architecture et le plan d'implémentation pour la **gestion des modèles d'exportation (Templates d'Export PDF/Excel/CSV)** et les évolutions avancées du module `Program`.

---

## 🎨 1. Gestion des Modèles d'Exportation (Export Templates)

### 1.1 Modèles de Mise en Page Configurables

| Modèle (Template) | Orientation | Usage Principal | Éléments inclus |
|---|---|---|---|
| **Officiel MESRS / Ministère** | Portrait / Paysage A4 | Accréditation, contrôle ministériel | En-tête national, Armoiries, Logotype Établissement, Numéro d'arrêté, Grille complète UEs/ECs, Heures CM/TD/TP, Crédits ECTS, Signatures |
| **Maquette Synthétique** | Paysage A4 | Orientation étudiants & Enseignants | Résumé compact par semestre, Intitulés, Crédits, Volumes horaires globaux |
| **Grille de Charge Enseignante** | Paysage A4 / Excel | Répartition de la charge horaire | Ventilation détaillée CM / TD / TP par cours et département |
| **Fiche de Présentation / Syllabi** | Portrait A4 | Prospectus & Plaquette de formation | Objectifs pédagogiques, Profil d'entrée, Compétences, Débouchés + Maquette synthétique |

### 1.2 Modal de Personnalisation & Prévisualisation d'Export

Lors du clic sur **"Exporter"** dans `ProgramExportButton.tsx` :
1. **Sélection du Modèle** : Choisir entre *Modèle Officiel*, *Synthèse Pédagogique*, ou *Grille de Charge*.
2. **Options de Personnalisation (Formulaire de configuration)** :
   - [x] Inclure la ventilation horaire (CM / TD / TP)
   - [x] Inclure les codes de cours / UEs
   - [x] Filigrane personnalisé (*"Document Officiel"*, *"Provisoire"*, *"Projet de Maquette"*)
   - [x] Inclure la grille des signatures de validation (Doyen, Directeur des Études)
3. **Prévisualisation rapide en direct** avant déclenchement du téléchargement.

### 1.3 Architecture Technique de l'Export (`services/export` ou `hooks/data/programs/Useprogramexport.ts`)

```typescript
export interface ProgramExportConfig {
  template: 'official' | 'synthetic' | 'teaching_load' | 'syllabus';
  format: 'pdf' | 'csv' | 'excel' | 'json';
  watermark?: string;
  showHoursBreakdown: boolean;
  showSignatures: boolean;
  showCompetencies: boolean;
}
```

---

## 🏷️ 2. Typologie des UEs (`UEType`) & Gestion des Optionnelles

### 2.1 Prise en compte de l'Enum `UEType`
Intégration de l'enum `UEType` révisé dans le schéma Prisma (`FONDAMENTALE`, `COMPLEMENTAIRE`, `APPROFONDISSEMENT`, `SPECIALITE`, `TRANSVERSALE`, `LIBRE`) :
- Badge visuel de couleur dans `UEBlock.tsx` (ex: Fondamentale = Bleu, Transversale = Violet, Optionnelle = Ambre).
- Filtrage et regroupement par type d'UE sur les maquettes et exports.

### 2.2 Choix des UEs Optionnelles par Semestre
- Renseignement du volume de crédits à valider parmi les UEs optionnelles d'un semestre (ex: *"Choisir 2 UEs parmi 4"*).

---

## 📊 3. Tableau de Bord Analytique des Volumes Horaires

### 3.1 Indicateurs Récapitulatifs Globaux
Affichage d'une barre analytique sur la page de détail du programme :
- **Total Heures CM** / **Total Heures TD** / **Total Heures TP** sur l'ensemble de la formation.
- **Ratio CM / TP** (équilibrage entre cours magistraux et travaux pratiques).
- **Nombre total de crédits ECTS** (ex: 180 ECTS pour une Licence, 120 ECTS pour un Master).

---

## 📜 4. Versionnement & Historique des Révisions (`ProgramVersion`)

### 4.1 Instantané lors du Verrouillage (`isLocked = true`)
- Génération automatique d'un snapshot JSON immuable de la maquette lors du verrouillage officiel.
- Historique des versions (v1.0, v1.1, v2.0) pour pouvoir consulter l'évolution d'une maquette pédagogique au fil des années universitaires.

---

## 📅 Chronologie d'Exécution Proposée

```
Phase 1 : Modal & Moteur de Templates d'Exportation PDF/Excel (Configuration + Filigranes + Signatures)
Phase 2 : Typologie UEs (UEType badges & regroupement par catégorie)
Phase 3 : Tableau analytique des ratios d'heures CM/TD/TP
Phase 4 : Versionnement & Instantanés de Maquette
```
