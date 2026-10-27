# Spécification Technique — Feature Chat Offline & Mesh (Attendancy)
**Date :** 2026-10-26 (Amendé)  
**Cible :** Applications clientes (`apps/teacher`, `apps/desktop`, mobiles Android/iOS) — *Phase 0 transverse Web/Desktop*  
**Modèles Prisma impactés :** `device.prisma` (1 champ), `communication.prisma` (1 champ) — *aucune migration avant la Phase 3*  

---

## 1. Contexte & Principes Directeurs

Dans les établissements d'enseignement, l'absence de réseau est fréquente (salles en sous-sol, zones blanches, sorties scolaires, coupures réseau). Le besoin est de permettre la communication continue au sein d'une classe (`ChannelType.CLASS`), puis de synchroniser les messages sur PostgreSQL dès qu'un appareil retrouve une connectivité Internet.

### Principes retenus
1. **Périmètre v1 ciblé :** Uniquement les canaux de classe (`ChannelType.CLASS`). Les DMs et Noise Protocol sont reportés en phase ultérieure.
2. **Minimalisme côté serveur :** La complexité offline (file d'attente, état de synchronisation, horloges logiques) vit dans le client local (SQLite). PostgreSQL ne stocke que la vérité réconciliée.
3. **Chiffrement symétrique obligatoire :** Aucun message ne transite en clair sur le mesh.
4. **Découplage JWT / Auteur :** L'appareil qui transmet le message à la base (le *Gateway Peer*) n'est pas nécessairement l'auteur du message.

---

## 2. Tableau des Références

| Référence / Projet | Modèle de Transport | Format & Déduplication | Sécurité & Identité | Enseignements pour Attendancy |
| :--- | :--- | :--- | :--- | :--- |
| **Bitchat** *(permissionlesstech)* | BLE Mesh flooding (TTL multi-sauts, max 7) | Paquets binaires compacts, déduplication | Noise Protocol (XX), clés éphémères, aucun compte | **Format de paquet BLE de référence** : segmentation MTU, flooding contrôlé par TTL, déduplication. |
| **Briar (Bramble)** | Multi-transport (BLE, Wi-Fi LAN, Tor) | Store-and-forward, sync de graphes | Clés d'identité statiques, chiffrement de groupe | **Modèle de groupe** : échange de vecteurs d'état lors de la rencontre entre pairs. |
| **Secure Scuttlebutt (SSB)** | Transport agnostique (LAN, BLE, TCP) | Feeds append-only chaînés cryptographiquement | Signatures Ed25519, gossip de logs immuables | **Modèle mental d'immuabilité** : messages immuables insérés avec idempotence pure (`ON CONFLICT DO NOTHING`). |
| **Berty (Wesh)** | BLE + mDNS (libp2p) | Store-and-forward, réplication CRDT | Protocole Wesh / Double Ratchet | Intérêt fort pour le **duo BLE + LAN**. |
| **Google Nearby Connections** | Wi-Fi Direct + BLE natif Android | Sockets abstraction haut niveau | Clés propriétaires | **Option pragmatique pour une v1 100% Android** (découverte et transport combinés sans écrire le BLE à la main). |

---

## 3. Schéma Prisma : Minimalisme à 2 Champs

Contrairement à une modélisation complexe répliquant l'état distribué en base, le schéma est allégé à **2 champs au total** sur l'ensemble de la base :

```
UserDevice.signingPublicKey (String?)  <-- Authentifie l'appareil auteur
Message.signature           (Bytes?)   <-- Marqueur d'ingestion offline & preuve d'intégrité
```

### 3.1. Justification des exclusions
- **Pas de `Channel.isMeshEnabled` :** Tout canal `CLASS` est éligible au mode classe locale par configuration métier.
- **Pas de `Message.clientMsgId` :** `Message.id` est déjà un UUID. Le client génère un **UUIDv7** avant l'émission. L'idempotence à l'ingestion repose directement sur :
  ```sql
  INSERT INTO "Message" (...) VALUES (...) ON CONFLICT (id) DO NOTHING;
  ```
- **Pas de `Message.isOffline` :** La présence d'une signature valide (`signature IS NOT NULL`) atteste intrinsèquement que le message provient du pipeline offline.
- **Pas de `Message.syncedAt` :** Un message présent dans PostgreSQL est synchronisé par définition. Le statut "en attente de synchronisation" appartient exclusivement au SQLite local du client.
- **Pas de `Message.sourceDeviceId` :** L'appareil auteur est encapsulé dans l'enveloppe cryptographique signée. Le serveur vérifie sa validité à l'ingestion sans qu'il soit nécessaire d'encombrer le schéma d'une relation superflue.
- **Pas de `Message.lamportClock` :** À l'ingestion, le serveur applique :
  $$\text{createdAt} = \min(\text{horloge appareil}, \text{now}())$$
  L'index existant `@@index([channelId, createdAt])` continue d'assurer un tri naturel et performant.
- **Pas de `noisePublicKey` ni `keyFingerprint` :** Les DMs sont reportés. L'empreinte se dérive mathématiquement à la volée depuis la clé publique.

### 3.2. Modifications exactes

> ⚠️ **Aucune migration Prisma n'est requise pour les Phases 0, 1 et 2.**  
> Les champs ci-dessous ne seront ajoutés qu'au démarrage de la Phase 3 (BLE / cryptographie signée).

#### Dans `apps/web/prisma/schemas/device.prisma` :
```diff
model UserDevice {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String    @db.Uuid
  deviceId       String    // string généré côté client
  ...
  revokedAt      DateTime?

+ // ─── Clé cryptographique P2P offline (Phase 3) ──────────────────────
+ signingPublicKey String?   // Clé publique Ed25519 (base64) pour vérifier les signatures offline

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions UserSession[]
}
```

#### Dans `apps/web/prisma/schemas/communication.prisma` :
```diff
model Message {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content   String
  createdAt DateTime  @default(now())
  userId    String?   @db.Uuid
  deletedAt DateTime?
  channelId String    @db.Uuid
  parentId  String?   @db.Uuid
  updatedAt DateTime  @updatedAt

+ // ─── Preuve d'intégrité offline (Phase 3) ───────────────────────────
+ signature Bytes?   // Signature Ed25519 (64 octets binaires) du paquet offline

  channel   Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  parent    Message?  @relation("MessageReplies", fields: [parentId], references: [id])
  replies   Message[] @relation("MessageReplies")
  user      User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([channelId, createdAt])
  @@index([userId])
  @@index([parentId])
}
```

---

## 4. Sécurité Cryptographique & Format de Paquet

### 4.1. Chiffrement Symétrique Obligatoire de Classe
Sur un canal de classe, un message relayé de saut en saut transite par les téléphones d'élèves tiers. **Aucun broadcast en clair n'est toléré.**
- Chaque canal `CLASS` dispose d'une clé symétrique de classe (**Class Channel Key** - AES-GCM-256 ou ChaCha20-Poly1305).
- Cette clé est distribuée de manière sécurisée par le serveur lorsque l'appareil est en ligne.
- La clé est renouvelée (ratchet/rotation) dès que la composition de la classe change (départ ou arrivée d'un élève).
- Le payload transmis sur le mesh est systématiquement chiffré avec cette clé.

### 4.2. Correction du Bug de Signature : Séparation Routage vs Payload
Dans un réseau mesh, le champ **TTL** est décrémenté par chaque nœud relais intermédiaire. Si le TTL était inclus dans les octets signés, la signature deviendrait invalide dès le premier saut.

Le paquet est donc scindé en deux enveloppes :
1. **Enveloppe de Routage Mutable (NON SIGNÉE) :** Modifiée à chaque relais.
2. **Enveloppe Applicative Immuable (SIGNÉE) :** Signée par l'auteur à l'émission, inviolable.

```
┌────────────────────────────────────────────────────────┐
│             1. Enveloppe de Routage (Mutable)          │
│  - Magic Header (2 octets)                             │
│  - TTL (1 octet - décrémenté à chaque saut)            │
│  - Hop Count (1 octet)                                 │
├────────────────────────────────────────────────────────┤
│             2. Enveloppe Applicative (Immuable)         │
│  [Octets signés par la clé Ed25519 de l'appareil auteur]│
│  - Protocole Version (1 octet)                         │
│  - Type de paquet (1 octet)                            │
│  - Channel ID (16 octets - UUID)                       │
│  - Message ID (16 octets - UUIDv7)                     │
│  - Horloge appareil (8 octets - Timestamp Unix ms)     │
│  - Author Device UUID (16 octets - UserDevice.id)      │
│  - Encrypted Payload (N octets - Chiffré classe)       │
├────────────────────────────────────────────────────────┤
│             3. Signature Cryptographique               │
│  - Ed25519 Signature (64 octets)                       │
└────────────────────────────────────────────────────────┘
```

### 4.3. Identité de l'Auteur dans le Paquet
- Le champ `Author Device UUID` utilise **`UserDevice.id`** (UUID Postgres garanti, stocké localement par le client lors de son enregistrement avec Bearer Token), et non le `deviceId` textuel libre.
- À la connexion initiale, le client Tauri enregistre son appareil dans `UserDevice` et y publie sa `signingPublicKey`.

### 4.4. Déduplication
Le calcul d'un hash composite redondant est supprimé. La déduplication dans le cache LRU mémoire du client s'effectue directement sur **l'UUIDv7 du message (`Message.id`)** :
- Réception d'un paquet $\rightarrow$ `Message.id` déjà présent dans le cache LRU $\rightarrow$ Ignoré sans traitement.
- Nouveau `Message.id` $\rightarrow$ Vérification signature $\rightarrow$ Stockage local $\rightarrow$ Décrémentation du TTL $\rightarrow$ Relais aux voisins si $\text{TTL} > 1$.

### 4.5. Gestion de la Fragmentation BLE
La surcharge d'enveloppe avoisine ~125 octets (dont 64 octets de signature Ed25519). Sans négociation, le MTU utile par défaut du BLE n'est que de ~20 à 23 octets.
- **En Phase 3 :**
  1. Négociation active de l'Extended MTU (demande à 512 octets à la connexion).
  2. Couche de fragmentation/réassemblage intégrée (framing Bitchat : `chunkIndex`, `totalChunks`, `transferId`) pour reconstituer les messages dépassant le MTU effectif.

---

## 5. Ingestion Serveur & Contrôles de Sécurité

La synchronisation s'effectue via une RPC dédiée : `batchSyncOfflineMessages`.  
Comme n'importe quel appareil connecté peut agir comme **Gateway Peer** et synchroniser des messages dont il n'est pas l'auteur, **le serveur ne se fie jamais au JWT de la requête pour authentifier l'auteur d'un message**.

### Algorithme de vérification à l'ingestion :
Pour chaque message du lot :
1. **Résolution de l'appareil auteur :** Recherche du `UserDevice` via le `Author Device UUID` du paquet.
2. **Vérification de révocation :** Le `UserDevice` doit avoir `revokedAt IS NULL` (vérifié en direct en base à l'instant T).
3. **Vérification de signature :** Validation de la signature `Ed25519` contre la `signingPublicKey` enregistrée du `UserDevice`.
4. **Contrôle d'habilitation :** L'utilisateur (`UserDevice.userId`) doit être membre effectif du canal (`ChannelMember`) à la date du message.
5. **Plafonnement temporel :** $\text{createdAt} = \min(\text{horloge appareil}, \text{now}())$ pour contrer les horloges locales désynchronisées ou malveillantes.
6. **Insertion idempotente :**
   ```sql
   INSERT INTO "Message" (id, content, "createdAt", "userId", "channelId", signature)
   VALUES (...)
   ON CONFLICT (id) DO NOTHING;
   ```
7. **Rate Limiting :** Quota de téléversement strict par appareil téléverseur pour éviter les dénis de service à la reconnexion.

---

## 6. Feuille de Route Révisée (5 Phases)

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Phase 0  │ ──> │  Phase 1  │ ──> │  Phase 2  │ ──> │  Phase 3  │ ──> │  Phase 4  │
│  Outbox   │     │  SQLite   │     │ LAN (Hub  │     │ BLE Mesh  │     │ Gateway & │
│ (No P2P)  │     │  Client   │     │WebSocket) │     │  Plugins  │     │ Ingestion │
└───────────┘     └───────────┘     └───────────┘     └───────────┘     └───────────┘
```

### Phase 0 : Outbox Offline-First Locale (Sans P2P)
*Bénéficie immédiatement à l'application Web et aux clients lourds.*
- Génération côté client de l'`id` (UUIDv7) pour chaque nouveau message.
- Enregistrement immédiat dans la file locale d'envoi (*Pending Outbox*).
- Détection de connectivité via l'`onlineManager` existant (`@attendancy/cache`) — *pas de `navigator.onLine` isolé*.
- Rejeu automatique des messages au retour du réseau avec insertion idempotente (`ON CONFLICT (id) DO NOTHING`).

### Phase 1 : Stockage Local Client (Tauri)
- Intégration de `tauri-plugin-sql` dans `apps/teacher`.
- Stockage persistant standard en base SQLite locale pour la liste des messages de classe et la file d'attente d'envoi.
- *Précision technique :* `tauri-plugin-sql` n'intègre pas de chiffrement au repos par défaut ; cette couche utilise SQLite standard sans promesse de chiffrement disque v1.

### Phase 2 : Transport LAN (Architecture Hub WebSocket)
- *Constat terrain :* Le P2P pur en mDNS/UDP multicast est fréquemment filtré sur les bornes Wi-Fi scolaires (isolation client / broadcast filtering).
- *Solution retenue :* **Mode Hybride Hub / Étoile locale** :
  - L'application enseignant (`apps/teacher`) héberge un micro-serveur WebSocket local (port aléatoire ou mDNS si supporté).
  - Un QR code ou une IP locale permet aux élèves de la salle de s'y connecter directement.
  - Tous les échanges sont chiffrés avec la **Class Channel Key**.
- *Aucune migration Prisma requise.*

### Phase 3 : Transport BLE Mesh (Secours Terrain)
- **Réalité technique Rust :** La bibliothèque Rust `btleplug` ne supporte que le rôle Central (scanning). Le rôle Peripheral (Advertising) nécessite des wrappers plateforme natifs :
  - **Android :** Plugin Tauri en Kotlin exploitant `BluetoothLeAdvertiser` et `BluetoothLeScanner` (avec permissions Android 12+ : `BLUETOOTH_ADVERTISE`, `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`).
  - **Option Nearby Connections :** Évaluée comme alternative pragmatique pour une v1 100% Android.
  - **iOS :** Plugin Tauri en Swift exploitant `CBPeripheralManager` et `CBCentralManager` (gestion des contraintes d'arrière-plan iOS).
- Intégration de la négociation d'Extended MTU et de la fragmentation/réassemblage.
- **Migration Prisma :** Application de l'ajout de `UserDevice.signingPublicKey` et `Message.signature`.

### Phase 4 : Ingestion Serveur & Gateway Peer
- Implémentation de la RPC `batchSyncOfflineMessages` avec les 7 contrôles de sécurité (signature, non-révocation, vérification membership, borne temporelle, découplage JWT/auteur).
- Tests d'ingestion par un tiers et validation de non-duplication par `ON CONFLICT (id) DO NOTHING`.
