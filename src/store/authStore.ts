import { create } from 'zustand'
import type { AuthSession, UserRole } from '../types'

interface AuthState {
  session: AuthSession | null
  login: (email: string, password: string) => boolean
  logout: () => void
  hasRole: (roles: UserRole[]) => boolean
}

const demoUsers: Record<string, { password: string; session: AuthSession }> = {
  'admin@wildlife.local': {
    password: 'admin123',
    session: {
      user: { id: 'user-admin', name: 'Forest Administrator', email: 'admin@wildlife.local', role: 'admin' },
      accessToken: 'demo-admin-token',
      expiresAt: '2099-12-31T23:59:59.000Z',
    },
  },
  'viewer@wildlife.local': {
    password: 'viewer123',
    session: {
      user: { id: 'user-viewer', name: 'Wildlife Researcher', email: 'viewer@wildlife.local', role: 'viewer' },
      accessToken: 'demo-viewer-token',
      expiresAt: '2099-12-31T23:59:59.000Z',
    },
  },
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  login: (email, password) => {
    const account = demoUsers[email.trim().toLowerCase()]
    if (!account || account.password !== password) return false
    set({ session: account.session })
    return true
  },
  logout: () => set({ session: null }),
  hasRole: (roles) => {
    const role = get().session?.user.role
    return role !== undefined && roles.includes(role)
  },
}))
