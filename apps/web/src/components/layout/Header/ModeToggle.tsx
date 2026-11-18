// src/components/layout/Header/ModeToggle.tsx
'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface ModeToggleProps {
  className?: string
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className={cn('size-9', className)} />

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      // ModeToggle.tsx (bouton)
      className={cn(
        'size-9 items-center justify-center rounded-full text-text-subtle transition-colors hover:bg-fill-faint hover:text-text-primary',
        className,
      )}
      aria-label="Basculer le thème"
    >
      {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}