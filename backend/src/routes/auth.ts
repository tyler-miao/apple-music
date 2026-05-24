import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()
const ctrl = new AuthController()

router.post('/register', ctrl.register.bind(ctrl))
router.post('/login', ctrl.login.bind(ctrl))
router.post('/refresh', ctrl.refresh.bind(ctrl))
router.get('/profile', authenticate, ctrl.profile.bind(ctrl))
router.patch('/avatar', authenticate, ctrl.updateAvatar.bind(ctrl))
router.patch('/bio', authenticate, ctrl.updateBio.bind(ctrl))

export default router
