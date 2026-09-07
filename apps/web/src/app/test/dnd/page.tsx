"use client"
import DragDrop from '@/components/programs/dnd-basic-exemple'
import ExampleNoiseUsage from './NoiseExemple'
import React from 'react'
import { BackgroundPattern } from '@/components/design/BackgroundPattern'

export default function page() {
  return (
    <div className='flex flex-col gap-10'>
      <div className="relative overflow-hidden rounded-xl h-40">
  <div className="pattern pattern-noise dark:invert" style={{ "--pattern-opacity": 0.25 } as React.CSSProperties} />
  <p className="relative p-4 text-white">Contenu</p>
</div>

<BackgroundPattern pattern="pattern-dots"  className="opacity-30" />
      <DragDrop/>
      <ExampleNoiseUsage/>
    </div>
  )
}
