# 🚀 Système de Cache Utilisateur

Documentation complète du système de cache triple niveau pour les informations utilisateur.

---

## 📐 Architecture

### Triple Cache Stratégique

```
┌─────────────────────────────────────────────────────────┐
│  NIVEAU 1: React Cache (Request-level)                  │
│  ⚡ Déduplique les appels durant le même render         │
│  🔑 Clé: [userId, options]                              │
│  ⏱️  Durée: 1 requête/render                            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  NIVEAU 2: LRU Cache (Cross-request)                    │
│  💾 Stocke en mémoire entre les requêtes                │
│  🔑 Clé: userId                                          │
│  ⏱️  TTL: 10 minutes                                     │
│  📊 Max: 1000 utilisateurs                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  NIVEAU 3: Supabase Auth                                 │
│  🗄️  Source de vérité                                    │
│  🔒 Validation de sécurité                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Utilisation Rapide

### 1. Utilisation Standard (avec cache)

```typescript
import { getUserInfo } from '@/services/users/getUserInfo'

// Dans n'importe quel composant ou server action
const user = await getUserInfo()

// Même si 10 composants appellent cette fonction dans le même render,
// elle ne s'exécutera qu'UNE seule fois grâce au React Cache
```

### 2. Forcer le Refresh

```typescript
// Après une mise à jour de profil
await updateUserProfile(userId, { name: "New Name" })

// Invalider le cache
CacheInvalidation.onUserUpdate(userId)

// Récupérer les données fraîches et mettre à jour le cache
const freshUser = await getUserInfo({ refresh: true })
```

### 3. Bypass le Cache

```typescript
// Pour des vérifications critiques de sécurité
const user = await getUserInfo({ cache: false })

// Accès direct à Supabase, sans toucher au cache LRU
// React Cache reste actif pour éviter les duplications
```

---

## 📊 Performance

### Scénario 1: Render Multiple

```typescript
// Header.tsx
const user = await getUserInfo() // ✅ Exécution réelle (50ms)

// Sidebar.tsx (même render)
const user = await getUserInfo() // ⚡ React Cache hit (<1ms)

// ProfileMenu.tsx (même render)
const user = await getUserInfo() // ⚡ React Cache hit (<1ms)

// Résultat: 3 composants, 1 seule exécution
```

### Scénario 2: Requêtes Successives

```typescript
// Request 1 à 10:00:00
const user = await getUserInfo() 
// Cache miss → Supabase (50ms) → LRU

// Request 2 à 10:00:05
const user = await getUserInfo() 
// LRU hit → O(1) (<1ms)

// Request 3 à 10:09:59
const user = await getUserInfo() 
// LRU hit → O(1) (<1ms)

// Request 4 à 10:10:01
const user = await getUserInfo() 
// TTL expiré → Supabase (50ms) → LRU
```

### Scénario 3: Multi-Utilisateurs

```typescript
// User A - 5 composants dans le même render
// → 1 seule exécution grâce à React Cache

// User B - 3 composants dans le même render (différente requête)
// → 1 seule exécution (cache séparé par userId)

// Isolation totale: pas de collision entre utilisateurs
```

---

## 🔧 API Complète

### `getUserInfo(options?)`

Fonction principale pour récupérer les informations utilisateur.

**Options:**

```typescript
interface GetUserInfoOptions {
  cache?: boolean   // true (défaut) ou false
  refresh?: boolean // false (défaut) ou true
}
```

**Exemples:**

```typescript
// Mode par défaut (triple cache activé)
const user = await getUserInfo()

// Forcer le refresh du cache LRU
const user = await getUserInfo({ refresh: true })

// Bypass le cache LRU
const user = await getUserInfo({ cache: false })
```

### Fonctions Helpers

```typescript
// Alias pratiques
getUserInfoCached()  // = getUserInfo({ cache: true })
getUserInfoDirect()  // = getUserInfo({ cache: false })
getUserInfoRefresh() // = getUserInfo({ refresh: true })
```

---

## 🗑️ Invalidation du Cache

### Classe `CacheInvalidation`

Helpers pour invalider intelligemment le cache.

```typescript
import { CacheInvalidation } from '@/services/users/cache-invalidation'

// Après mise à jour d'un utilisateur
CacheInvalidation.onUserUpdate(userId)

// Après changement d'organisation
CacheInvalidation.onOrganizationChange('acme-corp')

// Après suppression d'organisation
CacheInvalidation.onOrganizationDeleted('acme-corp')

// Import en masse
CacheInvalidation.onBulkUserUpdate(['user1', 'user2', 'user3'])

// Reset complet (⚠️ précaution)
CacheInvalidation.reset()

// Statistiques
const stats = CacheInvalidation.getStats()
// {
//   total: 245,
//   maxSize: 1000,
//   usage: "24.5%",
//   byOrganization: {
//     'acme-corp': 45,
//     'tech-startup': 200
//   }
// }

// Rapport détaillé
CacheInvalidation.logReport()
```

---

## 💡 Cas d'Usage Pratiques

### 1. Mise à Jour de Profil

```typescript
// src/app/api/users/[id]/route.ts
export async function PATCH(req, { params }) {
  const userId = params.id
  const updates = await req.json()
  
  // 1. Mise à jour en base
  await db.user.update({
    where: { id: userId },
    data: updates
  })
  
  // 2. Invalider le cache
  CacheInvalidation.onUserUpdate(userId)
  
  // 3. Le prochain appel à getUserInfo() récupérera les données fraîches
  return Response.json({ success: true })
}
```

### 2. Changement de Rôle

```typescript
"use server"
import { CacheInvalidation } from '@/services/users/cache-invalidation'
import { getUserInfo } from '@/services/users/getUserInfo'

export async function promoteToAdmin(userId: string) {
  // Mise à jour
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'ADMIN' }
  })
  
  // Invalider
  CacheInvalidation.onUserUpdate(userId)
  
  // Récupérer avec refresh pour vérification
  const user = await getUserInfo({ refresh: true })
  
  return user
}
```

### 3. Modification d'Organisation

```typescript
// src/app/api/organizations/[slug]/route.ts
export async function PUT(req, { params }) {
  const orgSlug = params.slug
  const updates = await req.json()
  
  // Mise à jour
  await db.organization.update({
    where: { slug: orgSlug },
    data: updates
  })
  
  // Invalider TOUS les utilisateurs de cette org
  const count = CacheInvalidation.onOrganizationChange(orgSlug)
  
  return Response.json({ 
    success: true, 
    invalidatedUsers: count 
  })
}
```

### 4. Vérification de Sécurité

```typescript
// Pour des opérations sensibles, bypass le cache
export async function deleteAccount() {
  // Vérifier avec des données fraîches
  const user = await getUserInfo({ cache: false })
  
  if (user?.role === 'ADMIN') {
    throw new Error("Les admins ne peuvent pas supprimer leur compte")
  }
  
  // Procéder à la suppression...
}
```

---

## 📈 Monitoring

### Statistiques Globales

```typescript
import { getCacheStats } from '@/services/users/lru-cache'

const stats = getCacheStats()
console.log(`Cache: ${stats.size}/${stats.maxSize}`)
// Cache: 245/1000

// Alerter si > 80%
if (stats.size / stats.maxSize > 0.8) {
  await sendAlert('Cache à 80%')
}
```

### Statistiques par Organisation

```typescript
import { getCacheStatsByOrg } from '@/services/users/lru-cache'

const orgStats = getCacheStatsByOrg()
for (const [slug, count] of orgStats) {
  console.log(`${slug}: ${count} utilisateurs`)
}
// acme-corp: 45 utilisateurs
// tech-startup: 200 utilisateurs
```

### Dashboard Admin

```typescript
// src/app/admin/cache/page.tsx
import { CacheInvalidation } from '@/services/users/cache-invalidation'

export default function CacheDashboard() {
  const stats = CacheInvalidation.getStats()
  
  return (
    <div>
      <h1>Cache Utilisateur</h1>
      <div>
        <p>Utilisation: {stats.usage}</p>
        <p>Total: {stats.total}/{stats.maxSize}</p>
      </div>
      
      <h2>Par Organisation</h2>
      <table>
        {Object.entries(stats.byOrganization).map(([slug, count]) => (
          <tr key={slug}>
            <td>{slug}</td>
            <td>{count}</td>
          </tr>
        ))}
      </table>
      
      <button onClick={() => CacheInvalidation.reset()}>
        Vider le cache
      </button>
    </div>
  )
}
```

---

## ⚠️ Best Practices

### ✅ À FAIRE

1. **Toujours invalider après mise à jour**
   ```typescript
   await updateUser(...)
   CacheInvalidation.onUserUpdate(userId)
   ```

2. **Utiliser `refresh: true` après modifications importantes**
   ```typescript
   await changeUserRole(userId, 'ADMIN')
   const user = await getUserInfo({ refresh: true })
   ```

3. **Utiliser `cache: false` pour les vérifications sensibles**
   ```typescript
   // Vérification de paiement, sécurité, etc.
   const user = await getUserInfo({ cache: false })
   ```

### ❌ À ÉVITER

1. **Ne pas abuser de `cache: false`**
   ```typescript
   // ❌ Mauvais: Tue les performances
   const user = await getUserInfo({ cache: false })
   
   // ✅ Bon: Utiliser par défaut
   const user = await getUserInfo()
   ```

2. **Ne pas oublier l'invalidation**
   ```typescript
   // ❌ Mauvais: Le cache reste périmé
   await updateUser(userId, updates)
   // Pas d'invalidation !
   
   // ✅ Bon
   await updateUser(userId, updates)
   CacheInvalidation.onUserUpdate(userId)
   ```

3. **Ne pas vider le cache inutilement**
   ```typescript
   // ❌ Mauvais: Reset complet pour une mise à jour
   CacheInvalidation.reset()
   
   // ✅ Bon: Invalider uniquement ce qui est nécessaire
   CacheInvalidation.onUserUpdate(userId)
   ```

---

## 🔒 Sécurité

Le système inclut une vérification de sécurité automatique :

```typescript
// Dans fetchUserFromSupabase
if (user.id !== userId) {
  console.error(`Security: userId mismatch`)
  return null
}
```

Cela protège contre les scénarios où l'userId en paramètre ne correspondrait pas à la session authentifiée.

---

## 📦 Structure des Fichiers

```
src/services/users/
├── getUserInfo.ts           # Fonction principale avec React Cache
├── lru-cache.ts             # Cache LRU et helpers
└── cache-invalidation.ts    # Helpers d'invalidation
```

---

## 🎓 Résumé

- **3 niveaux de cache** pour performance maximale
- **Isolation par userId** pour éviter les conflits
- **Options flexibles** (cache, refresh)
- **Invalidation intelligente** par utilisateur ou organisation
- **Monitoring intégré** avec statistiques détaillées
- **Sécurité renforcée** avec validation automatique

**Performance:**
- React Cache: Déduplication dans le même render
- LRU Cache: O(1) entre les requêtes (10min TTL)
- Supabase: Source de vérité quand nécessaire

**Utilisation simple:**
```typescript
const user = await getUserInfo() // C'est tout ! 🚀
```