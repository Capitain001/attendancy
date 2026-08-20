'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

import { updateOrgIdentityAction } from '@/services/organization/actions'
import { updateOrgIdentitySchema } from '@/services/organization/validation'
import type { UpdateOrgIdentityInput } from '@/services/organization/validation'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLogoUpload } from '@/hooks/pratical/useLogoUpload'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

interface OrgIdentityFormProps {
  initialData: {
    id: string
    name: string
    email?: string | null
    domain?: string | null
    slug?: string | null
    logo?: string | null
  }
}

export function OrgIdentityForm({ initialData }: OrgIdentityFormProps) {
  const [isPending, startTransition] = React.useTransition()

  const { uploadLogo } = useLogoUpload()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(initialData.logo ?? null)
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)

  const form = useForm<UpdateOrgIdentityInput>({
    resolver: valibotResolver(updateOrgIdentitySchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email ?? '',
      domain: initialData.domain ?? '',
      logo: initialData.logo ?? undefined,
    },
  })

  function onSubmit(values: UpdateOrgIdentityInput) {
    startTransition(async () => {
      const result = await updateOrgIdentityAction(values)
      if ('error' in result) {
        toast.error("Erreur lors de la mise à jour", { description: result.error })
      } else {
        toast.success("Identité mise à jour avec succès")
        form.reset(values) // update pristine state
      }
    })
  }

  return (
    <div className={cn(card.base, 'flex flex-col gap-6')}>
      <div>
        <h2 className={typography.h4}>Identité de l'organisation</h2>
        <p className={typography.small}>
          Gérez les informations publiques et l'identité principale de votre espace.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'organisation</FormLabel>
                <FormControl>
                  <Input placeholder="Nom" {...field} disabled />
                </FormControl>
                <p className="text-xs text-text-subtle mt-1">
                  Le nom de l'organisation ne peut pas être modifié pour le moment.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de contact</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@organisation.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domaine internet</FormLabel>
                  <FormControl>
                    <Input placeholder="mon-organisation.com" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-3">
            <FormLabel>Logo de l'organisation</FormLabel>
            <div className="flex items-center gap-4">
              <div 
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted flex items-center justify-center cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo organisation" className="h-full w-full object-cover transition-opacity group-hover:opacity-75" />
                ) : (
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Logo</span>
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  disabled={isUploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Changer le logo
                </Button>
                <p className="text-xs text-text-subtle">Recommandé : PNG/JPG, 512x512px max</p>
                <input 
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    setIsUploadingLogo(true)
                    try {
                      const url = await uploadLogo(initialData.id, file)
                      setLogoPreview(url)
                      form.setValue('logo', url, { shouldDirty: true })
                      toast.success('Logo téléchargé (n\'oubliez pas d\'enregistrer)')
                    } catch (err: any) {
                      toast.error(err.message || 'Erreur lors du téléchargement')
                    } finally {
                      setIsUploadingLogo(false)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-4">
             <span className={typography.label}>Identifiant unique (Slug)</span>
             <span className={typography.body}>{initialData.slug ?? 'N/A'}</span>
             <span className="text-xs text-text-subtle">
               Le slug ne peut pas être modifié. Il sert d'identifiant unique pour votre espace.
             </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              <Save className="mr-2 size-4" />
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
