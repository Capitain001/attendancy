"use client"
import { LiveAvatars } from '@/components/users/avatars/LiveAvatars'
// import { useUser } from '@/contexts/UserContext'
import { UserRoles, type Role } from '@/types/user'
import { cn } from '@/lib/utils';

type RoleLiveBarProps = {
  role?: Role;
  size?: number;
  className?: string;
};

export function RoleLiveBar({ role, size = 26, className }: RoleLiveBarProps) {
  // const { onlineUsers , otherUsers} = useUser();
  
  // console.log("otherUsers", otherUsers);
  // console.log("onlineUsers", onlineUsers);
  // const onlineUsersList = Object.values(otherUsers);
  // const targetRole = role ? role.toString().toUpperCase() : null;

  // const filteredUsers = targetRole
  //   ? onlineUsersList.filter((user) => {
  //       const userRole = (user?.role!).toString().toUpperCase();
  //       return userRole === targetRole;
  //     })
  //   : onlineUsersList;

  return (
    <div className={cn("border rounded-2xl p-[0.2px]", className )}>
      {/* min-w-36 md:min-w-48 */}
      <div className="flex items-center rounded-3xl p-[0.2px] bg-muted/80 justify-between">
        {/* <LiveAvatars
          size={size}
          members={filteredUsers.map((user) => ({
            username: user.name,
            src: user.avatar_url,
          }))}
        /> */}
      </div>
    </div>
  );
}

