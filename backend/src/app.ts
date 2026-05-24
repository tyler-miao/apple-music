import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import config from './config'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import musicRoutes from './routes/music'
import lyricsRoutes from './routes/lyrics'
import uploadRoutes from './routes/upload'
import playlistRoutes from './routes/playlist'
import adminRoutes from './routes/admin'
import proxyRoutes from './routes/proxy'
import { WSManager } from './websocket'

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true })
}

app.use('/uploads', express.static(config.uploadDir))

app.use('/api/auth', authRoutes)
app.use('/api/music', musicRoutes)
app.use('/api/lyrics', lyricsRoutes)
app.use('/api/upload', uploadRoutes)

// CORS proxy routes (moved from Next.js API routes)
app.get('/api/cover', async (req, res) => {
  const url = req.query.url as string
  if (!url) return res.status(400).json({ error: 'Missing url' })
  try {
    const response = await fetch(url)
    if (!response.ok) return res.status(502).json({ error: 'Failed to fetch image' })
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=604800', 'Access-Control-Allow-Origin': '*' })
    res.send(Buffer.from(buffer))
  } catch { res.status(502).json({ error: 'Proxy failed' }) }
})

app.get('/api/audio', async (req, res) => {
  const url = req.query.url as string
  const ref = (req.query.ref as string) || ''
  if (!url) return res.status(400).json({ error: 'Missing url' })
  const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0' }
  if (ref) headers['Referer'] = ref
  const range = req.headers['range']
  if (range) headers['Range'] = range as string
  try {
    const response = await fetch(url, { headers })
    const resHeaders: Record<string, string> = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Content-Range' }
    const ct = response.headers.get('content-type') || 'audio/mpeg'
    resHeaders['Content-Type'] = ct
    const cl = response.headers.get('content-length')
    if (cl) resHeaders['Content-Length'] = cl
    const cr = response.headers.get('content-range')
    if (cr) resHeaders['Content-Range'] = cr
    const buffer = await response.arrayBuffer()
    res.status(range && response.status === 206 ? 206 : 200).set(resHeaders).send(Buffer.from(buffer))
  } catch { res.status(502).json({ error: 'Proxy failed' }) }
})

app.use('/api/playlist', playlistRoutes)
app.use('/api/playlist', playlistRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/proxy', proxyRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 种子默认配置
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
Promise.resolve().then(async () => {
  const defaults: Record<string, string> = {
    gd_api_url: 'https://music-api.gdstudio.xyz/api.php',
  }
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: {},
      create: { key, value },
    })
  }
})

app.use(errorHandler)

const wsManager = new WSManager(config.wsPort)
console.log(`[WS] WebSocket server running on port ${config.wsPort}`)

app.listen(config.port, () => {
  console.log(`[API] Server running on http://localhost:${config.port}`)
  console.log(`[API] CORS origin: ${config.corsOrigin}`)
})

export { app, wsManager }
