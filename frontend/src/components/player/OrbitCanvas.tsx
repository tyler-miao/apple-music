'use client'

import { useEffect, useRef } from 'react'
import { audioEngine } from '@/lib/audio-engine'

interface Star3D {
  x: number; y: number; z: number
  size: number
  speed: number
  hue: number
}

export function OrbitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef(0)
  const starsRef = useRef<Star3D[]>([])
  const timeRef = useRef(0)

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

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 }
    }
    const handleLeave = () => {
      mouseRef.current = { x: 0, y: 0 }
    }
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('mouseleave', handleLeave)

    const stars: Star3D[] = []
    for (let i = 0; i < 400; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 200 + Math.random() * 2000
      stars.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi) - 500,
        size: 0.5 + Math.random() * 2,
        speed: 2 + Math.random() * 4,
        hue: 200 + Math.random() * 60,
      })
    }
    starsRef.current = stars

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

      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      const warpSpeed = 1 + bassN * 3
      const rotY = mx * 0.8 + Math.sin(t * 0.1) * 0.1
      const rotX = my * 0.5 + Math.sin(t * 0.07 + 1) * 0.05
      const cosRY = Math.cos(rotY), sinRY = Math.sin(rotY)
      const cosRX = Math.cos(rotX), sinRX = Math.sin(rotX)

      // Central glow
      const glowR = 60 + bassN * 150
      const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
      gg.addColorStop(0, `rgba(180,200,255,${0.1 + energy * 0.15})`)
      gg.addColorStop(0.5, `rgba(150,180,255,${0.03 + energy * 0.05})`)
      gg.addColorStop(1, 'rgba(150,180,255,0)')
      ctx.fillStyle = gg
      ctx.beginPath()
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
      ctx.fill()

      // Sort: far to near
      const sorted = [...starsRef.current].sort((a, b) => b.z - a.z)

      for (const s of sorted) {
        s.z -= s.speed * warpSpeed * 2

        if (s.z < -100) {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const r = 800 + Math.random() * 1200
          s.x = r * Math.sin(phi) * Math.cos(theta)
          s.y = r * Math.sin(phi) * Math.sin(theta)
          s.z = 500 + Math.random() * 1000
          s.hue = 200 + Math.random() * 60
          s.size = 0.5 + Math.random() * 2
        }

        // Rotate Y
        let px = s.x * cosRY - s.z * sinRY
        let pz = s.x * sinRY + s.z * cosRY
        let py = s.y

        // Rotate X
        const y2 = py * cosRX - pz * sinRX
        pz = py * sinRX + pz * cosRX
        py = y2

        if (pz <= 0) continue

        const scale = 300 / pz
        const sx = cx + px * scale
        const sy = cy + py * scale

        if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) continue

        const depthAlpha = Math.min(1, 400 / pz)
        const sSize = s.size * scale * 0.15 * (1 + bassN * 0.5)
        const hueShift = s.hue + midN * 40
        const alpha = depthAlpha * (0.4 + energy * 0.4)

        // Glow
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sSize * 6)
        g.addColorStop(0, `hsla(${hueShift}, 80%, ${70 + bassN * 20}%, ${alpha})`)
        g.addColorStop(0.4, `hsla(${hueShift + 10}, 70%, 55%, ${alpha * 0.3})`)
        g.addColorStop(1, `hsla(${hueShift + 20}, 60%, 40%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(sx, sy, sSize * 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Mouse glow
      if (Math.abs(mx) > 0.01 || Math.abs(my) > 0.01) {
        const mmx = (mx + 1) / 2 * w
        const mmy = (my + 1) / 2 * h
        const mg = ctx.createRadialGradient(mmx, mmy, 0, mmx, mmy, 200 + energy * 150)
        mg.addColorStop(0, `rgba(200,220,255,${0.05 + energy * 0.04})`)
        mg.addColorStop(1, 'rgba(200,220,255,0)')
        ctx.fillStyle = mg
        ctx.beginPath()
        ctx.arc(mmx, mmy, 200 + energy * 150, 0, Math.PI * 2)
        ctx.fill()
      }

      // Outer vignette
      const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(0.7, `rgba(0,0,0,${0.05 + energy * 0.05})`)
      vg.addColorStop(1, `rgba(0,0,0,${0.25 + energy * 0.1})`)
      ctx.fillStyle = vg
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(w, h) * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
