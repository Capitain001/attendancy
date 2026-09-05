'use client'

import { Search, X } from 'lucide-react'

export type SortKey = 'name' | 'email' | 'relation'

interface ParentFilterProps {
  search: string
  onSearchChange: (value: string) => void
  filterRelation: string
  onRelationChange: (value: string) => void
  allRelations: string[]
  sortBy: SortKey
  onSortByChange: (value: SortKey) => void
  filteredCount: number
  totalCount: number
}

export function ParentFilter({
  search,
  onSearchChange,
  filterRelation,
  onRelationChange,
  allRelations,
  sortBy,
  onSortByChange,
  filteredCount,
  totalCount,
}: ParentFilterProps) {
  const selectStyle =
    'h-9 px-2 text-[12px] bg-card border border-dashed border-foreground/30 rounded-md outline-none text-muted-foreground cursor-pointer focus:border-foreground/60'

  return (
    <div className="flex flex-wrap gap-2 items-center justify-between">
      <div className="flex flex-1 flex-wrap gap-2 min-w-[240px]">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Rechercher un responsable, email ou étudiant..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-8 pr-8 text-[12px] bg-card border border-dashed border-foreground/30 rounded-md outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <select
          value={filterRelation}
          onChange={(e) => onRelationChange(e.target.value)}
          className={selectStyle}
        >
          <option value="all">Toutes les relations</option>
          {allRelations.map((rel) => (
            <option key={rel} value={rel}>
              {rel}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortKey)}
          className={selectStyle}
        >
          <option value="name">Trier : Nom</option>
          <option value="email">Trier : Email</option>
          <option value="relation">Trier : Relation</option>
        </select>
      </div>

      <div className="text-[11px] font-mono text-muted-foreground">
        {filteredCount} / {totalCount} responsable{totalCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
