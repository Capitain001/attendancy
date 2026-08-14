task : utilise :
grep -rn "toUpdateFn(" src/

pour identifier les hook sur qui sont tjr sur le forma V1 de toUpdateFn dans [actionHelpers.ts](file;file:///c%3A/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/hooks/entity/actionHelpers.ts) 

le format correct est : { id, data } 
actionHelpers.ts en V2 → construis { [idField]: id, data } au lieu de { [idField]: id, ...data }

NB:
- voir hook et fn reference V2 : [useClasses.ts](file;file:///c%3A/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/hooks/data/classes/useClasses.ts) , 
- retirer //@ts-nocheck au hook identifier pr identifier d autres erreurs 
- suivre le format des services ellustrer dans le skill :C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy\docs\skills\service-module-pattern\SKILL.md