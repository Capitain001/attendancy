# Feature — Organisation personnelle (mode teacher-centric)

**Statut** : cadrage validé sur le principe — avant implémentation.
**Convention** : ❓ ouverte · 🟡 en discussion · ✅ actée

---

## 1. Vision

Le parcours d'adoption actuel (`PRD-attendancy.md` §9.1) part toujours d'une
**Direction** qui crée l'organisation, construit le référentiel académique,
puis invite les enseignants. C'est le bon flow pour une vraie université,
mais c'est un mur pour valider le produit sur de vrais utilisateurs : un
enseignant seul ne peut aujourd'hui tester Attendancy qu'en attendant
l'infrastructure complète d'un établissement.

Cette feature ouvre une **porte d'entrée alternative** : un enseignant peut
utiliser le produit — planning réel, sessions, présence QR — **sans jamais
dépendre d'une université**. Objectif : recueillir des besoins réels côté
teacher/student/parent avant/sans le parcours administratif lourd, et ouvrir
un canal de test utilisateur (voire un mode démo) découplé de toute
infrastructure institutionnelle.

Effet secondaire assumé et recherché : c'est aussi un modèle économique
(§5) — un enseignant qui dépasse le format gratuit devient un client direct,
indépendamment de toute université.

---

## 2. Principe retenu

**Une organisation personnelle est une `Organization` comme les autres**,
marquée `type: PERSONAL` (`Organization.type`, déjà ajouté au schéma —
`enum OrganizationType { INSTITUTION, PERSONAL }`, défaut `INSTITUTION` pour
la rétrocompatibilité).

Ce choix a été préféré à un domaine de données parallèle (`PersonalSchedule`,
`PersonalUnavailability`, etc.) proposé initialement, pour une raison
simple : la réutilisation intégrale du socle existant est gratuite —
`Schedule`, `Session`, l'anti-conflit GiST, `TeacherUnavailability`, le flow
QR complet (`teacher_check_in`, `SessionToken`, `Attendance`), le système
d'invitation (`inviteStudent`) fonctionnent tels quels. Zéro logique dupliquée
à maintenir en parallèle du cœur du produit.

**Aucune autre modification de schéma n'est nécessaire** au-delà du champ
`Organization.type` déjà en place. Le reste de cette feature est une
question de **service** (bootstrap, quota, agrégation cross-org), pas de
modèle de données.

---

## 3. Décisions actées

### 3.1 · Double profil du propriétaire — ✅ actée

Le référentiel académique (créer classes, cours, salles, planning) est une
capacité **Direction uniquement** (`PRD-attendancy.md` §10). Or le prof
propriétaire de son org perso doit à la fois pouvoir construire cette
structure ET être assignable à ses propres séances (`Schedule.teacherId`).

À la création de l'org personnelle, le service crée **deux profils** pour le
même user, sur la même org — pattern déjà supporté nativement (A-07, profils
indépendants par `[userId, orgId]`, sans contrainte croisée) :

- `UserOrganization { role: DIRECTION }` → autorité pour bootstrap/gérer la structure.
- `Teacher { userId, orgId }` → apparaît comme enseignant sur ses séances, ses indisponibilités, etc.

L'utilisateur ne "voit" jamais cette dualité — côté UI il a une seule
casquette ("mon espace"), le double profil est un détail d'implémentation
côté service (`authAccess({ requiredRole: 'DIRECTION' })` pour les mutations
de structure, profil `Teacher` pour tout le reste).

### 3.2 · Bootstrap académique invisible — ✅ actée

Contrainte explicite : **pas de configuration longue**. La nature
relationnelle du référentiel académique (Année → Département → Filière →
UE → Matière → Cours) est déjà cognitivement lourde pour une direction
d'université ; elle serait rédhibitoire pour un prof qui veut juste "gérer
son planning".

Principe : le prof ne voit et ne manipule qu'un seul concept — **la
classe** ("Terminale S1", "Groupe TOEFL avancé"...). Tout le reste est créé
silencieusement, en singleton, au moment de la création de l'org :

```
Bootstrap unique (1 fois, à la création de l'org perso) :
  AcademicYear   — 1, bornes larges, non éditée par l'utilisateur
  Department     — 1, fixe, masqué
  ProgramTrack   — 1, fixe, masqué

À chaque "nouvelle classe" créée par le prof (formulaire minimal : nom, couleur) :
  Class          — 1, portant le nom saisi
  UE             — 1, miroir 1:1 de la classe, masqué
  UECourse       — 1, miroir 1:1, masqué
  Course         — 1, rattache la classe à cette UECourse
```

Une "classe" côté UX = 4 lignes DB créées en une transaction côté service,
sans qu'aucune de ces notions (UE/UECourse/Département/Filière) ne soit
jamais montrée à l'utilisateur. Les `Room` créées par le prof n'ont jamais
de `Location` rattachée → pas de géofencing (comportement déjà natif de
`teacher_check_in`, aucune adaptation nécessaire).

### 3.3 · Modèle de quota — ✅ actée

Le nombre de classes est le **levier commercial** de cette feature : chaque
org personnelle reçoit **5 classes gratuites** ; au-delà, l'utilisateur
souscrit un plan payant qui augmente ce quota.

Aucun nouveau champ nécessaire : `OrganizationSettings.maxClasses` existe
déjà (`Int? @default(10)`). Pour une org `PERSONAL`, le service de bootstrap
l'initialise explicitement à `5` (au lieu du défaut générique 10 pensé pour
les institutions). La garde applicative est symétrique à ce qui existe déjà
côté quotas (`OrganizationUsage` vs `OrganizationSettings.max*`) : avant
toute création de classe, vérifier `count(classes actives) < maxClasses`.

Le passage payant réutilise `billing.prisma` tel quel : un nouveau `Plan`
dédié (ex. code `TEACHER_SOLO`), avec `features: { maxClasses: N }`, et une
`Subscription` rattachée à l'org perso à la souscription. **Point ouvert** :
la synchronisation `Plan.features.maxClasses` → `OrganizationSettings.maxClasses`
n'est pas automatique (deux tables distinctes) — nécessite un point
d'application explicite côté service au moment du changement de plan (cf. §6).

### 3.4 · Consultation — lecture seule, agrégée — ✅ actée

Le prof consulte :
- **Son planning personnel** (org perso) — lecture + actions classiques (check-in, QR, etc.) comme n'importe quel teacher.
- **Le planning de toutes les organisations institutionnelles où il a un profil `Teacher`** — nommé **"Planning global"** côté produit.

Le planning global est **strictement lecture seule** : on ne réinterprète ni
ne redéfinit aucune règle métier d'une institution (pas de check-in, pas de
modification) — c'est une **synthèse visuelle requêtée**, pas une action.

### 3.5 · Invitation étudiante — ✅ actée, aucun changement requis

Un utilisateur (avec ou sans compte, avec ou sans autre org) peut être
invité comme `Student` dans l'org perso du prof. Comme les profils sont
indépendants par `[userId, orgId]` (A-07), un étudiant réel d'une vraie
université peut aussi être `Student` dans l'org perso d'un prof, sans aucun
conflit. Le flow `inviteStudent()` existant fonctionne tel quel, ciblant la
`Class` unique choisie par le prof.

---

## 4. Exception à R1 (isolation tenant) — à documenter formellement

Le planning global (§3.4) est la **première traversée intentionnelle** de
frontière d'organisation dans le produit (R1 : *« aucune lecture ni écriture
ne franchit la frontière d'un établissement »*). C'est légitime et strictement
borné : un utilisateur ne voit jamais que ses **propres** profils `Teacher`
à travers ses orgs — jamais les données d'un autre utilisateur.

Recommandation (à acter en A-XX lors du passage en revue d'architecture) :
- Fonction de service **unique et nommée** (ex. `getMyGlobalScheduleAction(userId)`), qui résout tous les `Teacher.id` du user puis fait un seul `Schedule.findMany({ teacherId: { in: [...] } })` en lecture.
- Ne jamais généraliser ce pattern ailleurs sans revue explicite — il ne doit pas devenir un précédent pour d'autres traversées moins légitimes.

---

## 5. Ce que cette feature n'est pas (hors scope de cette itération)

- Pas de bascule automatique "org perso → vraie université" (ex. si le prof
  rejoint une institution plus tard). Si le besoin se confirme : un import
  ponctuel explicite (mapping manuel des `Room`/`Class` texte-libre vers de
  vraies ressources institutionnelles), jamais une migration de schéma.
- Pas de mode démo formalisé pour l'instant — l'org perso *ouvre la porte* à
  un futur mode démo (compte jetable, données de test), mais ce n'est pas
  la même feature et n'est pas traité ici.
- Le planning global n'expose aucune action d'écriture cross-org.

---

## 6. Questions ouvertes avant implémentation

1. **Routing/onboarding** : les routes actuelles sont `(attendancy)/[slug]/teacher/...`,
   bâties sur un slug d'org. Un flow de création de compte "sans université"
   doit soit générer un slug technique pour l'org perso (transparent pour
   l'utilisateur), soit introduire un point d'entrée de routing dédié.
   À trancher avec qui possède le routing/middleware.
2. **Synchronisation quota ↔ plan** (§3.3) : quel service applique
   `Plan.features.maxClasses` sur `OrganizationSettings.maxClasses` au
   changement d'abonnement ? (webhook paiement existant, ou nouveau point
   d'entrée à créer — dépend de l'état d'avancement du module billing).
3. **Downgrade / classes au-delà du nouveau quota** : si un prof revient à
   l'offre gratuite avec 7 classes actives et un quota qui retombe à 5,
   quel comportement ? (lecture seule sur l'excédent ? blocage de nouvelle
   création seulement ? À trancher — probablement la seconde option, la
   moins punitive.)
4. **Naming produit exact** du bouton/parcours de création ("Créer mon
   espace", "Utiliser Attendancy sans université"...) — question UX, pas
   technique, mais impacte le vocabulaire des services/actions à écrire.

---

## 7. Prochaine étape

Une fois les points 1 à 4 du §6 clarifiés : écrire les signatures de service
(`createPersonalOrganization(userId)`, `createPersonalClass(orgId, input)`,
`getMyGlobalScheduleAction(userId)`) et le flow de bootstrap académique en
détail, avant code.
