apps\web\src\hooks\data\invitation\use-class-invitations.ts
apps\web\src\modules\invitation\student\actions.ts
notifyInvitationStakeholders
apps\web\src\modules\invitation\notifications.ts


apps\web\src\modules\auth\members\inbox-invitation.ts

lorsqu on invite un etudiant existant dans l org a une nouvelle classe l ui ne doit pas afficher :"Vous avez été invité à rejoindre P.Jeane Edouarde en tant que étudiant."

mais pluto un message adapter selon le contexte d invitation , ne code pas encore evalue ma proprosition

fn responsable du message  buildInvitationNotification
 : apps\web\src\services\notification\database\notification.mutations.ts


Proposition

Principe : buildInvitationNotification reste une fonction pure, mais elle ne choisit plus son message uniquement à partir de role et org. Elle reçoit un contexte d’invitation déjà résolu, et le message dépend de ce contexte.

1. Le contexte vient de la source, pas du builder

InvitationNotificationSource gagne deux champs :

isExistingMember: boolean : l’utilisateur a déjà un UserOrganization dans cette org.
resourceName?: string | null : le libellé de la ressource ciblée (nom de la classe pour CLASS).

Ces infos sont connues à la création, dans inviteUser. Le nom de la classe est déjà lu par checkInvitationResources, donc il suffit de le retourner au lieu de refaire une requête. isExistingMember se résout avec une seule requête userOrganization, au même endroit. Le builder ne touche jamais à la DB.

2. Le message est dérivé d’un context discriminé

À partir de isExistingMember et resourceType, on obtient un context :

Contexte	Condition	Message proposé
ORG_JOIN	nouveau membre, sans ressource	« Vous avez été invité à rejoindre {org} en tant que {rôle}. » (inchangé)
ORG_JOIN_CLASS	nouveau membre + CLASS	« {org} vous invite à rejoindre la classe {classe} en tant qu’étudiant. »
CLASS_ENROLL	membre existant + CLASS	« Vous avez été invité à rejoindre la classe {classe}. » (l’org n’est pas répétée, il en fait déjà partie)
ROLE_ADD	membre existant, sans ressource, rôle différent	« {org} vous propose le rôle de {rôle}. »

Un switch exhaustif sur context (avec un never en default) garantit qu’un futur resourceType (matière, groupe…) force à écrire son message. Si resourceName est absent, on retombe sur « une classe » plutôt que sur un message cassé.

3. Le context est persisté dans metadata

On ajoute context et resourceName à la metadata de la notification. Cela permet à l’UI (composant serveur) d’adapter le libellé du bouton (« Rejoindre la classe » au lieu de « Accepter ») en lisant la metadata telle quelle, sans mapping côté serveur. upsertInvitationNotification passe par le même builder, donc un renvoi garde un message cohérent.

4. Amendements aux autres messages (même logique, après le flux principal)
createInvitationResponseNotification : le message à l’émetteur doit suivre le contexte. Par exemple « X a accepté de rejoindre la classe 6e A » au lieu de « …rejoindre {orgName} ». Il lui faut context et resourceName dans InvitationResponseSource.
notifyInvitationStakeholders : « Invitation étudiant envoyée à {email} » peut citer la classe, puisque classId est déjà passé.
Points à trancher
Existant avec un autre rôle : si un enseignant déjà dans l’org est invité comme étudiant, est-ce CLASS_ENROLL ou un cas à part ? Je propose de le traiter via ROLE_ADD ( a verifier l existant), sans cas spécial supplémentaire.
