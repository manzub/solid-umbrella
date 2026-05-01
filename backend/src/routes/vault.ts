import { Hono } from "hono";
import { supabase } from '../lib/supabase.js'
import { deriveKey, encrypt, decrypt } from '../crypto/vault.js'
import { z } from 'zod'

type Variables = {
  userId: string
}

const vault = new Hono<{ Variables: Variables }>()

// Middleware — verify the JWT token on every vault request
vault.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'No token provided' }, 401)

  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return c.json({ error: 'Invalid token' }, 401)

  c.set('userId', data.user.id)
  await next()
})

const entrySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  masterPassword: z.string().min(8),
  data: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    url: z.string().optional(),
    notes: z.string().optional()
  })
})


// GET all entries (decrypted)
vault.get('/', async (c) => {
  const userId = c.get('userId')
  const masterPassword = c.req.header('X-Master-Password')
  if (!masterPassword) return c.json({ error: 'Master password required' }, 400)

  // pagination + filter params
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const category = c.req.query('category')
  const date = c.req.query('date')         // ISO date string e.g. "2026-04-20"
  const search = c.req.query('search')
  const sortKey = c.req.query('sortKey') || 'created_at'
  const sortDir = c.req.query('sortDir') || 'desc'
  const offset = (page - 1) * limit

  let query = supabase
    .from('vault_entries')
    .select('id, name, category, encrypted, iv, created_at, is_favourite', { count: 'exact' })
    .eq('user_id', userId)
    .order('is_favourite', { ascending: false })
    .order(sortKey, { ascending: sortDir === 'asc' })
    .range(offset, offset + limit - 1)

  if (category && category !== 'all') query = query.eq('category', category)

  if (date) {
    // Parse the date string as local midnight in UTC to avoid timezone shift
    const [year, month, day] = date.split('-').map(Number)
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
  }

  const { data, error, count } = await query
  if (error) return c.json({ error: error.message }, 500)

  const key = deriveKey(masterPassword, userId)
  const decrypted = (data ?? []).map((entry) => {
    // name search is done after decryption since name is stored plaintext
    try {
      const plaintext = decrypt(entry.encrypted, entry.iv, key)
      return {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        created_at: entry.created_at,
        is_favourite: entry.is_favourite,
        data: JSON.parse(plaintext)
      }
    } catch {
      return {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        created_at: entry.created_at,
        is_favourite: entry.is_favourite,
        data: null
      }
    }
  }).filter(entry => !search || entry.name.toLowerCase().includes(search.toLowerCase()))

  return c.json({
    entries: decrypted,
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0)
  })
})


// POST a new entry
vault.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const parsed = entrySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)

  const { name, category, masterPassword, data } = parsed.data
  const key = deriveKey(masterPassword, userId)
  const { encrypted, iv } = encrypt(JSON.stringify(data), key)

  const { error } = await supabase.from('vault_entries').insert({
    user_id: userId,
    name,
    category,
    encrypted,
    iv
  })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true }, 201)
})


// DELETE an entry
vault.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const { error } = await supabase
    .from('vault_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// UPDATE an entry
vault.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = await c.req.json()

  const parsed = entrySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid input' }, 400)

  const { name, category, masterPassword, data } = parsed.data
  const key = deriveKey(masterPassword, userId)
  const { encrypted, iv } = encrypt(JSON.stringify(data), key)

  const { error } = await supabase
    .from('vault_entries')
    .update({ name, category, encrypted, iv, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// TOGGLE favourite
vault.patch('/:id/favourite', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  // get current value first
  const { data, error: fetchError } = await supabase
    .from('vault_entries')
    .select('is_favourite')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (fetchError || !data) return c.json({ error: 'Entry not found' }, 404)

  const { error } = await supabase
    .from('vault_entries')
    .update({ is_favourite: !data.is_favourite })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ is_favourite: !data.is_favourite })
})

// EXPORT vault — returns all entries as encrypted JSON
vault.get('/export', async (c) => {
  const userId = c.get('userId')
  const masterPassword = c.req.header('X-Master-Password')
  if (!masterPassword) return c.json({ error: 'Master password required' }, 400)

  const { data, error } = await supabase
    .from('vault_entries')
    .select('id, name, category, encrypted, iv, created_at, is_favourite')
    .eq('user_id', userId)

  if (error) return c.json({ error: error.message }, 500)

  const key = deriveKey(masterPassword, userId)

  const decrypted = data.map((entry) => {
    try {
      const plaintext = decrypt(entry.encrypted, entry.iv, key)
      return {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        created_at: entry.created_at,
        is_favourite: entry.is_favourite,
        data: JSON.parse(plaintext)
      }
    } catch {
      return {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        created_at: entry.created_at,
        is_favourite: entry.is_favourite,
        data: null
      }
    }
  })

  // Re-encrypt the entire export with the master password
  // so the file is useless without it
  const exportPayload = JSON.stringify({
    version: 1,
    exported_at: new Date().toISOString(),
    entry_count: decrypted.length,
    entries: decrypted
  })

  const { encrypted, iv } = encrypt(exportPayload, key)

  return c.json({
    version: 1,
    exported_at: new Date().toISOString(),
    entry_count: decrypted.length,
    encrypted,
    iv
  })
})

export default vault