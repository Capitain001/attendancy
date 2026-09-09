import Link from 'next/link'
import { ArrowLeft, HelpCircle, ShieldCheck, TriangleAlert, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFunctionDetailAction } from '@/services/function'
import { FunctionMembersTable } from '@/components/direction/functions/ui/FunctionMembersTable'
import { FunctionPermissionsList } from '@/components/direction/functions/ui/FunctionPermissionsList'


function FunctionError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <TriangleAlert className="mb-4 size-8 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="text-lg font-semibold">Impossible d'afficher cette fonction</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="../">Voir toutes les fonctions</Link>
      </Button>
    </div>
  )
}

function FunctionNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <HelpCircle className="mb-4 size-8 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="text-lg font-semibold">Cette fonction n'existe plus</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Elle a peut-être été supprimée, ou le lien que vous avez suivi n'est plus à jour.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/functions">Voir toutes les fonctions</Link>
      </Button>
    </div>
  )
}

export default async function FunctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getFunctionDetailAction({ functionId: id })

  if (result.error) return <FunctionError message={result.error} />
  if (!result.data) return <FunctionNotFound />

  const fn = result.data
  const createdLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(fn.createdAt)

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="../functions"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Fonctions
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{fn.name}</h1>
            {fn.isMain && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="size-3.5" />
                Fonction principale
              </Badge>
            )}
          </div>
          {fn.description && <p className="mt-2 max-w-lg text-sm text-muted-foreground">{fn.description}</p>}
        </div>
      </header>

      <p className="mt-4 text-sm text-muted-foreground">
        {fn._count.users} membre{fn._count.users > 1 ? 's' : ''} · {fn._count.permissions} permission
        {fn._count.permissions > 1 ? 's' : ''} · créée le {createdLabel}
      </p>

      <Separator className="my-8" />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="size-4" />
            Membres ({fn._count.users})
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5">
            <ShieldCheck className="size-4" />
            Permissions ({fn._count.permissions})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <FunctionMembersTable functionId={fn.id} members={fn.users} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <FunctionPermissionsList permissions={fn.permissions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}