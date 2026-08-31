import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInMinutes } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fonction utilitaire pour simuler des délais réseau
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//get start of today
export function getStartOfToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}


export function getTotalDuration(endTime: Date, startTime: Date): number {
  return differenceInMinutes(endTime, startTime);
}

export const colors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#009688', // Teal
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#E91E63', // Pink
  '#00BCD4', // Cyan
];

/**
 * Génère une couleur aléatoire
 * 
 * @returns Couleur hexadécimale aléatoire
 */
export const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Génère une couleur stable basée sur un nom/chaîne de caractères
 * La même chaîne produira toujours la même couleur
 * 
 * @param name - Chaîne de caractères pour générer une couleur stable (ex: username)
 * @returns Couleur hexadécimale stable
 */
export const getNameColor = (name: string) => {
  // Générer un index stable basé sur la chaîne
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Utiliser la valeur absolue du hash pour obtenir un index valide
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getInitials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export function getUserInitials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}


/**
 * Construit un nom complet à partir du prénom/nom, en ignorant les parties
 * vides ou undefined. Retourne undefined si aucune des deux parties n'est fournie.
 */
export function getFullName(firstName?: string | null, lastName?: string | null): string | undefined {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export * from "./date"



export const truncateText = (text: string, maxLength: number = 60) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};


export function diff<T extends object>(current: T, initial?: Partial<T>): Partial<T> {
  if (!initial) return current;

  return Object.fromEntries(
    Object.entries(current).filter(([key, value]) => {
      const prev = initial[key as keyof T];
      // Comparer les Dates par valeur
      if (value instanceof Date && prev instanceof Date) {
        return value.getTime() !== prev.getTime();
      }
      return prev !== value;
    })
  ) as Partial<T>;
}