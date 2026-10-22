# Plan : builds Tauri pour plusieurs apps client

## Contexte

`apps/desktop` possède aujourd'hui le shell Tauri v2 et le projet Android
généré. `apps/teacher` est une app Vite/React indépendante, sans shell natif.
Le build Android actuel de desktop ne produit donc pas l'APK teacher ; la
variante WebView est un conteneur séparé qui charge le site hébergé.

L'objectif est de pouvoir distribuer plusieurs clients Attendancy en APK natif
sans mélanger leurs identités, leurs permissions, leurs fichiers Android
générés ou leurs pipelines de build. `apps/desktop` sert principalement de
terrain de test et ne contient pas d'écran indispensable au produit ; les
clients métier tels que teacher sont les applications distribuées à prendre
comme référence. Les composants et bibliothèques React restent partagés selon
les besoins actuels du monorepo.

## Décision d'architecture proposée

- **Un shell Tauri par application distribuée** : `apps/desktop/src-tauri`,
  `apps/teacher/src-tauri`, puis un shell dédié pour chaque futur client natif.
- **Pas de package Tauri Rust générique au départ.** Le Rust, les plugins, les
  commandes, les capacités et les configurations qui ne sont pas réellement
  communs restent dans le shell propriétaire.
- **Un workspace Cargo racine** regroupe les shells Tauri et centralise le
  `Cargo.lock` ainsi que le répertoire `target/`, afin de réutiliser les
  artefacts Rust coûteux. Les dépendances communes sont définies dans
  `[workspace.dependencies]`; les features spécifiques restent décidées par
  chaque shell.
- **Mutualiser l'outillage de build** dans `tools/tauri/` quand plusieurs apps
  utilisent les mêmes opérations (signature, vérification, copie d'artifact,
  tâches CI). Chaque shell conserve néanmoins ses commandes et configurations
  d'application.
- **Extraire plus tard un crate Rust partagé** seulement lorsqu'un même code
  Rust existe dans au moins deux shells et que ses dépendances/cibles sont
  compatibles. Ce crate pourra alors vivre dans `packages/tauri-core/`.

Cette séparation donne à chaque app son `identifier`, ses permissions, ses
icônes et son projet Android généré. Les builds teacher et desktop ne partagent
pas leur répertoire Gradle. Ils restent indépendants dans leur identité et
leurs fichiers, mais leur compilation Rust partage les artefacts et doit être
orchestrée sans concurrence non vérifiée sur le même `target/`.

## Architecture cible

```text
attendancy/
  Cargo.toml                   # workspace Cargo racine
  Cargo.lock                   # résolution Rust commune
  target/                      # sortie Cargo commune, ignorée par git
apps/
  desktop/
    src-tauri/
      Cargo.toml
      tauri.conf.json
      capabilities/
      gen/android/             # projet généré propre à desktop
  teacher/
    src-tauri/
      Cargo.toml
      tauri.conf.json
      capabilities/
      gen/android/             # projet généré propre à teacher
  <future-client>/
    src-tauri/                 # identité et plateforme propres à ce client
tools/
  tauri/
    sign-android-apk.mjs       # outillage commun, si plusieurs apps l'utilisent
    build-android.mjs          # orchestration commune, paramétrée par app
    README.md                  # conventions d'appel et variables requises
packages/
  tauri-core/                  # option ultérieure, seulement si du Rust est partagé
```

Le workspace racine déclare les shells connus avec une inclusion adaptée,
initialement `apps/*/src-tauri`, et définit un `target-dir` commun si nécessaire
pour que tous les outils Tauri/Cargo utilisent la même sortie. La configuration
Tauri/Gradle générée doit être vérifiée avec ce `target-dir` avant de retenir ce
choix : les scripts générés ne doivent pas supposer que les artefacts Rust
restent sous chaque `src-tauri/target`.

`apps/teacher` reste le propriétaire de son frontend Vite et de son UX. Son
shell Tauri utilise ce frontend comme `frontendDist`; il ne charge pas le site
web et ne réutilise pas le frontend de desktop.

## Contrats de propriété

| Élément | Propriétaire | Règle |
|---|---|---|
| UI, routes et build Vite teacher | `apps/teacher` | Pas de dépendance à l'UI desktop |
| Shell natif teacher, commandes et capabilities | `apps/teacher/src-tauri` | Identité `io.attendancy.teacher` |
| Shell natif desktop | `apps/desktop/src-tauri` | Conserve son identité et son comportement |
| Configuration Android générée | Chaque `src-tauri/gen/android` | Générée et utilisée par son shell seulement |
| `Cargo.toml`, `Cargo.lock`, `target/` Cargo | Racine du monorepo | Dépendances et artefacts Rust partagés ; `target/` ignoré par git |
| Signature/copie d'APK | `tools/tauri` après mutualisation | Pas de chemins d'app codés en dur |
| Composants React partagés | `packages/ui`, `packages/app`, autres packages existants | Partage frontend indépendant de Tauri |
| Crate Rust partagé | Aucun initialement | Extraction ultérieure selon duplication démontrée |

## Plan d'implémentation

### Phase 0 — Inventaire et règles de build

1. Confirmer les besoins Android teacher : ABI arm64, permissions et plugins
   réellement nécessaires, accès natif éventuel, mode debug/release.
2. Vérifier que les builds web teacher et desktop peuvent être invoqués depuis
   le monorepo sans dépendance à un serveur Next.js.
3. Définir les identités de package et noms d'artifacts :
   - desktop : conserver `io.attendancy.app` ;
   - teacher : réserver `io.attendancy.teacher` ;
   - WebView : conserver son identité actuelle distincte.
4. Ne pas versionner `gen/android` : le projet Android est régénérable depuis
   `src-tauri` avec `tauri android init`. Ignorer ses fichiers générés et ses
   sorties locales ; documenter suffisamment le setup pour reproduire
   l'initialisation sur une nouvelle machine.
5. Documenter la contrainte résiduelle : le build WebView existant modifie
   temporairement le Gradle généré de desktop. Il reste séquentiel avec les
   builds qui utilisent ce même projet Android jusqu'à son éventuelle
   isolation.
6. Vérifier que Tauri reconnaît le workspace Cargo racine avec les manifests
   des shells imbriqués, que `gen/android` résout correctement les chemins
   Rust et que les sorties desktop sont bien sous le `target/` commun.
7. Confirmer le ciblage initial Android `aarch64` uniquement ; ajouter d'autres
   ABI seulement pour un besoin produit ou de test identifié.

**Sortie attendue :** liste des plugins/capabilities teacher et décision sur
les fichiers générés avant toute création de shell.

### Phase 1 — Créer le shell Tauri teacher

Créer le shell dans `apps/teacher/src-tauri`, sans déplacer ni recopier le
frontend. Ajouter d'abord le workspace Cargo racine et rattacher le shell
desktop existant sans changer son comportement :

- workspace Cargo racine avec `members = ["apps/*/src-tauri"]`, un lockfile à
  la racine et un répertoire `target/` commun et ignoré par git ;
- ignorer `apps/*/src-tauri/gen/`, puisque le projet Android est régénérable ;
- centraliser les versions des dépendances Rust communes dans
  `[workspace.dependencies]` ;
- renommer le package et la bibliothèque desktop avec une convention stable
  (`attendancy-desktop`, `attendancy_desktop_lib`) si cela ne casse pas les
  références Tauri générées ;
- `Cargo.toml` et sources Rust minimales produits par Tauri ;
- `tauri.conf.json` avec `productName`, `version`, `identifier`,
  `beforeDevCommand`, `devUrl`, `beforeBuildCommand` et `frontendDist` visant
  les scripts/dist de `apps/teacher` ;
- `capabilities/` avec le strict nécessaire, sans reprendre aveuglément les
  permissions desktop ;
- icônes adaptées au teacher ;
- scripts teacher dédiés `tauri:dev`, `tauri:android:init` et
  `build:android` dans `apps/teacher/package.json` ;
- dépendance CLI Tauri v2 alignée sur celle de desktop ; ajouter
  `@tauri-apps/api` ou des plugins frontend uniquement si le teacher appelle
  réellement les API natives.

Convention d'identité : Android `io.attendancy.<role>` (desktop conserve
`io.attendancy.app` comme exception de compatibilité), package Cargo
`attendancy-<role>`, bibliothèque `attendancy_<role>_lib`. Ces noms doivent
être uniques pour chaque shell. Les dépendances partagées peuvent utiliser
`workspace = true`, mais chaque shell active uniquement les features et plugins
dont il a besoin ; ne pas activer `tray-icon` dans teacher uniquement pour
forcer une configuration identique. Conserver l'initialisation Rust propre au
shell. Une app sans commandes Rust particulières n'a pas besoin d'un crate
partagé pour démarrer.

### Phase 2 — Initialiser et valider Android indépendamment

1. Lancer `tauri android init` depuis le contexte teacher et générer
   `apps/teacher/src-tauri/gen/android/`.
2. Vérifier que le package Gradle est `io.attendancy.teacher` et que le
   manifeste, les ressources et les icônes appartiennent au teacher.
3. Builder une première APK arm64 non signée pour valider la chaîne frontend →
   Tauri → Gradle → Rust.
4. Installer sur émulateur ou appareil et vérifier démarrage, auth, navigation,
   liens externes et mode hors-ligne, selon les fonctionnalités réellement
   activées.
5. Vérifier que le build desktop courant reste inchangé après cette
   initialisation.

Les deux shells ayant des projets Android distincts, leurs builds natifs ne
doivent pas nécessiter de remplacement temporaire d'`applicationId` ou de
création/suppression de package Java dans le projet de l'autre app.
Le premier build ne cible que `aarch64` afin de limiter les compilations et le
volume du cache Cargo partagé.

### Phase 3 — Partager l'outillage Android

Après un build teacher validé, déplacer ou extraire dans `tools/tauri/` les
opérations réellement communes :

- localiser `apksigner.jar` depuis `ANDROID_HOME` / `ANDROID_SDK_ROOT` ;
- signer depuis le keystore debug local sans exposer de secrets dans le dépôt ;
- vérifier cryptographiquement la signature ;
- vérifier l'identifiant d'application et l'ABI de l'artifact ;
- copier vers un chemin d'artifact stable, par exemple
  `apps/teacher/artifacts/Attendancy-Teacher-arm64-debug-signed.apk` ;
- retourner une erreur non nulle et explicite si SDK, keystore, APK ou outils
  manquent.

L'outil commun reçoit des chemins/configurations explicites ou une cible
connue (`teacher`, `desktop`, `webview`) ; il ne déduit pas le produit depuis
le répertoire courant et n'édite pas silencieusement les fichiers Gradle.
L'outil ne code pas en dur le chemin du `target/` Cargo ; il obtient les sorties
via Cargo/Tauri ou les reçoit explicitement depuis la configuration de l'app.
Les APK restent localisés dans le projet Android généré propre à chaque shell.
Les scripts desktop existants sont migrés vers cet outil seulement si la
mutualisation est testée sans changement de comportement.

### Phase 4 — Scripts et documentation utilisateur

- Ajouter des commandes sans ambiguïté dans les manifests d'app :
  - teacher : build Android du frontend teacher ;
  - desktop : build Android du frontend desktop ;
  - WebView : build du site distant, distinct et explicitement nommé.
- Mettre à jour `docs/cmd/android.md` et `apps/desktop/BUILD.md` pour distinguer
  ces trois produits, leurs identifiants, leur sortie, leur signature et les
  prérequis.
- Documenter la génération Android teacher, les variables d'environnement,
  l'emplacement des artifacts et le fait que la signature debug est réservée
  aux tests.
- Ne pas présenter l'APK WebView comme le build teacher.

### Phase 5 — CI et distribution

Lorsque le build local est stable :

1. Ajouter un job CI par shell / produit, déclenché sélectivement par les
   chemins concernés.
2. Installer les mêmes versions contrôlées de Java, Android SDK/NDK, Rust et
   targets utilisés localement.
3. Utiliser des secrets CI pour une signature release dédiée ; ne jamais
   transférer le keystore debug local ou son mot de passe dans le dépôt.
4. Publier des artifacts nommés avec produit, ABI, version et type de signature.
5. Ajouter une vérification bloquante de l'identité d'application afin d'éviter
   de publier l'APK d'une autre app sous un nom teacher.

La signature release et la publication peuvent être une phase séparée si le
besoin immédiat est uniquement un APK local signé debug.

### Phase 6 — Décider d'un crate Rust partagé

Après deux shells fonctionnels, comparer leurs commandes Rust et l'initialisation
des plugins. Extraire seulement les fonctions réellement communes et stables :

- crate `packages/tauri-core` avec dépendances Tauri/Serde explicites ;
- commandes partagées exportées puis enregistrées dans chaque shell ;
- compatibilité desktop/mobile encadrée par `cfg` et features Cargo explicites ;
- chaque shell conserve son `tauri.conf.json`, ses capabilities, ses plugins
  nécessaires et son `generate_context!`.

Ne pas mettre dans ce crate les identifiants, permissions, icônes, configuration
Android, callbacks métier teacher/desktop, ni les plugins inutilisés par un
consommateur. Si aucun code Rust ne se répète, ne pas créer le crate.

## Commandes et validation prévues

Les commandes exactes seront ajoutées une fois le shell créé, avec les chemins
validés par Tauri. Le contrat cible est :

```powershell
# Depuis apps/teacher
bun run build
bun run tauri:android:init
bun run build:android
```

Validation fonctionnelle :

1. `apps/teacher` : vérification TypeScript + build Vite.
2. Tauri teacher : validation de configuration et build Android arm64.
3. Signature : vérification `apksigner verify --verbose`.
4. Identité : package APK égal à `io.attendancy.teacher`.
5. Installation : teacher et desktop peuvent coexister sur un même appareil.
6. Régression : les commandes Android desktop et WebView produisent toujours
   leurs artifacts actuels et gardent leurs identifiants respectifs.
7. Git : confirmer que `gen/android` teacher et desktop restent ignorés, tandis
   que leurs sources Tauri (`Cargo.toml`, Rust, config et capabilities) sont
   conservées.
8. Workspace Cargo : `cargo check`/build ciblé pour chaque shell après toute
   modification du lockfile racine, notamment un `cargo update`.
9. Concurrence : vérifier les builds teacher et desktop séparés et simultanés ;
   tant que le comportement Tauri/Gradle avec `target/` partagé n'est pas
   validé, séquencer les builds qui l'utilisent.

## Décisions, alternatives et risques

| Décision | Alternative écartée | Motif | Risque / garde-fou |
|---|---|---|---|
| Un `src-tauri` par app distribuée | Un shell desktop qui change de frontend et d'identifiant selon la commande | Identités, permissions, icônes et artefacts appartiennent à chaque app | Duplication initiale des configs Tauri ; limiter les configs au nécessaire et mutualiser ensuite |
| Workspace Cargo racine avec `Cargo.lock` et `target/` communs | Un cache Rust par shell | Réduire la duplication de compilation importante observée dans le `target` desktop | Valider les chemins générés Tauri/Gradle ; builds non vérifiés en parallèle peuvent se gêner |
| Dépendances communes centralisées, features propres à chaque shell | Forcer exactement les mêmes features dans toutes les apps | Éviter dérive des versions sans ajouter des plugins inutiles à teacher | La résolution de features Cargo peut varier selon cible/graph ; vérifier que le partage d'artefacts atteint l'économie attendue |
| Noms Cargo et bibliothèques uniques par shell | Réutiliser le même nom de package/lib dans un workspace | Cohérence et identification claire des crates | Confirmer les noms référencés dans les fichiers générés avant renommage |
| Ne pas versionner `gen/android` | Committer le projet Android généré | Les fichiers régénérables ne doivent pas être suivis ; l'initialisation doit pouvoir les recréer | Les personnalisations manuelles du généré seraient perdues : les porter dans la config/source ou documenter le patch reproductible |
| Réutiliser les packages React existants | Copier le frontend teacher dans desktop | Les packages frontend sont déjà partageables et indépendants du runtime natif | Vérifier que les alias Vite teacher fonctionnent lors du build lancé par Tauri |
| Mutualiser d'abord des scripts Node | Créer immédiatement un package Rust générique | Le code Rust visible est aujourd'hui spécifique au desktop (tray, opener) ; aucune duplication teacher démontrée | Ne pas transformer `tools/tauri` en framework configurable excessif |
| Garder les capabilities par app | Copier la capability desktop entière | Limiter les permissions natives à la surface nécessaire | Une permission manquante peut casser un plugin ; couvrir par validation device |
| Garder WebView distincte | Faire passer le site web pour l'app teacher | La WebView charge le site distant et n'embarque pas le frontend Vite teacher | WebView modifie encore le Gradle desktop ; build séquentiel et suivi explicite |
| N'extraire `tauri-core` qu'après duplication | Centraliser immédiatement builder, commandes et plugins | Les entrypoints Tauri et les cibles diffèrent selon les apps | Extraction plus tardive ; surveiller la duplication après l'ajout du second shell |
| Ne pas imposer `tray-icon` à teacher | Copier toutes les features desktop dans tous les shells | Une feature peut ajouter du code et des dépendances natifs inutiles ; versions partagées ne signifient pas features identiques | Cargo peut générer plusieurs variantes d'une dépendance selon les features/cibles ; mesurer le cache plutôt que gonfler chaque app |
| Séquencer les builds partageant `target/` jusqu'à validation | Affirmer que les builds sont indépendants parce que chaque shell a son dossier Android | Le `target/` et `Cargo.lock` sont communs | La sérialisation exacte dépend des verrous Cargo et de l'orchestration Tauri/Gradle ; tester avant parallélisation CI |
| `tools/tauri` ne dépend pas d'un chemin global `target/` codé en dur | Supposer que Cargo sort toujours sous le target local à un shell | Le `target-dir` est configurable et sera racine avec le workspace | Résoudre dynamiquement les sorties Cargo ; garder les chemins Gradle/APK propres à l'app |
| Signer debug localement au départ | Réutiliser un secret release local | L'APK de test ne doit pas dépendre d'un secret de production | Debug APK non distribuable ; prévoir un keystore release en phase CI |

## Hors périmètre de la première livraison

- migration de tous les clients existants vers un nouveau système de build ;
- extraction de l'UI teacher ou desktop dans de nouveaux packages ;
- crate Rust partagé sans code commun réel ;
- publication Play Store / App Store et gestion complète des certificats ;
- refonte de la variante WebView, sauf adaptations nécessaires à une validation
  fiable des builds.
