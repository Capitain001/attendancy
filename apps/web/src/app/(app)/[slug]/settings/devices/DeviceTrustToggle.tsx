"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { setDeviceTrustedAction } from "@/services/device"
import { useRouter } from "next/navigation"

interface Props {
  deviceId: string
  initialTrusted: boolean
}

export function DeviceTrustToggle({ deviceId, initialTrusted }: Props) {
  const [trusted, setTrusted] = useState(initialTrusted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async (value: boolean) => {
    setLoading(true)
    setTrusted(value)
    await setDeviceTrustedAction({ deviceId, isTrusted: value })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <ShieldCheck
        className={`size-4 transition-colors ${trusted ? "text-green-500" : "text-muted-foreground/40"}`}
      />
      <Switch
        id={`trust-${deviceId}`}
        checked={trusted}
        onCheckedChange={toggle}
        disabled={loading}
        aria-label="Marquer comme appareil de confiance"
      />
    </div>
  )
}
