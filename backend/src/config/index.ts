import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../../.env') })

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  wsPort: parseInt(process.env.WS_PORT || '4001', 10),
  jwtSecret: process.env.JWT_SECRET || 'apple-music-jwt-secret-dev',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'apple-music-refresh-secret-dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/apple_music',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  maxFileSize: 100 * 1024 * 1024,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
}

export default config
