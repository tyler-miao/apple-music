'use client'

import { useEffect, useRef } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { usePlayerStore } from '@/stores/playerStore'
import { processCoverColors, parseRgb } from '@/lib/color'

const ROWS = 6
const COLS = 5

export function AmbientBackground() {
  const { coverColors } = useUIStore()
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const scale = 3
    const w = Math.round(window.innerWidth / scale)
    const h = Math.round(window.innerHeight / scale)
    canvas.width = w
    canvas.height = h

    const [vibrant, muted, dark, light] = processCoverColors(
      coverColors.vibrant, coverColors.muted, coverColors.dark, coverColors.light
    )
    const colors = [vibrant, muted, light, dark].map(parseRgb)

    const [br, bg, bb] = colors[3]!
    const cellW = w / (ROWS - 1)
    const cellH = h / (COLS - 1)

    const pts: { bx: number; by: number; ci: number }[] = []
    for (let gy = 0; gy < COLS; gy++) {
      for (let gx = 0; gx < ROWS; gx++) {
        pts.push({
          bx: gx * cellW + (Math.random() - 0.5) * 20,
          by: gy * cellH + (Math.random() - 0.5) * 20,
          ci: (gx + gy) % 4,
        })
      }
    }
    const rad = Math.max(cellW, cellH) * 1.6
    tRef.current = 0

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      if (isPlaying) tRef.current += 0.008

      ctx.fillStyle = `rgb(${br},${bg},${bb})`
      ctx.fillRect(0, 0, w, h)

      for (const p of pts) {
        const t = tRef.current
        const dx = Math.sin(p.bx * 0.006 + t * 0.5 + p.by * 0.004) * 70
        const dy = Math.cos(p.by * 0.006 + t * 0.4 + p.bx * 0.004) * 60

        const px = p.bx + dx
        const py = p.by + dy
        const [cr, cg, cb] = colors[p.ci]!

        const grad = ctx.createRadialGradient(px, py, 0, px, py, rad)
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.55)`)
        grad.addColorStop(0.3, `rgba(${cr},${cg},${cb},0.18)`)
        grad.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.06)`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, rad, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [coverColors, isPlaying])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ background: '#08080a', zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{
          filter: 'blur(18px) saturate(1.6) brightness(1.05)',
          willChange: 'transform',
        }}
      />
    </div>
  )
}
