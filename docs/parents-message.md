**Citation (type WhatsApp)** : la réponse reste dans la chronologie du canal, avec un aperçu du message d'origine au-dessus.
- Tout ce qu'on a construit continue de marcher sans changement de forme : la pagination par curseur, `reconcileMessages`, la fenêtre contiguë du cache et le broadcast.
- Le parent est une simple information d'affichage.

**Fils (type Slack)** : les réponses sortent du fil principal et vivent dans un panneau.
- `getMessages` et `getOlderMessages` filtrent `parentId: null`, et il faut une seconde requête paginée par fil, avec son propre cache.
- Chaque message racine doit porter un compteur de réponses.
- Les événements temps réel doivent être routés par `parentId`, et les notifications changent de logique (participants du fil plutôt que tout le canal).
- C'est une refonte, pas une extension.

Le modèle de données (`parentId`) supporte les deux, mais je conseille de ne pas prendre le second tant que le besoin n'est pas confirmé.

## Étapes proposées (pour le modèle « citation »)

**1. Serveur : valider le parent.** Aujourd'hui `parentId` est accepté sans contrôle croisé. Il faut vérifier que le parent existe, appartient au même canal (donc à la même organisation) et n'est pas supprimé. Un détail d'ordre compte : la vérification doit passer **après** la détection d'un rejeu idempotent. Sinon, un retry d'une réponse dont le parent a été supprimé entre-temps serait rejeté alors que le message existe déjà en base, et l'expéditeur resterait bloqué en `failed`. Il faut aussi vérifier que la clé étrangère est `onDelete: SetNull` si tu as des purges.

**2. Serveur : renvoyer un instantané du parent dans le DTO.** Sans ça, l'aperçu d'une réponse dont le parent est hors de la fenêtre chargée serait impossible, ce qui arrive vite avec la pagination. Via la relation auto-référente (à vérifier dans le schéma ; si elle n'existe pas, la contrainte à ajouter peut échouer sur des `parentId` orphelins déjà en base) :

```ts
parent: { select: { id: true, content: true, deletedAt: true,
                    user: { select: { id: true, firstName: true, lastName: true } } } }
```

Puis un post-traitement dans la requête : le contenu est tronqué (environ 200 caractères, pour ne pas sérialiser 50 × 4 000 caractères), et si le parent est supprimé, le contenu est remplacé par `null`. Un message supprimé ne doit jamais fuiter dans l'aperçu.

**3. Client : un seul `replyTo` dérivé dans `useChat`.** Le message chargé fait foi, l'instantané sert de repli :

```ts
replyTo: resolve(message.parentId)
  // 1. parent chargé (cache / temps réel), avec surcouche patches et pierres tombales
  // 2. sinon l'instantané embarqué par le serveur
  // 3. sinon null → « Message d'origine indisponible »
```

Ça donne la fraîcheur (un parent édité ou supprimé en direct met à jour l'aperçu) et la robustesse (un parent hors fenêtre s'affiche quand même). Je n'ajouterais pas d'instantané dans le payload broadcast : il est non fiable et permettrait de forger une fausse citation attribuée à quelqu'un. Un message temps réel dont le parent n'est pas chargé affichera un repli neutre jusqu'au prochain refetch, ce qui est rare puisqu'on répond surtout à des messages récents.

**4. Client : l'état de composition.** `replyToId` devient un objet (`replyingTo` avec auteur et extrait) pour le bandeau au-dessus du champ, avec `startReply(message)` et `cancelReply()`. Deux cas à gérer : le parent supprimé pendant la rédaction (on abandonne la réponse avec un toast, plutôt que de laisser le serveur la refuser) et le changement de canal. Sur ce dernier, un bug existe déjà dans la version actuelle : `replyToId` n'est pas réinitialisé quand `channelId` change, donc une réponse commencée dans un canal partirait vers l'autre avec un parent étranger. Le serveur la refuserait grâce à l'étape 1, mais l'expéditeur verrait un échec incompréhensible.

**5. Aller au message d'origine.** Je limiterais la première version au cas où le parent est déjà chargé (défilement et surbrillance, côté UI). Pour un parent plus ancien, charger une fenêtre autour de lui créerait une zone non contiguë dans le cache, ce qui casse l'invariant « sans trou » sur lequel reposent `reconcileMessages` et `useOlderMessages`. Une boucle bornée de `loadOlder` (5 pages au plus), puis un message « trop ancien », respecte l'invariant.

**6. Notifications (optionnel).** Aujourd'hui tout le canal reçoit le même push. Pour une réponse, l'auteur du parent devrait recevoir « X a répondu à votre message ». Ça se règle côté serveur, dans l'action de notification : c'est la raison de plus pour qu'elle reçoive seulement `{ channelId, messageId }` et relise le message en base, comme je l'avais suggéré.

## Risques à garder en tête

- **Profondeur** : en mode citation, on peut répondre à une réponse, et l'aperçu ne montre que le parent direct. Pas de récursion, donc rien à plafonner.
- **Suppression d'un parent** : les réponses restent, avec l'aperçu « Message supprimé ». C'est la raison de la tombstone dans l'instantané.
- **Coût** : la jointure sur le parent ajoute une lecture par ligne, négligeable avec l'index primaire. Le contenu tronqué limite surtout la taille de la réponse.
- **Tests** : la résolution de `replyTo` est une fonction pure, sur le modèle de `reconcileMessages`, avec les quatre cas (chargé, instantané, supprimé, absent).

