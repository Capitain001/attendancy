"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AvatarUploader from "@/components/users/AvatarUploader";

import { updateUserProfileAction } from "@/services/user/actions/user.mutations";
import { updateUserDataSchema } from "@/services/user/validation";
import type { UpdateCurrentUserInput } from "@/services/user/validation";
import type { UserInfo } from "@/types/user";

interface EditProfileFormProps {
  user: UserInfo;
  onCancel: () => void;
  onSuccess: () => void;
  className?: string;
}

export function EditProfileForm({ user, onCancel, onSuccess, className }: EditProfileFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const form = useForm<UpdateCurrentUserInput>({
    resolver: valibotResolver(updateUserDataSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: user.phone ?? "",
    },
  });

  function onSubmit(values: UpdateCurrentUserInput) {
    startTransition(async () => {
      const result = await updateUserProfileAction(values);

      if (result?.error) {
        toast.error("Erreur de mise à jour", { description: result.error });
      } else {
        toast.success("Profil mis à jour avec succès");
        router.refresh();
        onSuccess();
      }
    });
  }

  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      <div className="overflow-hidden rounded-[1em] border border-border bg-card shadow-sm p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-heading">
                Modification du profil
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez vos informations personnelles.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-heading transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-heading">Photo de profil</span>
              <AvatarUploader initialAvatarUrl={user.avatar_url} name={user.name} />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">Adresse e-mail (connexion)</span>
                  <span className="text-sm font-medium text-heading  rounded-lg border border-border bg-muted/30 p-2">{user.email}</span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-heading">Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} value={field.value ?? ""} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-heading">Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} value={field.value ?? ""} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium text-heading">Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="+33 6 12 34 56 78" {...field} value={field.value ?? ""} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-2 gap-3">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} className="rounded-xs">
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isPending || !form.formState.isDirty} className="rounded-xs">
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
