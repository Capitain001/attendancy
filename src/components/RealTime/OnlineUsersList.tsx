"use client"

import { useUser } from "@/contexts/UserContext"



export function OnlineUsersList() {
  const { onlineUsers, user } = useUser()
  
  const onlineUsersList = Object.values(onlineUsers)

  return (
    <div className="p-4">
      <h3 className="font-medium mb-3">
        Membres en ligne ({onlineUsersList.length})
      </h3>
      
      <div className="space-y-2">
        {onlineUsersList.map(onlineUser => (
          <div key={onlineUser.id} className="flex items-center gap-2 p-2  border-b rounded">
            <img 
              src={onlineUser.avatar_url || "/avatar.png"} 
              alt={onlineUser.name}
              className="w-8 h-8 rounded-full"
            />
            
            <div className="flex-1">
              <p className="font-medium">
                {onlineUser.name}
                {onlineUser.id === user?.id && " (Vous)"}
              </p>
              <p className="text-sm text-gray-600">
                {onlineUser.role} • {onlineUser.function}
              </p>
            </div>
            <div className="text-xs text-green-600">
              ● En ligne
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}