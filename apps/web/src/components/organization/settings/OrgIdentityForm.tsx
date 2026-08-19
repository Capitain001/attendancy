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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

interface OrgIdentityFormProps {
  initialData: {
    name: string
    email?: string | null
    domain?: string | null
    slug?: string | null
  }
}

export function OrgIdentityForm({ initialData }: OrgIdentityFormProps) {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<UpdateOrgIdentityInput>({
    resolver: valibotResolver(updateOrgIdentitySchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email ?? '',
      domain: initialData.domain ?? '',
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
