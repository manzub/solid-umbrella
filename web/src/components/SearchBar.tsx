import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import type { SortKey } from '../types/vault.ts'
import SortButtons from './SortButtons.tsx'

type Props = {
  search: string
  onSearch: (v: string) => void
  categoryFilter: string
  onCategory: (v: string) => void
  date: Date | null
  onDate: (d: Date | null) => void
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onToggleSort: (key: SortKey) => void
  resultCount: number
  total: number
  showResults: boolean
  onClear: () => void
}

const CATEGORIES = ['all', 'login', 'card', 'note', 'other']

export default function SearchBar({ search, onSearch, categoryFilter, onCategory, date, onDate, sortKey, sortDir, onToggleSort, resultCount, total, showResults, onClear }: Props) {
  const chipStyle = (active: boolean, activeColor = 'var(--accent-blue)'): React.CSSProperties => ({
    padding: '0.35rem 0.75rem', borderRadius: 20,
    border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
    background: active ? activeColor : 'var(--bg-chip)',
    color: active ? 'white' : 'var(--text-secondary)'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        placeholder="🔍 Search by name..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: 15, background: 'var(--bg-input)', color: 'var(--text-primary)' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => onCategory(cat)} style={chipStyle(categoryFilter === cat)}>
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <DatePicker
          selected={date}
          onChange={onDate}
          placeholderText="📅 Pick a date..."
          dateFormat="dd MMM yyyy"
          isClearable
          customInput={
            <button style={chipStyle(!!date, 'var(--accent-purple)')}>
              {date ? `📅 ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : '📅 Pick a date'}
            </button>
          }
        />
        <SortButtons sortKey={sortKey} sortDir={sortDir} onToggle={onToggleSort} />
      </div>
      {showResults && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Showing {resultCount} of {total} entries
          </span>
          <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: 13 }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}