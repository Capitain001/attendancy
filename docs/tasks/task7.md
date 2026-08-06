path:C:C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\direction\invitations

analiser le systeme de la v1 et proproser un plan d implementation pour un systeme mieux ecris
-meilleur UX 
- Meilleur UI
ect 

il ne s agit pas d une reproduction , utiliser docs\cmd\por-dev.md , 
lire claude.md racine  + docs\skills\service-module-pattern\SKILL.md et docs\cmd\generators.md et implemente dans le plan les bon patern avant de continuer a coder : (ex: lire la fn x rapidement grace a l index /.api ou /summary , cree le service grace au generator de service , generer es type grace au generateur de types , ect ) pour aller plus vite


lire claude.md racine  + docs\skills\service-module-pattern\SKILL.md et docs\cmd\generators.md  pour inclure dans le plan le workflow d implementation avec les bon usage des outils et patern pour ne pas oublier durant les compacting : (ex: lire la fn x rapidement grace a l index /.api ou /summary , cree le service grace au generator de service , generer es type grace au generateur de types , ect )
---

## → Plan produit

`specs/invitations-v2/` (structure por-dev). **Périmètre : UX/UI des 2 écrans Direction,
structure backend conservée** — on consomme `modules/invitation/` tel quel.
- `spec.md` — analyse V1 (problèmes UX/UI), état V2 (backend dormant), user stories, critères
- `architecture.md` — couche frontend (pages→composants→hooks) sur `modules/invitation/` existant,
  inventaire des fonctions réutilisables, seul manque backend = wrapper `getOrgInvitationsAction`
- `plan.md` — 5 phases (wrapper backend → hooks → hub → écran classe → finition)

**Hors périmètre (différé)** : refactor `modules/invitation/` → `services/invitation/`
(module = core / service = usage métier `direction`/`student`/`teacher`). Décision prise, non exécutée.