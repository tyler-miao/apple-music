import { Router } from 'express'
import { MusicController } from '../controllers/music.controller'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()
const ctrl = new MusicController()

router.get('/liked', authenticate, ctrl.getLiked.bind(ctrl))
router.get('/', ctrl.list.bind(ctrl))
router.get('/:id', ctrl.detail.bind(ctrl))
router.get('/:id/url', ctrl.getUrl.bind(ctrl))
router.get('/:id/stream', ctrl.stream.bind(ctrl))
router.post('/:id/play', authenticate, ctrl.recordPlay.bind(ctrl))
router.post('/:id/like', authenticate, ctrl.toggleLike.bind(ctrl))

export default router
