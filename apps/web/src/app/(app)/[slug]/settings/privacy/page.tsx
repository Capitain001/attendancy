export default function PrivacySettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">Confidentialité & Données</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Paramètres relatifs au traitement de vos données personnelles.
        </p>
      </div>
      <div className="p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground text-sm">Politique de confidentialité</p>
        <p>Vos données sont protégées selon les normes RGPD. Seuls les administrateurs de votre établissement ont accès aux registres d'assiduité.</p>
      </div>
    </div>
  );
}
