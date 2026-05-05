import { useState } from 'react'
import type { Entry } from '../types/vault.ts'
import { vaultApi } from '../lib/api.ts'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  entry: Entry
  onClose: () => void
  onEdit: () => void
  onDelete: (id: string) => void
}

export default function EntryDetail({ entry, onClose, onEdit, onDelete }: Props) {
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'username' | 'password' | null>(null)

  const handleCopy = async (field: 'username' | 'password') => {
    const value = field === 'username' ? entry.data?.username : entry.data?.password
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFavourite = async () => {
    await vaultApi.toggleFavourite(entry.id)
    queryClient.invalidateQueries({ queryKey: ['vault'] })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 50
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 51,
        width: '100%',
        maxWidth: 480,
        maxHeight: '85vh',
        overflowY: 'auto',
        background: 'var(--bg-modal)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.name}
            </h2>
            <button
              onClick={handleFavourite}
              title={entry.is_favourite ? 'Unpin' : 'Pin to top'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '0 0.25rem', flexShrink: 0, color: entry.is_favourite ? 'var(--accent-yellow-text)' : 'var(--text-muted)' }}
            >
              {entry.is_favourite ? '⭐' : '☆'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            {entry.data !== null && (
              <button
                onClick={onEdit}
                style={{ padding: '0.4rem 0.75rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category badge */}
        <span style={{
          display: 'inline-block', marginBottom: '1rem',
          padding: '0.2rem 0.75rem', borderRadius: 20,
          background: 'var(--accent-blue-bg)', color: 'var(--accent-blue-text)',
          fontSize: 13, fontWeight: 500
        }}>
          {entry.category}
        </span>

        {/* Content */}
        {entry.data === null ? (
          <div style={{ backgroundColor: 'var(--accent-red-bg)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
            <div style={{ color: 'var(--accent-red)', fontWeight: 600, marginBottom: '0.25rem' }}>⚠️ Decryption Failed</div>
            <div style={{ color: 'var(--accent-red)', fontSize: '0.9rem' }}>
              This entry was encrypted with a different master password and cannot be displayed.
              You can still delete it if you no longer need it.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {entry.data?.username && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Username</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{entry.data.username}</span>
                  <button
                    onClick={() => handleCopy('username')}
                    style={{
                      padding: '0.25rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)',
                      cursor: 'pointer', fontSize: 12, flexShrink: 0,
                      background: copied === 'username' ? 'var(--accent-green-bg)' : 'var(--bg-chip)',
                      color: copied === 'username' ? 'var(--accent-green)' : 'var(--text-secondary)'
                    }}
                  >
                    {copied === 'username' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {entry.data?.password && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Password</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontFamily: showPassword ? 'monospace' : 'inherit', fontWeight: 500, wordBreak: 'break-all' }}>
                    {showPassword ? entry.data.password : '••••••••••••'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', fontSize: 13, whiteSpace: 'nowrap' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleCopy('password')}
                      style={{
                        padding: '0.25rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)',
                        cursor: 'pointer', fontSize: 12,
                        background: copied === 'password' ? 'var(--accent-green-bg)' : 'var(--bg-chip)',
                        color: copied === 'password' ? 'var(--accent-green)' : 'var(--text-secondary)'
                      }}
                    >
                      {copied === 'password' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {entry.data?.url && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>URL</div>
                <a href={entry.data.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', wordBreak: 'break-all' }}>
                  {entry.data.url}
                </a>
              </div>
            )}

            {entry.data?.notes && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Notes</div>
                <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{entry.data.notes}</div>
              </div>
            )}

            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Added {new Date(entry.created_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(entry.id)}
          style={{ marginTop: '1.5rem', width: '100%', padding: '0.6rem', background: 'var(--accent-red-bg)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Delete Entry
        </button>
      </div>
    </>
  )
}