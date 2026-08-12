'use client';

import { type UseFormReturn } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type CreateUECourseInput } from '@/services/ue/validation';


interface UECourseFormProps {
  form: UseFormReturn<CreateUECourseInput>;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}


export function UECourseForm({ form, submitting, onSubmit, onCancel }: UECourseFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code Course</FormLabel>
              <FormControl>
                <Input placeholder="1MTH1110" {...field} />
              </FormControl>
              <FormDescription>Code unique de la course</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la Course</FormLabel>
              <FormControl>
                <Input placeholder="Algèbre linéaire" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="credits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crédits</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="30"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée (heures)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Création...' : 'Créer Course'}
          </Button>
        </div>
      </form>
    </Form>
  );
}