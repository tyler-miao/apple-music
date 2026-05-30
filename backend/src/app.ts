import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { Readable } from 'stream'
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

app.use(cors({ origin: true, credentials: true }))
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
  if (!url) {
    res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' })
    return res.send('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="#1a1a2e"/><circle cx="250" cy="210" r="80" fill="none" stroke="#ffffff20" stroke-width="8"/><path d="M250 290v80M200 370h100" stroke="#ffffff20" stroke-width="8" stroke-linecap="round"/><text x="250" y="440" text-anchor="middle" fill="#ffffff20" font-family="sans-serif" font-size="24">No Cover</text></svg>')
  }
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error('Not OK')
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=604800', 'Access-Control-Allow-Origin': '*' })
    res.send(Buffer.from(buffer))
  } catch {
    res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' })
    res.send('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="#1a1a2e"/><circle cx="250" cy="210" r="80" fill="none" stroke="#ffffff20" stroke-width="8"/><path d="M250 290v80M200 370h100" stroke="#ffffff20" stroke-width="8" stroke-linecap="round"/><text x="250" y="440" text-anchor="middle" fill="#ffffff20" font-family="sans-serif" font-size="24">No Cover</text></svg>')
  }
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
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) })
    if (!response.ok || !response.body) return res.status(502).json({ error: 'Proxy failed' })
    const status = range && response.status === 206 ? 206 : 200
    res.status(status)
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Range',
      'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
    const cl = response.headers.get('content-length')
    if (cl) res.set('Content-Length', cl)
    const cr = response.headers.get('content-range')
    if (cr) res.set('Content-Range', cr)
    const stream = Readable.fromWeb(response.body)
    stream.on('error', () => { try { res.end() } catch {} })
    res.on('close', () => { try { stream.destroy() } catch {} })
    stream.pipe(res)
  } catch { 
    try { res.status(502).json({ error: 'Proxy failed' }) } catch {} 
  }
})

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
