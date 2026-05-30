'use client'

import { useEffect, useRef } from 'react'
import { audioEngine } from '@/lib/audio-engine'

export function Mode1Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const timeRef = useRef(0)
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; life: number; hue: number }[]>([])
  const flashRef = useRef(0)
  const glitchRef = useRef(0)
  const shakeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      timeRef.current += 0.016
      const t = timeRef.current
      const w = canvas.width
      const h = canvas.height

      const freq = audioEngine.frequencyData
      let bass = 0, mid = 0, high = 0
      if (freq && freq.length) {
        for (let i = 0; i < 16; i++) bass += freq[i] / 16
        for (let i = 16; i < 40; i++) mid += freq[i] / 24
        for (let i = 40; i < 64; i++) high += freq[i] / 24
      }
      const bassN = bass / 255
      const midN = mid / 255
      const highN = high / 255
      const energy = Math.min(1, (bass + mid + high) / 255 / 3 * 1.5)

      if (bass > 200) flashRef.current = 8
      if (bass > 180 && Math.random() > 0.7) glitchRef.current = 4
      if (bass > 190) shakeRef.current = 6
      if (flashRef.current > 0) flashRef.current--
      if (glitchRef.current > 0) glitchRef.current--
      if (shakeRef.current > 0) shakeRef.current--

      const sx = shakeRef.current > 0 ? (Math.random() - 0.5) * 8 : 0
      const sy = shakeRef.current > 0 ? (Math.random() - 0.5) * 8 : 0

      ctx.save()
      ctx.translate(sx, sy)

      // Dark background with slight trail
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(-10, -10, w + 20, h + 20)

      const cx = w / 2
      const cy = h / 2

      // ── 1. BEAT FLASH ──
      if (flashRef.current > 0) {
        const fAlpha = flashRef.current / 8 * 0.3
        ctx.fillStyle = `rgba(255,200,255,${fAlpha})`
        ctx.fillRect(-10, -10, w + 20, h + 20)
      }

      // ── 2. GLITCH ──
      if (glitchRef.current > 0 && Math.random() > 0.4) {
        const gy = Math.random() * h
        const gh = 4 + Math.random() * 20
        const gw = w * (0.3 + Math.random() * 0.7)
        ctx.fillStyle = `hsla(${Math.random() * 360}, 90%, 60%, 0.3)`
        ctx.fillRect(Math.random() * w * 0.3, gy, gw, gh)
      }

      // ── 3. BIG EQ BARS ──
      const barCount = 32
      const barW = w / barCount
      const barH = h * 0.4

      for (let i = 0; i < barCount; i++) {
        const fi = Math.floor((i / barCount) * (freq?.length || 64))
        const val = freq ? freq[fi] / 255 : 0
        const hVal = val * (0.4 + bassN * 0.6)
        const barHeight = barH * hVal

        const hue = 300 + i * 2 + bassN * 60 + midN * 30
        const light = 40 + val * 50 + bassN * 20

        // Glow
        ctx.shadowColor = `hsla(${hue}, 100%, ${light}%, 0.6)`
        ctx.shadowBlur = 15 + val * 25

        // Bar with rounded top
        const x = i * barW
        const y = h - barHeight - 60

        // Gradient bar
        const grad = ctx.createLinearGradient(x, y, x, h - 60)
        grad.addColorStop(0, `hsla(${hue}, 100%, ${light}%, 0.95)`)
        grad.addColorStop(0.5, `hsla(${hue + 20}, 100%, ${light - 10}%, 0.8)`)
        grad.addColorStop(1, `hsla(${hue + 40}, 100%, ${light - 20}%, 0.2)`)
        ctx.fillStyle = grad
        ctx.fillRect(x, y, barW - 2, barHeight + 60)

        ctx.shadowBlur = 0
      }

      // ── 4. BASS RINGS ──
      const ringCount = Math.floor(3 + bassN * 5)
      for (let i = 0; i < ringCount; i++) {
        const r = 60 + i * 50 + bassN * 100 * Math.sin(t * (2 + i * 0.5))
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${300 + i * 20 + bassN * 40}, 100%, ${60 + bassN * 30}%, ${0.3 + bassN * 0.5 - i * 0.06})`
        ctx.lineWidth = 2 + bassN * 4 - i * 0.5
        ctx.shadowColor = `hsla(${300 + i * 20}, 100%, 60%, 0.5)`
        ctx.shadowBlur = 20 + bassN * 30
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── 5. SCATTER PARTICLES ──
      if (bassN > 0.5 && particlesRef.current.length < 200) {
        for (let i = 0; i < Math.floor(bassN * 8); i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 3 + Math.random() * 8
          particlesRef.current.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed * (1 + bassN),
            vy: Math.sin(angle) * speed * (1 + bassN),
            size: 2 + Math.random() * 5,
            life: 1,
            hue: 280 + Math.random() * 80 + midN * 40,
          })
        }
      }

      // Update particles
      const pts = particlesRef.current
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96
        p.vy *= 0.96
        p.life -= 0.015 + bassN * 0.02
        p.size *= 0.995

        if (p.life <= 0 || p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50) {
          pts.splice(i, 1)
          continue
        }

        const alpha = p.life * (0.5 + energy * 0.5)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (0.5 + bassN * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 100%, ${60 + bassN * 30}%, ${alpha})`
        ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.5})`
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // ── 6. STROBE LINES ──
      if (highN > 0.4) {
        const lineCount = Math.floor(highN * 8)
        for (let i = 0; i < lineCount; i++) {
          const lx = Math.random() * w
          ctx.beginPath()
          ctx.moveTo(lx, 0)
          ctx.lineTo(lx + (Math.random() - 0.5) * 20, h)
          ctx.strokeStyle = `rgba(255, 150, 255, ${highN * 0.15})`
          ctx.lineWidth = 1 + Math.random() * 2
          ctx.stroke()
        }
      }

      // ── 7. VIGNETTE ──
      const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5)
      vg.addColorStop(0, `rgba(0,0,0,0)`)
      vg.addColorStop(0.7, `rgba(0,0,0,${0.1 + energy * 0.1})`)
      vg.addColorStop(1, `rgba(0,0,0,${0.4 + bassN * 0.2})`)
      ctx.fillStyle = vg
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(w, h) * 0.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  )
}
