import React from 'react'
import { cn } from '@/lib/utils'

interface MirrorHoverProps {
  children: React.ReactNode
  className?: string
}

export const MirrorHover = ({ children, className }: MirrorHoverProps) => {
  return (
    <div className={cn('relative group overflow-hidden', className)}>
      {children}

      {/* Bande miroir */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 -left-1/4 w-1/2 rotate-12 bg-white/15  blur-sm scale-y-[2] opacity-0 transition-all duration-700 transform group-hover:translate-x-[250%] group-hover:opacity-80" />
      </div>
    </div>
  )
}
