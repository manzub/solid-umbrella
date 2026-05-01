import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { vaultApi, authApi } from '../lib/api.ts'
import type { Entry, SortKey, FormState } from '../types/vault.ts'
import { useAutoLock } from '../hooks/useAutoLock.ts'
import { emptyForm } from '../types/vault.ts'
import SearchBar from '../components/SearchBar.tsx'
import EntryCard from '../components/EntryCard.tsx'
import EntryDetail from '../components/EntryDetail.tsx'
import EntryForm from '../components/EntryForm.tsx'
import AutoLockWarning from '../components/AutoLockWarning.tsx'
import ExportVault from '../components/ExportVault.tsx'

export default function Vault() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showExport, setShowExport] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const { showWarning, secondsLeft, stayLoggedIn } = useAutoLock()

  // filters — all server-side now
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [date, setDate] = useState<Date | null>(null)
  const [page, setPage] = useState(1)

  const queryParams = {
    page,
    search: search || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    date: date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : undefined,
    sortKey,
    sortDir
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['vault', queryParams],
    queryFn: () => vaultApi.getAll(queryParams),
    placeholderData: (prev) => prev // keep showing old data while loading
  })

  const entries: Entry[] = data?.entries ?? []
  const total: number = data?.total ?? 0
  const hasMore: boolean = data?.hasMore ?? false
  const hasFilters = !!search || categoryFilter !== 'all' || !!date

  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setDate(null)
    setPage(1)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  // reset page when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleCategory = (v: string) => { setCategoryFilter(v); setPage(1) }
  const handleDate = (d: Date | null) => { setDate(d); setPage(1) }

  const openAdd = () => { setEditingEntry(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (entry: Entry) => {
    setEditingEntry(entry)
    setForm({ name: entry.name, category: entry.category, username: entry.data?.username || '', password: entry.data?.password || '', url: entry.data?.url || '', notes: entry.data?.notes || '' })
    setShowForm(true)
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vault'] })

  const createMutation = useMutation({
    mutationFn: () => vaultApi.create(form.name, form.category, { username: form.username, password: form.password, url: form.url, notes: form.notes }),
    onSuccess: () => { invalidate(); setShowForm(false) }
  })

  const updateMutation = useMutation({
    mutationFn: () => vaultApi.update(editingEntry!.id, form.name, form.category, { username: form.username, password: form.password, url: form.url, notes: form.notes }),
    onSuccess: () => { invalidate(); setShowForm(false); setSelectedEntry(null) }
  })

  const deleteMutation = useMutation({
    mutationFn: vaultApi.delete,
    onSuccess: () => { invalidate(); setSelectedEntry(null) }
  })

  const handleSubmit = () => editingEntry ? updateMutation.mutate() : createMutation.mutate()
  const isPending = createMutation.isPending || updateMutation.isPending

  if (error) return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'red' }}>Failed to load vault</div>

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', paddingTop: showWarning ? '6rem' : '2rem', transition: 'padding-top 0.3s' }}>

      {showWarning && (
        <AutoLockWarning
          secondsLeft={secondsLeft}
          onStayLoggedIn={stayLoggedIn}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>🔐 My Vault</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={openAdd} style={{ padding: '0.5rem 1rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            + Add Entry
          </button>
          <button onClick={() => setShowExport(true)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 14 }}>
            📦 Export
          </button>
          <button onClick={() => { authApi.logout(); navigate('/login') }} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
            Logout
          </button>
        </div>
      </div>

      <SearchBar
        search={search} onSearch={handleSearch}
        categoryFilter={categoryFilter} onCategory={handleCategory}
        date={date} onDate={handleDate}
        sortKey={sortKey} sortDir={sortDir} onToggleSort={toggleSort}
        resultCount={entries.length} total={total}
        showResults={hasFilters || total > 0}
        onClear={resetFilters}
      />

      {/* Loading indicator — subtle, doesn't blank the list */}
      {isLoading && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: '0.5rem' }}>
          Loading...
        </div>
      )}

      {/* Entry List */}
      {!isLoading && entries.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '4rem' }}>
          {hasFilters ? <p>No entries match your filters.</p> : <p>Your vault is empty.</p>}
          {!hasFilters && (
            <button onClick={openAdd} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Add your first entry
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entries.map((entry: Entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isSelected={selectedEntry?.id === entry.id}
                onClick={() => setSelectedEntry(entry)}
              />
            ))}
          </div>

          {/* Pagination */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 6, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          >
            ← Prev
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 6, cursor: !hasMore ? 'default' : 'pointer', opacity: !hasMore ? 0.4 : 1, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          >
            Next →
          </button>
        </>
      )}

      {/* Entry Detail */}
      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={() => openEdit(selectedEntry)}
          onDelete={deleteMutation.mutate}
        />
      )}

      {/* Entry Form */}
      {showForm && (
        <EntryForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          editingEntry={editingEntry}
          isPending={isPending}
        />
      )}

      {showExport && <ExportVault onClose={() => setShowExport(false)} />}
    </div>
  )
}