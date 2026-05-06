import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

type Variables = { userId: string }
const images = new Hono<{ Variables: Variables }>()

// Auth middleware
images.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'No token provided' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return c.json({ error: 'Invalid token' }, 401)
  c.set('userId', data.user.id)
  await next()
})

// Upload image
images.post('/upload', async (c) => {
  const userId = c.get('userId')

  const formData = await c.req.formData()
  const file = formData.get('image') as File | null

  if (!file) return c.json({ error: 'No image provided' }, 400)

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Only JPEG, PNG, GIF and WebP images are allowed' }, 400)
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'Image must be under 5MB' }, 400)
  }

  const ext = file.name.split('.').pop()
  const filename = `${userId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from('vault-images')
    .upload(filename, buffer, { contentType: file.type })

  if (error) return c.json({ error: error.message }, 500)

  return c.json({ path: filename })
})

// Get signed URL for an image
images.get('/signed-url', async (c) => {
  const userId = c.get('userId')
  const path = c.req.query('path')

  if (!path) return c.json({ error: 'No path provided' }, 400)

  // Ensure user can only access their own images
  if (!path.startsWith(`${userId}/`)) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  const { data, error } = await supabase.storage
    .from('vault-images')
    .createSignedUrl(path, 60 * 60) // 1 hour expiry

  if (error) return c.json({ error: error.message }, 500)

  return c.json({ url: data.signedUrl })
})

// Delete image
images.delete('/delete', async (c) => {
  const userId = c.get('userId')
  const path = c.req.query('path')

  if (!path) return c.json({ error: 'No path provided' }, 400)

  if (!path.startsWith(`${userId}/`)) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  const { error } = await supabase.storage
    .from('vault-images')
    .remove([path])

  if (error) return c.json({ error: error.message }, 500)

  return c.json({ success: true })
})

export default images