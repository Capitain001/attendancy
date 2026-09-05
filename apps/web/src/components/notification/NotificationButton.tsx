// src/components/notification-permission-button.tsx
"use client"
import { BUTTON_CONFIG } from "@/config/notification"
import { cn } from "@/lib/utils"
import { getPermissionStatus, requestNotificationPermission, showLocalNotification } from "@/modules/notification/permission"
import { BellIcon } from "lucide-react"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"

interface NotificationPermissionButtonProps {
  onPermissionChange?: (permission: NotificationPermission) => void
  className?: string
}

export function NotificationPermissionButton({ 
  onPermissionChange, 
  className = '' 
}: NotificationPermissionButtonProps) {
  const [isClient, setIsClient] = useState(false)
  const [permissionState, setPermissionState] = useState<{
    permission: NotificationPermission
    isGranted: boolean
    isDenied: boolean
  }>({
    permission: 'default',
    isGranted: false,
    isDenied: false
  })

  useEffect(() => {
    setIsClient(true)
    const status = getPermissionStatus()
    setPermissionState(status)
  }, [])

  const { permission, isGranted, isDenied } = permissionState
  // const config = BUTTON_CONFIG[permission]

  const handleClick = async () => {
    if (!isClient) return

    if (isDenied) {
      alert('Les notifications sont bloquées. Activez-les dans les paramètres de votre navigateur.')
      return
    }

    if (isGranted) {
      showLocalNotification('Notifications actives ✅', {
        body: 'Vous etes connecter a notre application'
      })
      return
    }

    const newPermission = await requestNotificationPermission()
    onPermissionChange?.(newPermission)

    if (newPermission === 'granted') {
      showLocalNotification('Notifications activées ! 🎉', {
        body: 'Vous recevrez désormais nos notifications.'
      })
    }
  }

  // État de chargement pendant l'hydratation
  if (!isClient) {
    return (
      <Button
        variant="ghost"
        className={cn(" p-0 cursor-pointer rounded transition-colors", className)}
        disabled
      >
        <BellIcon className="w-4 h-4 text-gray-400" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn(" p-0 cursor-pointer rounded transition-colors", className)}
    >
      {/* {config.text} */}
      <BellIcon className={cn(
        "w-4 h-4  transition-colors",
        {
          "text-green-500": isGranted,
          "text-red-500": isDenied,
          "text-blue-500": !isGranted && !isDenied
        }
      )} />
    </Button>
  )
}
