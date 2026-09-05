"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export type ClassItem = {
  id: string;
  name: string;
  programTrack?: { name: string };
};

interface SelectClassProps {
  classes: ClassItem[];
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SelectClass({
  classes,
  value,
  onChange,
  placeholder = "Sélectionner une classe",
  className,
}: SelectClassProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // value est la seule source de vérité : la sélection est pilotée par l'URL
  // (?classId=...) via les <Link> ci-dessous, pas par un state interne.
  const selected = classes.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full max-w-xs justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full min-w-[260px] p-0 bg-card" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une classe..." />
          <CommandList>
            <CommandEmpty>Aucune classe trouvée.</CommandEmpty>
            <CommandGroup heading="Classes disponibles">
              {classes.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  keywords={[c.name, c.programTrack?.name || ""]}
                  onSelect={() => {
                    onChange?.(c.id);
                    setOpen(false);
                  }}
                  asChild
                  className="flex items-center justify-between px-3 py-2 cursor-pointer"
                >
                  <Link
                    href={`${pathname}?classId=${c.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {c.name}
                      </span>
                      {c.programTrack?.name && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {c.programTrack.name}
                        </span>
                      )}
                    </div>
                    {value === c.id && (
                      <CheckIcon size={16} className="text-primary shrink-0 ml-2" />
                    )}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}