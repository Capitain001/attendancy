Décisions actées
omitted sur le welcome : ignoré pour l'instant, sans indicateur « historique partiel » (le serveur central fournit l'historique complet au retour d'Internet). Garde-fous notés pour un éventuel rattrapage futur : un ensemble d'IDs en mémoire borné et vidé à stop(), ainsi que --max-welcome-bytes dans KNOWN_OPTIONS pour le test E2E.

Commentaire de relay-host.ts : corrigé pour refléter la solution retenue (bibliothèque, et non « sidecar Tauri »).

Vocabulaire et périmètre métier : abandon des termes « élève » et « enseignant » au profit d'un vocabulaire neutre (réseau local, hôte, appareil, lien d'appairage) selon l'usage métier ; Pairing.sessionId conservé tel quel ; renderQr retenu sous l'angle de la capacité d'hébergement.

Canaux au hello : signature connectLan(pairing, { channels? }) validée, les canaux imposés par le profil métier primant sur la liste du provider utilisée en repli.

Relecture hors ligne de useChannels (queryPersister) : actée comme tâche distincte à prendre en compte.

Contrainte Web http:// / ws:// et saisie du lien : confirmé par l'essai sur [http://192.168.1.71:8080](http://192.168.1.71:8080) avec URL ws:// pré-remplie (le passage par https:// poserait un conflit entre caméra sécurisée et ws:// en contenu mixte). Le scanner basé sur BarcodeDetector est retiré de la brique 6 au profit de la saisie/collage du lien, avec un scanner injectable optionnel réservé à l'app native (brique 7).

Identité déclarée à l'écran : validée via un avis dans LanPanel et une info-bulle sur les messages non confirmés dans MessageBubble.tsx.

dans le code actuel :

1. **`connectLan(pairing)` sans `{ channels? }` :**
   * Dans [ChatSyncProvider.tsx](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/modules/chat/ChatSyncProvider.tsx#L49-L176), `connectLan(p: Pairing)` ne prend pas d'options et utilise uniquement `channelsRef.current` (y compris pour `inbox.knownIds`). Il faudra passer à `connectLan(p: Pairing, opts?: { channels?: string[] })` (et penser à la reprise après rechargement dans `sessionStorage` si `channels` est imposé).

2. **Démarrage à froid hors-ligne (`channelIds` = `[]`) :**
   * `acceptsChannel` ([ligne 139](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/modules/chat/ChatSyncProvider.tsx#L139)) et `connectLan` ([ligne 174](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/modules/chat/ChatSyncProvider.tsx#L174)) lisent `channelsRef.current` alimenté par `useChannels` dans [route.tsx](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/chat/src/routes/_app/route.tsx#L21-L31).
   * Sans persistance locale (`queryPersister`) pour `useChannels` (ou `opts.channels`), un démarrage à froid hors-ligne part avec `[]` → refus `not_member` du relais et rejet par `acceptsChannel`.

3. **Compteur « non confirmés » dans [useSyncCounts.ts](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/apps/web/src/modules/chat/lan/useSyncCounts.ts#L19) :**
   * Aujourd'hui il fait simplement `unverified: inbox.length`, sans exclure les IDs déjà confirmés/persistés.

4. **Collision de noms `ChatMessage` / `MessageStatus` :**
   * [packages/chat/src/types.ts](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/packages/chat/src/types.ts#L25-L36) exporte `ChatMessage` et `MessageStatus`, alors que [MessageBubble.tsx](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/packages/ui/src/components/chat/MessageBubble.tsx#L9) utilise déjà le `ChatMessage` applicatif — d'où un risque de collision à l'import si on les mélange sans alias ou renommage.