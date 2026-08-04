"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StickyDialogProps {
  trigger: React.ReactNode;             // bouton ou trigger
  title: React.ReactNode;               // titre du dialogue
  description?: React.ReactNode;        // description optionnelle
  content: React.ReactNode;             // contenu principal
  footer?: React.ReactNode;             // footer optionnel
  triggerClassName?: string;            // classes du trigger
  contentClassName?: string;            // classes du content
  headerSticky?: boolean;               // si header doit être sticky
  open?: boolean;                       // état d'ouverture contrôlé
  onOpenChange?: (open: boolean) => void; // callback de changement d'état
}

export function StickyDialog({
  trigger,
  title,
  description,
  content,
  footer,
  triggerClassName,
  contentClassName,
  headerSticky = true,
  open,
  onOpenChange,
}: StickyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <span className={cn("inline-block", triggerClassName)}>
          {trigger}
        </span>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:top-3.5",
          contentClassName
        )}
      >
        <DialogHeader className={cn("contents space-y-0 text-left")}>
          <div
            className={cn(
              "border-b px-6 py-4 flex justify-between items-center",
              headerSticky ? "sticky top-0 bg-background z-10" : ""
            )}
          >
            <DialogTitle className="text-base">{title}</DialogTitle>
            <div className="flex gap-4">
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
                <DialogClose className="text-2xl text-muted-foreground hover:text-inherit font-bold">x</DialogClose>
            </div>
          </div>

        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto h-full">{content}</div>

        {footer && (
          <DialogFooter className="px-6 pb-6 sm:justify-start">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
