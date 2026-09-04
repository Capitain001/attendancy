import Link from "next/link";
import {
  User,
  Palette,
  SunMedium,
  Bell,
  ShieldCheck,
  CreditCard,
  Plug,
  ChevronRight,
} from "lucide-react";
import { getUserInfo } from "@/modules/user";

export default async function SettingsOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUserInfo();

  const settingsCards = [
    {
      id: "profile",
      title: "Profil & Compte",
      description: "Gérez vos informations personnelles, votre nom, adresse email et sécurité.",
      icon: User,
      href: `/${slug}/settings/profile`,
      badge: "Principal",
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      id: "theme",
      title: "Thème & Apparence",
      description: "Personnalisez le mode clair/sombre et le style visuel de votre interface.",
      icon: Palette,
      href: `/${slug}/settings/theme`,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      id: "time",
      title: "Heure & Langue",
      description: "Définissez la langue par défaut, le format de date et votre fuseau horaire.",
      icon: SunMedium,
      href: `/${slug}/settings/time`,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Configurez vos alertes par email, push navigateur et résumés hebdomadaires.",
      icon: Bell,
      href: `/${slug}/settings/notifications`,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      id: "privacy",
      title: "Confidentialité & Sécurité",
      description: "Gérez l'accès au support, les sessions actives et la protection de vos données.",
      icon: ShieldCheck,
      href: `/${slug}/settings/privacy`,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      id: "payment",
      title: "Paiement & Abonnement",
      description: "Consultez votre forfait, vos moyens de paiement et l'historique de facturation.",
      icon: CreditCard,
      href: `/${slug}/settings/payment`,
      badge: "Pro",
      color: "text-cyan-500 bg-cyan-500/10",
    },
    {
      id: "plugins",
      title: "Plugins & Intégrations",
      description: "Connectez vos outils préférés et gérez vos intégrations et webhooks.",
      icon: Plug,
      href: `/${slug}/settings/plugins`,
      color: "text-indigo-500 bg-indigo-500/10",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Paramètres de l'application
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sélectionnez une catégorie ci-dessous pour personnaliser vos préférences et votre compte.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {settingsCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              className="group relative flex flex-col justify-between p-5 rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-border transition-all duration-200 shadow-xs hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg shrink-0 ${card.color}`}>
                    <Icon className="size-5" />
                  </div>
                  {card.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h2 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {card.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground">
                <span>Configurer</span>
                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
