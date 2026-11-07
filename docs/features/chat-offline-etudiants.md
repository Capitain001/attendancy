# Fiche produit — Chat de classe sans Internet

**Statut :** proposition produit à valider
**Public principal :** étudiants
**Facilitateur :** enseignant
**Périmètre envisagé :** échanges dans un canal de classe, depuis les applications clientes

Cette fiche décrit le besoin et l’expérience attendue. Elle ne spécifie ni l’architecture réseau, ni le stockage, ni le protocole de synchronisation. Pour ces aspects, voir l’[analyse de faisabilité](../analyses/chat-offline.md).

## 1. Problème utilisateur

Dans une salle ou un établissement où Internet est indisponible ou instable, les étudiants ne peuvent plus échanger dans le chat de leur classe. Ils ont besoin de continuer à partager des informations utiles au cours, puis de retrouver ces messages dans le chat habituel lorsque la connexion revient.

## 2. Promesse produit

Un étudiant peut envoyer et recevoir des messages dans le canal de sa classe même si le serveur Attendancy est temporairement inaccessible, à condition que les appareils concernés puissent rejoindre le réseau local de la séance.

Les messages sont présentés immédiatement sur l’appareil de leur auteur. L’interface indique clairement s’ils sont encore en attente, visibles seulement via le réseau local ou confirmés par Attendancy.

## 3. Utilisateurs et responsabilités

### Étudiant

- rejoint le chat local de la classe avec le QR fourni pour la séance;
- consulte les messages reçus à proximité;
- envoie des messages même sans Internet;
- voit quels messages attendent encore leur confirmation;
- peut relancer un envoi refusé ou retirer un message local en échec.

### Enseignant

- démarre et termine le mode d’échange local pour sa classe;
- affiche le QR de connexion aux étudiants;
- peut vérifier combien d’appareils ont rejoint la séance, si cette information est disponible;
- prévient les étudiants lorsque le mode local est terminé ou qu’Internet est revenu.

Le rôle de l’enseignant est celui d’un facilitateur de la séance locale. La modération, la suppression des messages des autres et les outils d’administration ne font pas partie du périmètre défini ici.

## 4. Parcours nominal

### A. L’enseignant ouvre l’échange local

1. Il ouvre le chat de la classe concernée.
2. Il active **« Démarrer le chat local »**.
3. Attendancy affiche un QR de séance et une indication pour que les étudiants rejoignent le réseau local prévu.
4. L’enseignant laisse l’écran ou le mode de séance actif pendant l’échange.

### B. Les étudiants rejoignent

1. Chaque étudiant ouvre le chat de la même classe dans l’application.
2. Il scanne le QR affiché par l’enseignant.
3. L’application confirme le nom de la classe et indique que l’étudiant est connecté au chat local.
4. L’étudiant peut voir les messages locaux disponibles pour cette séance et participer.

Le QR doit identifier la séance et la classe attendues. Un étudiant doit pouvoir reconnaître qu’il rejoint le bon échange avant d’envoyer un message.

### C. Les étudiants échangent sans Internet

1. L’étudiant rédige puis envoie un message.
2. Le message apparaît immédiatement dans son fil avec un indicateur **« En attente de synchronisation »**.
3. Les autres étudiants connectés au chat local peuvent le recevoir. Tant qu’Attendancy ne l’a pas confirmé, ils voient **« Reçu via le chat local — non confirmé »**.
4. Si l’envoi est refusé pour une raison définitive, le message affiche **« Échec »** et propose **« Réessayer »**. L’étudiant peut aussi le retirer de sa file locale.

Un indicateur de réception locale ne doit pas être présenté comme une confirmation de sauvegarde sur Attendancy.

### D. Internet revient

1. L’application tente de transmettre les messages en attente.
2. Lorsqu’Attendancy confirme un message, celui-ci prend l’état **« Envoyé »** dans le fil.
3. La copie reçue par le réseau local est remplacée par la version confirmée afin d’éviter les doublons.
4. Si l’application est toujours hors ligne ou si le serveur refuse le message, l’indicateur reste explicite et l’étudiant peut agir en conséquence.

Chaque message est synchronisé à partir de l’appareil de son auteur. Recevoir une copie locale d’un message ne garantit donc pas, à lui seul, que ce message sera sauvegardé sur Attendancy.

### E. L’enseignant termine le mode local

1. L’enseignant choisit **« Terminer le chat local »** ou clôt la séance.
2. L’application indique aux participants que les nouveaux échanges locaux sont terminés.
3. Les messages qui n’ont pas encore été confirmés restent signalés comme tels sur l’appareil de leur auteur; ils ne doivent pas apparaître comme sauvegardés.

Le comportement exact des messages en attente après la clôture — notamment la durée de conservation et les possibilités de renvoi — reste à valider.

## 5. États des messages visibles

| État affiché | Signification pour l’étudiant | Action disponible |
|---|---|---|
| **En attente de synchronisation** | Le message est conservé sur l’appareil de son auteur, mais Attendancy ne l’a pas encore confirmé. | Attendre; consulter le message dans le chat local. |
| **Reçu via le chat local — non confirmé** | Une copie du message est arrivée par l’échange local; Attendancy ne l’a pas encore confirmé. | Lire; ne pas interpréter comme une sauvegarde serveur. |
| **Envoyé** | Attendancy a accepté le message et il est disponible dans l’historique normal du canal. | Aucune action de synchronisation. |
| **Échec** | L’envoi a été refusé ou n’a pas pu aboutir selon le résultat présenté par l’application. | Réessayer ou retirer la copie locale. |

Les libellés, icônes et distinction entre panne réseau temporaire et refus définitif devront être validés avec l’UI. Le point produit incontournable est de ne jamais confondre « transmis sur le réseau local » et « confirmé par Attendancy ».

## 6. Préconditions d’utilisation

- L’étudiant doit disposer d’un accès au canal de classe dans Attendancy.
- L’enseignant et les étudiants doivent utiliser une version de l’application qui prend en charge le chat local.
- Les appareils doivent pouvoir communiquer sur le réseau local de la séance; une connexion Internet n’est pas nécessaire pour l’échange local lui-même.
- Pour synchroniser vers l’historique Attendancy, l’appareil de l’auteur doit retrouver un accès au serveur.
- Le QR de séance doit être encore valide et correspondre au canal de classe attendu.

Le fonctionnement lorsque l’étudiant n’a jamais ouvert sa session sur cet appareil, n’a pas chargé les droits de la classe, ou a changé de compte hors ligne n’est pas garanti par cette proposition et doit être défini avant le lancement.

## 7. Périmètre v1 proposé

### Inclus

- échanges textuels dans le canal de classe;
- connexion au chat local à l’aide du QR de séance;
- envoi et réception sur le réseau local;
- indication visible des états local, en attente, confirmé et en échec;
- synchronisation ultérieure vers le canal Attendancy existant;
- déduplication visible entre copie locale et message confirmé.

### Hors périmètre proposé

- conversations privées et messages directs;
- pièces jointes, photos, audio, vidéo et partage de fichiers;
- fonctionnement mesh multi-sauts ou Bluetooth;
- garantie que chaque message local est sauvegardé même si son auteur perd son appareil avant la synchronisation;
- lecture ou modification des droits de la classe hors ligne;
- modération avancée, suppression/modification des messages d’autrui et accusés de lecture.

## 8. Confidentialité et attentes à communiquer

- Le chat local est limité au contexte de classe et de séance affiché à l’étudiant.
- Le QR ne doit pas être partagé publiquement et doit expirer à la fin de la séance ou après une durée clairement annoncée.
- Les messages non confirmés sont conservés localement; l’interface doit avertir l’utilisateur qu’ils peuvent ne pas être présents sur son compte ou sur un autre appareil.
- L’étudiant doit pouvoir distinguer les messages confirmés des copies reçues localement.
- L’application ne doit pas promettre un niveau de confidentialité ou une livraison garantie tant que ces garanties ne sont pas effectivement validées.

## 9. Critères d’acceptation produit

1. Un enseignant peut démarrer un échange local pour le bon canal de classe et présenter un QR compréhensible.
2. Un étudiant autorisé peut rejoindre cet échange et identifier la classe avant d’envoyer.
3. Deux étudiants sur le même réseau local peuvent échanger sans accès au serveur Attendancy.
4. Un message créé hors ligne reste visuellement distinct d’un message confirmé.
5. Après retour d’Internet, un message confirmé apparaît dans le canal habituel sans doublon visible.
6. Un message non confirmé n’est jamais présenté comme sauvegardé ou livré à tous les membres de la classe.
7. Si la synchronisation échoue, l’étudiant voit l’état et sait s’il peut réessayer ou retirer son message.
8. La fin de la séance empêche les nouveaux participants de croire qu’ils rejoignent encore l’échange local.

## 10. Décisions produit encore à valider

- Le chat local est-il activé par séance, par cours ou par classe?
- Le canal de classe existant est-il le seul espace utilisé, ou faut-il un fil local temporaire distinct?
- Qui peut démarrer/arrêter l’échange si plusieurs enseignants encadrent la même séance?
- Quelle durée le QR reste-t-il valable? La clôture de la session l’invalide-t-elle immédiatement?
- L’enseignant voit-il les messages en attente et les états de synchronisation des étudiants, ou seulement le fil de discussion?
- Quelle conservation est promise pour les messages reçus localement et les messages en attente après la fin de séance?
- Un message « non confirmé » doit-il être visible dans le fil après expiration du QR ou après changement de compte?
- Quels appareils et versions sont officiellement pris en charge en première livraison?
- Quel message d’interface explique les limites de confidentialité et l’éventuelle perte avant synchronisation?

## 11. Documents associés

- [Analyse de faisabilité technique](../analyses/chat-offline.md)
- [Spécification technique du chat offline et mesh](../rapport/2026-10-26-feature-chat-offline.md)
- [Vision du rôle étudiant](../visions/roles/student.md)
- [Hooks partagés Web / Vite / Tauri](../techs/hooks-partages.md)
