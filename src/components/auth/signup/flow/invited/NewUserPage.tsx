import { UserInfo } from '@/types/user'
import React from 'react'
import {  WelcomeToOrganization, WelcomeTransition } from './OrganizationInfo'
import Transition from '@/components/design/Transition'
import SignupSection from '@/components/auth/signup/SignupSection'



interface NewUserPageProps{
    user:UserInfo
}

export default function NewUserPage({user}:NewUserPageProps) {
  return (
    <div className="">
        <Transition contents={[
          {content: <WelcomeToOrganization  user={user}/>, duration: 3500},
          {content: <WelcomeTransition  user={user}/>, duration: 3500},
          {content: <SignupSection email={user?.email!} orgName={user?.organization?.name} />, duration: 3500}
        
        ]} />
      
    </div>
  )
}
