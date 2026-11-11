// src/app/auth/org/profile/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Building2,
  GraduationCap,
  Presentation,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { getRoleProfileKey, getUserInfo } from '@/modules/user'
import { PERSONAL_ROLES } from '@/modules/auth/constants'
import { ORG_INFO_URL } from '@/config'
import { selectOrganizationProfileAction } from '@/services/organization'
import type { Role } from '@/types/user'
import { PersonalRolePicker } from '@/components/personal/organization/profile/PersonalRolePicker'
import { PersonalRoleOptions } from '@/components/personal/organization/profile/PersonalRoleOptions'
import { ROLE_OPTIONS } from '@/components/personal/organization/profile/roles'
import { selectPersonalRoleFormAction } from './helper'

const PROFILE_PRESENTATION: Partial<Record<Role, { label: string; description: string; Icon: LucideIcon }>> = {
  TEACHER: { label: 'Enseignant', description: 'Gérez vos classes, cours et présences.', Icon: Presentation },
  STUDENT: { label: 'Étudiant', description: 'Suivez votre emploi du temps et vos présences.', Icon: GraduationCap },
  PARENT: { label: 'Parent', description: 'Suivez la scolarité de vos enfants.', Icon: UsersRound },
  DIRECTION: { label: 'Direction', description: 'Administration et gestion de l’établissement.', Icon: Building2 },
  ADMIN: { label: 'Administrateur', description: 'Gestion technique et configuration.', Icon: ShieldCheck },
  GUEST: { label: 'Invité', description: 'Accès invité temporaire.', Icon: UserRound },
}

const PROFILE_ORDER: Role[] = ['TEACHER', 'STUDENT', 'PARENT', 'DIRECTION', 'ADMIN', 'GUEST']

export const metadata: Metadata = {
  title: 'Choisir un profil | Attendancy',
  robots: { index: false, follow: false },
}

export default async function OrganizationProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string; error?: string }>
}) {
  const [user, params] = await Promise.all([getUserInfo(), searchParams])
  if (!user?.id) redirect('/login')
  if (!params.organizationId) redirect(ORG_INFO_URL)

  const organizations = user.organizations ?? []
  const isPersonalKeyword = params.organizationId === 'personal'
  const existingPersonalOrg = organizations.find((item) => item.type === 'PERSONAL')
    ?? (user.organization?.type === 'PERSONAL' ? user.organization : undefined)

  // Si le mot-clé 'personal' est demandé, utiliser l'org existante si elle existe, sinon org virtuelle
  const targetOrgId = isPersonalKeyword
    ? (existingPersonalOrg?.id ?? 'personal')
    : params.organizationId

  const organization = (targetOrgId === 'personal')
    ? { id: 'personal', name: 'Espace personnel', type: 'PERSONAL' as const }
    : (organizations.find((item) => item.id === targetOrgId)
       ?? (user.organization?.id === targetOrgId ? user.organization : undefined))

  if (!organization) redirect(`${ORG_INFO_URL}?error=unavailable`)

  const isPersonal = organization.type === 'PERSONAL'
  const organizationId = organization.id ?? 'personal'
  const isCurrentOrganization = organizationId === user.organization?.id

  const availableRoles = isPersonal ? PERSONAL_ROLES : PROFILE_ORDER
  const profiles = (organizationId === 'personal')
    ? []
    : availableRoles.filter((role) => {
        const profileField = role === 'GUEST' ? null : getRoleProfileKey(role)
        return (profileField !== null && Boolean(organization[profileField]))
          || (isCurrentOrganization && user.role === role)
      })

  const unassignedPersonalRoles = isPersonal
    ? ROLE_OPTIONS.filter((opt) => !profiles.includes(opt.role))
    : []

  return (
    <main className="flex min-h-screen justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2">
          <Link href={ORG_INFO_URL} className="text-sm text-muted-foreground hover:text-foreground">
            ← Mes organisations
          </Link>
          <p className="pt-4 text-sm font-medium text-muted-foreground">
            {isPersonal ? 'Espace personnel' : 'Organisation'}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {organization.name ?? 'Choisir un profil'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPersonal && profiles.length === 0
              ? 'Choisissez votre rôle pour initialiser votre espace personnel.'
              : 'Avec quel profil souhaitez-vous continuer ?'}
          </p>
        </header>

        {params.error === 'unavailable' && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Ce profil n’est pas disponible dans cette organisation.
          </p>
        )}
        {params.error === 'switch' && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            La connexion à ce profil a échoué. Réessayez.
          </p>
        )}
        {params.error === 'failed' && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            La création de l’espace personnel ou du profil a échoué. Réessayez.
          </p>
        )}

        {/* Cas 1 : Espace personnel sans profil encore configuré */}
        {isPersonal && profiles.length === 0 ? (
          <div className="space-y-4">
            <PersonalRoleOptions options={ROLE_OPTIONS} action={selectPersonalRoleFormAction} />
          </div>
        ) : profiles.length > 0 ? (
          /* Cas 2 : Profils existants */
          <div className="space-y-6">
            <ul className="divide-y rounded-md border bg-card">
              {profiles.map((role) => {
                const profile = PROFILE_PRESENTATION[role]
                if (!profile) return null
                const { label, description, Icon } = profile
                const isCurrent = isCurrentOrganization && user.role === role

                return (
                  <li key={role}>
                    <form action={selectOrganizationProfileAction.bind(null, organizationId, role)}>
                      <button
                        type="submit"
                        className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-foreground">{label}</span>
                          <span className="block text-sm text-muted-foreground">
                            {isCurrent ? 'Profil actuellement connecté' : description}
                          </span>
                        </span>
                        {isCurrent ? (
                          <span className="text-xs font-semibold text-primary">Actuel</span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                            Continuer →
                          </span>
                        )}
                      </button>
                    </form>
                  </li>
                )
              })}
            </ul>

            {/* Possibilité d'ajouter un rôle supplémentaire à l'espace personnel */}
{isPersonal && unassignedPersonalRoles.length > 0 && (
  <div className="overflow-hidden rounded-md border border-dashed bg-muted/30">
    <PersonalRolePicker
      action={selectPersonalRoleFormAction}
      options={unassignedPersonalRoles}
      triggerLabel="Ajouter un autre rôle"
      triggerDescription={`Ajoutez un profil ${unassignedPersonalRoles.map((r) => r.label.toLowerCase()).join(" ou ")} à votre espace.`}
    />
  </div>
)}
          </div>
        ) : (
          <p className="rounded-md border px-4 py-6 text-sm text-muted-foreground">
            Aucun profil n’est associé à cette organisation.
          </p>
        )}
      </div>
    </main>
  )
}