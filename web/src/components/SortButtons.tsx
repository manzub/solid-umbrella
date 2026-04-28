import type { SortKey } from '../types/vault.ts'

type Props = {
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onToggle: (key: SortKey) => void
}

export default function SortButtons({ sortKey, sortDir, onToggle }: Props) {
  const btn = (key: SortKey, label: string) => (
    <button
      key={key}
      onClick={() => onToggle(key)}
      style={{
        padding: '0.35rem 0.75rem', border: '1px solid var(--border)',
        borderRadius: 6, cursor: 'pointer', fontSize: 13,
        background: sortKey === key ? 'var(--accent-blue-bg)' : 'var(--bg-chip)',
        color: sortKey === key ? 'var(--accent-blue-text)' : 'var(--text-secondary)'
      }}
    >
      {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </button>
  )
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
      {btn('name', 'Name')}
      {btn('created_at', 'Date')}
    </div>
  )
}