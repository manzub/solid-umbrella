import { useState } from 'react'
import type { FormState, Entry } from '../types/vault.ts'  // ← update import
import PasswordStrength from './PasswordStrength.tsx'
import PasswordGenerator from './PasswordGenerator.tsx'  // ← add

type Props = {
  form: FormState
  onChange: (form: FormState) => void
  onSubmit: () => void
  onClose: () => void
  editingEntry: Entry | null
  isPending: boolean
}

const CATEGORIES = ['login', 'card', 'note', 'other']

export default function EntryForm({ form, onChange, onSubmit, onClose, editingEntry, isPending }: Props) {
  const [showGenerator, setShowGenerator] = useState(false)

  const inputStyle = {
    width: '100%', padding: '0.5rem', marginTop: '0.25rem',
    boxSizing: 'border-box' as const, borderRadius: 6,
    border: '1px solid #e5e7eb', fontSize: 15
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: 12, width: '100%', maxWidth: 450, maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>{editingEntry ? 'Edit Entry' : 'New Entry'}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="e.g. Gmail" />
            </div>
            <div>
              <label>Category</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => onChange({ ...form, category: cat })}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: 20, border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 13,
                      background: form.category === cat ? '#2563eb' : 'white',
                      color: form.category === cat ? 'white' : '#555'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label>Username / Email</label>
              <input style={inputStyle} value={form.username} onChange={e => onChange({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Password</span>
                <button
                  onClick={() => setShowGenerator(true)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 }}
                >
                  🎲 Generate
                </button>
              </label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => onChange({ ...form, password: e.target.value })} />
              <PasswordStrength password={form.password} />
            </div>
            <div>
              <label>URL</label>
              <input style={inputStyle} value={form.url} onChange={e => onChange({ ...form, url: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label>Notes</label>
              <textarea style={{ ...inputStyle, height: 80 }} value={form.notes} onChange={e => onChange({ ...form, notes: e.target.value })} />
            </div>
            <button
              onClick={onSubmit}
              disabled={!form.name || isPending}
              style={{ padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: !form.name || isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving...' : editingEntry ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>

      {/* Password Generator Modal */}
      {showGenerator && (
        <PasswordGenerator
          onUse={password => onChange({ ...form, password })}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </>
  )
}