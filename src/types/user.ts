export type UserRole = 'admin' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}

export interface AuthSession {
  user: User
  accessToken: string
  expiresAt: string
}
