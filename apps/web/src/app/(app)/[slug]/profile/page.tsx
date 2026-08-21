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
      <div className="flex flex-col mx-auto w-full max-w-3xl ">
        <ProfileSection user={user as any} />
      </div>
    </div>
  )
}

/* deprecier */
{/* <UserProfileForm 
  initialData={{
    id: user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone,
    avatar_url: user.avatar_url,
  }} 
/> */}