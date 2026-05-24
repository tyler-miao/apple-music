'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { audioEngine } from '@/lib/audio-engine'

export function Visualizer({ barCount = 32, height = 48 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isPlaying } = usePlayerStore()
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      const data = audioEngine.frequencyData
      const w = canvas.clientWidth / barCount
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

      for (let i = 0; i < barCount; i++) {
        const value = data[Math.floor((i / barCount) * data.length)] || 0
        const h = (value / 255) * canvas.clientHeight * 0.9
        const x = i * w + 1
        const bw = Math.max(w - 2, 1)

        const gradient = ctx.createLinearGradient(x, canvas.clientHeight, x, canvas.clientHeight - h)
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)')
        gradient.addColorStop(1, 'rgba(255,255,255,0.8)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(x, canvas.clientHeight - h, bw, h, bw / 2)
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    if (isPlaying) {
      draw()
    } else {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, barCount])

  return (
    <canvas
      ref={canvasRef}
      className="w-full pointer-events-none"
      style={{ height: `${height}px` }}
    />
  )
}
