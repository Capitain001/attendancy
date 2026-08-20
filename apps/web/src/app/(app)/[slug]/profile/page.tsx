import { getUserInfo } from '@/modules/user'
import { redirect } from 'next/navigation'
import { typography } from '@/styles'
import { UserProfileForm } from '@/components/users/profile/UserProfileForm'
import { UserPasswordForm } from '@/components/users/profile/UserPasswordForm'
import { UserProfileCard } from '@/components/users/profile/UserProfileCard'

export default async function ProfilePage() {
  const user = await getUserInfo()

  if (!user || !user.id) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col mx-auto w-full max-w-3xl ">
        <UserProfileCard user={user}  />
        <UserPasswordForm />
      </div>
    </div>
  )
}

{/* <UserProfileForm 
  initialData={{
    id: user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone,
    avatar_url: user.avatar_url,
  }} 
/> */}