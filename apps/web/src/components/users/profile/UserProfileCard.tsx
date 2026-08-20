"use client";

import { useState, type ElementType, type ReactNode } from "react";
import {
  Pencil,
  Calendar,
  Mail,
  Phone,
  User as IconUser,
  ShieldCheck,
  Briefcase,
  Building2,
  Lock,
  LogOut,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserInfo, UserStatus } from "@/types/user";
import UserIcon from "../UserIcon";
import AvatarUploader from "../AvatarUploader";

// ─────────────────────────────────────────────────────────────────────────
// Types
//
// Le composant consomme directement `UserInfo`.
// Il ne fetch rien et ne résout aucune donnée : il reçoit l'utilisateur
// déjà résolu au niveau de la page / du composant appelant.
// ─────────────────────────────────────────────────────────────────────────

export interface UserProfileCardProps {
  user: UserInfo;
  /** Édition de l'avatar / bouton "Modifier le profil" en haut. */
  onEditProfile?: () => void;
  /** Édition des champs de la carte "Détails du profil". */
  onEditDetails?: () => void;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
  ON_LEAVE: "En congé",
  PENDING: "En attente",
  NEW: "Nouveau",
  INVITED: "Invité",
};

function getStatusLabel(status?: UserStatus): string {
  return status ? STATUS_LABEL[status] : "—";
}

function getInitials(name?: string | null): string {
  if (!name) return "?";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "?";
  }

  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ─────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────

function VerifiedBadge({ label = "Vérifié" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      <BadgeCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status?: UserStatus }) {
  const tone =
    status === "ACTIVE"
      ? "bg-primary/10 text-primary"
      : status === "SUSPENDED"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>

        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-heading">
            {value}
          </p>

          {badge}
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_SESSIONS = [
  {
    location: "Lomé, Togo",
    device: "Chrome — macOS",
    ip: "102.176.•.•",
    action: "Session actuelle",
  },
  {
    location: "Lomé, Togo",
    device: "Safari — iPhone",
    ip: "102.176.•.•",
    action: "Il y a 2 jours",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────

export function UserProfileCard({
  user,
  onEditProfile,
  onEditDetails,
  className,
}: UserProfileCardProps) {
  // Placeholder visuel uniquement (cf. décision : 2FA / historique des accès
  // hors scope produit actuel) — aucun état n'est persisté.
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const fullName = user.name?.trim() || "Utilisateur";

  const organization = user.organization;

  const roleLabel = user.role ?? "—";

  const functionLabel = user.function ?? "—";

  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      {/* ── Identité ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[1em] border border-border bg-card shadow-sm">
        <div className="relative h-32 bg-linear-to-br from-primary/70 via-primary/40 to-accent/40">
          <button
            type="button"
            onClick={onEditProfile}
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3.5 py-1.5 text-sm font-medium text-heading backdrop-blur transition hover:bg-card"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier le profil
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <AvatarUploader initialAvatarUrl={user?.avatar_url} name={fullName} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-xl font-semibold text-heading">
              {fullName}
            </h1>

            {user.email_verified ? (
              <VerifiedBadge label="Email vérifié" />
            ) : (
              <StatusBadge status={user.status} />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              {roleLabel}
            </div>

            {functionLabel !== "—" && (
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {functionLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Détails du profil ───────────────────────────────────────── */}
      <div className="mt-4 rounded-[1em] border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-heading">
            Détails du profil
          </h2>

          <button
            type="button"
            onClick={onEditDetails}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
          <DetailField
            icon={IconUser}
            label="Nom complet"
            value={fullName}
          />

          <DetailField
            icon={Mail}
            label="Email"
            value={user.email ?? "—"}
            badge={
              user.email_verified ? (
                <VerifiedBadge />
              ) : undefined
            }
          />

          <DetailField
            icon={Phone}
            label="Téléphone"
            value={user.phone ?? "—"}
            badge={
              user.phone && user.phone_verified ? (
                <VerifiedBadge />
              ) : undefined
            }
          />

          <DetailField
            icon={Briefcase}
            label="Rôle"
            value={roleLabel}
          />

          <DetailField
            icon={ShieldCheck}
            label="Fonction"
            value={functionLabel}
          />

        </div>
      </div>

      {/* ── Organisations ───────────────────────────────────────────── */}
      {user.organizations && user.organizations.length > 1 && (
        <div className="mt-4 rounded-[1em] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-heading">
              Mes organisations
            </h2>

            <span className="text-xs text-muted-foreground">
              {user.organizations.length} organisations
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {user.organizations.map((org) => (
              <div
                key={org.id ?? org.slug ?? org.name}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {org.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={org.logo}
                      alt={org.name ?? "Organisation"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">
                    {org.name ?? "Organisation"}
                  </p>

                  {org.slug && (
                    <p className="truncate text-xs text-muted-foreground">
                      {org.slug}
                    </p>
                  )}
                </div>

                {org.id === organization?.id && (
                  <span className="ml-auto shrink-0 text-xs font-medium text-primary">
                    Actuelle
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2FA — placeholder visuel, non branché ───────────────────── */}
      <div className="mt-4 flex flex-col gap-4 rounded-[1em] border border-border bg-linear-to-br from-primary/10 to-accent/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Lock className="h-5 w-5" />
          </div>

          <div>
            <p className="font-heading text-sm font-semibold text-heading">
              Authentification à deux facteurs
            </p>

            <p className="text-sm text-muted-foreground">
              Ajoutez une couche de sécurité supplémentaire à votre compte.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          title="Bientôt disponible"
          className="inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-background opacity-60"
        >
          Gérer
        </button>
      </div>

      {/* ── Historique des accès — placeholder visuel, non branché ──── */}
      <div className="mt-4 rounded-[1em] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold text-heading">
            Historique des accès
          </h2>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Alertes de connexion</span>

              <button
                type="button"
                onClick={() => setAlertsEnabled((v) => !v)}
                aria-pressed={alertsEnabled}
                className={cn(
                  "relative h-5 w-9 rounded-full transition",
                  alertsEnabled ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all",
                    alertsEnabled ? "left-4" : "left-0.5",
                  )}
                />
              </button>
            </label>

            <button
              type="button"
              disabled
              title="Bientôt disponible"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-sm font-medium text-destructive opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnecter les autres sessions
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Localisation</th>
                <th className="pb-2 font-medium">Appareil</th>
                <th className="pb-2 font-medium">Adresse IP</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {PLACEHOLDER_SESSIONS.map((row) => (
                <tr key={row.ip + row.device}>
                  <td className="py-3 text-heading">{row.location}</td>
                  <td className="py-3 text-muted-foreground">
                    {row.device}
                  </td>
                  <td className="py-3 text-muted-foreground">{row.ip}</td>
                  <td className="py-3 text-muted-foreground">
                    {row.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}