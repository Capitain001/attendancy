import { getUserInfo } from '@/modules/user'
import { redirect } from 'next/navigation'
import { ProfileSection } from '@/components/users/profile/ProfileSection'

export default async function ProfilePage() {
  const user = await getUserInfo()

  if (!user || !user.id) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col mx-auto w-full overflow-y-auto ">
        <ProfileSection user={user} />
      </div>
    </div>
  )
}

