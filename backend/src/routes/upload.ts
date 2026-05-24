import { Router } from 'express'
import { UploadController } from '../controllers/upload.controller'
import { upload } from '../middleware/upload'
import { authenticate } from '../middleware/auth'

const router = Router()
const ctrl = new UploadController()

router.post('/music', authenticate, upload.single('file'), ctrl.uploadMusic.bind(ctrl))
router.post('/cover', authenticate, upload.single('file'), ctrl.uploadCover.bind(ctrl))

export default router
