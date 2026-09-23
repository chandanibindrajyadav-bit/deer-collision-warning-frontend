import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('admin@wildlife.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const authenticated = login(email, password)

    if (!authenticated) {
      setError('Invalid email or password.')
      return
    }

    navigate(from || '/dashboard', { replace: true })
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Wildlife intelligence workspace</p>
        <h1 id="login-title">Sign in to monitor</h1>
        <p className="auth-intro">Access live detection data and protected research tools.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button">Sign in</button>
        </form>

        <div className="demo-accounts">
          <p>Demo accounts</p>
          <span>Admin: admin@wildlife.local / admin123</span>
          <span>Viewer: viewer@wildlife.local / viewer123</span>
        </div>
      </section>
    </main>
  )
}
