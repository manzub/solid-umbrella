import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../lib/api.ts'

type Step = 'form' | 'success'

export default function Recover() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newMasterPassword, setNewMasterPassword] = useState('')
  const [confirmMaster, setConfirmMaster] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newMasterPassword !== confirmMaster) {
      setError('Master passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.recover(email, recoveryCode, newMasterPassword)
      setStep('success')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || 'Recovery failed. Check your email and recovery code.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem', marginTop: '0.25rem',
    borderRadius: 6, border: '1px solid var(--border)',
    fontSize: 15, background: 'var(--bg-input)', color: 'var(--text-primary)',
    boxSizing: 'border-box'
  }

  if (step === 'success') {
    return (
      <div style={{ maxWidth: 440, margin: '100px auto', padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Account Recovered</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Your account has been recovered. Your vault entries have been cleared as they could not be decrypted without your old master password.
        </p>
        <div style={{ background: 'var(--accent-yellow-bg)', border: '1px solid var(--accent-yellow-text)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: 13, color: 'var(--accent-yellow-text)', textAlign: 'left' }}>
          You can now log in with your existing account password and start adding entries to your vault again using your new master password.
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '0.75rem 2rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: 'var(--text-primary)', textAlign: 'center' }}>🔐 Password Manager</h1>
      <h2 style={{ color: 'var(--text-primary)' }}>Recover Account</h2>

      <div style={{ background: 'var(--accent-red-bg)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: 13 }}>
        <div style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ Important</div>
        <div style={{ color: 'var(--accent-red)', lineHeight: 1.6 }}>
          Recovering your account will <strong>permanently delete all your vault entries</strong>. They cannot be recovered without your old master password. Only proceed if you have no other option.
        </div>
      </div>

      {error && <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>
            Recovery Code
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              (shown when you registered)
            </span>
          </label>
          <input
            value={recoveryCode}
            onChange={e => setRecoveryCode(e.target.value.toUpperCase())}
            style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 2 }}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>New Master Password</label>
          <input type="password" value={newMasterPassword} onChange={e => setNewMasterPassword(e.target.value)} style={inputStyle} required minLength={8} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Confirm New Master Password</label>
          <input type="password" value={confirmMaster} onChange={e => setConfirmMaster(e.target.value)} style={inputStyle} required minLength={8} />
          {confirmMaster && newMasterPassword !== confirmMaster && (
            <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 4 }}>Master passwords do not match</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || newMasterPassword !== confirmMaster}
          style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600, opacity: loading || newMasterPassword !== confirmMaster ? 0.6 : 1 }}
        >
          {loading ? 'Recovering...' : 'Recover Account'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Remembered your master password? <Link to="/login" style={{ color: 'var(--accent-blue)' }}>Login</Link>
      </p>
    </div>
  )
}