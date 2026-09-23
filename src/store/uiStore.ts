import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface UiState {
  isSidebarCollapsed: boolean
  theme: Theme
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarCollapsed: false,
  theme: 'dark',
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}))
