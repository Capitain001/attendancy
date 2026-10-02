la route personnel represente un espace personel pr l user sans dependre de d administration (organition.type:Institution)

-apps\web\src\app\(app)\personal\[slug]\teacher
reprensente l interface libre du prof 

les ecrant sont quasi identique que l interface institrutionel :apps\web\src\app\(app)\[slug]\teacher

adapter au contexte car l user teacher doit a present gerer ses propre cours
nous utilisons donc des fn boostrap ex:apps\web\src\services\class\actions\class.mutations.ts (createPersonalClassAction)
l option allowPersonalOrg: true sur aurh access

ou encore des fn adapter tel que 
-apps\web\src\services\class\form.ts

pour gerer l interface personel 

notre tache est d offrire une gestion clean des planning et cours au l user teacher 

il devra principalement pouvoir :

-cree les classe ( deja implementer )
-cree des cours ( bootsrap a ecrir de facon logique )
-inviter ses etudiants (deja implementer)
-gerer et cree ses planning actuelement vue unique via apps\web\src\app\(app)\personal\[slug]\teacher\planning\page.tsx (a cree une ui PersonalTeacherPlanning qui permetra aussi l edition , l ui sera inspirer de TeacherPlanning et de la logique fonctionel de apps\web\src\components\planning\ClassPlanning.tsx )

-permettre un suvi des etudiants (retard d un etudiant , notes , acces au info ( parent , numero ect ) )
-permetre le cheking de session ( deja implementer)
les taches seront a decouper en mini lot livrable 