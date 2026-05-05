import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../lib/api.ts'
import { useSearchParams } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('reason') === 'session_expired' || searchParams.get('reason') === 'auto_locked'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.login(email, password, masterPassword)
      navigate('/vault')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed'
      // make wrong master password very clear
      if (message === 'Incorrect master password') {
        setError('❌ Incorrect master password. Your account password was correct but the master password is wrong. Try again.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '2rem' }}>
      <h1 style={{ color: 'var(--text-primary)' }}>🔐 Password Manager</h1>
      <h2 style={{ color: 'var(--text-primary)' }}>Login</h2>
      {sessionExpired && (
        <div style={{ backgroundColor: 'var(--accent-yellow-bg)', color: 'var(--accent-yellow-text)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: 14 }}>
          {searchParams.get('reason') === 'auto_locked'
            ? '🔒 Your vault was locked due to inactivity. Please log in again.'
            : '⏱️ Your session expired. Please log in again.'
          }
        </div>
      )}
      {error && <p style={{ color: 'var(--accent-red)' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Email</label><br />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: 6, border: '1px solid var(--border)' }}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Password</label><br />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: 6, border: '1px solid var(--border)' }}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>
            Master Password <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>(used to decrypt your vault)</span>
          </label><br />
          <input
            type="password" value={masterPassword} onChange={e => setMasterPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: 6, border: '1px solid var(--border)' }}
            required
          />
        </div>
        <button
          type="submit" disabled={loading}
          style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No account? <Link to="/register" style={{ color: 'var(--accent-blue)' }}>Register</Link>
      </p>
      <p style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Forgot master password? <Link to="/recover" style={{ color: 'var(--accent-red)' }}>Recover account</Link>
      </p>
    </div>
  )
}