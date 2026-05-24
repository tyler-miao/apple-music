'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LyricLine as LyricLineType } from '@/types'
import { LyricLine } from '@/components/lyrics/LyricLine'
import { useLyricStore } from '@/stores/lyricStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useLyricsSync } from '@/hooks/useLyricsSync'
import { useInertiaScroll } from '@/hooks/useInertiaScroll'

interface HeartParticle {
  id: number
  x: number
  y: number
  size: number
  delay: number
}

interface CharData {
  char: string
  lineIndex: number
  isCurrentLine: boolean
  wordStart?: number
  wordEnd?: number
}

const CURVE_ARC = 200
const ARC_RADIUS = 340
const MAX_CHARS = 40
const HALF_WINDOW_LINES = 3

function buildOrbitChars(lyrics: LyricLineType[], currentLineIndex: number): CharData[] {
  if (!lyrics.length || currentLineIndex < 0) return []
  const chars: CharData[] = []
  const start = Math.max(0, currentLineIndex - HALF_WINDOW_LINES)
  const end = Math.min(lyrics.length - 1, currentLineIndex + HALF_WINDOW_LINES)
  for (let i = start; i <= end; i++) {
    const line = lyrics[i]
    const text = line.text || ''
    const isCurrent = i === currentLineIndex
    if (line.wordTimings && line.wordTimings.length > 0) {
      for (const wt of line.wordTimings) {
        for (const ch of wt.word) {
          chars.push({ char: ch, lineIndex: i, isCurrentLine: isCurrent, wordStart: wt.start, wordEnd: wt.end })
        }
      }
    } else {
      for (const ch of text) {
        chars.push({ char: ch === ' ' ? '\u00A0' : ch, lineIndex: i, isCurrentLine: isCurrent })
      }
    }
  }
  if (chars.length > MAX_CHARS) {
    const center = Math.floor(chars.length / 2)
    const half = Math.floor(MAX_CHARS / 2)
    return chars.slice(center - half, center + half)
  }
  return chars
}

export function PlayerView() {
  const { lyrics, currentLineIndex, isLoaded } = useLyricStore()
  const { currentMusic, seek, isPlaying, currentTime } = usePlayerStore()
  const [hearts, setHearts] = useState<HeartParticle[]>([])
  const [shaking, setShaking] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [coverRotate, setCoverRotate] = useState({ x: 0, y: 0 })
  const [displayMode, setDisplayMode] = useState<'normal' | 'orbit' | 'danmaku'>('normal')
  const [danmakuMouse, setDanmakuMouse] = useState({ x: -999, y: -999 })
  const heartIdRef = useRef(0)
  const danmakuPositions = useRef<Record<number, { x: number; y: number; rotate: number; driftX: number; driftY: number; duration: number }>>({})

  useLyricsSync()
  const { containerRef: scrollRef, isFollowing } = useInertiaScroll()
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const id = currentMusic?.id
    if (!id) { setIsLiked(false); return }
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetch('/api/music/liked', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.ok ? r.json() : [])
      .then((songs: any[]) => setIsLiked(songs.some((s) => s.musicId === id)))
      .catch(() => {})
  }, [currentMusic?.id])

  const burstHearts = useCallback((clientX: number, clientY: number) => {
    const newHearts: HeartParticle[] = Array.from({ length: 12 }, () => ({
      id: heartIdRef.current++,
      x: clientX,
      y: clientY,
      size: 16 + Math.random() * 20,
      delay: Math.random() * 0.15,
    }))
    setHearts((prev) => [...prev, ...newHearts])
    setTimeout(() => setHearts((prev) => prev.filter((h) => !newHearts.find((n) => n.id === h.id))), 1200)
  }, [])

  const toggleLike = useCallback(async () => {
    const id = currentMusic?.id
    if (!id) return
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/music/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: currentMusic?.title,
          artist: currentMusic?.artist,
          album: currentMusic?.album,
          source: currentMusic?.source,
          sourceId: currentMusic?.sourceId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsLiked(data.liked)
      }
    } catch {}
  }, [currentMusic])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    burstHearts(e.clientX, e.clientY)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    toggleLike()
  }, [burstHearts, toggleLike])

  const handleCoverClick = useCallback(() => {
    const s = usePlayerStore.getState()
    s.isPlaying ? s.setIsPlaying(false) : s.setIsPlaying(true)
    if (s.currentMusic) useHistoryStore.getState().addEntry(s.currentMusic)
  }, [])

  const handleCoverMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setCoverRotate({ x: (y - 0.5) * -12, y: (x - 0.5) * 12 })
  }, [])

  const handleCoverMouseLeave = useCallback(() => {
    setCoverRotate({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (displayMode !== 'danmaku') return
    const handleMove = (e: MouseEvent) => {
      setDanmakuMouse({
        x: e.clientX / window.innerWidth * 100,
        y: e.clientY / window.innerHeight * 100,
      })
    }
    const handleLeave = () => setDanmakuMouse({ x: -999, y: -999 })
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseleave', handleLeave)
    }
  }, [displayMode])

  useEffect(() => {
    if (currentLineIndex >= 0 && lineRefs.current[currentLineIndex]) {
      const el = lineRefs.current[currentLineIndex]
      const container = scrollRef.current
      if (!el || !container) return
      container.scrollTo({ top: el.offsetTop - container.clientHeight * 0.3 + el.clientHeight / 2, behavior: 'smooth' })
    }
  }, [currentLineIndex, scrollRef])

  useEffect(() => {
    if (displayMode === 'danmaku') danmakuPositions.current = {}
  }, [displayMode])

  const showOrbit = lyrics.length > 0 && currentLineIndex >= 0 && displayMode === 'orbit'

  const climaxIndices = useMemo(() => {
    const countMap = new Map<string, number[]>()
    lyrics.forEach((l, i) => {
      const t = l.text?.trim()
      if (!t) return
      if (!countMap.has(t)) countMap.set(t, [])
      countMap.get(t)!.push(i)
    })
    const set = new Set<number>()
    for (const [, indices] of countMap) {
      if (indices.length >= 2) indices.forEach(i => set.add(i))
    }
    return set
  }, [lyrics])
  const isClimax = climaxIndices.has(currentLineIndex)

  const orbitContent = useMemo(() => {
    if (!showOrbit) return null
    const chars = buildOrbitChars(lyrics, currentLineIndex)
    if (!chars.length) return null
    const centerIdx = Math.floor((chars.length - 1) / 2)
    const step = CURVE_ARC / Math.max(chars.length - 1, 1)
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute pointer-events-none rounded-full" style={{
          width: ARC_RADIUS * 2 + 60,
          height: ARC_RADIUS * 2 + 60,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 0 80px rgba(255,255,255,0.02)',
        }} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 cursor-pointer"
          style={{ width: 240, height: 240, borderRadius: '50%' }}
          onClick={handleCoverClick}
        >
          {currentMusic?.coverUrl ? (
            <img src={currentMusic.coverUrl} alt={currentMusic.title}
              className="w-full h-full object-cover rounded-full pointer-events-none"
              style={{ boxShadow: '0 0 40px rgba(255,255,255,0.1), 0 0 80px rgba(0,0,0,0.5)' }}
            />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="white" opacity="0.15">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                border: '2px solid transparent',
                borderTopColor: 'rgba(255,255,255,0.12)',
                borderRightColor: 'rgba(255,255,255,0.04)',
              }}
            />
          )}
        </motion.div>
        <div className="absolute inset-0 pointer-events-none">
          {chars.map((c, i) => {
            const offsetFromCenter = i - centerIdx
            const angleDeg = -90 + offsetFromCenter * step
            const angleRad = (angleDeg * Math.PI) / 180
            const px = Math.cos(angleRad) * ARC_RADIUS
            const py = Math.sin(angleRad) * ARC_RADIUS
            const dist = Math.abs(offsetFromCenter) / Math.max(centerIdx, 1)
            let progress = 1
            if (c.isCurrentLine && c.wordStart !== undefined && c.wordEnd !== undefined) {
              progress = Math.min(Math.max((currentTime - c.wordStart) / (c.wordEnd - c.wordStart), 0), 1)
            }
            return (
              <div key={`${c.lineIndex}-${i}`}
                className="absolute" style={{
                  left: `calc(50% + ${px}px)`, top: `calc(50% + ${py}px)`,
                  transform: 'translate(-50%, -50%)', pointerEvents: 'auto', cursor: 'pointer',
                }}
                onClick={() => seek(lyrics[c.lineIndex]?.time ?? 0)}
              >
                <span className="relative inline-block leading-none" style={{
                  fontSize: c.isCurrentLine ? 'clamp(1.6rem, 2.8vw, 2.5rem)' : `clamp(0.8rem, ${1.1 + (1 - Math.min(dist, 1)) * 0.8}vw, 1.4rem)`,
                  color: c.isCurrentLine ? '#fff' : `rgba(255,255,255,${Math.max(0.15, 0.5 - Math.min(dist, 1) * 0.35)})`,
                  filter: c.isCurrentLine ? 'none' : `blur(${Math.min(2, dist * 2)}px)`,
                  fontWeight: c.isCurrentLine ? 800 : 600,
                  textShadow: c.isCurrentLine ? '0 0 24px rgba(255,255,255,0.2)' : 'none',
                  transition: 'all 0.4s ease', letterSpacing: '-0.02em',
                }}>
                  {c.isCurrentLine && progress < 1 && c.wordStart !== undefined ? (
                    <>
                      <span style={{ opacity: 0.25 }}>{c.char}</span>
                      <span style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>
                        {c.char}
                      </span>
                    </>
                  ) : c.char}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [showOrbit, lyrics, currentLineIndex, currentTime, currentMusic, isPlaying])

  return (
    <div
      className={`flex-1 flex items-center overflow-hidden relative px-[6vw] gap-16 ${shaking ? 'animate-shake' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* 爱心粒子 */}
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0, x: h.x, y: h.y }}
          animate={{
            opacity: 0,
            scale: 1.5,
            x: h.x + (Math.random() - 0.5) * 200,
            y: h.y - 80 - Math.random() * 120,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: h.delay, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed pointer-events-none z-50"
          style={{ width: h.size, height: h.size }}
        >
          <svg viewBox="0 0 24 24" fill="#ff4d6d" className="w-full h-full drop-shadow-lg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </motion.div>
      ))}

      {/* 模式切换按钮 */}
      <div className="fixed top-20 right-8 z-40 flex flex-col gap-2">
        <button
          onClick={() => setDisplayMode(displayMode === 'orbit' ? 'normal' : 'orbit')}
          className="px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl border transition-all"
          style={{
            background: displayMode === 'orbit' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
            borderColor: displayMode === 'orbit' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
            color: displayMode === 'orbit' ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          神圣
        </button>
        <button
          onClick={() => setDisplayMode(displayMode === 'danmaku' ? 'normal' : 'danmaku')}
          className="px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-xl border transition-all"
          style={{
            background: displayMode === 'danmaku' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
            borderColor: displayMode === 'danmaku' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
            color: displayMode === 'danmaku' ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          神人款
        </button>
      </div>

      {displayMode === 'orbit' ? (
        orbitContent
      ) : displayMode === 'danmaku' ? (
        <div
          className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
          style={{ perspective: 1000, zIndex: 10 }}
        >
          <style>{`@keyframes dDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--dx,0),var(--dy,0))}}`}</style>

          <div className="absolute inset-0 pointer-events-none transition-[background] ease-out" style={{
            transitionDuration: isClimax ? '400ms' : '700ms',
            background: danmakuMouse.x > -500
              ? `radial-gradient(500px circle at ${danmakuMouse.x}% ${danmakuMouse.y}%, rgba(255,255,255,0.035) 0%, transparent 55%)`
              : 'none',
          }} />

          <div className="absolute inset-0 pointer-events-none">
            {lyrics.map((line, idx) => {
              const isCurrent = idx === currentLineIndex
              if (!danmakuPositions.current[line.time]) {
                danmakuPositions.current[line.time] = {
                  x: 3 + Math.random() * 74,
                  y: 2 + Math.random() * 86,
                  rotate: -12 + Math.random() * 24,
                  driftX: -60 + Math.random() * 120,
                  driftY: -50 + Math.random() * 100,
                  duration: 2 + Math.random() * 3,
                }
              }
              const pos = danmakuPositions.current[line.time]
              const sizeSeed = (Math.sin(line.time * 0.0073) + 1) / 2
              const opacitySeed = (Math.sin(line.time * 0.0117 + 2) + 1) / 2

              const dx = danmakuMouse.x - pos.x
              const dy = danmakuMouse.y - pos.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const repelStr = Math.max(0, 1 - dist / 16)
              const repelX = -(dx / (dist || 1)) * repelStr * 60
              const repelY = -(dy / (dist || 1)) * repelStr * 60

              return (
                <div
                  key={line.time}
                  className="absolute whitespace-nowrap"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      rotate: `${pos.rotate}deg`,
                      zIndex: isCurrent ? 50 : undefined,
                      animation: `dDrift ${isClimax ? pos.duration / 1.5 : pos.duration}s ease-in-out infinite`,
                      '--dx': `${pos.driftX}px`,
                      '--dy': `${pos.driftY}px`,
                    } as unknown as React.CSSProperties}
                >
                  <motion.div
                    animate={{ x: repelX, y: repelY }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22, mass: 0.4 }}
                  >
                    {isCurrent ? (
                      <span className="select-none block leading-tight font-extrabold tracking-tight" style={{
                        fontSize: `clamp(1.2rem, ${1.8 + sizeSeed * 1.5}vw, 2.5rem)`,
                        color: '#fff',
                        textShadow: '0 0 30px rgba(255,255,255,0.25)',
                      }}>
                        {line.wordTimings && line.wordTimings.length > 0 ? (
                          line.wordTimings.map((w, i) => {
                            const progress = Math.min(Math.max((currentTime - w.start) / (w.end - w.start), 0), 1)
                            return (
                              <span key={i} className="relative inline">
                                <span className="text-white/30">{w.word}</span>
                                <span className="absolute inset-0 text-white overflow-hidden" style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>
                                  {w.word}
                                </span>
                              </span>
                            )
                          })
                        ) : (
                          line.text || '\u3000'
                        )}
                        {line.translation && <div className="text-white/60 text-sm mt-1 font-semibold">{line.translation}</div>}
                      </span>
                    ) : (
                      <span className="select-none block leading-tight font-bold tracking-tight" style={{
                        fontSize: `clamp(0.6rem, ${0.7 + sizeSeed * 1.3}vw, 1.3rem)`,
                        color: `rgba(255,255,255,${0.12 + opacitySeed * 0.38})`,
                      }}>
                        {line.text || '\u3000'}
                      </span>
                    )}
                  </motion.div>
                </div>
              )
            })}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-20 cursor-pointer pointer-events-auto"
            onClick={handleCoverClick}
          >
            {currentMusic?.coverUrl ? (
              <img
                src={currentMusic.coverUrl}
                alt={currentMusic.title}
                className="object-cover pointer-events-none"
                style={{ width: 400, height: 400, borderRadius: 16, boxShadow: '0 30px 100px rgba(0,0,0,0.6)' }}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ width: 400, height: 400, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="white" opacity="0.15">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="overflow-y-auto mask-fade no-scrollbar" style={{ flex: 1.2, height: '100%' }}>
            <AnimatePresence mode="wait">
              {!isLoaded || lyrics.length === 0 ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center"
                >
                  <div className="font-extrabold tracking-tight text-white/80" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                    {currentMusic ? '等待歌词...' : 'Apple Music Experience'}
                  </div>
                  <div className="font-semibold text-white/40" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>
                    {currentMusic ? '正在加载歌词' : '搜索音乐开始体验'}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col min-h-full justify-center">
                  {lyrics.map((line, idx) => (
                    <div key={`${line.time}-${idx}`} ref={(el) => { lineRefs.current[idx] = el }}>
                      <LyricLine
                        line={line}
                        isActive={idx === currentLineIndex}
                        index={idx}
                        onClick={() => seek(line.time)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {currentMusic?.coverUrl ? (
              <motion.div
                key="cover"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center justify-end"
                style={{ flex: 1 }}
              >
                <div
                  className="relative cursor-pointer"
                  style={{
                    maxWidth: '45vh',
                    minWidth: 300,
                    aspectRatio: 1,
                    perspective: 800,
                    transformStyle: 'preserve-3d',
                  }}
                  onClick={handleCoverClick}
                >
                  <motion.div
                    onMouseMove={handleCoverMouseMove}
                    onMouseLeave={handleCoverMouseLeave}
                    animate={{ rotateX: coverRotate.x, rotateY: coverRotate.y }}
                    transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                    className="w-full h-full relative"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <img
                      src={currentMusic.coverUrl}
                      alt={currentMusic.title}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{ borderRadius: 24, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: isLiked ? 1 : 0 }}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.4)' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? '#ff4d6d' : 'none'} stroke={isLiked ? '#ff4d6d' : 'white'} strokeWidth="2" className={isLiked ? '' : 'text-white/70'}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </motion.div>
                    <div className="absolute inset-0 pointer-events-none" style={{
                      borderRadius: 24,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
                    }} />
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="cover-placeholder"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-end"
                style={{ flex: 1 }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '45vh', minWidth: 300, aspectRatio: 1, borderRadius: 24, background: 'rgba(255,255,255,0.05)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
                >
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="white" opacity="0.15">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
