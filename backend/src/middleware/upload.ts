import multer from 'multer'
import path from 'path'
import { v4 as uuid } from 'uuid'
import config from '../config'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  },
})

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedAudio = /\.(mp3|wav|flac|aac|ogg|m4a|wma)$/i
  const allowedImage = /\.(jpg|jpeg|png|gif|webp)$/i
  const allowedLrc = /\.(lrc|txt)$/i
  if (allowedAudio.test(file.originalname) || allowedImage.test(file.originalname) || allowedLrc.test(file.originalname)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件格式'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize },
})
