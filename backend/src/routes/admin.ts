import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'
import { requireAdmin } from '../middleware/admin'
import { AuthRequest } from '../types'

const router = Router()
const prisma = new PrismaClient()

// 仪表盘统计
router.get('/stats', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalMusic, totalPlaylists, totalPlays, totalLiked] = await Promise.all([
    prisma.user.count(),
    prisma.music.count(),
    prisma.playlist.count(),
    prisma.playHistory.count(),
    prisma.likedMusic.count(),
  ])
  res.json({ totalUsers, totalMusic, totalPlaylists, totalPlays, totalLiked })
})

// 用户管理（分页+搜索）
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const search = req.query.search as string | undefined
  const skip = (page - 1) * limit

  const where = search ? {
    OR: [
      { username: { contains: search } },
      { email: { contains: search } },
    ],
  } : undefined

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, username: true, role: true, bio: true, avatar: true, createdAt: true, updatedAt: true },
    }),
    prisma.user.count({ where }),
  ])
  res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) })
})

router.patch('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { role } = req.body
  if (!['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: '角色无效' })
  }
  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, username: true, role: true, createdAt: true },
  })
  res.json(user)
})

router.delete('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  await prisma.playlistItem.deleteMany({ where: { playlist: { userId: id } } })
  await prisma.playlist.deleteMany({ where: { userId: id } })
  await prisma.playHistory.deleteMany({ where: { userId: id } })
  await prisma.likedMusic.deleteMany({ where: { userId: id } })
  await prisma.user.delete({ where: { id } })
  res.json({ success: true })
})

// 音乐管理
router.get('/music', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const page = parseInt(_req.query.page as string) || 1
  const limit = parseInt(_req.query.limit as string) || 50
  const search = _req.query.search as string | undefined
  const skip = (page - 1) * limit
  const where = search ? {
    OR: [
      { title: { contains: search } },
      { artist: { contains: search } },
    ],
  } : undefined
  const [musics, total] = await Promise.all([
    prisma.music.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.music.count({ where }),
  ])
  res.json({ musics, total, page, limit, totalPages: Math.ceil(total / limit) })
})

router.patch('/music/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { title, artist, album, coverUrl, audioUrl, source } = req.body
  const music = await prisma.music.update({
    where: { id },
    data: { title, artist, album, coverUrl, audioUrl, source },
  })
  res.json(music)
})

router.delete('/music/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  await prisma.playlistItem.deleteMany({ where: { musicId: id } })
  await prisma.playHistory.deleteMany({ where: { musicId: id } })
  await prisma.likedMusic.deleteMany({ where: { musicId: id } })
  await prisma.lyrics.deleteMany({ where: { musicId: id } })
  await prisma.music.delete({ where: { id } })
  res.json({ success: true })
})

// 系统配置管理（用于切换音乐 API 等）
router.get('/config', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const configs = await prisma.systemConfig.findMany()
  const map: Record<string, string> = {}
  configs.forEach((c) => { map[c.key] = c.value })
  res.json(map)
})

router.put('/config', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const entries = req.body as Record<string, string>
  for (const [key, value] of Object.entries(entries)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  }
  const configs = await prisma.systemConfig.findMany()
  const map: Record<string, string> = {}
  configs.forEach((c) => { map[c.key] = c.value })
  res.json(map)
})

export default router
