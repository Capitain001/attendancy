quelque qestion concernant :apps\web\src\components\users\list\TClassesInvitationScreen.tsx

: ne modiie pas le code , repond simplement

2. Comment le serveur/ client  distingue « nouveau » et « existant ».
Par recherche de l’email ? Que se passe-t-il pour un email saisi qui correspond à un user existant hors de la liste available (un user de l’org sans profil étudiant, ou d’une autre org) ? Le client doit-il pré-classer, ou le serveur décide-t-il seul ?


4. Forme du retour.
On sait qu’il y a status: ok | partial | failed avec succeeded[] et failed[]. Que contiennent ces éléments (email ? studentId ? raison de l’échec) ? On en a besoin pour garder les échecs cochés et pour réafficher les emails saisis en échec.

5. Ajout à un groupe optionnel.
Le serveur l’accepte-t-il un groupId par invitation
Si l’inscription se fait à l’acceptation, où est stocké le groupe en attendant (dans details: DatabaseInvitationDetails) 
