import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/modules/user'

export const metadata: Metadata = {
  title: 'Informations organisation | Attendancy',
  robots: { index: false, follow: false },
}

export default async function OrgInfoPage() {
  const user = await getUserInfo()
  if (!user?.id) redirect('/login')

  const organizations = user.organizations ?? []
  const currentOrg = user.organization

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Organisation
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Vos informations d'organisation
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Visualisez vos organisations associées et créez une nouvelle organisation lorsque
                vous souhaitez démarrer avec Attendancy.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-foreground/80">Compte connecté</p>
                <p className="text-base font-medium">{user.name ?? user.email ?? 'Utilisateur'}</p>
              </div>
              <Link
                href="/auth/org/setup"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Créer une organisation
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight">Organisation actuelle</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="text-base font-medium">{currentOrg?.name ?? 'Aucune organisation'}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Identifiant URL</p>
                  <p className="text-base font-medium">{currentOrg?.slug ?? '—'}</p>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="text-base font-medium">{currentOrg?.id ?? '—'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Organisations associées</h2>
                <p className="text-sm text-muted-foreground">
                  Les organisations disponibles depuis votre compte utilisateur.
                </p>
              </div>
            </div>

            {organizations.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Vous n&apos;êtes associé·e à aucune organisation pour le moment.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {organizations.map((org) => (
                  <div
                    key={org.id ?? org.slug ?? org.name}
                    className="rounded-2xl border border-border/80 bg-muted p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Nom</p>
                        <p className="text-base font-medium">{org.name ?? 'Sans nom'}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        {org.slug ?? 'sans-slug'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">ID</p>
                        <p className="text-sm">{org.id ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Permissions</p>
                        <p className="text-sm">{org.permissions?.join(', ') || 'Aucune permission listée'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
