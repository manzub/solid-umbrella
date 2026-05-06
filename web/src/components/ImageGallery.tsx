import { useState, useEffect } from 'react'
import { imageApi } from '../lib/api.ts'

type Props = {
  paths: string[]
}

export default function ImageGallery({ paths }: Props) {
  const [urls, setUrls] = useState<string[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    Promise.all(paths.map(p => imageApi.getSignedUrl(p)))
      .then(setUrls)
      .catch(() => {})
  }, [paths])

  if (urls.length === 0) return null

  return (
    <>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          Attachments ({paths.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {urls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`attachment ${i + 1}`}
              onClick={() => setLightbox(url)}
              style={{
                width: 80, height: 80, objectFit: 'cover',
                borderRadius: 6, border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightbox}
            alt="full size"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', fontSize: 24, cursor: 'pointer',
              borderRadius: '50%', width: 40, height: 40
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}