import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const PEPPER = process.env.MASTER_ENCRYPTION_PEPPER!

// Derives a consistent encryption key from the user's master password
export function deriveKey(masterPassword: string, userId: string): Buffer {
  return crypto.pbkdf2Sync(
    masterPassword + PEPPER,
    userId, // salt = userId so each user's key is unique
    200_000,
    32,
    'sha256'
  )
}

export function generateRecoveryCode(): string {
  // generates a code like: XXXX-XXXX-XXXX-XXXX-XXXX
  const segments = Array.from({ length: 5 }, () =>
    crypto.randomBytes(2).toString('hex').toUpperCase()
  )
  return segments.join('-')
}

export function hashRecoveryCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace(/-/g, '').toUpperCase())
    .digest('hex')
}

export function encrypt(plaintext: string, key: Buffer): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString('base64'),
    iv: iv.toString('base64')
  }
}

export function decrypt(encryptedData: string, iv: string, key: Buffer): string {
  const data = Buffer.from(encryptedData, 'base64')
  const ivBuffer = Buffer.from(iv, 'base64')
  const tag = data.subarray(data.length - 16)
  const encrypted = data.subarray(0, data.length - 16)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}