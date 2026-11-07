import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFullName, getUserInitials } from "@/lib/utils";
import { getStudentName } from "./helpers";
import type { StudentUser } from "./types";

export function StudentAvatar({
  user,
  className,
}: {
  user: StudentUser;
  className?: string;
}) {
  const name = getStudentName(user);
  return (
    <Avatar className={className} title={name}>
      <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
      <AvatarFallback>
        {getUserInitials(getFullName(user.firstName, user.lastName), user.email)}
      </AvatarFallback>
    </Avatar>
  );
}