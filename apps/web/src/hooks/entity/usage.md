##https://chat.deepseek.com/a/chat/s/efab7e07-d025-4ee3-a98c-c291aaa5dca7
# Documentation d'usage du système d'entités

## Table des matières
- [Introduction](#introduction)
- [Hook de base useEntity](#hook-de-base-useentity)
- [Hook avancé useEntityFilter](#hook-avancé-useentityfilter)
- [Filtrage et tri](#filtrage-et-tri)
- [Exemples avancés](#exemples-avancés)

## Introduction

Le système d'entités fournit une gestion optimisée des données avec cache intégré, filtrage et tri. Il est construit autour de deux hooks principaux :

- `useEntity` : Hook de base pour la récupération et la gestion du cache
- `useEntityFilter` : Hook étendu avec capacités de filtrage et tri

## Hook de base useEntity

### Utilisation simple

```typescript
import { useEntity } from "@/hooks/entity/useEntity";

// Fonction de récupération des données - communique avec votre API ou server action
const fetchUsers = async (params?: EntityParams) => {
  const response = await fetch(`/api/users?${new URLSearchParams(params)}`);
  return response.json();
};

function UserList() {
  /**
   * Utilisation basique du hook useEntity
   * @param entityName - Nom unique pour identifier le cache (comme une clé de stockage)
   * @param fetchFn - Fonction qui va chercher les données
   * @param initialParams - Paramètres initiaux pour la requête
   */
  const { data, loading, error } = useEntity({
    entityName: "users", // Clé unique pour le cache React Query
    fetchFn: fetchUsers, // Fonction qui appelle votre API
    initialParams: { page: 1, limit: 10 } // Paramètres de pagination
  });

  // États de chargement et d'erreur
  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  // data contient toujours la structure { items: [], byId: {} }
  return (
    <div>
      {data.items.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Avec transformation personnalisée

```typescript
/**
 * Fonction de transformation personnalisée
 * Transforme le tableau d'utilisateurs en objet groupé par statut
 */
const transformUsersByStatus = (users: User[]) => {
  return users.reduce((acc, user) => {
    const status = user.status || 'inactive';
    if (!acc[status]) acc[status] = [];
    acc[status].push(user);
    return acc;
  }, {} as Record<string, User[]>);
};

function UserDashboard() {
  /**
   * useEntity avec transformation personnalisée
   * @param transformFn - Transforme les données après récupération
   * La transformation est appliquée automatiquement par React Query
   */
  const { data, loading } = useEntity({
    entityName: "users",
    fetchFn: fetchUsers,
    transformFn: transformUsersByStatus // Applique la transformation
  });

  // Après transformation, data n'a plus la structure {items, byId}
  // mais contient directement le résultat de transformUsersByStatus
  return (
    <div>
      <h3>Utilisateurs actifs: {data.active?.length || 0}</h3>
      <h3>Utilisateurs inactifs: {data.inactive?.length || 0}</h3>
    </div>
  );
}
```

### Refetch avec paramètres - Recherche dynamique

```typescript
function SearchableUserList() {
  // État local pour le terme de recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  /**
   * useEntity avec paramètres initiaux
   * refetchWithParams permet de recharger avec de nouveaux paramètres
   */
  const { data, loading, refetchWithParams } = useEntity({
    entityName: "users",
    fetchFn: fetchUsers,
    initialParams: { page: 1, limit: 20 } // Paramètres initiaux
  });

  /**
   * Fonction de recherche qui met à jour les paramètres
   * @param term - Terme de recherche à envoyer à l'API
   * 
   * refetchWithParams fait deux choses importantes :
   * 1. Appelle fetchFn avec les nouveaux paramètres
   * 2. Met à jour le cache React Query avec la nouvelle clé [entityName, newParams]
   * 3. Fusionne intelligemment les nouvelles données avec l'ancien cache
   */
  const handleSearch = async (term: string) => {
    await refetchWithParams({ 
      search: term,   // Nouveau paramètre de recherche
      page: 1         // On retourne à la page 1 pour les nouveaux résultats
    });
  };

  return (
    <div>
      {/**
       * Champ de recherche qui déclenche la recherche quand on perd le focus
       * (on pourrait aussi utiliser un bouton ou un debounce)
       */}
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onBlur={() => handleSearch(searchTerm)} // Déclenche la recherche
        placeholder="Rechercher un utilisateur..."
      />
      
      {/** Affichage de la liste des utilisateurs */}
      {data.items.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Hook avancé useEntityFilter

### Filtrage et tri de base

```typescript
import { useEntityFilter } from "@/hooks/entity/useEntityFilter";

function ActiveUsersList() {
  /**
   * useEntityFilter ajoute le filtrage et tri côté client
   * @param where - Conditions de filtrage (appliquées sur les données déjà chargées)
   * @param sort - Configuration du tri
   * @param isFilteredView - Indique si les données sont filtrées/triées
   */
  const { data, loading, isFilteredView } = useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    where: { 
      status: "active",
      profile: { verified: true } // Filtre profond (nested objects)
    },
    sort: { key: "name", order: "asc" } // Tri par nom croissant
  });

  return (
    <div>
      {/** isFilteredView est true quand where ou sort sont utilisés */}
      <p>Vue filtrée: {isFilteredView ? "Oui" : "Non"}</p>
      
      {/** data.items contient les données FILTRÉES et TRIÉES */}
      {data.items.map(user => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}
```

### Accès aux données complètes et filtrées

```typescript
function UserManagement() {
  const { data, isFilteredView } = useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    where: { role: "admin" }, // Filtre seulement les admins
    sort: { key: "createdAt", order: "desc" } // Tri par date de création décroissante
  });

  return (
    <div>
      {/**
       * data.items = données filtrées/triées (seulement les admins)
       * data.allItems = toutes les données (tous les utilisateurs)
       * data.byId = index des données filtrées
       * data.allById = index de toutes les données
       */}
      <h2>Administrateurs ({data.items.length})</h2>
      <p>Total utilisateurs: {data.allItems.length}</p>
      
      {/** Liste des administrateurs (données filtrées) */}
      {data.items.map(admin => (
        <AdminCard key={admin.id} admin={admin} />
      ))}
      
      {/**
       * Exemple d'accès à un utilisateur spécifique via son ID
       * On utilise allById pour accéder à TOUS les utilisateurs
       * même si actuellement on affiche seulement les admins
       */}
      <UserDetail userId="123" allUsers={data.allById} />
    </div>
  );
}

// Composant enfant utilisant le cache complet
function UserDetail({ userId, allUsers }: { userId: string, allUsers: Record<string, User> }) {
  // Accès direct à un utilisateur via son ID dans le cache complet
  const user = allUsers[userId];
  return user ? <div>{user.name}</div> : null;
}
```

## Filtrage et tri

### Syntaxe de filtrage profond

```typescript
// Exemple de configuration de filtrage complexe
const complexFilter = {
  where: {
    status: "active",
    profile: {
      age: { $gt: 18 },       // Âge supérieur à 18 ans
      country: "France",
      settings: {
        newsletter: true      // Abonné à la newsletter
      }
    },
    orders: {
      status: "completed"     // Au moins une commande complétée
    }
  },
  sort: { 
    key: "profile.age",       // Tri par âge (propriété imbriquée)
    order: "desc"             // Ordre décroissant (du plus vieux au plus jeune)
  }
};

function ComplexUserFilter() {
  const { data } = useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    ...complexFilter
  });

  // data.items contient les utilisateurs actifs français majeurs 
  // avec newsletter, ayant complété des commandes, triés par âge décroissant
  return <UserList users={data.items} />;
}
```

### Filtres multiples avec état

```typescript
function AdvancedUserSearch() {
  // État pour gérer plusieurs filtres
  const [filters, setFilters] = useState({
    status: "active",
    minAge: 18,
    country: "FR"
  });

  /**
   * Le hook se recrée automatiquement quand les filtres changent
   * useEntityFilter mémoïse les fonctions de filtrage/tri pour la performance
   */
  const { data } = useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    where: {
      status: filters.status,
      profile: {
        age: { $gte: filters.minAge }, // Âge >= minAge
        country: filters.country
      }
    }
  });

  return (
    <div>
      {/** Composant qui met à jour les filtres */}
      <FilterControls onFilterChange={setFilters} />
      
      {/** Affichage des résultats filtrés */}
      <UserGrid users={data.items} />
    </div>
  );
}
```

## Exemples avancés

### Combinaison avec pagination

```typescript
function PaginatedUserList() {
  // États pour la pagination et les filtres
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  /**
   * Combinaison de useEntityFilter avec pagination côté serveur
   * initialParams est envoyé au serveur (pagination)
   * where/sort sont appliqués côté client (filtrage/tri)
   */
  const { data, loading, refetchWithParams } = useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    where: filters,          // Filtrage côté client
    initialParams: { 
      page,                  // Pagination côté serveur
      limit: 10 
    }
  });

  /**
   * Changement de page - recharge les données du serveur
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Recharge avec les nouveaux paramètres de pagination
    refetchWithParams({ 
      page: newPage, 
      limit: 10,
      // Les filtres sont déjà dans l'état, inutile de les renvoyer
    });
  };

  return (
    <div>
      <UserFilters onFiltersChange={setFilters} />
      <UserList users={data.items} />
      <Pagination 
        currentPage={page}
        totalItems={data.allItems.length} // Total toutes pages confondues
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

### Optimisation des performances

```typescript
// Utilisation de useMemo pour éviter les recréations inutiles
function OptimizedUserList() {
  const [search, setSearch] = useState('');

  /**
   * useMemo optimise les performances en évitant de recréer l'objet options
   * à chaque rendu. L'objet options n'est recréé que quand 'search' change.
   */
  const options = useMemo(() => ({
    entityName: "users" as const,
    fetchFn: fetchUsers,
    where: search ? { 
      name: { $contains: search }  // Filtre de recherche côté client
    } : undefined,
    sort: { key: "createdAt", order: "desc" as const },
    staleTime: 5 * 60 * 1000 // Données considérées "fraîches" pendant 5 minutes
  }), [search]); // Dépendance : seulement quand 'search' change

  const { data } = useEntityFilter(options);

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <VirtualizedList items={data.items} />
    </div>
  );
}
```

### Gestion d'erreurs et états de chargement

```typescript
function RobustUserInterface() {
  const { data, loading, refreshing, error, refetch } = useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    where: { status: "active" },
    suspense: false // Important : désactive le mode suspense pour gérer les états manuellement
  });

  // Gestion explicite des états d'erreur
  if (error) {
    return (
      <ErrorState 
        message="Erreur de chargement des utilisateurs"
        onRetry={refetch} // Bouton de réessaye
      />
    );
  }

  // État de chargement initial (premier chargement)
  if (loading && !data.items.length) {
    return <FullPageLoader />;
  }

  // État normal avec indicateur de rechargement
  return (
    <div>
      {/** Indicateur pendant les rechargements (refetch) */}
      {refreshing && <RefreshIndicator />}
      
      {/** Contenu principal avec effet de flou pendant le rechargement */}
      <div className={refreshing ? "opacity-50" : ""}>
        <UserList users={data.items} />
      </div>
      
      {/** Bouton de rafraîchissement manuel */}
      <button onClick={() => refetch()} disabled={refreshing}>
        {refreshing ? "Actualisation..." : "Actualiser"}
      </button>
    </div>
  );
}
```

### Pattern de composition pour la réutilisabilité

```typescript
/**
 * Hook personnalisé qui encapsule la logique utilisateur
 * Permet de réutiliser la configuration dans toute l'application
 */
function useUsers(options?: { where?: PartialDeep<User>, sort?: any }) {
  return useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    staleTime: 1000 * 60 * 10, // 10 minutes de cache
    ...options // Surcharge des options par défaut
  });
}

// Utilisation dans les composants
function UserManagement() {
  // Utilisation du hook personnalisé avec différentes configurations
  const activeUsers = useUsers({ 
    where: { status: "active" },
    sort: { key: "name", order: "asc" }
  });

  const adminUsers = useUsers({
    where: { role: "admin" }
  });

  return (
    <div>
      <UserSection 
        title="Utilisateurs actifs" 
        users={activeUsers.data.items}
        loading={activeUsers.loading}
      />
      <UserSection 
        title="Administrateurs" 
        users={adminUsers.data.items}
        loading={adminUsers.loading}
      />
    </div>
  );
}
```

## Points clés à retenir

### useEntity vs useEntityFilter

- **useEntity** : Récupération de données + cache simple
- **useEntityFilter** : useEntity + filtrage/tri côté client

### Structure des données

```typescript
// useEntity (sans transformFn)
data: {
  items: User[],                    // Tableau d'items
  byId: Record<string, User>        // Index par ID
}

// useEntity (avec transformFn)
data: any // Résultat de la transformation personnalisée

// useEntityFilter
data: {
  items: User[],                    // Items filtrés/triés
  byId: Record<string, User>,       // Index des items filtrés
  allItems: User[],                 // Tous les items (non filtrés)
  allById: Record<string, User>     // Index de tous les items
}
```

### Performance

- Les fonctions de filtrage/tri sont mémoïsées automatiquement
- Les données sont recalculées seulement quand les dépendances changent
- Le cache React Query évite les requêtes réseau inutiles