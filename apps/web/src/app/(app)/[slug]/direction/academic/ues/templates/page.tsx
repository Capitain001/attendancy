import { connection } from 'next/server'
import { getReferentialsAction } from '@/services/ue-template'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { typography } from '@/styles'
import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'

export default async function UETemplatesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await connection()
  const { slug } = await params

  const referentialsResult = await getReferentialsAction()

  if ('error' in referentialsResult) {
    return <p className={typography.body}>{referentialsResult.error}</p>
  }

  const referentials = referentialsResult.data

  return (
    <div className="flex flex-col gap-y-6 max-w-4xl">
      <div className="flex flex-col gap-y-4">
        <SectionHeader title="Référentiel national de formations" />
        <p className={typography.small}>
          Sélectionnez un catalogue national pour parcourir et importer des programmes et des UE
          harmonisés dans votre établissement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {referentials.map((ref) => (
          <Link
            key={ref.id}
            href={`/${slug}/direction/academic/ues/templates/${ref.id}`}
            className="flex items-start gap-x-4 p-5 rounded-xs border border-border bg-card hover:bg-accent/50 transition-colors group"
          >
            <div className="shrink-0 p-2 bg-primary/10 rounded-md text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{ref.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Version {ref.version} • {ref.country}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Publié par : {ref.issuer}
              </p>
            </div>
            <div className="shrink-0 self-center text-muted-foreground group-hover:text-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
        ))}

        {referentials.length === 0 && (
          <div className="col-span-full p-8 text-center border border-dashed rounded-lg text-muted-foreground">
            Aucun référentiel national n'est disponible pour le moment.
          </div>
        )}
      </div>
    </div>
  )
}
