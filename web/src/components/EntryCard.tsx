import { useState } from 'react'
import type { Entry } from '../types/vault.ts'
import { vaultApi } from '../lib/api.ts'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  entry: Entry
  isSelected: boolean
  onClick: () => void
}

export default function EntryCard({ entry, isSelected, onClick }: Props) {
  const queryClient = useQueryClient()
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null)

  const handleCopy = async (e: React.MouseEvent, field: 'username' | 'password') => {
    e.stopPropagation() // prevent opening the detail panel
    const value = field === 'username' ? entry.data?.username : entry.data?.password
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleFavourite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await vaultApi.toggleFavourite(entry.id)
    queryClient.invalidateQueries({ queryKey: ['vault'] })
  }

  const btnStyle = (active = false): React.CSSProperties => ({
    padding: '0.25rem 0.6rem',
    borderRadius: 6,
    border: '1px solid var(--border)',
    cursor: 'pointer',
    fontSize: 12,
    background: active ? 'var(--accent-green-bg)' : 'var(--bg-chip)',
    color: active ? 'var(--accent-green)' : 'var(--text-secondary)',
    whiteSpace: 'nowrap'
  })

  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.85rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        cursor: 'pointer',
        background: isSelected ? 'var(--accent-blue-bg)' : 'var(--bg-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      {/* Left — name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {entry.is_favourite && <span style={{ fontSize: 14 }}>⭐</span>}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.name}
          </span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.category}
          {entry.data?.username ? ` · ${entry.data.username}` : ''}
          {` · ${new Date(entry.created_at).toLocaleDateString()}`}
        </div>
      </div>

      {/* Right — action buttons */}
      <div
        style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Copy username */}
        {entry.data?.username && (
          <button
            onClick={e => handleCopy(e, 'username')}
            style={btnStyle(copiedField === 'username')}
            title="Copy username"
          >
            {copiedField === 'username' ? '✓ Copied' : '👤 Copy'}
          </button>
        )}

        {/* Copy password */}
        {entry.data?.password && (
          <button
            onClick={e => handleCopy(e, 'password')}
            style={btnStyle(copiedField === 'password')}
            title="Copy password"
          >
            {copiedField === 'password' ? '✓ Copied' : '🔑 Copy'}
          </button>
        )}

        {/* Favourite toggle */}
        <button
          onClick={handleFavourite}
          title={entry.is_favourite ? 'Unpin' : 'Pin to top'}
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: 6,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            fontSize: 14,
            background: entry.is_favourite ? 'var(--accent-yellow-bg)' : 'var(--bg-chip)',
            color: entry.is_favourite ? 'var(--accent-yellow-text)' : 'var(--text-muted)',
          }}
        >
          {entry.is_favourite ? '⭐' : '☆'}
        </button>

        {entry.data === null && <span title="Decryption failed">⚠️</span>}
      </div>
    </div>
  )
}