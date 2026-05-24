import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' })
    }
    next()
  } catch {
    return res.status(500).json({ error: '服务器错误' })
  }
}
