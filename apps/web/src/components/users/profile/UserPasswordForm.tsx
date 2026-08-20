'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, minLength, pipe, check, forward } from 'valibot'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { updateAuthUser } from '@/modules/auth/supabase'

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

const passwordSchema = pipe(
  object({
    password: pipe(string(), minLength(6, 'Le mot de passe doit faire au moins 6 caractères')),
    confirmPassword: string(),
  }),
  forward(
    check(
      (input) => input.password === input.confirmPassword,
      'Les mots de passe ne correspondent pas'
    ),
    ['confirmPassword']
  )
)

type PasswordInput = {
  password: ''
  confirmPassword: ''
}

export function UserPasswordForm() {
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<PasswordInput>({
    resolver: valibotResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  function onSubmit(values: PasswordInput) {
    startTransition(async () => {
      const result = await updateAuthUser(values.password)

      if ('error' in result) {
        toast.error("Erreur de mise à jour", { description: result.error })
      } else {
        toast.success("Mot de passe mis à jour avec succès")
        form.reset()
      }
    })
  }

  return (
    <div className={cn(card.base, 'flex flex-col gap-6')}>
      <div>
        <h2 className={typography.h4}>Sécurité</h2>
        <p className={typography.small}>
          Mettez à jour votre mot de passe pour sécuriser votre compte.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="outline" disabled={isPending || !form.formState.isDirty}>
              <KeyRound className="mr-2 size-4" />
              {isPending ? 'Mise à jour...' : 'Changer le mot de passe'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
