"use client"

import { useState } from "react"
import type { View } from "../types"

export function useFicheNavigation() {
    const [view, setView] = useState<View>("home")

    const go = (next: View) => {
        setView(next)
        if (typeof window !== "undefined") window.scrollTo({ top: 0 })
    }

    return { view, go }
}
