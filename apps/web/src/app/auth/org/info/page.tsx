// src/app/auth/org/info/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Building2,
  GraduationCap,
  Presentation,
  ShieldCheck,
  User,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { getUserInfo } from '@/modules/user'
import { ORG_PROFILE_URL } from '@/config'
import type { Organization, Role } from '@/types/user'

type OrganizationProfilePresentation = {
  label: string
  field?: keyof Organization
  Icon: LucideIcon
}

const ORGANIZATION_PROFILES: Partial<Record<Role, OrganizationProfilePresentation>> = {
  TEACHER: { label: 'Enseignant', field: 'teacherId', Icon: Presentation },
  STUDENT: { label: 'Étudiant', field: 'studentId', Icon: GraduationCap },
  PARENT: { label: 'Parent', field: 'parentId', Icon: UsersRound },
  DIRECTION: { label: 'Direction', field: 'directionId', Icon: Building2 },
  ADMIN: { label: 'Administrateur', Icon: ShieldCheck },
  GUEST: { label: 'Invité', Icon: UserRound },
}

const PROFILE_ORDER: Role[] = ['TEACHER', 'STUDENT', 'PARENT', 'DIRECTION', 'ADMIN', 'GUEST']

function getOrganizationProfiles(
  organization: Organization,
  activeRole: Role | undefined,
  isCurrent: boolean,
) {
  return PROFILE_ORDER.flatMap((role) => {
    const profile = ORGANIZATION_PROFILES[role]
    if (!profile) return []

    const isActiveProfile = isCurrent && role === activeRole
    const hasProfileId = profile.field ? Boolean(organization[profile.field]) : false
    return isActiveProfile || hasProfileId ? [{ role, ...profile }] : []
  })
}

export const metadata: Metadata = {
  title: 'Informations organisation | Attendancy',
  robots: { index: false, follow: false },
}

export default async function OrganizationInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [user, params] = await Promise.all([getUserInfo(), searchParams])
  if (!user?.id) redirect('/login')

  const organizations = [...(user.organizations ?? [])]
  if (user.organization?.id && !organizations.some((org) => org.id === user.organization?.id)) {
    organizations.unshift(user.organization)
  }

  const personalOrg = organizations.find((org) => org.type === 'PERSONAL')
  const institutionalOrgs = organizations.filter((org) => org.type !== 'PERSONAL')

  // Initiale de l'utilisateur en cas d'absence d'avatar
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <main className="min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-8">

        {/* En-tête : Informations de l'utilisateur */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 ">
          <div className="flex items-center gap-4 min-w-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name ?? 'Avatar utilisateur'}
                className="h-16 w-16 shrink-0 rounded-full border object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-2xl font-bold text-primary">
                {userInitial}
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Votre espace Attendancy
              </p>
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {user.name ?? 'Utilisateur'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Sélectionnez un espace pour choisir votre profil.
              </p>
            </div>
          </div>
        </header>

        {/* Alertes d'erreur */}
        {params.error === 'unavailable' && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Cette organisation n’est pas disponible pour votre compte.
          </p>
        )}
        {params.error === 'switch' && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Le changement d’organisation a échoué. Réessayez.
          </p>
        )}

        {/* Grille unifiée des espaces et organisations */}
        <section aria-labelledby="organizations-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 id="organizations-heading" className="text-xl font-semibold">
                Mes espaces 
              </h2>
              <span className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {institutionalOrgs.length + 1}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

            {/* 1. Carte Espace personnel (TOUJOURS en première position) */}
            {(() => {
              const isCurrent = personalOrg?.id ? personalOrg.id === user.organization?.id : false
              const personalProfiles = personalOrg
                ? getOrganizationProfiles(personalOrg, user.role, isCurrent)
                : []
              const href = personalOrg?.id
                ? `${ORG_PROFILE_URL}?organizationId=${encodeURIComponent(personalOrg.id)}`
                : `${ORG_PROFILE_URL}?organizationId=personal`

              return (
                <Link
                  href={href}
                  aria-label="Accéder à votre espace personnel"
                  className={`group flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isCurrent ? 'ring-2 ring-primary/20 bg-muted/20 border-primary/30' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 font-bold text-primary">
                          <User aria-hidden="true" className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground">
                            {personalOrg?.name ?? 'Espace personnel'}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Espace personnel
                          </p>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Actuel
                        </span>
                      )}
                    </div>

                    <div className="mb-4 border-t pt-3">
                      {personalProfiles.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5" aria-label="Profils personnels">
                            {personalProfiles.map(({ role, label, Icon }) => (
                              <span
                                key={role}
                                title={label}
                                aria-label={label}
                                className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground"
                              >
                                <Icon aria-hidden="true" className="h-4 w-4" />
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {personalProfiles.map(({ label }) => label).join(' · ')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Configurez votre espace (Enseignant, Étudiant, Parent)
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="mt-2 flex w-full items-center justify-center rounded-lg bg-secondary px-4 py-2.5 text-xs font-medium text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    Choisir un profil →
                  </span>
                </Link>
              )
            })()}

            {/* 2. Cartes des organisations institutionnelles */}
            {institutionalOrgs.map((organization, index) => {
              const isCurrent = organization.id === user.organization?.id
              const orgInitial = organization.name ? organization.name.charAt(0).toUpperCase() : 'O'

              return (
                <Link
                  href={`${ORG_PROFILE_URL}?organizationId=${encodeURIComponent(organization.id ?? '')}`}
                  key={organization.id ?? `${organization.name ?? 'organization'}-${index}`}
                  aria-label={`Choisir un profil dans ${organization.name ?? 'cette organisation'}`}
                  className={`group flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isCurrent ? 'ring-2 ring-primary/20 bg-muted/20 border-primary/30' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {organization.logo ? (
                          <img
                            src={organization.logo}
                            alt={organization.name ?? 'Logo organisation'}
                            className="h-12 w-12 shrink-0 rounded-lg border bg-background object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted font-bold text-muted-foreground">
                            {orgInitial}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground">
                            {organization.name ?? 'Organisation'}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Établissement
                          </p>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Actuelle
                        </span>
                      )}
                    </div>

                    {(() => {
                      const profiles = getOrganizationProfiles(organization, user.role, isCurrent)

                      return (
                        <div className="mb-4 border-t pt-3">
                          {profiles.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5" aria-label="Profils dans cette organisation">
                                {profiles.map(({ role, label, Icon }) => (
                                  <span
                                    key={role}
                                    title={label}
                                    aria-label={label}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground"
                                  >
                                    <Icon aria-hidden="true" className="h-4 w-4" />
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {profiles.map(({ label }) => label).join(' · ')}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Profil non renseigné</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  <span className="mt-2 flex w-full items-center justify-center rounded-lg bg-secondary px-4 py-2.5 text-xs font-medium text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    Choisir un profil →
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

      </div>
    </main>
  )
}