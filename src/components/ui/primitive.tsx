'use client';

import { SearchIcon, XIcon } from './icons';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 pl-8 pr-8 text-[12px] bg-transparent border border-dashed border-foreground/20 rounded-sm outline-none focus:border-foreground/40 placeholder:text-muted-foreground/40"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  );
}

type FilterBadgeProps = {
  count: number;
  className?: string;
};

export function FilterBadge({ count, className = '' }: FilterBadgeProps) {
  if (count <= 0) return null;
  return (
    <span className={`size-4 rounded-full bg-foreground/20 text-[10px] font-medium flex items-center justify-center ${className}`}>
      {count}
    </span>
  );
}

type FilterButtonProps = {
  isActive?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export function FilterButton({ isActive = false, children, onClick, className = '' }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-8 px-3 text-[12px] border border-dashed rounded-sm transition-colors ${
        isActive
          ? 'border-foreground/40 text-foreground bg-foreground/5'
          : 'border-foreground/20 text-muted-foreground hover:border-foreground/40 hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  );
}

type DropdownMenuProps = {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
};

export function DropdownMenu({ isOpen, children, className = '' }: DropdownMenuProps) {
  if (!isOpen) return null;
  return (
    <div className={`absolute right-0 top-full mt-1 bg-background border border-dashed border-foreground/20 rounded-sm shadow-lg z-10 ${className}`}>
      {children}
    </div>
  );
}

type DropdownItemProps = {
  isActive?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export function DropdownItem({ isActive = false, children, onClick, className = '' }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 text-[12px] rounded-sm transition-colors ${
        isActive
          ? 'bg-foreground/10 text-foreground'
          : 'text-muted-foreground hover:bg-foreground/5'
      } ${className}`}
    >
      {children}
    </button>
  );
}