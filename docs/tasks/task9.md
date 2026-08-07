
prompt similaire a docs\tasks\task1.md 


et reproduire ou recopier quand compatible les pages students de la v1 
path: C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\student

conserver le visuel des page :
C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\student\page.tsx

C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\student\session

C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\student\planning

se baser sur docs\visions pour le refactor des autres pages 

BN: 
-s'assurer de lire claude.md racine et inclure dans le plan les worflow de patern adapter pr la tache 

ex:  pour la recherche rapide des fn se baser sur ./api et /summary referncer dans claude.md (racine) inclure les script et patern juger utile a la tache dans le plan pr ne pas perdre le contexte , ect 

-utiliser le skill :docs\cmd\por-dev.md pour etabir le plan

---

## → Plan produit

`specs/student-pages-v2/` (structure por-dev) :
- `spec.md` — source V1 (10 pages), traitement par page (visuel conservé vs refactor vision), état V2,
  user stories (vision), critères
- `architecture.md` — décisions (routes : vision si pertinent sinon V1), arbre composants à porter
  (`components/student/{ui,session,planning,user}`), backend (`getStudentActiveSessionAction` absent V2 → porter ;
  `getStudentStatsAction.today` manquant), réutilisation `resolveScheduleUiStatus`/`mapScheduleToEvent`, générateurs service
- `plan.md` — 6 phases (backend → UI partagée → 3 pages visuel-conservé → layout/nav → refactor vision → finition),
  + Phase 0 = mon workflow d'exécution (index `.api`/summary, générateurs service, conventions frontend)

Constat clé : pages student V2 **inexistantes** ; service `student` a 3/4 actions
(`getStudentActiveSessionAction` à porter) ; UI student-role entièrement à porter depuis V1.



