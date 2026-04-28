export type EntryData = {
  username?: string
  password?: string
  url?: string
  notes?: string
}

export type Entry = {
  id: string
  name: string
  category: string
  data: EntryData | null
  created_at: string
}

export type SortKey = 'name' | 'created_at'

export type FormState = {
  name: string
  category: string
  username: string
  password: string
  url: string
  notes: string
}

export const emptyForm: FormState = {
  name: '', category: 'login', username: '', password: '', url: '', notes: ''
}

export type GeneratorOptions = {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

export const defaultGeneratorOptions: GeneratorOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true
}

export function generatePassword(options: GeneratorOptions): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const nums = '0123456789'
  const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charset = ''
  if (options.uppercase) charset += upper
  if (options.lowercase) charset += lower
  if (options.numbers) charset += nums
  if (options.symbols) charset += syms
  if (!charset) charset = lower

  // guarantee at least one char from each selected set
  const required: string[] = []
  if (options.uppercase) required.push(upper[Math.floor(Math.random() * upper.length)])
  if (options.lowercase) required.push(lower[Math.floor(Math.random() * lower.length)])
  if (options.numbers) required.push(nums[Math.floor(Math.random() * nums.length)])
  if (options.symbols) required.push(syms[Math.floor(Math.random() * syms.length)])

  const rest = Array.from({ length: options.length - required.length }, () =>
    charset[Math.floor(Math.random() * charset.length)]
  )

  // shuffle required + rest together
  return [...required, ...rest]
    .sort(() => Math.random() - 0.5)
    .join('')
}

export function getPasswordStrength(password: string): { label: string; color: string; score: number } {
  if (!password) return { label: '', color: '#e5e7eb', score: 0 }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { label: 'Very Weak', color: '#dc2626', score }
  if (score === 2) return { label: 'Weak', color: '#f97316', score }
  if (score === 3) return { label: 'Fair', color: '#eab308', score }
  if (score === 4) return { label: 'Strong', color: '#22c55e', score }
  return { label: 'Very Strong', color: '#16a34a', score }
}