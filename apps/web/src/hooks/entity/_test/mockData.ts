import { generateMockUsers } from "./utils";

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
      role: 'moderator',
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
  
    // Ajout des utilisateurs générés pour les tests de pagination

   ...generateMockUsers(15)
  ];
  
  export const mockUsersWithPagination = [
    ...mockUsers.slice(0, 10),
    ...mockUsers.slice(10, 20),
    ...mockUsers.slice(20, 30),
    ...mockUsers.slice(30, 40),
    ...mockUsers.slice(40, 50)
  ];