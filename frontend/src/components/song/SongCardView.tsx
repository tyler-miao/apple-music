'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LyricLine as LyricLineType } from '@/types'
import { StereoCover } from '@/components/player/StereoCover'
import { OrbitCanvas } from '@/components/player/OrbitCanvas'
import { Mode1Canvas } from '@/components/player/Mode1Canvas'
import { ThreeDScene } from '@/components/player/ThreeDScene'
import { useLyricStore } from '@/stores/lyricStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useLyricsSync } from '@/hooks/useLyricsSync'

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

const CURVE_ARC = 250
const ARC_RADIUS = 420
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

type Module = 'holy' | 'dream' | 'blade' | 'today' | 'v2'

const modules: { key: Module; label: string }[] = [
  { key: 'holy', label: '圣神' },
  { key: 'dream', label: '镜花水月' },
  { key: 'blade', label: '小李飞刀' },
  { key: 'today', label: '今天' },
  { key: 'v2', label: '2' },
]

const MODE_MAP: Record<Module, string> = {
  holy: 'orbit',
  dream: 'danmaku',
  blade: 'lixiaofeidao',
  today: '',
  v2: 'three',
}

function TodayModule({ music, cover, lyrics, currentLineIndex, onCoverClick }: { music: any; cover: string | null; lyrics: LyricLineType[]; currentLineIndex: number; onCoverClick?: () => void }) {
  const leftLyric = lyrics[currentLineIndex]
  const rightLyric = lyrics[currentLineIndex + 1] || lyrics[currentLineIndex - 1]

  return (
    <div className="relative w-full h-full">
      {/* Main content - two column layout */}
      <div className="relative z-10 h-full grid grid-cols-[1fr_1fr] gap-8 items-center px-12 md:px-16">
        
        {/* Left - Large lyrics */}
        <div className="flex flex-col justify-center items-start">
          {leftLyric && (
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {leftLyric.text || '\u3000'}
              </h1>
              {leftLyric.translation && (
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white/80 leading-tight tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {leftLyric.translation}
                </h2>
              )}
            </div>
          )}
        </div>

        {/* Right - Album cover + info */}
        <div className="flex flex-col items-center justify-center gap-6">
          <StereoCover
            src={cover}
            alt=""
            size={180}
            className="md:w-[220px]"
            rounded="rounded-2xl"
            tiltAmount={8}
            onClick={onCoverClick}
          />

          {/* Credits */}
          <div className="text-white/70 text-sm space-y-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <div className="space-y-1">
              <p className="text-[10px] text-white/40 tracking-widest uppercase">Produced by</p>
              <p className="font-bold text-white/80">{music?.artist || 'Daniel Caesar'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-white/40 tracking-widest uppercase">Lyrics by</p>
              <p className="font-bold text-white/80">{music?.artist || 'Sir Dylan'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-white/40 tracking-widest uppercase">Visual Design</p>
              <p className="font-bold text-white/80">Neo_FM</p>
            </div>
          </div>
        </div>

        {/* Right edge - Song info */}
        <div className="absolute top-1/2 right-12 md:right-16 -translate-y-1/2 text-right space-y-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <p className="text-lg md:text-xl font-bold text-white flex items-center gap-2 justify-end">
            <span className="text-white/60">♪</span> {music?.title || 'Who Knows'}
          </p>
          <p className="text-base md:text-lg text-white/70 font-medium">{music?.artist || 'Daniel Caesar'}</p>
          <p className="text-sm md:text-base text-white/50 italic">{music?.album || 'Son Of Spergy'}</p>
        </div>
      </div>

      {/* Bottom left - Chorus line */}
      <div className="absolute bottom-12 left-12 md:left-16 z-10">
        <p className="text-sm md:text-base text-white/60 italic" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          * {music?.title === 'Who Knows' ? '也许我在消耗你的耐心' : music?.title || '也许我在消耗你的耐心'}
        </p>
      </div>

      {/* Bottom right - Additional lyric */}
      <div className="absolute bottom-12 right-12 md:right-16 z-10">
        <p className="text-sm md:text-base text-white/60 italic" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          * Is it a crime to be unsure?
        </p>
      </div>

      {/* Top right - Module tag */}
      <div className="absolute top-6 right-12 md:right-16 text-[10px] text-white/20 tracking-[6px] font-mono">今天</div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-white/20 h-full">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
      <p className="text-sm">暂无播放中的歌曲</p>
    </div>
  )
}

export function SongCardView() {
  const [activeModule, setActiveModule] = useState<Module>('blade')
  const displayMode = MODE_MAP[activeModule]

  const { lyrics, currentLineIndex } = useLyricStore()
  const { currentMusic, seek, isPlaying, currentTime } = usePlayerStore()
  const [hearts, setHearts] = useState<HeartParticle[]>([])
  const [shaking, setShaking] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [danmakuMouse, setDanmakuMouse] = useState({ x: -999, y: -999 })
  const heartIdRef = useRef(0)
  const danmakuPositions = useRef<Record<number, { x: number; y: number; rotate: number; driftX: number; driftY: number; duration: number }>>({})
  const flyPositions = useRef<Record<number, { y: number; duration: number; delay: number; rotateY: number; scaleStart: number; scaleMid: number }>>({})

  useLyricsSync()

  useEffect(() => {
    const id = currentMusic?.id
    if (!id) { setIsLiked(false); return }
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetch('/api/music/liked', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.ok ? r.json() : [])
        .then((songs: any[]) => setIsLiked(songs.some((s) => s.musicId === id)))
        .catch(() => {})
    } else {
      setIsLiked(localStorage.getItem('liked_' + id) === '1')
    }
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
    if (token) {
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
          return
        }
      } catch {}
    }
    setIsLiked((prev) => {
      const next = !prev
      try { localStorage.setItem('liked_' + id, next ? '1' : '') } catch {}
      return next
    })
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
    if (displayMode === 'danmaku') danmakuPositions.current = {}
    if (displayMode === 'lixiaofeidao') flyPositions.current = {}
  }, [displayMode])

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

  const showOrbit = lyrics.length > 0 && currentLineIndex >= 0 && displayMode === 'orbit'

  const orbitContent = useMemo(() => {
    if (!showOrbit) return null
    const chars = buildOrbitChars(lyrics, currentLineIndex)
    if (!chars.length) return null
    const centerIdx = Math.floor((chars.length - 1) / 2)
    const step = CURVE_ARC / Math.max(chars.length - 1, 1)
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 cursor-pointer"
          style={{ width: 300, height: 300, borderRadius: '50%', perspective: '800px' }}
          onClick={handleCoverClick}
        >
          <motion.div style={{ width: '100%', height: '100%', borderRadius: '50%', transformStyle: 'preserve-3d' }}>
            <div className="w-full h-full rounded-full overflow-hidden" style={{ boxShadow: '0 0 40px rgba(255,255,255,0.1), 0 30px 80px rgba(0,0,0,0.6)' }}>
              <StereoCover
                src={currentMusic?.coverUrl}
                alt={currentMusic?.title}
                size="100%"
                rounded="rounded-full"
                tilt={false}
              />
            </div>
          </motion.div>
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
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: isLiked ? 1 : 0 }}
            onClick={(e) => { e.stopPropagation(); toggleLike() }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center z-20"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? '#ff4d6d' : 'none'} stroke={isLiked ? '#ff4d6d' : 'white'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </motion.button>
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
      className={`flex-1 flex flex-col relative overflow-hidden ${shaking ? 'animate-shake' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* module selector - right side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col items-center gap-1.5 bg-white/[0.04] rounded-2xl p-1.5 border border-white/[0.06]">
          {modules.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveModule(m.key)}
              className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap ${
                activeModule === m.key
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* hearts */}
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

      {/* content */}
      <div className="flex-1 relative min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {!currentMusic ? (
              <Placeholder />
            ) : activeModule === 'today' ? (
              <TodayModule music={currentMusic} cover={currentMusic?.coverUrl || null} lyrics={lyrics} currentLineIndex={currentLineIndex} onCoverClick={handleCoverClick} />
            ) : displayMode === 'orbit' ? (
              <div className="absolute inset-0" style={{ zIndex: 5 }}>
                {orbitContent}
              </div>
            ) : displayMode === 'danmaku' ? (
              <div className="fixed inset-0 overflow-hidden pointer-events-none flex items-center justify-center" style={{ perspective: 1000, zIndex: 10 }}>
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
                      <div key={line.time} className="absolute whitespace-nowrap"
                        style={{
                          left: `${pos.x}%`, top: `${pos.y}%`, rotate: `${pos.rotate}deg`,
                          zIndex: isCurrent ? 50 : undefined,
                          animation: `dDrift ${isClimax ? pos.duration / 1.5 : pos.duration}s ease-in-out infinite`,
                          '--dx': `${pos.driftX}px`, '--dy': `${pos.driftY}px`,
                        } as unknown as React.CSSProperties}
                      >
                        <motion.div
                          animate={{ x: repelX, y: repelY }}
                          transition={{ type: 'spring', stiffness: 500, damping: 22, mass: 0.4 }}
                        >
                          {isCurrent ? (
                            <span className="select-none block leading-tight font-extrabold tracking-tight" style={{
                              fontSize: `clamp(1.2rem, ${1.8 + sizeSeed * 1.5}vw, 2.5rem)`,
                              color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.25)',
                            }}>
                              {line.wordTimings && line.wordTimings.length > 0 ? (
                                line.wordTimings.map((w, i) => {
                                  const progress = Math.min(Math.max((currentTime - w.start) / (w.end - w.start), 0), 1)
                                  return (
                                    <span key={i} className="relative inline">
                                      <span className="text-white/30">{w.word}</span>
                                      <span className="absolute inset-0 text-white overflow-hidden" style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>{w.word}</span>
                                    </span>
                                  )
                                })
                              ) : (line.text || '\u3000')}
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
                  style={{ width: 400, height: 400 }}
                >
                  <StereoCover
                    src={currentMusic?.coverUrl}
                    alt={currentMusic?.title}
                    size={400}
                    rounded="rounded-2xl"
                    tiltAmount={6}
                  />
                </motion.div>
              </div>
            ) : displayMode === 'lixiaofeidao' ? (
              <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ perspective: 1200, zIndex: 10 }}>
                <style>{`@keyframes flyRTL{0%{transform:translateX(calc(100vw + 300px)) rotateY(var(--ry,0deg)) scale(var(--ss,0.75))}50%{transform:translateX(calc(50vw - 50%)) rotateY(0deg) scale(var(--sm,1.15))}100%{transform:translateX(calc(-100% - 100vw - 300px)) rotateY(calc(var(--ry,0deg)*-1)) scale(var(--ss,0.75))}}`}</style>
                <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                  {lyrics.map((line, idx) => {
                    if (idx === currentLineIndex) return null
                    if (!flyPositions.current[line.time]) {
                      const ry = -20 + Math.random() * 40
                      flyPositions.current[line.time] = {
                        y: 5 + Math.random() * 80, duration: 4 + Math.random() * 16,
                        delay: Math.random() * 5, rotateY: ry,
                        scaleStart: 0.7 + Math.random() * 0.3, scaleMid: 1.0 + Math.random() * 0.4,
                      }
                    }
                    const pos = flyPositions.current[line.time]
                    const opacity = 0.25 + Math.sin(line.time * 0.008 + 1) * 0.2
                    return (
                      <div key={line.time} className="absolute whitespace-nowrap"
                        style={{
                          left: 0, top: `${pos.y}%`,
                          animation: `flyRTL ${pos.duration}s linear ${pos.delay}s infinite`,
                          opacity: Math.max(0.1, opacity),
                          '--ry': `${pos.rotateY}deg`, '--ss': pos.scaleStart, '--sm': pos.scaleMid,
                        } as unknown as React.CSSProperties}
                      >
                        <span className="select-none block leading-tight font-bold tracking-tight drop-shadow-xl" style={{
                          fontSize: `clamp(0.85rem, ${1.3 + Math.sin(line.time * 0.005) * 0.6 + 0.6}vw, 2.1rem)`,
                          color: 'rgba(255,255,255,0.7)', textShadow: '0 0 30px rgba(255,255,255,0.08)',
                        }}>
                          {line.text || '\u3000'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="z-20 cursor-pointer pointer-events-auto"
                    onClick={handleCoverClick}
                    style={{ width: 400, height: 400 }}
                  >
                    <StereoCover
                      src={currentMusic?.coverUrl}
                      alt={currentMusic?.title}
                      size={400}
                      rounded="rounded-2xl"
                      tiltAmount={6}
                    />
                  </motion.div>
                </div>
                {currentLineIndex >= 0 && lyrics[currentLineIndex] && (
                  <div className="absolute inset-x-0 pointer-events-none flex justify-center" style={{ bottom: '15%', zIndex: 30 }}>
                    <motion.div
                      key={lyrics[currentLineIndex].time}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center cursor-pointer pointer-events-auto"
                      onClick={() => seek(lyrics[currentLineIndex].time)}
                    >
                      <div className="font-extrabold tracking-tight leading-tight text-white"
                        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                      >
                        {lyrics[currentLineIndex].wordTimings && lyrics[currentLineIndex].wordTimings!.length > 0 ? (
                          lyrics[currentLineIndex].wordTimings!.map((w, i) => {
                            const progress = Math.min(Math.max((currentTime - w.start) / (w.end - w.start), 0), 1)
                            return (
                              <span key={i} className="relative inline">
                                <span className="text-white/30">{w.word}</span>
                                <span className="absolute inset-0 text-white overflow-hidden" style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}>{w.word}</span>
                              </span>
                            )
                          })
                        ) : (
                          <span>{lyrics[currentLineIndex].text || '\u3000'}</span>
                        )}
                      </div>
                      {lyrics[currentLineIndex].translation && (
                        <div className="mt-2 font-semibold text-white/70" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>
                          {lyrics[currentLineIndex].translation}
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 5 }}>
                <ThreeDScene onClose={() => {}} />
                <div style={{
                  position: 'absolute', top: 40, right: 40, zIndex: 10,
                  color: '#9ca3af', fontSize: 13, pointerEvents: 'none', letterSpacing: 1,
                }}>
                  ◇ 鼠标拖拽以旋转 3D 空间，滚轮缩放
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* bottom left tag */}
      <div className="absolute bottom-3 left-6 z-20 text-[9px] tracking-[6px] text-white/10 font-light">
        模组 · {modules.find((m) => m.key === activeModule)?.label}
      </div>
    </div>
  )
}
