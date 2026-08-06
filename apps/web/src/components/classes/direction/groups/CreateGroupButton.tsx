'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

export function CreateGroupButton({
  submit,
}: {
  classId: string;
  submit: (input: { name: string; description?: string }) => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setName('');
    setDescription('');
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-foreground/20 bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
        >
          <span aria-hidden className="text-[14px] leading-none">+</span>
          Nouveau groupe
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Nouveau groupe</DialogTitle>
          <DialogDescription className="text-[12px]">
            Créer un groupe d'étudiants dans cette classe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="group-name"
              className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              Nom
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              minLength={2}
              maxLength={100}
              placeholder="ex. Groupe A"
              className="w-full h-9 px-3 text-[13px] bg-card border border-dashed border-foreground/30 rounded-md outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="group-description"
              className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              Description (optionnel)
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              rows={2}
              placeholder="ex. Travaux pratiques du mardi"
              className="w-full px-3 py-2 text-[13px] bg-card border border-dashed border-foreground/30 rounded-md outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60 resize-none"
            />
          </div>

          {error && <p className="text-[12px] text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-md border border-foreground/15 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04]"
              >
                Annuler
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={pending || name.trim().length < 2}
              className="rounded-md bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
