import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../lib/api.ts'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.login(email, password, masterPassword)
      navigate('/vault')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '2rem' }}>
      <h1 style={{ color: 'var(--text-primary)' }}>🔐 Password Manager</h1>
      <h2 style={{ color: 'var(--text-primary)' }}>Login</h2>
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
    </div>
  )
}