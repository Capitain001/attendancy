## Contexte

le service :

src/services/notification/: tente de rexporter les elements du module 

src/modules/notification/ , ce n est pas le but d un service 

le module contient : la logique core 
le service contient : la logique propre au projet (metier)


exemple :
apps\web\src\services\notification\service-worker.ts
apps\web\src\services\notification\push.ts
