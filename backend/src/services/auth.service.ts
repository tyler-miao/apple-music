import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { AppError } from '../middleware/error'

const prisma = new PrismaClient()

export class AuthService {
  async register(email: string, username: string, password: string) {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) throw new AppError(409, '邮箱已注册')

    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'ADMIN' : 'USER'

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, username, password: hashed, role },
    })

    const payload = { userId: user.id, email: user.email }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    return {
      user: { id: user.id, email: user.email, username: user.username, bio: user.bio || '', role: user.role, avatar: user.avatar, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    }
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new AppError(401, '邮箱或密码错误')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new AppError(401, '邮箱或密码错误')

    const payload = { userId: user.id, email: user.email }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    return {
      user: { id: user.id, email: user.email, username: user.username, bio: user.bio || '', role: user.role, avatar: user.avatar, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    }
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken)
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError(401, '刷新令牌无效')
      }

      const payload = { userId: user.id, email: user.email }
      const newAccessToken = generateAccessToken(payload)
      const newRefreshToken = generateRefreshToken(payload)

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      })

      return { accessToken: newAccessToken, refreshToken: newRefreshToken }
    } catch (err) {
      if (err instanceof AppError) throw err
      throw new AppError(401, '刷新令牌无效')
    }
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, email: true, username: true, bio: true, role: true, avatar: true, createdAt: true },
    })
    return user
  }

  async updateBio(userId: string, bio: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { bio },
      select: { id: true, email: true, username: true, bio: true, role: true, avatar: true, createdAt: true },
    })
    return user
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, bio: true, role: true, avatar: true, createdAt: true },
    })
    if (!user) throw new AppError(404, '用户未找到')
    return user
  }
}
