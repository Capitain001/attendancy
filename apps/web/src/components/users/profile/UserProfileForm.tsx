'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, minLength, optional, regex, pipe } from 'valibot'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { updateProfile } from '@/modules/auth/supabase'
import { useRouter } from 'next/navigation'

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
import AvatarUploader from '@/components/users/AvatarUploader'

// ── Validation Schema
const userProfileSchema = object({
  name: pipe(string(), minLength(2, 'Le nom doit contenir au moins 2 caractères')),
  phone: optional(pipe(string(), regex(/^\+?[0-9\s]*$/, 'Numéro de téléphone invalide'))),
})

type UserProfileInput = {
  name: string
  phone?: string
}

interface UserProfileFormProps {
  initialData: {
    id: string
    name: string
    email: string
    phone?: string | null
    avatar_url?: string | null
  }
}

export function UserProfileForm({ initialData }: UserProfileFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  const form = useForm<UserProfileInput>({
    resolver: valibotResolver(userProfileSchema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone ?? '',
    },
  })

  function onSubmit(values: UserProfileInput) {
    startTransition(async () => {
      const result = await updateProfile(initialData.id, {
        name: values.name,
        phone: values.phone,
      })

      if ('error' in result) {
        toast.error("Erreur de mise à jour", { description: result.error })
      } else {
        toast.success("Profil mis à jour avec succès")
        form.reset(values)
        router.refresh()
      }
    })
  }

  return (
    <div className={cn(card.base, 'flex flex-col gap-6')}>
      <div>
        <h2 className={typography.h4}>Informations personnelles</h2>
        <p className={typography.small}>
          Gérez votre nom, votre photo de profil et vos coordonnées.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Photo de profil */}
        <div className="flex flex-col gap-3">
          <FormLabel>Photo de profil</FormLabel>
          <AvatarUploader initialAvatarUrl={initialData.avatar_url}  />
        </div>

        {/* Formulaire Textuel */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-4">
            
            <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-4 mb-2">
              <span className={typography.label}>Adresse e-mail (connexion)</span>
              <span className={typography.body}>{initialData.email}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+33 6 12 34 56 78" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
    </div>
  )
}
