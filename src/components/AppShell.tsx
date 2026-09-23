import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import type { UserRole } from '../types'

const navigation: { label: string; path: string; roles: UserRole[] }[] = [
  { label: 'Overview', path: '/dashboard', roles: ['admin', 'viewer'] },
  { label: 'Live monitoring', path: '/monitoring', roles: ['admin', 'viewer'] },
  { label: 'Upload analysis', path: '/upload-analysis', roles: ['admin', 'viewer'] },
  { label: 'Track history', path: '/history', roles: ['admin', 'viewer'] },
  { label: 'Analytics', path: '/analytics', roles: ['admin', 'viewer'] },
  { label: 'Alerting', path: '/alerts', roles: ['admin', 'viewer'] },
  { label: 'Camera management', path: '/admin/cameras', roles: ['admin'] },
]

export function AppShell() {
  const location = useLocation()
  const session = useAuthStore((state) => state.session)
  const logout = useAuthStore((state) => state.logout)
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(session?.user.role ?? 'viewer'),
  )

  return (
    <div className={`app-layout${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">WM</span>
          <span className="brand-name">Wildlife Monitor</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-heading">Workspace</span>
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end={item.path === '/dashboard'}
            >
              <span className="nav-indicator" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="connection-status">
            <span className="status-dot" aria-hidden="true" />
            System ready
          </span>
          <button type="button" className="sidebar-action" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="app-header">
          <button
            type="button"
            className="icon-button"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span aria-hidden="true">{isSidebarCollapsed ? '>>' : '<<'}</span>
          </button>
          <div className="breadcrumb" aria-label="Current location">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>{location.pathname === '/dashboard' ? 'Overview' : visibleNavigation.find((item) => item.path === location.pathname)?.label ?? 'Access'}</strong>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <span className="user-chip" title={session?.user.email}>
              {session?.user.name}
              <small>{session?.user.role}</small>
            </span>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {visibleNavigation.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
