'use client'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface FunctionFilterProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function FunctionFilter({
  value,
  onChange,
  placeholder = 'Rechercher une fonction…',
}: FunctionFilterProps) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        id="function-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8 h-8 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Effacer la recherche"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
