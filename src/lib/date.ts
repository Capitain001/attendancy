//src/lib/date.ts

import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** Locale de date centralisée pour toute l'app (formatage, Calendar, etc.). */
export const DATE_LOCALE = fr;


export const DATE_FORMATS = {
  FULL: "dd/MM/yyyy HH:mm:ss",
  DATETIME: "dd/MM/yyyy HH:mm",
  DATE: "dd/MM/yyyy",
  TIME: "HH:mm",
  TIME_SEC: "HH:mm:ss",
  ISO: "yyyy-MM-dd",

  SHORT_MONTH: "d MMM yyyy",
  LONG_DATE: "EEEE d MMMM yyyy",
} as const;

export type DateFormat =
  | keyof typeof DATE_FORMATS
  | (string & {});

export function parseDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}
export function formatDate(
  date: Date | string,
  formatOrKey: keyof typeof DATE_FORMATS | string = "DATE"
): string {
  const formatStr = DATE_FORMATS[formatOrKey as keyof typeof DATE_FORMATS] || formatOrKey;
  return format(parseDate(date), formatStr, { locale: fr });
}


export function formatDates(date: Date | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('fr-FR')
}

/**
 * Génère une date basée sur aujourd'hui
 * @param hours Heure (0-23)
 * @param minutes Minutes
 */
export function todayAt(hours: number, minutes: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
}


/**
 * Formate une heure en string au format français.
 *
 * @param date La date contenant l'heure à formater.
 * @param separator Chaîne à utiliser entre heures et minutes (par défaut ":").
 *                  Exemple : "h" pour "08h30"
 * @returns L'heure formatée (ex: "14:30" ou "14h30")
 */
export function formatTime(date: Date | string, separator: string = ":"): string {
  const time = formatDate(date, "TIME");
  if (separator === ":") return time; // valeur par défaut
  return time.replace(":", separator);
}


/**
 * Formate une date et heure complète en string au format français.
 *
 * @param date La date à formater.
 * @returns La date et heure formatées en string (ex: "14:30").
 */
  export function formatDateTime(date: Date | string): string {
    return formatDate(date, "DATETIME");
  }

/**
 * Formate une date courte en string au format français.
 *
 * @param date La date à formater.
 * @returns La date formatée en string (ex: "15/01/2024").
 */
export function formatDateShort(date: Date | string): string {
  return formatDate(date, "DATE");
}




/**
 * Crée une date facilement.
 * 
 * @param year Année
 * @param month Mois (1-12, lecture humaine)
 * @param day Jour du mois
 * @param time Heure au format "HH:MM" ou objet { hours, minutes }, ou undefined (default 00:00)
 * @returns Date
 * 
 * @example
 * const date1 = createDate(2025, 10, 9, "6:30");
 * console.log(date1.toLocaleString("fr-FR")); // "09/10/2025, 06:30:00"
 * 
 * @example
 * const date2 = createDate(2025, 12, 25);
 * console.log(date2.toLocaleString("fr-FR")); // "25/12/2025, 00:00:00"
 * 
 * @example
 * const date = createDate(2025, 7, 14, { hours: 14, minutes: 45 });
 * console.log(date3.toLocaleString("fr-FR")); // "14/07/2025, 14:45:00"
 */
export function createDate(
  year: number,
  month: number,
  day: number,
  time: string | { hours: number; minutes: number } = "00:00"
): Date {
  let hours = 0;
  let minutes = 0;

  if (typeof time === "string") {
    [hours, minutes] = time.split(":").map(Number);
  } else {
    hours = time.hours;
    minutes = time.minutes;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

// export * from "../services/planning/recurrence/utils"


import { startOfWeek, endOfWeek } from 'date-fns';

/**
 * Calcule les bornes GMT 0 d'une semaine à partir d'une date donnée.
 */
export const getWeekRange = (dateInWeek: Date) => {
  const start = startOfWeek(dateInWeek, { weekStartsOn: 1 });
  const end = endOfWeek(dateInWeek, { weekStartsOn: 1 });

  return { start, end };
};


export function hasStarted(startTime: string): boolean {
  const now = new Date()

  const [hours, minutes] = startTime.split(":").map(Number)

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  )

  return now >= start
}

export function formatDateRange(start: Date, end: Date, locale = fr): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${format(start, "d")} - ${format(end, "d MMMM yyyy", { locale })}`;
  }

  if (sameYear) {
    return `${format(start, "d MMM", { locale })} - ${format(end, "d MMM yyyy", { locale })}`;
  }

  return `${format(start, "d MMM yyyy", { locale })} - ${format(end, "d MMM yyyy", { locale })}`;
}