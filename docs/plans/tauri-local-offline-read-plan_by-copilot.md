# Plan d'implémentation : version locale desktop + Android offline (lecture simple)

## 1. Objectif

Créer une version locale de l'application qui puisse tourner sans connexion, en lecture simple, en priorité pour :

- Windows : exécutable local (`.exe`)
- Android : package d'installation (`.apk`)
- usage hors ligne en lecture, avec synchronisation ultérieure dès que la connexion revient

L'objectif n'est pas de faire une version complète multi-write dès le départ. Le premier livrable doit être un mode "lecture + consultation locale" robuste et fiable, compatible avec le monorepo existant et la stack Tauri v2.

---

## 2. Contexte technique

Le projet est structuré autour de :

- `apps/web` : application Next.js + logique métier + API web
- `apps/desktop` : shell Tauri v2 + interface web
- `packages/types` : DTOs partagés
- `packages/planning` : logique de planning côté web
- Supabase : base distante / auth / synchronisation réseau
- Vercel : hébergement web

La bonne stratégie est de réutiliser exactement le même code React/Webview entre le shell desktop et la version Android, en tirant profit de la compatibilité native de Tauri v2.

---

## 3. Principe d'architecture cible

### 3.1. But fonctionnel

La première version locale doit permettre :

- installer l'app sur desktop et Android
- démarrer sans dépendre d'un serveur web distant
- afficher les données déjà capturées localement
- fonctionner en mode lecture simple
- mettre à jour les données quand le réseau revient

### 3.2. Architecture proposée

1. Core app web conservé comme source de vérité UI
   - même interface React
   - mêmes composants
   - mêmes types partagés

2. Couche locale ajoutée dans Tauri
   - stockage local SQLite ou IndexedDB/SQLite selon le contexte
   - cache des données essentielles pour l'usage sans réseau
   - modules de synchronisation et de détection de connexion

3. Mode de fonctionnement app
   - `online` : données lues depuis Supabase / Vercel
   - `offline` : données lues depuis le cache local
   - `sync` : mise à jour locale -> backend distant si connexion disponible

4. Séparation claire des responsabilités
   - lecture : cache local + données synchronisées
   - écriture : limitée ou désactivée en phase 1
   - sync : planifiée mais non bloquante

---

## 4. Livraison ciblée (phase 1)

### 4.1. Scope fonctionnel

La phase 1 couvre uniquement :

- application Tauri démarrable localement
- build Windows `.exe`
- build Android `.apk`
- consultation des données déjà synchronisées
- cache local des écrans de lecture principale
- couverture basique de l'état offline
- mécanisme de rafraîchissement automatique ou manuel

### 4.2. Scope hors cible

- édition complète hors ligne
- synchronisation concurrente complexe
- gestion avancée de conflits
- workflow de publication App Store / Play Store
- synchronisation bidirectionnelle complète

---

## 5. Plan de mise en œuvre par étape

## Phase 1 — Fondation Tauri pour le projet

### Objectif
Mettre en place le packaging local et la base de build multi-plateforme.

### Tâches

- valider le projet `apps/desktop` comme shell Tauri v2
- configurer les builds `tauri build` pour Windows
- configurer la cible Android pour APK
- vérifier le partage des ressources web et des variables d'environnement
- préparer les commandes de build locales et CI

### Livrables

- configuration Tauri stable
- scripts de build Windows et Android
- document de build pour dev / CI

### Critères de validation

- app Tauri démarrée localement
- build Windows sans erreurs de packaging
- build Android APK généré avec configuration minimale

---

## Phase 2 — Modèle de données local hors ligne

### Objectif
Définir ce qui doit être stocké localement pour une lecture fiable sans réseau.

### Données à conserver

- utilisateurs / profils accessibles
- organisations et contextes essentiels
- cours / UEs / séances / planning
- ressources de consultation fréquente
- éléments de navigation et filtres
- statuts, permissions et libellés métier

### Recommandation de stockage

- SQLite local dans Tauri pour les données structurées et fiables
- tables auxiliaires pour cache, metadata, version de sync, logs d'erreurs
- stratégie de clé/versions des données par domaine

### Structure proposée

```
local_cache/
  schema/
  sync_state/
  data/
  metadata/
```

ou équivalent selon la structure interne Tauri.

### Règles de conception

- ne pas stocker tout le backend brut sans nécessité
- prioriser uniquement les écrans de lecture
- maintenir un schéma stable et versionné
- éviter la duplication couteuse de données transitives

### Critères de validation

- données chargées depuis la source distante puis persistées localement
- ouverture du cache offline sans crash
- prise en charge d'une version locale ancienne vs nouvelle

---

## Phase 3 — Synchronisation de lecture simple

### Objectif
Rendre l'application cohérente quand elle passe de l'état online à offline.

### Stratégie

1. Charger les données depuis le backend en ligne si disponible
2. Sauvegarder les données dans le stockage local
3. Si la connexion est perdue, basculer vers le cache local
4. Si la connexion revient, réactualiser automatiquement le cache

### Flux recommandé

- `bootstrap`: initialiser le cache local
- `syncPull`: récupérer les données distantes
- `cacheWrite`: enregistrer dans le stockage local
- `loadCurrentView`: lire depuis local si offline
- `refresh`: relancer la synchronisation dès que la connexion redevient active

### Sécurité de la synchronisation

- ne pas écraser des données locales si la version distante est plus récente
- garder un horodatage de dernière mise à jour
- journaliser les erreurs de synchronisation sans casser l'app

### Critères de validation

- basculement offline transparent
- re-synchronisation automatique
- affichage cohérent des données après reprise réseau

---

## Phase 4 — Interface applicative et UX offline

### Objectif
Donner à l'utilisateur une expérience claire sur l'état de synchronisation et sa disponibilité locale.

### Éléments UI à ajouter

- state `En ligne / Hors ligne`
- badge de dernière synchronisation
- bouton de rafraîchissement manuel
- message explicite si les données affichées sont locales
- écran de fallback si le cache est vide

### UX attendue

- pas de blocage technique pour l'utilisateur
- visibilité claire sur les données sûres à consulter
- limite explicite du mode lecture simple

### Critères de validation

- l'utilisateur sait immédiatement si l'app est en mode offline
- aucun écran ne reste vide sans explication
- l'interface reste utilisable sans connexion

---

## Phase 5 — Packaging Windows et Android

### Objectif
Produire les builds réels de distribution locale.

### Windows

- génération d'un exécutable `.exe` Tauri
- configuration du nom, icône et identités de build
- préparation pour installation locale ou test interne

### Android

- configuration de la cible Android pour Tauri v2
- génération d'un `.apk`
- validation sur émulateur / appareil de test
- gestion de permissions et accès réseau / stockage local

### Recommandation de gouvernance des builds

- garder un environnement de build dédié
- versionner les build numbers
- avoir un identifiant distinct par plateforme
- stocker les artefacts avec date + commit associé

### Critères de validation

- build Windows validé sur machine de test
- build Android validé sur émulateur ou appareil réel
- installation locale sans blocage de permissions

---

## Phase 6 — Sécurité, stabilité et limites métier

### Points critiques

- ne pas exposer de données sensibles hors contexte local autorisé
- sécuriser le cache local contre lecture non autorisée
- gérer les cas de données insuffisantes pour un écran
- prévenir l'utilisateur si le mode hors ligne ne couvre pas tout le besoin

### Limites de la phase 1

- lecture seule uniquement
- pas de création / modification / suppression sans connexion
- pas de résolution avancée de conflits
- pas d'édition concurrente de données locales

### Stratégie de montée de version

Une fois la lecture locale validée, on peut passer à :

- écriture différée
- gestion des queues d'actions
- synchronisation de changements locaux
- résolution de conflits métier

---

## 6. Plan de mise en œuvre détaillé (ordre recommandé)

### Sprint 1 — préparation technique

- valider Tauri v2 dans le monorepo
- configurer builds windows + android
- identifier les données essentielles à stocker localement

### Sprint 2 — cache local

- installer le stockage local SQLite
- implémenter les migrations de cache
- créer les modules de lecture locale

### Sprint 3 — mode offline

- détecter l'état de connexion
- basculer automatiquement en cache local
- ajouter les messages et états UI

### Sprint 4 — synchronisation

- mettre en place la pull sync
- gérer les horodatages et versioning
- tester reprises réseau / perte de connexion

### Sprint 5 — packaging

- générer les builds Windows et Android
- tester l'installation
- corriger les écarts de permissions ou de ressources

---

## 7. Risques et mitigations

### Risque 1 : build multi-plateforme non stable
Mitigation : automatiser les builds et tester sur chaque plateforme avant validation.

### Risque 2 : cache local incohérent
Mitigation : versionner le schéma et surveiller l'état de synchronisation.

### Risque 3 : trop d'informations stockées localement
Mitigation : limiter le périmètre à la lecture simple et aux écrans prioritaires.

### Risque 4 : confusion entre online / offline
Mitigation : afficher clairement l'état et la source des données en cours.

---

## 8. Critères de succès

La tâche est réussie si, à la fin de la phase 1 :

- l'application s'exécute localement via Tauri
- un build Windows est généré et utilisable
- un build Android APK est généré et installé sur émulateur ou appareil
- la lecture des données fonctionne sans connexion
- le système bascule proprement en mode offline
- la synchronisation de reprise est opérationnelle et sécurisée

---

## 9. Recommandation finale

La bonne approche pour ce projet est de traiter la version locale comme un "shell de lecture hors ligne" basé sur le même code web que le produit, puis d'ajouter la synchronisation progressive avant la mise en place du mode édition offline.

Le point clé est de commencer par la bonne abstraction :

- source de données unique
- cache local versionné
- stratégie de fallback offline
- build Tauri stable sur desktop et Android

C'est la voie la plus rapide pour obtenir un livrable fonctionnel, plus simple à valider, puis extensible vers l'offline sync plus avancée.
