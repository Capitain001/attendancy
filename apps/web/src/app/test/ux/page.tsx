'use client'

import InvitationFlow from '@/components/auth/signup/flow/invited/InvitationFlow'
import {
  WelcomeStep,
  InvitationStep,
  RoleStep,
  ConfirmStep,
} from '@/components/auth/signup/flow/invited/InvitationSteps'
import type { UserInfo } from '@/types/user'

const mockUser: UserInfo = {
  id: 'usr_mock_001',
  email: 'sarah.diallo@example.com',
  name: 'Sarah Diallo',
  avatar_url: 'https://i.pravatar.cc/150?img=47',
  role: 'TEACHER',
  function: 'ASSISTANT',
  status: 'INVITED',
  invitationToken: 'mock-token-abc123',
  organization: {
    id: 'org_mock_001',
    name: 'Lycée Excelsior',
    slug: 'lycee-excelsior',
    logo: 'https://api.dicebear.com/9.x/initials/svg?seed=Lycee%20Excelsior',
    responsable: false,
  },
  invited_by: {
    name: 'Moussa Kone',
    email: 'moussa.kone@example.com',
  },
}

export default function Page() {
  return (
    <InvitationFlow
      steps={[
        { key: 'welcome',    render: () => <WelcomeStep    user={mockUser} /> },
        { key: 'invitation', render: () => <InvitationStep user={mockUser} /> },
        { key: 'role',       render: () => <RoleStep       user={mockUser} /> },
      ]}
      confirm={{
        key: 'confirm',
        render: (status) => <ConfirmStep user={mockUser} status={status} />,
      }}
      onAccept={async () => { await new Promise((r) => setTimeout(r, 1500)) }}
      onDecline={async () => { await new Promise((r) => setTimeout(r, 800)) }}
    />
  )
}
