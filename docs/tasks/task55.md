: git grep -n "insecure_context\|bad_token\|ack_timeout" packages/chat/src


 le tableau de couverture est exact, les compléments sont bien priorisés, et l'observation sur le test de l'arrivant tardif est juste (Carol arrive avec une inbox vide, donc il ne prouve pas l'exclusion des ids connus).

## Amendements

1. **`Drop` annule, il n'attend pas.** `Drop` ne peut pas être asynchrone. Le plan écrit « la même logique dans `Drop` » : il faut que `Drop` ne fasse que déclencher le jeton d'annulation (les tâches se terminent seules), et que `stop().await` soit le seul à attendre leur fin. Le test Rust doit couvrir les deux chemins.
2. **La suite `hostContract` ne prouve pas l'arrêt de la bibliothèque.** Appliquée à l'hôte qui lance le binaire, « l'arrêt libère le port » passe trivialement : tuer un processus libère tout. La preuve de `stop()` reste dans les tests Rust, et il en faut au moins un où le **processus de test reste vivant** pendant que les clients reçoivent la trame `Close`. La suite de contrat garde son utilité pour la sémantique côté TypeScript (double `start`, `start` après `stop`) et pour la brique 8.
3. **Il faut un client WebSocket côté Rust.** (plugin `tauri-plugin-websocket`), connexion côté Rust, pas depuis la WebView. 

Depuis Rust: ni mixed content ni CSP ne s'appliquent. Il existe un plugin officiel, tauri-plugin-websocket. Et ton moteur est déjà prêt : createLanTransport reçoit WebSocketImpl, que ton e2e remplace par le module ws de Node. En Tauri, on y passe un petit adaptateur sur ce plugin, sans toucher au moteur.

à la brique 8 , Il faut prevoir l'adaptateur qui implémente `WebSocketCtor`, et définir avant ça le **sous-ensemble minimal** de l'API WebSocket dont `createLanTransport` dépend réellement (événements, `readyState`, `send`, `close`). Cette interface se teste avec un faux, l'adaptateur lui-même sur appareil.

Ce qui reste des contraintes mobiles: iOS et Android:

iOS : l'autorisation « réseau local » (message d'explication obligatoire) pour toute connexion à une adresse locale, que le code soit en JavaScript ou en Rust. Et l'appli suspendue en arrière-plan coupe l'hébergement : l'enseignant doit garder l'appli au premier plan.
Android : pour héberger écran éteint, il faut un service de premier plan, donc un petit plugin Kotlin, c'est la seule vraie part de code hors Rust.
Windows et macOS : l'invite du pare-feu au premier lancement du relais.

4. **L'identité doit être décidée avant de figer les tests du protocole.** Le plan ne la mentionne pas. Tant que `hello.userId` est une simple déclaration, les tests des briques 1 à 4 vont graver ce comportement, et `--members` y paraîtra comme un contrôle d'accès alors qu'il n'en est pas un. La version 1 du protocole peut recevoir un champ optionnel (par exemple `credential`) sans casser les clients existants, et `bad_version` permet d'évoluer ensuite. Je réserverais ce champ maintenant et je nommerais clairement « identité déclarée » dans les tests existants.
5. **Un essai jetable sur appareil avant les briques 5 à 7.** Il est repoussé à la brique 8, après toute l'interface. Un projet minimal suffit : hôte démarré par la bibliothèque dans une appli Tauri, un autre appareil qui rejoint via le client Rust, sur un vrai téléphone. Ce que ça révèle (invite « réseau local » d'iOS, isolation des clients Wi-Fi, comportement en arrière-plan) peut changer l'interface, donc il vaut mieux le savoir avant de la construire.
6. **Côté relais, trois ajouts.**
   - **Plafond de taille :** le constat est juste, avec une précision : à ma connaissance les défauts de `tungstenite` sont 64 Mio par message et 16 Mio par trame, bien au-delà de ce dont une messagerie a besoin mais on aura a implementer l envoie de fichier dans d autres taches (hors tache actuel). 

   - **Nombre de connexions :** une limite par relais et une limite de débit par client. Un porteur du jeton peut sinon ouvrir des centaines de connexions ou inonder un canal.
   - **Port occupé :** le cas déjà cité (erreur sans panique), qui devient un message lisible pour l'enseignant.


## Ses deux questions

- **Les correctifs du transport sont-ils déjà appliqués ?** Tu le sauras en cinq secondes : `git grep -n "insecure_context\|bad_token\|ack_timeout" packages/chat/src`. S'il ne trouve rien, ce sont les tests qui viennent en premier, comme il l'a lui-même proposé.
- **Le faux relais en TypeScript :** oui, pour les trames mal formées, le silence prolongé et l'ack retardé, qu'un relais réel ne peut pas produire. Je garderais ces cas, et seulement eux, sur ce faux relais, avec la conformité du protocole sur le vrai relais.

## À transmettre à l'instance

Les points 3, 4 et 5 sont les seuls que son plan ne contient pas du tout, donc ce sont ceux à lui renvoyer en priorité, avec la décision sur l'identité à prendre de ton côté d'abord.


point a savoir :

 git grep -n "insecure_context\|bad_token\|ack_timeout" packages/chat/src
packages/chat/src/lan-transport.ts:27:const FATAL = new Set(['bad_token', 'not_member', 'bad_hello'])
packages/chat/src/lan-transport.ts:129:      failure = 'insecure_context'
packages/chat/src/lan-transport.ts:206:        const timer = setTimeout(() => settle(env.id, new Error('ack_timeout')), ackTimeoutMs) 
PS C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy> 

 git grep -n "reason\|ping\|silence\|heartbeat\|new WebSocketImpl\|started" packages/chat/src/lan-transport.ts\PRODUCTIONS\attendancy>
packages/chat/src/lan-transport.ts:24:  pingIntervalMs?: number
packages/chat/src/lan-transport.ts:33:  const pingMs = opts.pingIntervalMs ?? 20_000
packages/chat/src/lan-transport.ts:42:  let pingTimer: ReturnType<typeof setInterval> | undefined
packages/chat/src/lan-transport.ts:59:    if (pingTimer) {
packages/chat/src/lan-transport.ts:60:      clearInterval(pingTimer)
packages/chat/src/lan-transport.ts:61:      pingTimer = undefined
packages/chat/src/lan-transport.ts:77:  // Fermeture traitée UNE fois, qu'elle vienne de onclose ou de la détection de silence.
packages/chat/src/lan-transport.ts:93:    pingTimer = setInterval(() => {
packages/chat/src/lan-transport.ts:96:      if (Date.now() - lastSeen > pingMs * 2.5) {
packages/chat/src/lan-transport.ts:106:        sock.send('{"t":"ping"}')
packages/chat/src/lan-transport.ts:110:    }, pingMs)
packages/chat/src/lan-transport.ts:165:        if (f.id) settle(String(f.id), new Error(String(f.reason)))
packages/chat/src/lan-transport.ts:168:        else if (FATAL.has(String(f.reason))) {
packages/chat/src/lan-transport.ts:170:          failure = String(f.reason)
PS C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy> 
