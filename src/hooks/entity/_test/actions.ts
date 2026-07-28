//@hooks/entity/_test/actions.ts
'use server';

import { delay } from '@/lib/utils';
import { mockUsers, type User } from './mockData';
import { EntityParams } from '../types';

/**
 * Server Action mock pour récupérer les utilisateurs
 * Simule le comportement d'une vraie API avec délais et erreurs aléatoires
 */
export async function fetchUsers(params?: EntityParams): Promise<{ 
    items: User[]; 
    total: number; 
    page: number }> {
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
 * Pour les APIs qui retournent un objet avec items et total ..
 */
export const fetchUsersArray = async (params?: EntityParams) => {
    const response = await fetchUsers(params);
    return response.items;
  };
  


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