import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.post('/', async (_req: Request, res: Response) => {
  await prisma.pageVisit.create({ data: {} })
  res.json({ ok: true })
})

export default router
