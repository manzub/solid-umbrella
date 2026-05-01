import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../lib/api.ts'

type Step = 'form' | 'recovery_code'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [confirmMaster, setConfirmMaster] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (masterPassword !== confirmMaster) {
      setError('Master passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register(email, password, masterPassword)
      setRecoveryCode(res.data.recoveryCode)
      setStep('recovery_code')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = async () => {
    if (!confirmed) return
    setLoading(true)
    try {
      await authApi.login(email, password, masterPassword)
      navigate('/vault')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recoveryCode)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem', marginTop: '0.25rem',
    borderRadius: 6, border: '1px solid var(--border)',
    fontSize: 15, background: 'var(--bg-input)', color: 'var(--text-primary)',
    boxSizing: 'border-box'
  }

  // Step 2 — show recovery code
  if (step === 'recovery_code') {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'var(--text-primary)', textAlign: 'center' }}>🔐 Password Manager</h1>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 1rem' }}>Save your Recovery Code</h2>

          {/* Recovery code display */}
          <div style={{ background: 'var(--bg-secondary)', border: '2px solid var(--accent-blue)', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 0.75rem' }}>Your recovery code</p>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, letterSpacing: 3, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              {recoveryCode}
            </div>
            <button
              onClick={handleCopyCode}
              style={{ padding: '0.4rem 1rem', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'var(--bg-chip)', color: 'var(--text-secondary)', fontSize: 13 }}
            >
              📋 Copy code
            </button>
          </div>

          {/* Critical warnings */}
          <div style={{ background: 'var(--accent-red-bg)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: '0.5rem', fontSize: 15 }}>
              ⚠️ Read this carefully
            </div>
            <ul style={{ color: 'var(--accent-red)', fontSize: 13, margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
              <li>This code is shown <strong>once only</strong> and cannot be retrieved again</li>
              <li>Save it somewhere safe — a password manager, printed paper, or secure notes app</li>
              <li>If you forget your <strong>master password</strong>, this code lets you recover your <strong>account login only</strong></li>
              <li><strong>All vault entries will be permanently deleted</strong> during recovery — they cannot be decrypted without your master password</li>
              <li>There is <strong>no other way</strong> to recover your vault entries if you lose your master password</li>
            </ul>
          </div>

          {/* Confirmation checkbox */}
          <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1.25rem' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
              I have saved my recovery code and I understand that losing my master password means permanently losing all my vault entries
            </span>
          </label>

          <button
            onClick={handleContinue}
            disabled={!confirmed || loading}
            style={{
              width: '100%', padding: '0.75rem',
              background: confirmed ? 'var(--accent-blue)' : 'var(--bg-chip)',
              color: confirmed ? 'white' : 'var(--text-muted)',
              border: 'none', borderRadius: 6, cursor: confirmed ? 'pointer' : 'not-allowed',
              fontSize: 15, fontWeight: 600
            }}
          >
            {loading ? 'Setting up vault...' : 'I\'ve saved my code — Continue to vault'}
          </button>
        </div>
      </div>
    )
  }

  // Step 1 — registration form
  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: 'var(--text-primary)', textAlign: 'center' }}>🔐 Password Manager</h1>
      <h2 style={{ color: 'var(--text-primary)' }}>Create Account</h2>

      {/* Master password warning */}
      <div style={{ background: 'var(--accent-yellow-bg)', border: '1px solid var(--accent-yellow-text)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: 13 }}>
        <div style={{ color: 'var(--accent-yellow-text)', fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ Before you register</div>
        <div style={{ color: 'var(--accent-yellow-text)', lineHeight: 1.6 }}>
          Your <strong>master password</strong> encrypts all your vault entries. It is <strong>never sent to our servers</strong> and <strong>cannot be recovered</strong> by anyone — including us. If you lose it, your vault entries are gone forever. Choose something memorable.
        </div>
      </div>

      {error && <p style={{ color: 'var(--accent-red)' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Account Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>
            Master Password
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
              (encrypts your vault — cannot be recovered)
            </span>
          </label>
          <input type="password" value={masterPassword} onChange={e => setMasterPassword(e.target.value)} style={inputStyle} required minLength={8} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Confirm Master Password</label>
          <input type="password" value={confirmMaster} onChange={e => setConfirmMaster(e.target.value)} style={inputStyle} required minLength={8} />
          {confirmMaster && masterPassword !== confirmMaster && (
            <p style={{ color: 'var(--accent-red)', fontSize: 13, marginTop: 4 }}>Master passwords do not match</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || masterPassword !== confirmMaster}
          style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-green)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600, opacity: loading || masterPassword !== confirmMaster ? 0.6 : 1 }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)' }}>Login</Link>
      </p>
    </div>
  )
}