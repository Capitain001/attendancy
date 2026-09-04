export default function TimeSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">Langue & Fuseau horaire</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Définissez la langue d'affichage et votre fuseau horaire de référence.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Langue</label>
          <select className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium">
            <option value="fr">Français (France)</option>
            <option value="en">English (US)</option>
          </select>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Fuseau horaire</label>
          <select className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium">
            <option value="UTC">UTC+00:00 (Londres, Casablanca)</option>
            <option value="Europe/Paris">UTC+01:00 (Paris, Bruxelles)</option>
            <option value="Africa/Lome">UTC+00:00 (Lomé, Accra)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
