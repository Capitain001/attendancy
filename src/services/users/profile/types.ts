export interface FunctionProfile {
  id: string
  userId: string
  functionId: string
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    avatar_url: string | null
  }
  function: {
    id: string
    name: string
    description: string | null
    icon: string | null
  }
  assignedAt: Date
}

export interface UserProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  avatar_url: string | null
  functions: FunctionProfile[]
}
