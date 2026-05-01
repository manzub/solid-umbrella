type Props = {
  secondsLeft: number
  onStayLoggedIn: () => void
}

export default function AutoLockWarning({ secondsLeft, onStayLoggedIn }: Props) {
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeStr = minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')}`
    : `${seconds}s`

  const urgency = secondsLeft <= 30

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      backgroundColor: urgency ? 'var(--accent-red)' : '#d97706',
      color: 'white',
      padding: '0.75rem 1.5rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      transition: 'background-color 0.3s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: 20 }}>⏱️</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            Your vault will lock in {timeStr}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Move your mouse or click "Stay logged in" to continue
          </div>
        </div>
      </div>
      <button
        onClick={onStayLoggedIn}
        style={{
          padding: '0.5rem 1.25rem', borderRadius: 8,
          border: '2px solid white', background: 'transparent',
          color: 'white', cursor: 'pointer', fontWeight: 600,
          fontSize: 14, whiteSpace: 'nowrap'
        }}
      >
        Stay logged in
      </button>
    </div>
  )
}