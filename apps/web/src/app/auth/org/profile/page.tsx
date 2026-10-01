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

const PROFILE_PRESENTATION: Partial<Record<Role, { label: string; Icon: LucideIcon }>> = {
  TEACHER: { label: 'Enseignant', Icon: Presentation },
  STUDENT: { label: 'Étudiant', Icon: GraduationCap },
  PARENT: { label: 'Parent', Icon: UsersRound },
  DIRECTION: { label: 'Direction', Icon: Building2 },
  ADMIN: { label: 'Administrateur', Icon: ShieldCheck },
  GUEST: { label: 'Invité', Icon: UserRound },
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
  const organization = organizations.find((item) => item.id === params.organizationId)
    ?? (user.organization?.id === params.organizationId ? user.organization : undefined)
  if (!organization) redirect(`${ORG_INFO_URL}?error=unavailable`)

  const organizationId = organization.id
  if (!organizationId) redirect(ORG_INFO_URL)

  const isCurrentOrganization = organizationId === user.organization?.id
  const availableRoles = organization.type === 'PERSONAL' ? PERSONAL_ROLES : PROFILE_ORDER
  const profiles = availableRoles.filter((role) => {
    const profileField = role === 'GUEST' ? null : getRoleProfileKey(role)
    return (profileField !== null && Boolean(organization[profileField]))
      || (isCurrentOrganization && user.role === role)
  })

  return (
    <main className="flex min-h-screen justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2">
          <Link href={ORG_INFO_URL} className="text-sm text-muted-foreground hover:text-foreground">
            ← Mes organisations
          </Link>
          <p className="pt-4 text-sm font-medium text-muted-foreground">
            {organization.type === 'PERSONAL' ? 'Espace personnel' : 'Organisation'}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {organization.name ?? 'Choisir un profil'}
          </h1>
          <p className="text-sm text-muted-foreground">Avec quel profil souhaitez-vous continuer ?</p>
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

        {profiles.length > 0 ? (
          <ul className="divide-y rounded-md border">
            {profiles.map((role) => {
              const profile = PROFILE_PRESENTATION[role]
              if (!profile) return null
              const { label, Icon } = profile
              const isCurrent = isCurrentOrganization && user.role === role

              return (
                <li key={role}>
                  <form action={selectOrganizationProfileAction.bind(null, organizationId, role)}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{label}</span>
                        <span className="block text-sm text-muted-foreground">
                          {isCurrent ? 'Profil actuellement connecté' : 'Continuer avec ce profil'}
                        </span>
                      </span>
                      {isCurrent && <span className="text-xs font-medium text-primary">Actuel</span>}
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-md border px-4 py-6 text-sm text-muted-foreground">
            Aucun profil n’est associé à cette organisation.
          </p>
        )}
      </div>
    </main>
  )
}