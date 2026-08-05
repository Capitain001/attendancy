'use client'
import { useEffect } from 'react'

export function ErudaProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'production') return

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/eruda'
    script.onload = () => {
      // @ts-ignore
      eruda.init()
    }
    document.body.appendChild(script)
  }, [])

  return null
}
