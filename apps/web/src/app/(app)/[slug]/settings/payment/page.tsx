export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">Facturation & Abonnement</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Détails de l'offre souscrite pour votre établissement.
        </p>
      </div>
      <div className="p-5 rounded-2xl border border-border bg-muted/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-primary uppercase">Plan Actuel</span>
          <h4 className="text-base font-bold text-foreground mt-0.5">Enterprise Edition</h4>
          <p className="text-xs text-muted-foreground">Accès illimité aux modules Direction, Enseignants et Étudiants.</p>
        </div>
        <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-500/20">Actif</span>
      </div>
    </div>
  );
}
