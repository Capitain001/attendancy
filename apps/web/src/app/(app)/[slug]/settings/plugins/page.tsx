export default function PluginsSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">Extensions & Intégrations</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Connectez vos outils externes (Google Workspace, Calendars, LMS).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
          <span className="text-sm font-semibold">Google Workspace</span>
          <span className="text-xs text-muted-foreground">Connecté</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
          <span className="text-sm font-semibold">Microsoft Teams</span>
          <button className="text-xs text-primary font-medium hover:underline">Activer</button>
        </div>
      </div>
    </div>
  );
}
