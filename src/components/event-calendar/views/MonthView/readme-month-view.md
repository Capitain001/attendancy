# MonthView - Composant Calendrier Mensuel

Un composant React modulaire et maintenable pour l'affichage d'un calendrier mensuel avec gestion complète des événements.

## Structure du Module

```
month-view/
├── month-view.tsx              # Composant principal
├── components/
│   ├── WeekdaysHeader.tsx      # En-tête des jours de la semaine
│   ├── CalendarWeek.tsx        # Composant semaine
│   ├── CalendarDay.tsx         # Composant jour individuel
│   ├── EventList.tsx           # Liste des événements d'un jour
│   └── MoreEventsPopover.tsx   # Popover pour événements supplémentaires
├── hooks/
│   └── month-view-hooks.ts     # Hooks personnalisés
├── utils/
│   └── month-view-utils.ts     # Fonctions utilitaires
├── types/
│   └── month-view-types.ts     # Types et interfaces
├── index.ts                    # Exports principaux
└── README.md                   # Cette documentation
```

## Utilisation

### Utilisation Basique

```tsx
import { MonthView } from './month-view';

function MyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const handleEventSelect = (event: CalendarEvent) => {
    console.log('Événement sélectionné:', event);
  };

  const handleEventCreate = (startTime: Date) => {
    console.log('Créer événement à:', startTime);
  };

  return (
    <MonthView
      currentDate={currentDate}
      events={events}
      onEventSelect={handleEventSelect}
      onEventCreate={handleEventCreate}
    />
  );
}
```

### Utilisation des Hooks

```tsx
import { useMonthViewData, useMountedState } from './month-view';

function CustomCalendar() {
  const { days, weekdays, weeks } = useMonthViewData(new Date());
  const isMounted = useMountedState();
  
  // Votre logique personnalisée...
}
```

## Composants

### MonthView (Principal)

Le composant racine qui orchestre l'affichage du calendrier mensuel.

**Props:**
- `currentDate: Date` - Date courante pour déterminer le mois affiché
- `events: CalendarEvent[]` - Liste des événements à afficher
- `onEventSelect: (event: CalendarEvent) => void` - Callback sélection d'événement
- `onEventCreate: (startTime: Date) => void` - Callback création d'événement

### WeekdaysHeader

Affiche l'en-tête avec les noms des jours de la semaine.

### CalendarWeek

Représente une semaine complète (7 jours) dans le calendrier.

### CalendarDay

Gère l'affichage d'un jour individuel avec ses événements.

### EventList

Affiche la liste des événements visibles d'un jour.

### MoreEventsPopover

Popover pour afficher les événements supplémentaires quand il y a overflow.

## Hooks Personnalisés

### useMonthViewData(currentDate)

Calcule les données nécessaires à l'affichage du mois.

**Retourne:**
- `days: Date[]` - Tous les jours à afficher
- `weekdays: string[]` - Noms des jours de la semaine
- `weeks: Date[][]` - Jours organisés en semaines

### useMountedState()

Gère l'état de montage pour éviter les problèmes d'hydratation SSR.

### useEventHandlers(onEventSelect)

Encapsule la logique de gestion des clics sur les événements.

### useDayEventVisibility(...)

Gère la logique de visibilité des événements avec overflow.

### useEventCreation(onEventCreate)

Simplifie la création d'événements avec heure par défaut.

## Utilitaires

### getMonthViewDays(currentDate)

Calcule tous les jours à afficher dans la grille du calendrier.

### getWeekdayNames()

Génère les noms des jours de la semaine.

### groupDaysIntoWeeks(days)

Organise les jours en semaines de 7 jours.

### getEventVisibilityStats(totalEvents, visibleCount)

Calcule les statistiques de visibilité des événements.

## Types

### EventHandlers

Interface pour les callbacks d'événements.

### EventVisibilityProps

Props liées à la gestion de la visibilité.

### DayData

Données complètes d'un jour du calendrier.

## Fonctionnalités

### ✅ Gestion des Événements

- Affichage des événements sur plusieurs jours
- Événements all-day et avec horaires
- Tri automatique des événements
- Gestion de l'overflow avec popover

### ✅ Interactions

- Clic sur événement pour sélection
- Clic sur jour pour création d'événement
- Drag & drop des événements
- Navigation au clavier

### ✅ Responsive Design

- Adaptation mobile/desktop
- Hauteur dynamique selon l'espace disponible
- Gestion des événements cachés sur petits écrans

### ✅ Accessibilité

- Support du clavier
- ARIA labels appropriés
- Contraste et lisibilité
- Screen reader friendly

### ✅ Performance

- Calculs memoïsés
- Rendu conditionnel
- Lazy loading des événements
- Optimisation SSR

## Personnalisation

### Styles

Le composant utilise Tailwind CSS avec des variables CSS pour la personnalisation :

```css
:root {
  --event-height: 20px;
  --event-gap: 2px;
}
```

### Thèmes

Support des thèmes sombre/clair via les classes Tailwind conditionnelles.

## Dépendances

- `date-fns` - Manipulation des dates
- `@/components/event-calendar` - Composants événements de base
- `@/components/ui/popover` - Composant popover UI
- `React` - Framework principal

## Migration depuis l'Ancienne Version

```tsx

import { MonthView } from './month-view';
// Les props restent identiques, aucun changement nécessaire
```

## Maintenance

### Ajout d'une Nouvelle Fonctionnalité

1. Créer les types nécessaires dans `types/`
2. Implémenter la logique dans `utils/` ou `hooks/`
3. Créer/modifier les composants dans `components/`
4. Mettre à jour les exports dans `index.ts`
5. Documenter dans ce README

### Tests

```bash
# Tests unitaires
npm test month-view

# Tests d'intégration
npm test month-view:integration

# Tests de performance
npm test month-view:performance
```

## Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## License

MIT License - voir le fichier LICENSE pour plus de détails.
