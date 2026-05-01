import { Hono } from "hono";
import { supabase } from "../lib/supabase.js";
import { z } from "zod";

const auth = new Hono()

const credSchema = z.object({
  email: z.email(),
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

  // We never store the master password — just confirm it was received
  // The client will use it to derive the encryption key locally
  return c.json({ userId: data.user.id })
})

// Login
auth.post('/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = body

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return c.json({ error: error.message }, 401)

  return c.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user.id
  })
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

export default auth