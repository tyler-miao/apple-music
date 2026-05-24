import { Router } from 'express'
import { LyricsController } from '../controllers/lyrics.controller'

const router = Router()
const ctrl = new LyricsController()

router.get('/:musicId', ctrl.get.bind(ctrl))
router.post('/upload', ctrl.upload.bind(ctrl))
router.get('/fetch/gd', ctrl.fetchFromGD.bind(ctrl))

export default router
