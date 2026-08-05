objectif : reproduire les éléments nécessaires à la conception de la page planning de classe de la V1 :

path : C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\app\(attendancy)\[slug]\direction\planning\classe\[classId]\page.tsx

composant principal (point d'entrée) :
C:\PROJECTS\DEV\ULTIMATE\SAVE\attendancy\src\components\planning\ClassPlanning.tsx

Le résultat final devra éviter :

```ts
import { ClassPlanning } from "@/components/planning/ClassPlanning";
import { getPlanningResourcesAction } from "@/services/planning/actions";

utiiser:

import { ClassPlanning } from "@/components/planning";
import { getPlanningResourcesAction } from "@/services/planning";

//types
GetSchedulesReturn vs GetSchedulesDto  ( pour un type auto generer inferer d une fn database )
dans la V2 nous utilison pluto le terme Dto et les types sont generer automatiquement via :npx tsx scripts/generate/types/types.ts <service>

objectif de la tache 

reproduire src\components\planning\ClassPlanning.tsx
fonctionel appelabe sur une page 


NB:
La V1 contien deja le code applicatif il s agira surtout de l analyser , de  le recopier ( pas d ecriture from strach ) et d assurer le branchement 
La V1 et la V2 utilisent le même schéma de données sur la gestion de planning.
Ne pas refaire l'analyse métier comprendre le flux et si besoin proproser des amelioration 

suivre une logique portable semi-modulaire : mettre ensemble les elmement ayant le meme domaine pour faciliter leur usage 
exemple :components\planning\ contiendra les ui planning ce qui evite plusieur import diverses

La tâche essentielement consiste à :
- copier les composants nécessaires depuis la V1,
- adapter uniquement ce qui est nécessaire pour respecter les conventions V2,
- assurer le branchement final dans la V2. 