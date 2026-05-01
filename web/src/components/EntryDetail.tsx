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
    <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{entry.name}</h2>
          <button
            onClick={handleFavourite}
            title={entry.is_favourite ? 'Unpin' : 'Pin to top'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, padding: '0 0.25rem',
              color: entry.is_favourite ? 'var(--accent-yellow-text)' : 'var(--text-muted)'
            }}
          >
            {entry.is_favourite ? '⭐' : '☆'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

      <div style={{ marginTop: '1rem' }}>
        {entry.data === null ? (
          <div style={{ backgroundColor: 'var(--accent-red-bg)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
            <div style={{ color: 'var(--accent-red)', fontWeight: 600, marginBottom: '0.25rem' }}>⚠️ Decryption Failed</div>
            <div style={{ color: 'var(--accent-red)', fontSize: '0.9rem' }}>
              This entry was encrypted with a different master password and cannot be displayed.
              You can still delete it if you no longer need it.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {entry.data?.username && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Username</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{entry.data.username}</span>
                  <button
                    onClick={() => handleCopy('username')}
                    style={{
                      padding: '0.25rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)',
                      cursor: 'pointer', fontSize: 12,
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
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Password</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontFamily: showPassword ? 'monospace' : 'inherit' }}>
                    {showPassword ? entry.data.password : '••••••••'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', fontSize: 13 }}
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
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>URL</span>
                <div><a href={entry.data.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>{entry.data.url}</a></div>
              </div>
            )}

            {entry.data?.notes && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Notes</span>
                <div style={{ color: 'var(--text-primary)' }}>{entry.data.notes}</div>
              </div>
            )}

            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Added {new Date(entry.created_at).toLocaleString()}
            </div>
          </div>
        )}

        <button
          onClick={() => onDelete(entry.id)}
          style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Delete Entry
        </button>
      </div>
    </div>
  )
}