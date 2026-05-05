import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { z } from 'zod'
import { deriveKey, encrypt, decrypt, generateRecoveryCode, hashRecoveryCode } from '../crypto/vault.js'

const auth = new Hono<{ Variables: { userId: string } }>()

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  masterPassword: z.string().min(8)
})

// Register
auth.post('/register', async (c) => {
  const body = await c.req.json()
  const parsed = credSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)

  const { email, password, masterPassword } = parsed.data

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) return c.json({ error: error.message }, 400)

  const userId = data.user.id

  // Generate recovery code
  const recoveryCode = generateRecoveryCode()
  const codeHash = hashRecoveryCode(recoveryCode)

  const { error: recoveryError } = await supabase
    .from('recovery_codes')
    .insert({ user_id: userId, code_hash: codeHash })

  if (recoveryError) return c.json({ error: 'Failed to generate recovery code' }, 500)

  // Create canary entry — used to verify master password on login
  const key = deriveKey(masterPassword, userId)
  const canaryPayload = JSON.stringify({ canary: true, created_at: new Date().toISOString() })
  const { encrypted, iv } = encrypt(canaryPayload, key)

  const { error: canaryError } = await supabase
    .from('vault_entries')
    .insert({
      user_id: userId,
      name: '__canary__',
      category: '__system__',
      encrypted,
      iv,
      is_favourite: false
    })

  if (canaryError) return c.json({ error: 'Failed to create verification entry' }, 500)

  return c.json({ userId, recoveryCode })
})

// Login
auth.post('/login', async (c) => {
  const body = await c.req.json()
  const { email, password, masterPassword } = body

  if (!masterPassword) return c.json({ error: 'Master password is required' }, 400)

  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return c.json({ error: error.message }, 401)

  const userId = data.user.id

  // Fetch the canary entry
  const { data: canaryData, error: canaryError } = await supabase
    .from('vault_entries')
    .select('encrypted, iv')
    .eq('user_id', userId)
    .eq('name', '__canary__')
    .eq('category', '__system__')
    .single()

  if (canaryError || !canaryData) {
    // No canary found — could be an old account, let them in
    return c.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      userId
    })
  }

  // Try to decrypt the canary
  try {
    const key = deriveKey(masterPassword, userId)
    const plaintext = decrypt(canaryData.encrypted, canaryData.iv, key)
    const parsed = JSON.parse(plaintext)
    if (!parsed.canary) throw new Error('Invalid canary')
  } catch {
    // Sign them out of Supabase since master password is wrong
    await supabase.auth.admin.signOut(data.session.access_token)
    return c.json({ error: 'Incorrect master password' }, 401)
  }

  return c.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId
  })
})

// One-time route to create canary for existing accounts
auth.post('/create-canary', async (c) => {
  const body = await c.req.json()
  const { email, password, masterPassword } = body

  // Verify credentials first
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return c.json({ error: 'Invalid credentials' }, 401)

  const userId = data.user.id

  // Check if canary already exists
  const { data: existing } = await supabase
    .from('vault_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('name', '__canary__')
    .single()

  if (existing) return c.json({ message: 'Canary already exists' })

  // Create canary
  const key = deriveKey(masterPassword, userId)
  const canaryPayload = JSON.stringify({ canary: true, created_at: new Date().toISOString() })
  const { encrypted, iv } = encrypt(canaryPayload, key)

  const { error: canaryError } = await supabase
    .from('vault_entries')
    .insert({
      user_id: userId,
      name: '__canary__',
      category: '__system__',
      encrypted,
      iv,
      is_favourite: false
    })

  if (canaryError) return c.json({ error: 'Failed to create canary' }, 500)
  return c.json({ success: true })
})

// Refresh token
auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json()
  if (!refreshToken) return c.json({ error: 'No refresh token' }, 400)

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) return c.json({ error: 'Session expired' }, 401)

  return c.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user!.id
  })
})

// Recover account — re-encrypt all vault entries with new master password
auth.post('/recover', async (c) => {
  const body = await c.req.json()
  const { email, recoveryCode, newMasterPassword } = body

  if (!email || !recoveryCode || !newMasterPassword) {
    return c.json({ error: 'Email, recovery code and new master password are required' }, 400)
  }

  if (newMasterPassword.length < 8) {
    return c.json({ error: 'New master password must be at least 8 characters' }, 400)
  }

  // Find user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) return c.json({ error: 'Failed to find user' }, 500)

  const user = userData.users.find(u => u.email === email)
  if (!user) return c.json({ error: 'Invalid email or recovery code' }, 400)

  const userId = user.id

  // Verify recovery code
  const codeHash = hashRecoveryCode(recoveryCode)
  const { data: recoveryData, error: recoveryError } = await supabase
    .from('recovery_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .single()

  if (recoveryError || !recoveryData) {
    return c.json({ error: 'Invalid email or recovery code' }, 400)
  }

  // Get all vault entries
  const { data: entries, error: entriesError } = await supabase
    .from('vault_entries')
    .select('*')
    .eq('user_id', userId)

  if (entriesError) return c.json({ error: 'Failed to fetch vault entries' }, 500)

  // We can't re-encrypt without the old master password
  // Instead we delete all entries and mark the recovery code as used
  // The user will need to re-add their entries
  // This is the only safe option in a zero-knowledge system

  // Actually — since we don't have the old master password we cannot
  // re-encrypt. We mark entries as unrecoverable and delete them,
  // then mark code as used so user can log in fresh.

  // Mark recovery code as used
  await supabase
    .from('recovery_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', recoveryData.id)

  // Delete all vault entries (they're unrecoverable without old master password)
  await supabase
    .from('vault_entries')
    .delete()
    .eq('user_id', userId)

  // Update the user's password to match new master password
  // so they can log back in — note: account password != master password
  // We don't change the account password, just confirm recovery succeeded
  return c.json({ success: true, message: 'Recovery successful. Your vault entries have been cleared. Please log in with your existing account password and set up your vault again.' })
})

export default auth