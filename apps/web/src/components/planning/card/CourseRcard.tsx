import { AlertCircle, BookOpen, Users, MapPin } from "lucide-react";

export interface CourseRCardProps {
  coursesCount: number;
  roomsCount: number;
  teachersCount: number;
}

export function CourseRCard({ coursesCount, roomsCount, teachersCount }: CourseRCardProps) {
  return (
    <div className="w-full rounded-sm border border-destructive/20 bg-card p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle size={18} />
        <h3 className="font-semibold text-sm">Ressources manquantes</h3>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed">
        Impossible de planifier une séance. Veuillez configurer les ressources nécessaires dans cette promotion avant de continuer.
      </p>

      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen size={14} />
            <span>Matières</span>
          </div>
          <span className={coursesCount === 0 ? "text-destructive font-bold" : "text-emerald-500 font-medium"}>
            {coursesCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users size={14} />
            <span>Enseignants</span>
          </div>
          <span className={teachersCount === 0 ? "text-destructive font-bold" : "text-emerald-500 font-medium"}>
            {teachersCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={14} />
            <span>Salles</span>
          </div>
          <span className={roomsCount === 0 ? "text-destructive font-bold" : "text-emerald-500 font-medium"}>
            {roomsCount}
          </span>
        </div>
      </div>
    </div>
  );
}
