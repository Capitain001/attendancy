import { connection } from 'next/server'
import { getReferentialAction } from '@/services/ue-template'
import { typography } from '@/styles'
import { notFound } from 'next/navigation'
import { ReferentialViewer } from '@/components/direction/academic/ReferentialViewer'
import Link from 'next/link'
import { ArrowLeft, Globe, Building2, BookOpen, Calendar } from 'lucide-react'

export default async function UETemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  await connection()
  const { slug, id } = await params

  const result = await getReferentialAction(id)

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const referential = result.data
  if (!referential) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-y-6 overflow-y-auto ">
      <div className="mb-2">
        <Link
          href={`/${slug}/direction/academic/ues/templates`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au catalogue national
        </Link>
        
        <div className="border-l-4 border-primary pl-5 py-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{referential.name}</h1>
          
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>{referential.country}</span>
            </div>
            
            <div className="flex items-center gap-1.5 border-l pl-4 border-border">
              <Building2 className="w-4 h-4" />
              <span>{referential.issuer}</span>
            </div>
            
            <div className="flex items-center gap-1.5 border-l pl-4 border-border">
              <BookOpen className="w-4 h-4" />
              <span>Version {referential.version}</span>
            </div>
            
            {referential.publishedAt && (
              <div className="flex items-center gap-1.5 border-l pl-4 border-border">
                <Calendar className="w-4 h-4" />
                <span>Publié le {new Date(referential.publishedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReferentialViewer referential={referential} />
    </div>
  )
}
