import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { AuthRequest } from '../types'
import { z } from 'zod'

const service = new AuthService()

const registerSchema = z.object({
  email: z.string().email('邮箱格式无效').optional().or(z.literal('')),
  phone: z.string().regex(/^1\d{10}$/, '手机号格式无效').optional().or(z.literal('')),
  username: z.string().min(2, '用户名至少2个字符').max(30),
  password: z.string().min(6, '密码至少6个字符').max(100),
}).refine(d => d.email || d.phone, { message: '邮箱或手机号必须填写一个' })

const loginSchema = z.object({
  identifier: z.string().min(1, '请输入邮箱或手机号'),
  password: z.string().min(1),
})

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, username, password } = registerSchema.parse(req.body)
      const result = await service.register(email || '', phone || '', username, password)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = loginSchema.parse(req.body)
      const result = await service.login(identifier, password)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) return res.status(400).json({ error: '缺少刷新令牌' })
      const result = await service.refresh(refreshToken)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async profile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await service.getProfile(req.user!.userId)
      res.json(user)
    } catch (err) {
      next(err)
    }
  }

  async updateAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { avatarUrl } = req.body
      if (typeof avatarUrl !== 'string') return res.status(400).json({ error: 'avatarUrl 是必填的' })
      const user = await service.updateAvatar(req.user!.userId, avatarUrl)
      res.json(user)
    } catch (err) {
      next(err)
    }
  }

  async updateBio(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bio } = req.body
      if (typeof bio !== 'string') return res.status(400).json({ error: 'bio 是必填的' })
      const user = await service.updateBio(req.user!.userId, bio)
      res.json(user)
    } catch (err) {
      next(err)
    }
  }
}
