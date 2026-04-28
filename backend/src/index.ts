import dotenv from 'dotenv'
dotenv.config()

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth.js'
import vaultRoutes from './routes/vault.js'


const app = new Hono()

app.use('*', cors())

app.get('/', (c) => c.json({ status: 'ok' }))
app.route('/auth', authRoutes)
app.route('/vault', vaultRoutes)    

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})