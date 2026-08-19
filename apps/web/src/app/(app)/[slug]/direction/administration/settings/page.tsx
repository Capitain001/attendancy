import { connection } from 'next/server'
import { getOrgIdentityAction, getOrgDetailsAction } from '@/services/organization'
import { typography } from '@/styles'
import { OrgIdentityForm } from '@/components/organization/settings/OrgIdentityForm'
import { OrgSitesForm } from '@/components/organization/settings/OrgSitesForm'

export default async function SettingsPage() {
  // Respecter la contrainte PPR (cacheComponents: true)
  await connection()

  const [identityResult, detailsResult] = await Promise.all([
    getOrgIdentityAction(),
    getOrgDetailsAction(),
  ])

  if ('error' in identityResult) {
    return <p className={typography.body}>{identityResult.error}</p>
  }

  const org = identityResult.data
  if (!org) {
    return <p className={typography.body}>Organisation introuvable.</p>
  }

  const details = ('data' in detailsResult && detailsResult.data) ? detailsResult.data.details : null

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Paramètres de l'organisation
        </h1>
        <p className={typography.body}>
          Gérez les paramètres, l'identité et les adresses de votre organisation.
        </p>
      </div>

      <OrgIdentityForm 
        initialData={{
          name: org.name,
          email: org.email,
          domain: org.domain,
          slug: org.slug
        }} 
      />

      <OrgSitesForm initialDetails={details} />
    </div>
  )
}
