import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config'
import { AuthRequest, JwtPayload } from '../types'

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: '令牌无效或已过期' })
  }
}

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1]
      req.user = jwt.verify(token, config.jwtSecret) as JwtPayload
    } catch {}
  }
  next()
}
