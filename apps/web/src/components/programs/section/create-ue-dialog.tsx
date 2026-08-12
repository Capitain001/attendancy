'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { createUESchema, linkUESchema, CreateUEInput, LinkUEInput } from '@/services/ue/validation';
import { GetDepartmentsDto } from '@/services/department/types';
import { CreateUEsDTO, OrgUEDTO } from '@/services/ue/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';



interface CreateUEDialogProps {
  programId: string;
  semester: number;
  allUes: OrgUEDTO;
  departments: GetDepartmentsDto;
  linkedUEIds?: string[];
  onCreateUE: (
    data: CreateUEInput
  ) => Promise<{ success: boolean; error?: string; data?: unknown }>;
  onLinkUE: (
    data: LinkUEInput
  ) => Promise<{ success: boolean; error?: string }>;
}

export function CreateUEDialog({
  programId,
  semester,
  allUes,
  departments,
  linkedUEIds = [],
  onCreateUE,
  onLinkUE,
}: CreateUEDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUEId, setSelectedUEId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);


  const createForm = useForm<CreateUEInput>({
    resolver: valibotResolver(createUESchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      departmentId: '',
      semester: semester,
      order: 1,
    },
  });

  const linkForm = useForm<LinkUEInput>({
    resolver: valibotResolver(linkUESchema),
    defaultValues: {
      ueId: '',
      semester: semester,
      order: 1,
    },
  });

  async function onCreateSubmit(data: CreateUEInput) {
    setSubmitting(true);

    try {
      const result = await onCreateUE({
        ...data,
        semester,
      });

      if (!result.success) {
        createForm.setError("root", {
          message: result.error || "Une erreur est survenue",
        });
        return;
      }

      createForm.reset();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function onLinkSubmit(data: LinkUEInput) {
    try {
      setSubmitting(true);
      const result = await onLinkUE({
        ...data,
        semester,
      });

      if (!result.success) {
        linkForm.setError("root", {
          message: result.error || "Une erreur est survenue",
        });
        return;
      }

      linkForm.reset();
      setSelectedUEId("");
      setOpen(false);
    } catch (error) {
      linkForm.setError("root", {
        message: "Une erreur est survenue",
      });
    } finally {
      setSubmitting(false);
    }
  }


  // Mémoriser la liste des UE non liées
  const unlinkedUEs = useMemo(() => {
    return allUes.filter(ue => !linkedUEIds.includes(ue.id));
  }, [allUes, linkedUEIds]);

  // Mémoriser l'UE sélectionnée
  const selectedUE = useMemo(() => {
    return unlinkedUEs.find(u => u.id === selectedUEId);
  }, [unlinkedUEs, selectedUEId]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ajouter UE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter une UE au semestre {semester}</DialogTitle>
          <DialogDescription>
            Créez une nouvelle UE ou sélectionnez une UE existante
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Créer une UE</TabsTrigger>
            <TabsTrigger value="select">Sélectionner une UE</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code UE</FormLabel>
                      <FormControl>
                        <Input placeholder="MTH1110" {...field}  value={field.value ?? ''}/>
                      </FormControl>
                      <FormDescription>Code unique de l'UE</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'UE</FormLabel>
                      <FormControl>
                        <Input placeholder="Mathématiques générales" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez le contenu de l'UE..."
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un département" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Position dans le semestre</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {createForm.formState.errors.root && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                    {createForm.formState.errors.root.message}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Création...' : 'Créer UE'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="select" className="space-y-4">
            <Form {...linkForm}>
              <form onSubmit={linkForm.handleSubmit(onLinkSubmit)} className="space-y-4">
                <FormField
                  control={linkForm.control}
                  name="ueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sélectionner une UE</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedUEId(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisissez une UE existante" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unlinkedUEs.length === 0 ? (
                            <div className="p-2 text-sm text-neutral-600 dark:text-neutral-400">
                              Aucune UE disponible
                            </div>
                          ) : (
                            unlinkedUEs.map((ue) => (
                              <SelectItem key={ue.id} value={ue.id}>
                                {ue.code} - {ue.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedUEId && (
                  <div className="rounded-md bg-neutral-50 dark:bg-neutral-900 p-4 space-y-3 border border-neutral-200 dark:border-neutral-800">
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                        {selectedUE?.name} 
                      </p>
                      <p className="text-foreground text-xs mt-1">
                        Code: {selectedUE?.code}
                      </p>
                      {selectedUE?.department && (
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
                          {selectedUE?.description}
                        </p>
                      )}
                    </div>

                    {selectedUE && selectedUE.ueCourses?.length > 0 && (
                      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          Courses incluses:
                        </p>
                        <div className="space-y-2">
                          {selectedUE.ueCourses?.map((course: any) => (
                            <div key={course.id} className="text-xs bg-white dark:bg-neutral-950 rounded px-2 py-1.5 flex justify-between items-center border border-neutral-100 dark:border-neutral-800">
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {course.code} - {course.name}
                              </span>
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {course.credits} cr
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {course.duration}h
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <FormField
                  control={linkForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Position dans le semestre</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {linkForm.formState.errors.root && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                    {linkForm.formState.errors.root.message}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting || !selectedUEId}>
                    {submitting ? 'Liaison...' : 'Lier l\'UE'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
