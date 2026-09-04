import { SunMedium, Moon, Laptop } from "lucide-react";

export default function ThemeSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">Thème d'affichage</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choisissez l'apparence visuelle de l'application.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-border/60 hover:border-blue-600 transition cursor-pointer text-center gap-3 bg-card">
          <SunMedium className="size-7" />
          <span className="text-sm font-medium">Clair</span>
        </div>

        <div className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-border/60 hover:border-blue-600 transition cursor-pointer text-center gap-3 bg-card">
          <Moon className="size-7" />
          <span className="text-sm font-medium">Sombre</span>
        </div>

        <div className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/20 text-center gap-3">
          <Laptop className="size-7 text-blue-600" />
          <span className="text-sm font-semibold text-blue-600">Système</span>
        </div>
      </div>
    </div>
  );
}
