import { useState } from 'react'
import type { FormState, Entry } from '../types/vault.ts'
import PasswordStrength from './PasswordStrength.tsx'
import PasswordGenerator from './PasswordGenerator.tsx'
import ImageUploader from './ImageUploader.tsx'

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem', marginTop: '0.25rem',
    borderRadius: 6, border: '1px solid var(--border)',
    fontSize: 15, background: 'var(--bg-input)', color: 'var(--text-primary)'
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ background: 'var(--bg-modal)', padding: '2rem', borderRadius: 12, width: '100%', maxWidth: 450, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{editingEntry ? 'Edit Entry' : 'New Entry'}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-primary)' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)' }}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="e.g. Gmail" />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }}>Category</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => onChange({ ...form, category: cat })}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: 20,
                      border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
                      background: form.category === cat ? 'var(--accent-blue)' : 'var(--bg-chip)',
                      color: form.category === cat ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }}>Username / Email</label>
              <input style={inputStyle} value={form.username} onChange={e => onChange({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span>Password</span>
                <button
                  onClick={() => setShowGenerator(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: 13, padding: 0 }}
                >
                  🎲 Generate
                </button>
              </label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => onChange({ ...form, password: e.target.value })} />
              <PasswordStrength password={form.password} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }}>URL</label>
              <input style={inputStyle} value={form.url} onChange={e => onChange({ ...form, url: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }}>Notes</label>
              <textarea style={{ ...inputStyle, height: 80 }} value={form.notes} onChange={e => onChange({ ...form, notes: e.target.value })} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }}>Images</label>
              <div style={{ marginTop: '0.25rem' }}>
                <ImageUploader
                  images={form.images}
                  onChange={imgs => onChange({ ...form, images: imgs })}
                />
              </div>
            </div>
            <button
              onClick={onSubmit}
              disabled={!form.name || isPending}
              style={{ padding: '0.75rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: !form.name || isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Saving...' : editingEntry ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
      {showGenerator && (
        <PasswordGenerator
          onUse={password => onChange({ ...form, password })}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </>
  )
}