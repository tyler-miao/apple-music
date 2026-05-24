import jwt from 'jsonwebtoken'
import config from '../config'
import { JwtPayload } from '../types'

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any })
}

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn as any })
}

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload
}
