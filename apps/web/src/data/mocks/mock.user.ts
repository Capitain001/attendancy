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


// ## temp
export const MOCK_PARTICIPANTS= [
  { id: 'u1', name: 'Jennifer' },
  { id: 'u2', name: 'Cameron' },
  { id: 'u3', name: 'Diana' },
  { id: 'u4', name: 'Ronald' },
  { id: 'u5', name: 'Anne-Marie' },
  { id: 'u6', name: 'Leslie' },
  { id: 'u7', name: 'Leslie' },
]

export const MOCK_ORG_USERS = [
  { id: 'o1', name: 'Kofi Mensah', email: 'kofi.mensah@ecole.com' },
  { id: 'o2', name: 'Akouvi Dossou', email: 'akouvi.dossou@ecole.com' },
  { id: 'o3', name: 'Yao Agbodjan', email: 'yao.agbodjan@ecole.com' },
  { id: 'o4', name: 'Sika Lawson', email: 'sika.lawson@ecole.com' },
]
