import dotenv from 'dotenv'
dotenv.config()

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth.js'
import vaultRoutes from './routes/vault.js'
import imageRoutes from './routes/images.js'


const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://solid-umbrella.vercel.app'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Master-Password']
}))

app.get('/', (c) => c.json({ status: 'ok' }))
app.route('/auth', authRoutes)
app.route('/vault', vaultRoutes)
app.route('/images', imageRoutes)

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})