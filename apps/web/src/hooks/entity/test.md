
## 1. Server Action Mock pour les tests

```typescript
// lib/mocks/userServerActions.ts
'use server';

import { delay } from '@/lib/utils';
import { mockUsers, type User } from './mockData';

/**
 * Server Action mock pour récupérer les utilisateurs
 * Simule le comportement d'une vraie API avec délais et erreurs aléatoires
 */
export async function fetchUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: string;
}): Promise<{ items: User[]; total: number; page: number }> {
  // Simule un délai réseau (200-800ms)
  await delay(Math.random() * 600 + 200);
  
  // Simule une erreur aléatoire (5% de chance)
  if (Math.random() < 0.05) {
    throw new Error('Erreur serveur simulée');
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const search = params?.search?.toLowerCase();
  const filters = params?.filters ? JSON.parse(params.filters) : {};

  // Filtrage côté serveur (simulé)
  let filteredUsers = [...mockUsers];

  // Application de la recherche
  if (search) {
    filteredUsers = filteredUsers.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.profile?.bio?.toLowerCase().includes(search)
    );
  }

  // Application des filtres
  if (filters.status) {
    filteredUsers = filteredUsers.filter(user => user.status === filters.status);
  }
  if (filters.role) {
    filteredUsers = filteredUsers.filter(user => user.role === filters.role);
  }
  if (filters.minAge) {
    filteredUsers = filteredUsers.filter(user => 
      user.profile?.age && user.profile.age >= filters.minAge
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    items: paginatedUsers,
    total: filteredUsers.length,
    page: page
  };
}

/**
 * Server Action pour récupérer un utilisateur par ID
 */
export async function fetchUserById(id: string): Promise<User | null> {
  await delay(Math.random() * 300 + 100);
  
  const user = mockUsers.find(u => u.id === id);
  return user || null;
}

/**
 * Server Action pour créer un utilisateur
 */
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  await delay(Math.random() * 500 + 200);
  
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // En vrai, on ajouterait à la base de données
  // mockUsers.push(newUser); // À éviter car les imports sont read-only
  
  return newUser;
}

/**
 * Server Action pour mettre à jour un utilisateur
 */
export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  await delay(Math.random() * 400 + 100);
  
  const userIndex = mockUsers.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('Utilisateur non trouvé');
  }

  const updatedUser: User = {
    ...mockUsers[userIndex],
    ...userData,
    updatedAt: new Date().toISOString()
  };

  return updatedUser;
}
```

## 2. Données Mock complètes

```typescript
// lib/mocks/mockData.ts
export interface UserProfile {
  age?: number;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  company?: string;
  skills?: string[];
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  profile?: UserProfile;
  settings?: UserSettings;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  orders?: Array<{
    id: string;
    status: 'pending' | 'completed' | 'cancelled';
    amount: number;
    date: string;
  }>;
}

// Données mockées réalistes
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alice Dupont',
    email: 'alice.dupont@example.com',
    role: 'admin',
    status: 'active',
    profile: {
      age: 28,
      bio: 'Développeuse full-stack passionnée par React et Node.js',
      location: 'Paris, France',
      company: 'TechCorp',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript']
    },
    settings: {
      theme: 'dark',
      notifications: { email: true, push: false, sms: true },
      language: 'fr'
    },
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    orders: [
      { id: 'order-1', status: 'completed', amount: 149.99, date: '2024-01-10' },
      { id: 'order-2', status: 'pending', amount: 79.99, date: '2024-01-12' }
    ]
  },
  {
    id: 'user-2',
    name: 'Bob Martin',
    email: 'bob.martin@example.com',
    role: 'user',
    status: 'active',
    profile: {
      age: 35,
      bio: 'Architecte logiciel et mentor en développement',
      location: 'Lyon, France',
      company: 'CodeCraft',
      skills: ['Java', 'Spring', 'Microservices', 'DDD']
    },
    settings: {
      theme: 'light',
      notifications: { email: true, push: true, sms: false },
      language: 'en'
    },
    lastLogin: '2024-01-14T15:45:00Z',
    createdAt: '2023-03-15T14:20:00Z',
    updatedAt: '2024-01-14T15:45:00Z'
  },
  {
    id: 'user-3',
    name: 'Carol Johnson',
    email: 'carol.johnson@example.com',
    role: 'moderator',
    status: 'active',
    profile: {
      age: 24,
      bio: 'Designer UX/UI avec une passion pour l accessibilité',
      location: 'Londres, UK',
      company: 'DesignStudio',
      skills: ['Figma', 'UI Design', 'Accessibility', 'User Research']
    },
    settings: {
      theme: 'dark',
      notifications: { email: false, push: true, sms: false },
      language: 'en'
    },
    lastLogin: '2024-01-13T09:15:00Z',
    createdAt: '2023-05-20T11:30:00Z',
    updatedAt: '2024-01-13T09:15:00Z'
  },
  {
    id: 'user-4',
    name: 'David Chen',
    email: 'david.chen@example.com',
    role: 'user',
    status: 'inactive',
    profile: {
      age: 42,
      bio: 'CTO avec 15 ans d expérience dans les startups tech',
      location: 'San Francisco, USA',
      company: 'StartupXYZ',
      skills: ['Leadership', 'Strategy', 'Python', 'AWS']
    },
    lastLogin: '2023-12-01T16:20:00Z',
    createdAt: '2023-02-28T10:00:00Z',
    updatedAt: '2023-12-01T16:20:00Z'
  },
  {
    id: 'user-5',
    name: 'Eva Martinez',
    email: 'eva.martinez@example.com',
    role: 'user',
    status: 'pending',
    profile: {
      age: 29,
      bio: 'Data scientist spécialisée en machine learning',
      location: 'Madrid, Spain',
      company: 'DataLabs',
      skills: ['Python', 'TensorFlow', 'SQL', 'Data Visualization']
    },
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z'
  },
  {
    id: 'user-6',
    name: 'Frank Williams',
    email: 'frank.williams@example.com',
    role: 'admin',
    status: 'suspended',
    profile: {
      age: 38,
      bio: 'Expert en cybersécurité et penetration testing',
      location: 'Berlin, Germany',
      company: 'SecurityPro',
      skills: ['Cybersecurity', 'PenTesting', 'Linux', 'Networking']
    },
    lastLogin: '2023-11-15T14:30:00Z',
    createdAt: '2023-04-05T09:15:00Z',
    updatedAt: '2024-01-05T11:20:00Z'
  },
  // Ajoutez plus d'utilisateurs pour les tests de pagination
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `user-${i + 7}`,
    name: `Utilisateur ${i + 7}`,
    email: `user${i + 7}@example.com`,
    role: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'moderator' : 'user',
    status: ['active', 'inactive', 'pending'][i % 3] as any,
    profile: {
      age: 20 + (i % 20),
      bio: `Description de l'utilisateur ${i + 7}`,
      location: ['Paris', 'Lyon', 'Marseille', 'Toulouse'][i % 4]
    },
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }))
];
```

## 3. Utilitaire de délai

```typescript
// lib/utils.ts
/**
 * Fonction utilitaire pour simuler des délais réseau
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## 4. Exemples d'utilisation dans la documentation

```typescript
// examples/userExamples.tsx
'use client';

import { useEntity, useEntityFilter } from '@/hooks/entity';
import { fetchUsers, fetchUserById } from '@/lib/mocks/userServerActions';

/**
 * Exemple 1: Utilisation basique avec la server action mock
 */
export function BasicUserList() {
  const { data, loading, error } = useEntity({
    entityName: "users",
    fetchFn: fetchUsers, // Utilise notre server action mock
    initialParams: { page: 1, limit: 5 }
  });

  if (loading) return <div>Chargement des utilisateurs...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <h3>Liste des utilisateurs ({data.items.length})</h3>
      {data.items.map(user => (
        <div key={user.id} className="user-card">
          <h4>{user.name}</h4>
          <p>Email: {user.email}</p>
          <p>Statut: {user.status}</p>
          <p>Rôle: {user.role}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Exemple 2: Filtrage avancé avec données mockées
 */
export function FilteredUserList() {
  const { data, loading, isFilteredView } = useEntityFilter({
    entityName: "users",
    fetchFn: fetchUsers,
    where: { 
      status: "active",
      role: "admin",
      profile: { 
        age: { $gte: 25 } 
      }
    },
    sort: { key: "profile.age", order: "desc" }
  });

  return (
    <div>
      <h3>Administrateurs actifs de plus de 25 ans</h3>
      <p>Vue filtrée: {isFilteredView ? "Oui" : "Non"}</p>
      <p>Résultats: {data.items.length} sur {data.allItems.length} utilisateurs</p>
      
      {data.items.map(user => (
        <div key={user.id}>
          {user.name} - {user.profile?.age} ans - {user.email}
        </div>
      ))}
    </div>
  );
}

/**
 * Exemple 3: Recherche et pagination
 */
export function SearchableUserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, refetchWithParams } = useEntity({
    entityName: "users",
    fetchFn: fetchUsers,
    initialParams: { page: 1, limit: 5 }
  });

  const handleSearch = async (term: string) => {
    setPage(1);
    await refetchWithParams({ 
      search: term,
      page: 1,
      limit: 5
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refetchWithParams({ page: newPage, limit: 5 });
  };

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onBlur={() => handleSearch(searchTerm)}
        placeholder="Rechercher un utilisateur..."
      />
      
      {loading && <div>Recherche en cours...</div>}
      
      <div>
        {data.items.map(user => (
          <div key={user.id}>{user.name} - {user.email}</div>
        ))}
      </div>
      
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(page - 1)} 
          disabled={page === 1}
        >
          Précédent
        </button>
        <span>Page {page}</span>
        <button onClick={() => handlePageChange(page + 1)}>
          Suivant
        </button>
      </div>
    </div>
  );
}
```

## 5. Tests unitaires avec les mocks

```typescript
// __tests__/userServerActions.test.ts
import { fetchUsers, fetchUserById } from '@/lib/mocks/userServerActions';
import { mockUsers } from '@/lib/mocks/mockData';

describe('User Server Actions', () => {
  test('fetchUsers retourne une page d utilisateurs', async () => {
    const result = await fetchUsers({ page: 1, limit: 3 });
    
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result.items).toHaveLength(3);
    expect(result.page).toBe(1);
  });

  test('fetchUsers filtre par recherche', async () => {
    const result = await fetchUsers({ search: 'alice' });
    
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].name.toLowerCase()).toContain('alice');
  });

  test('fetchUserById retourne un utilisateur spécifique', async () => {
    const user = await fetchUserById('user-1');
    
    expect(user).toBeDefined();
    expect(user?.id).toBe('user-1');
    expect(user?.name).toBe('Alice Dupont');
  });

  test('fetchUserById retourne null pour ID inexistant', async () => {
    const user = await fetchUserById('id-inexistant');
    
    expect(user).toBeNull();
  });
});

// __tests__/useEntity.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useEntity } from '@/hooks/entity/useEntity';
import { fetchUsers } from '@/lib/mocks/userServerActions';

describe('useEntity avec server action mock', () => {
  test('charge les données initiales', async () => {
    const { result } = renderHook(() => 
      useEntity({
        entityName: 'test-users',
        fetchFn: fetchUsers,
        initialParams: { page: 1, limit: 5 }
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.items).toHaveLength(5);
    expect(result.current.error).toBeNull();
  });
});
```

## Points clés de cette implémentation :

1. **Server Action réaliste** : Simule les délais réseau, les erreurs aléatoires, la pagination et le filtrage
2. **Données mockées riches** : Utilisateurs avec profils complets, paramètres, commandes, etc.
3. **Couverture des cas d'usage** : Tous les statuts, rôles, et scénarios de test
4. **Typage TypeScript complet** : Interfaces détaillées pour une meilleure auto-complétion
5. **Prêt pour les tests** : Utilitaires pour tester les hooks avec les mocks

Cette implémentation vous permet de tester tous les cas d'usage décrits dans votre documentation avec des données réalistes et un comportement proche de la production.