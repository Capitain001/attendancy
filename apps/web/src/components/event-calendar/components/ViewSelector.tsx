// src/components/event-calendar/components/ViewSelector.tsx
import {
  Grid2X2Icon,
  CalendarDaysIcon,
  ListIcon,
  FileTextIcon,
  ChevronDownIcon,
  type LucideIcon,
} from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs"; // adapte le chemin
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarView } from "../types";

type ViewConfig = {
  name: CalendarView;
  icon: LucideIcon;
  /** Libellé court (tabs, anglais — cohérent avec l'existant). */
  title: string;
  /** Libellé FR (dropdown mobile). */
  label: string;
};

const views: ViewConfig[] = [
  { name: "month", icon: Grid2X2Icon, title: "Month", label: "Mois" },
  { name: "week", icon: ListIcon, title: "Week", label: "Semaine" },
  { name: "day", icon: CalendarDaysIcon, title: "Day", label: "Jour" },
  { name: "agenda", icon: FileTextIcon, title: "Agenda", label: "Agenda" },
];

interface ViewSelectorProps {
  view: CalendarView;
  setView: (view: CalendarView) => void;
}

/** Sélecteur en onglets (desktop ≥ md). */
export function ViewSelector({ view, setView }: ViewSelectorProps) {
  const currentIndex = views.findIndex((v) => v.name === view);

  const handleChange = (index: number | null) => {
    if (index !== null) {
      setView(views[index].name);
    }
  };

  return (
    <ExpandableTabs
      tabs={views}
      activeColor="text-primary"
      selected={currentIndex} // ← index contrôlé
      onChange={handleChange}
      // force l'onglet actif à rester ouvert même au clic extérieur
      // on contourne useOnClickOutside en gardant selected piloté par le parent
    />
  );
}

/** Sélecteur en menu déroulant (mobile < md). */
export function ViewSelectorDropdown({ view, setView }: ViewSelectorProps) {
  const current = views.find((v) => v.name === view) ?? views[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon size={16} />
          <span>{current.label}</span>
          <ChevronDownIcon size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup
          value={view}
          onValueChange={(v) => setView(v as CalendarView)}
        >
          {views.map(({ name, icon: Icon, label }) => (
            <DropdownMenuRadioItem key={name} value={name} className="gap-2">
              <Icon size={16} className="text-muted-foreground" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
