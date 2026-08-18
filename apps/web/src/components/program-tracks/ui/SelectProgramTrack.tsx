"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
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
import type { GetProgramTracksItem } from "@/services/program-track/types";

interface SelectProgramTrackProps {
  programTracks: NonNullable<GetProgramTracksItem>[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SelectProgramTrack({
  programTracks,
  value,
  onChange,
  placeholder = "Sélectionner un parcours",
  className,
}: SelectProgramTrackProps) {
  const [open, setOpen] = React.useState(false);

  const isControlled = value !== undefined && onChange !== undefined;
  const [internalValue, setInternalValue] = React.useState("");
  const selectedValue = isControlled ? value : internalValue;

  const setValue = (val: string) => {
    isControlled ? onChange?.(val) : setInternalValue(val);
  };

  const selected = programTracks.find((t) => t.id === selectedValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
        >
          {selected ? selected.name : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Rechercher un parcours..." />
          <CommandList>
            <CommandEmpty>Aucun parcours trouvé.</CommandEmpty>
            <CommandGroup heading="Parcours">
              {programTracks.map((track) => (
                <CommandItem
                  key={track.id}
                  value={track.id}
                  onSelect={() => {
                    setValue(track.id);
                    setOpen(false);
                  }}
                  className="flex justify-between items-center px-3 py-2"
                >
                  <span className="truncate">{track.name}</span>
                  {selectedValue === track.id && (
                    <CheckIcon size={16} className="text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
