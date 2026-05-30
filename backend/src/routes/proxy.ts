import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

const DEFAULT_GD_API = 'https://music-api.gdstudio.xyz/api.php'

router.all('/gd', async (req: Request, res: Response) => {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: 'gd_api_url' } })
    const baseUrl = config?.value || DEFAULT_GD_API

    const url = new URL(baseUrl)
    for (const [key, value] of Object.entries(req.query)) {
      url.searchParams.set(key, String(value))
    }

    const response = await fetch(url.toString(), {
      method: req.method,
      headers: { 'Accept': 'application/json' },
    })

    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('[Proxy] GD API non-JSON response:', text.slice(0, 200))
      return res.status(502).json({ error: '音乐API返回异常', detail: text.slice(0, 200) })
    }

    const data = await response.json()
    res.json(data)
  } catch (err: any) {
    console.error('[Proxy] GD API error:', err.message)
    res.status(502).json({ error: '音乐API请求失败', message: err.message })
  }
})

export default router
