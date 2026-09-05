// src/components/organization/OrganizationInfo.tsx
'use client'


import { TextShimmer } from '@/components/ui/text-shimmer'
import UserIcon from '@/components/users/UserIcon'
import { UserInfo } from '@/types/user'

interface OrganizationInfoProps {
  user: UserInfo
}

export function WelcomeResponsable({ user }: OrganizationInfoProps) {
  return (
    <div className="flex flex-col items-center gap-2 justify-center h-xl">
      <TextShimmer className='text-2xl font-bold' duration={5} >
        Informations sur l’organisation
      </TextShimmer>

      <p className="text-sm text-gray-500">
        Veuillez saisir les informations de votre organisation
      </p>

      <UserIcon
        className="border-indigo-400 border-1"
        name={user?.name}
        avatarUrl={user?.avatar_url}
      />
    </div>
  )
}

export function WelcomeToOrganization({ user }: OrganizationInfoProps) {
  return (
    <div className="flex flex-col items-center -mt-14 gap-2 justify-center border h-full">
      <TextShimmer className='text-2xl font-bold' duration={5} >
        Bienvenue à l’organisation
      </TextShimmer>

      <p className="text-sm text-gray-500">
        Vous avez été invité à rejoindre {user?.organization?.name}
      </p>
      <UserIcon
        className="border-indigo-400 border-1"
        name={user?.organization?.name}
        avatarUrl={user?.organization?.logo}
      />

      <p className="text-sm text-gray-500">
        pour le role <span className="font-bold">{user?.role}</span>
      </p>
    </div>
  )
}

export function WelcomeTransition({ user }: OrganizationInfoProps) {
  return (
    <div className="flex flex-col items-center gap-2 justify-center h-xl">
      <TextShimmer className='text-2xl font-bold' duration={5} >
        veuillez definir vos identifiants 

      </TextShimmer>
    </div>
  )
}



export function OrganizationInfo({ user }: OrganizationInfoProps) {
  return (
    <div className="flex flex-col items-center gap-2 justify-center h-screen">
      <TextShimmer className='text-2xl font-bold' duration={5} >
        Informations sur l’organisation
      </TextShimmer>

      <p className="text-sm text-gray-500">
        Veuillez saisir les informations de votre organisation
      </p>

      <UserIcon
        className="border-indigo-400 border-1"
        name={user?.name}
        avatarUrl={user?.avatar_url}
      />
    </div>
  )
}
