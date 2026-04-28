import type { SortKey } from '../types/vault.ts'

type Props = {
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onToggle: (key: SortKey) => void
}

export default function SortButtons({ sortKey, sortDir, onToggle }: Props) {
  const btn = (key: SortKey, label: string) => (
    <button
      onClick={() => onToggle(key)}
      style={{
        padding: '0.35rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13,
        background: sortKey === key ? '#eff6ff' : 'white',
        color: sortKey === key ? '#2563eb' : '#555'
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