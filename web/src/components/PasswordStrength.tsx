import { getPasswordStrength } from '../types/vault.ts'

type Props = {
  password: string
}

export default function PasswordStrength({ password }: Props) {
  if (!password) return null
  const strength = getPasswordStrength(password)
  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= strength.score ? strength.color : '#e5e7eb',
              transition: 'background 0.2s'
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.8rem', color: strength.color, fontWeight: 600 }}>
        {strength.label}
      </span>
    </div>
  )
}