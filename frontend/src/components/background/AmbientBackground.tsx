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
    const colors = [vibrant, muted, dark, light].map(parseRgb)

    const [br, bg, bb] = colors[2]!
    const cellW = w / (ROWS - 1)
    const cellH = h / (COLS - 1)

    const pts: { bx: number; by: number; ci: number }[] = []
    for (let gy = 0; gy < COLS; gy++) {
      for (let gx = 0; gx < ROWS; gx++) {
        pts.push({ bx: gx * cellW, by: gy * cellH, ci: (gx + gy * 2) % 4 })
      }
    }
    const rad = Math.max(cellW, cellH) * 1.4
    tRef.current = 0

    let frameCount = 0
    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      frameCount++
      if (!isPlaying) {
        if (frameCount % 3 !== 0) return
      }
      if (isPlaying) tRef.current += 0.015

      ctx.fillStyle = `rgb(${br},${bg},${bb})`
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'screen'

      for (const p of pts) {
        const t = tRef.current
        const dx =
          Math.sin(p.bx * 0.008 + t * 0.7) * Math.cos(p.by * 0.006 - t * 0.5) * 60 +
          Math.sin(p.bx * 0.015 + p.by * 0.01 + t * 0.3) * 25
        const dy =
          Math.cos(p.bx * 0.005 - t * 0.6) * Math.sin(p.by * 0.009 + t * 0.8) * 50 +
          Math.cos(p.bx * 0.012 + p.by * 0.008 + t * 0.4) * 20

        const px = p.bx + dx
        const py = p.by + dy
        const [cr, cg, cb] = colors[p.ci]!

        const grad = ctx.createRadialGradient(px, py, 0, px, py, rad)
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.6)`)
        grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.12)`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'
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
          filter: 'blur(12px) saturate(1.4)',
          willChange: 'transform',
        }}
      />
    </div>
  )
}
