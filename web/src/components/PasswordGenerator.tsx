import { useState } from 'react'
import type { GeneratorOptions } from '../types/vault.ts'
import { defaultGeneratorOptions, generatePassword } from '../types/vault.ts'
import PasswordStrength from './PasswordStrength.tsx'

type Props = {
  onUse?: (password: string) => void
  onClose: () => void
}

export default function PasswordGenerator({ onUse, onClose }: Props) {
  const [options, setOptions] = useState<GeneratorOptions>(defaultGeneratorOptions)
  const [password, setPassword] = useState(() => generatePassword(defaultGeneratorOptions))
  const [copied, setCopied] = useState(false)

  const regenerate = (newOptions = options) => {
    setPassword(generatePassword(newOptions))
    setCopied(false)
  }

  const updateOption = <K extends keyof GeneratorOptions>(key: K, value: GeneratorOptions[K]) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    regenerate(newOptions)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggle = (key: keyof GeneratorOptions, label: string) => {
    const activeCount = [options.uppercase, options.lowercase, options.numbers, options.symbols].filter(Boolean).length
    const isActive = options[key] as boolean
    if (isActive && activeCount === 1) return // prevent all off
    return (
      <button
        key={key}
        onClick={() => updateOption(key, !isActive)}
        style={{
          padding: '0.4rem 0.85rem', borderRadius: 20, border: '1px solid #e5e7eb',
          cursor: 'pointer', fontSize: 13,
          background: isActive ? '#2563eb' : 'white',
          color: isActive ? 'white' : '#555'
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: 12, width: '100%', maxWidth: 440 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>🎲 Password Generator</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Generated password display */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', fontFamily: 'monospace', fontSize: 16, wordBreak: 'break-all', letterSpacing: 1 }}>
          {password}
        </div>

        <PasswordStrength password={password} />

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={handleCopy}
            style={{ flex: 1, padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: copied ? '#dcfce7' : 'white', color: copied ? '#16a34a' : '#333', fontWeight: 600 }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => regenerate()}
            style={{ flex: 1, padding: '0.6rem', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600 }}
          >
            🔄 Regenerate
          </button>
          {onUse && (
            <button
              onClick={() => { onUse(password); onClose() }}
              style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: 8, cursor: 'pointer', background: '#2563eb', color: 'white', fontWeight: 600 }}
            >
              Use This
            </button>
          )}
        </div>

        {/* Length slider */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: 14 }}>Length</label>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>{options.length}</span>
          </div>
          <input
            type="range" min={8} max={64}
            value={options.length}
            onChange={e => updateOption('length', Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa' }}>
            <span>8</span><span>64</span>
          </div>
        </div>

        {/* Character type toggles */}
        <div>
          <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: '0.5rem' }}>Include</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {toggle('uppercase', 'A–Z')}
            {toggle('lowercase', 'a–z')}
            {toggle('numbers', '0–9')}
            {toggle('symbols', '!@#...')}
          </div>
        </div>

      </div>
    </div>
  )
}