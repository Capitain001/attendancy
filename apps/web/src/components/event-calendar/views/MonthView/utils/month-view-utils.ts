import {
    addDays,
    eachDayOfInterval,
    endOfMonth,
    format,
    startOfMonth,
  } from "date-fns";
  import {
    getWeekStart,
    getWeekEnd,
  } from "@/components/event-calendar/utils";
  import { CALENDAR_LOCALE } from "@/components/event-calendar/constants";

  /**
   * Calcule tous les jours à afficher dans la grille du calendrier mensuel
   *
   * @param currentDate - La date courante pour déterminer le mois
   * @returns Array des dates à afficher, incluant les jours des mois précédent/suivant
   *
   * Cette fonction garantit que la grille affiche toujours des semaines complètes,
   * en ajoutant les jours nécessaires du mois précédent et suivant.
   * Début de semaine aligné sur WEEK_STARTS_ON (cohérent avec les autres vues).
   */
  export function getMonthViewDays(currentDate: Date): Date[] {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);

    return eachDayOfInterval({
      start: getWeekStart(monthStart),
      end: getWeekEnd(monthEnd),
    });
  }

  /**
   * Génère les noms des jours de la semaine pour l'en-tête
   *
   * @returns Array des noms des jours en format court, localisés (lun., mar., …)
   */
  export function getWeekdayNames(): string[] {
    const weekStart = getWeekStart(new Date());
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(weekStart, i), "EEE", { locale: CALENDAR_LOCALE }),
    );
  }
  
  /**
   * Organise une liste de jours en semaines
   * 
   * @param days - Array des jours à organiser
   * @returns Array de semaines, chaque semaine contenant 7 jours
   * 
   * Divise la liste des jours en chunks de 7 pour créer les rangées du calendrier.
   */
  export function groupDaysIntoWeeks(days: Date[]): Date[][] {
    const result = [];
    let week = [];
  
    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (week.length === 7 || i === days.length - 1) {
        result.push(week);
        week = [];
      }
    }
  
    return result;
  }
  
  /**
   * Crée un identifiant unique pour une cellule de calendrier
   * 
   * @param day - La date de la cellule
   * @returns String - Identifiant unique basé sur la date ISO
   * 
   * Utilisé pour les fonctionnalités de drag & drop et l'accessibilité.
   */
  export function getCellId(day: Date): string {
    return `month-cell-${day.toISOString()}`;
  }
  
  /**
   * Calcule les statistiques de visibilité des événements
   * 
   * @param totalEvents - Nombre total d'événements
   * @param visibleCount - Nombre d'événements visibles
   * @returns Objet contenant les informations de visibilité
   */
  export function getEventVisibilityStats(
    totalEvents: number,
    visibleCount: number | undefined
  ) {
    // Si visibleCount n'est pas encore défini (pendant l'hydratation SSR)
    if (visibleCount === undefined) {
      return {
        hasMore: false,
        remainingCount: 0,
        canShow: false,
      };
    }
  
    // Calcule si il y a plus d'événements que la limite visible
    const hasMore = totalEvents > visibleCount;
    
    // Calcule le nombre d'événements restants
    const remainingCount = hasMore ? totalEvents - visibleCount : 0;
  
    return {
      hasMore,
      remainingCount,
      canShow: true,
    };
  }
  
  /**
   * Détermine si un jour est dans le mois courant
   * 
   * @param day - Le jour à vérifier
   * @param currentDate - La date de référence du mois courant
   * @returns Boolean indiquant si le jour appartient au mois courant
   */
  export function isDayInCurrentMonth(day: Date, currentDate: Date): boolean {
    return day.getMonth() === currentDate.getMonth() && 
           day.getFullYear() === currentDate.getFullYear();
  }
  
  /**
   * Crée une date de début par défaut pour un nouvel événement
   * 
   * @param day - Le jour sélectionné
   * @param defaultHour - L'heure de début par défaut (optionnel, défaut: 9)
   * @returns Date avec l'heure définie
   */
  export function createDefaultEventStart(day: Date, defaultHour: number = 9): Date {
    const startTime = new Date(day);
    startTime.setHours(defaultHour, 0, 0, 0);
    return startTime;
  }
  
  /**
   * Classe CSS conditionnelle pour les jours hors du mois courant
   * 
   * @param isCurrentMonth - Boolean indiquant si c'est le mois courant
   * @returns String des classes CSS à appliquer
   */
  export function getDayClasses(isCurrentMonth: boolean, isToday: boolean): string {
    const baseClasses = "group border-b border-r border-border/70 last:border-r-0";
    const todayClasses = isToday ? "data-today" : "";
    const outsideClasses = !isCurrentMonth ? "data-outside-cell:bg-muted/25 data-outside-cell:text-muted-foreground/70" : "";
    
    return [baseClasses, todayClasses, outsideClasses].filter(Boolean).join(" ");
  }
