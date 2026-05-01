import { useState } from 'react'
import { vaultApi } from '../lib/api.ts'

type Props = {
  onClose: () => void
}

type ExportState = 'idle' | 'loading' | 'done' | 'error'

export default function ExportVault({ onClose }: Props) {
  const [state, setState] = useState<ExportState>('idle')
  const [entryCount, setEntryCount] = useState(0)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setState('loading')
    setError('')
    try {
      const data = await vaultApi.export()
      setEntryCount(data.entry_count)

      // Build the export file
      const exportData = JSON.stringify(data, null, 2)
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      // Trigger download
      const date = new Date().toISOString().split('T')[0]
      const a = document.createElement('a')
      a.href = url
      a.download = `vault-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setState('done')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || 'Export failed')
      setState('error')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'var(--bg-modal)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 440 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📦 Export Vault</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-primary)' }}>✕</button>
        </div>

        {state === 'idle' && (
          <>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>What gets exported:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                <li>All vault entries including usernames, passwords, URLs and notes</li>
                <li>The file is <strong>encrypted with your master password</strong></li>
                <li>It cannot be read without your master password</li>
                <li>Store it somewhere safe — external drive, cloud storage, etc.</li>
              </ul>
            </div>

            <div style={{ background: 'var(--accent-yellow-bg)', border: '1px solid var(--accent-yellow-text)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: 13, color: 'var(--accent-yellow-text)' }}>
              ⚠️ Keep this file private. Anyone with the file <strong>and</strong> your master password can read all your passwords.
            </div>

            <button
              onClick={handleExport}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
            >
              Download Encrypted Backup
            </button>
          </>
        )}

        {state === 'loading' && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>⏳</div>
            <p>Encrypting your vault...</p>
          </div>
        )}

        {state === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: 48, marginBottom: '0.75rem' }}>✅</div>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>Export complete</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: '1.5rem' }}>
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'} exported successfully.
              Your backup file has been downloaded.
            </p>
            <div style={{ background: 'var(--accent-yellow-bg)', borderRadius: 8, padding: '0.75rem', marginBottom: '1.5rem', fontSize: 13, color: 'var(--accent-yellow-text)' }}>
              Store this file somewhere safe and keep it private.
            </div>
            <button
              onClick={onClose}
              style={{ padding: '0.75rem 2rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >
              Done
            </button>
          </div>
        )}

        {state === 'error' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: 48, marginBottom: '0.75rem' }}>❌</div>
            <p style={{ color: 'var(--accent-red)', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => setState('idle')}
              style={{ padding: '0.75rem 2rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}