import { useState, useRef } from 'react'
import { imageApi } from '../lib/api.ts'

type Props = {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const path = await imageApi.upload(file)
      onChange([...images, path])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async (path: string) => {
    try {
      await imageApi.delete(path)
      onChange(images.filter(p => p !== path))
    } catch {
      // still remove from list even if delete fails
      onChange(images.filter(p => p !== path))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: images.length > 0 ? '0.5rem' : 0 }}>
        {images.map(path => (
          <ImageThumbnail key={path} path={path} onRemove={() => handleRemove(path)} />
        ))}
      </div>

      {error && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: '0.5rem' }}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: '0.4rem 0.75rem', border: '1px dashed var(--border)',
          borderRadius: 6, cursor: uploading ? 'not-allowed' : 'pointer',
          background: 'var(--bg-chip)', color: 'var(--text-secondary)',
          fontSize: 13, opacity: uploading ? 0.6 : 1
        }}
      >
        {uploading ? '⏳ Uploading...' : '📎 Attach image'}
      </button>
      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: '0.5rem' }}>
        JPEG, PNG, GIF or WebP — max 5MB
      </span>
    </div>
  )
}

function ImageThumbnail({ path, onRemove }: { path: string; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useState(() => {
    imageApi.getSignedUrl(path).then(u => { setUrl(u); setLoading(false) }).catch(() => setLoading(false))
  })

  if (loading) return (
    <div style={{ width: 80, height: 80, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
      ⏳
    </div>
  )

  if (!url) return null

  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <img
        src={url}
        alt="attachment"
        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
      />
      <button
        onClick={onRemove}
        style={{
          position: 'absolute', top: -6, right: -6,
          background: 'var(--accent-red)', color: 'white',
          border: 'none', borderRadius: '50%',
          width: 20, height: 20, cursor: 'pointer',
          fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1
        }}
      >
        ✕
      </button>
    </div>
  )
}