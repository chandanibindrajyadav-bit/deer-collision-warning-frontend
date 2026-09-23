import { Link } from 'react-router-dom'

export function UnauthorizedPage() {
  return (
    <main className="protected-shell">
      <p className="eyebrow">Access restricted</p>
      <h1>Unauthorized</h1>
      <p className="auth-intro">Your account does not have permission to view this area.</p>
      <Link to="/dashboard">Return to dashboard</Link>
    </main>
  )
}
