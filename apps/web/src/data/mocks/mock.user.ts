import type { UserInfo } from '@/types/user'

export const mockUser: UserInfo = {
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