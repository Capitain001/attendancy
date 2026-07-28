import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NAME_COLORS = [
  '#4f46e5','#0891b2','#059669','#d97706',
  '#dc2626','#7c3aed','#db2777','#0284c7',
]

export function getNameColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length]
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function diff<T extends object>(current: T, initial?: Partial<T>): Partial<T> {
  if (!initial) return current;
  return Object.fromEntries(
    Object.entries(current).filter(([key, value]) => {
      const prev = initial[key as keyof T];
      if (value instanceof Date && prev instanceof Date) {
        return value.getTime() !== prev.getTime();
      }
      return prev !== value;
    })
  ) as Partial<T>;
}
