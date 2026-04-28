import type { Entry } from '../types/vault.ts'

type Props = {
  entry: Entry
  isSelected: boolean
  onClick: () => void
}

export default function EntryCard({ entry, isSelected, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        cursor: 'pointer',
        background: isSelected ? 'var(--accent-blue-bg)' : 'var(--bg-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.name}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {entry.category}
          {entry.data?.username ? ` · ${entry.data.username}` : ''}
          {` · ${new Date(entry.created_at).toLocaleDateString()}`}
        </div>
      </div>
      {entry.data === null && <span title="Decryption failed">⚠️</span>}
    </div>
  )
}