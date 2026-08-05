"use client";

import { PresenceRoomProps, usePresence } from "@/hooks/realtime";
import { LiveUserIcon } from "./UserIcon";


export function UserList({roomName, user}:PresenceRoomProps) {
    const {users} = usePresence({roomName, user})
    const userList = Object.values(users || {})
    
  return (
    <div className="flex gap-4">
      {userList.map((userx) => (
          <div className="flex gap-4">
        <LiveUserIcon
          key={userx.id}
          userId={userx.id!}
          avatarUrl={userx.avatar_url || "/avartar.png"}
        />

        {/* <pre>{JSON.stringify(userx , null , 2)}</pre> */}
        </div>     
      ))}

    </div>
  );
}
