import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

type User = { username: string }

type AuthGateProps = { children: ReactNode }

export default function AuthGate({ children }: AuthGateProps) {
  const [status, setStatus] = useState<'loading' | 'signed-out' | 'signed-in'>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/session', { credentials: 'same-origin' })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json() as { user: User }
          setUser(data.user)
          setStatus('signed-in')
          return
        }
        setStatus('signed-out')
      })
      .catch(() => {
        setError('Authentication service is unavailable. Please try again.')
        setStatus('signed-out')
      })
  }, [])

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
      })
      const data = await response.json() as { user?: User; error?: string }
      if (!response.ok || !data.user) throw new Error(data.error || 'Sign in failed.')
      setUser(data.user)
      setStatus('signed-in')
      event.currentTarget.reset()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
    setUser(null)
    setStatus('signed-out')
  }

  if (status === 'loading') {
    return <main className="auth-shell"><p className="auth-status">Checking secure session…</p></main>
  }

  if (status === 'signed-out') {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-labelledby="sign-in-title">
          <div className="brand auth-brand"><span className="brand-mark" aria-hidden="true">R</span><span>Rice Under Pressure</span></div>
          <div className="eyebrow">Protected investment workspace</div>
          <h1 id="sign-in-title">Sign in</h1>
          <p>Use the credentials provided by your project administrator. Passwords and signing secrets stay on the server and are never sent to the browser.</p>
          <form className="auth-form" onSubmit={login}>
            <label>Username<input name="username" autoComplete="username" required maxLength={128} /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button button--primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <>
      <div className="auth-session-bar" aria-label="Signed in session">
        <span>Signed in as <strong>{user?.username}</strong></span>
        <button type="button" className="auth-signout" onClick={logout}>Sign out</button>
      </div>
      {children}
    </>
  )
}
