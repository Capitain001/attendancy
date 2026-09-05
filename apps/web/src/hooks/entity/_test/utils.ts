
import { User } from "./mockData";

// Fonction utilitaire pour générer des utilisateurs mock supplémentaires
export function generateMockUsers(count: number): User[] {
    const roles: Array<'admin' | 'user' | 'moderator'> = ['admin', 'user', 'moderator'];
    const statuses: Array<'active' | 'inactive' | 'pending' | 'suspended'> = ['active', 'inactive', 'pending', 'suspended'];
    const locations = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille'];
    
    return Array.from({ length: count }, (_, i) => {
      const role = roles[i % roles.length];
      const status = statuses[i % statuses.length];
      const location = locations[i % locations.length];
      
      return {
        id: `user-${i + 7}`,
        name: `Utilisateur ${i + 7}`,
        email: `user${i + 7}@example.com`,
        role: role,
        status: status,
        profile: {
          age: 20 + (i % 20),
          bio: `Description de l'utilisateur ${i + 7}`,
          location: location
        },
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }


/**
 * Fonction pour rechercher des utilisateurs avec différents critères
 */
export function searchUsers(users: User[], criteria: {
  search?: string;
  role?: string;
  status?: string;
  minAge?: number;
  location?: string;
}): User[] {
  return users.filter(user => {
    if (criteria.search) {
      const searchTerm = criteria.search.toLowerCase();
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.profile?.bio?.toLowerCase().includes(searchTerm) ||
        user.profile?.company?.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }

    if (criteria.role && user.role !== criteria.role) return false;
    if (criteria.status && user.status !== criteria.status) return false;
    
    if (criteria.minAge && (!user.profile?.age || user.profile.age < criteria.minAge)) {
      return false;
    }

    if (criteria.location && user.profile?.location !== criteria.location) {
      return false;
    }

    return true;
  });
}

/**
 * Fonction pour trier les utilisateurs
 */
export function sortUsers(users: User[], key: keyof User, order: 'asc' | 'desc' = 'asc'): User[] {
  return [...users].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return order === 'asc' ? -1 : 1;
    if (bVal == null) return order === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });
}
