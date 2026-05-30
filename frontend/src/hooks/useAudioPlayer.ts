'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'
import { useUIStore } from '@/stores/uiStore'
import { audioEngine } from '@/lib/audio-engine'
import { gdService } from '@/services/gd-api.service'
import { LRCParser } from '@/lib/lrc-parser'
import { extractColorsFromImage } from '@/lib/color-thief'
import { wsService } from '@/services/websocket.service'

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const {
    currentMusic, isPlaying, volume, isMuted,
    setCurrentTime, setDuration, setIsPlaying, nextTrack, playbackMode,
    setAudioElement,
  } = usePlayerStore()
  const { setLyrics } = useLyricStore()
  const { setCoverColors } = useUIStore()

  const syncIntervalRef = useRef<number | null>(null)
  const prevMusicIdRef = useRef<string | null>(null)
  const pendingPlayRef = useRef(false)
  const canPlayHandlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto'
      audioRef.current.volume = 1
    }
    const audio = audioRef.current
    setAudioElement(audio)

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      if (playbackMode === 'repeat') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        nextTrack()
      }
    }
    const onError = () => console.error('[Audio]', audio.error?.message)
    const onCanPlay = () => {
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false
        audio.play().catch(() => {})
      }
    }
    const onCanPlayThrough = () => {
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false
        audio.play().catch(() => {})
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('canplaythrough', onCanPlayThrough)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('canplaythrough', onCanPlayThrough)
    }
  }, [nextTrack, setCurrentTime, setDuration, playbackMode])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying && currentMusic) {
      const expectedSrc = currentMusic.audioUrl || currentMusic.sourceId || ''
      const hasCorrectSrc = expectedSrc && audio.src === expectedSrc
      if (audio.readyState >= 2 && hasCorrectSrc) {
        audio.play().catch(() => {})
      } else {
        pendingPlayRef.current = true
      }
    } else {
      pendingPlayRef.current = false
      audio.pause()
    }
  }, [isPlaying, currentMusic, setIsPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
    audioEngine.setVolume(isMuted ? 0 : volume)
  }, [volume, isMuted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentMusic) return
    const musicId = currentMusic.id
    let cancelled = false

    if (currentMusic.id !== prevMusicIdRef.current) {
      prevMusicIdRef.current = currentMusic.id

      const source = currentMusic.source || 'netease'
      const sourceId = currentMusic.sourceId || currentMusic.id.replace(/^[^-]+-/, '')

      gdService.getPic(currentMusic.picId || '', source, 500).then((url) => {
        if (!url) return
        const state = usePlayerStore.getState()
        if (state.currentMusic?.id === currentMusic.id) {
          state.setCurrentMusic({ ...state.currentMusic!, coverUrl: url })
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => setCoverColors(extractColorsFromImage(img))
          img.src = url
        }
      })

      gdService.getLyric(currentMusic.lyricId || sourceId, source).then((d) => {
        if (!d.lyric) return
        const state = usePlayerStore.getState()
        if (state.currentMusic?.id === currentMusic.id) {
          const c = d.tlyric ? d.lyric + '\n' + d.tlyric : d.lyric
          setLyrics(LRCParser.parse(c))
        }
      })
    }

    ;(async () => {
      let audioUrl = currentMusic.audioUrl

      if (!audioUrl) {
        const source = currentMusic.source || 'netease'
        const sourceId = currentMusic.sourceId || musicId.replace(/^[^-]+-/, '')
        audioUrl = await gdService.getUrl(sourceId, source, 320)
        if (!audioUrl) return
      }

      if (cancelled) return
      if (audioUrl && audio.src !== audioUrl) {
        pendingPlayRef.current = true
        audio.pause()

        if (!audioEngine['ctx'] || audio !== (audioEngine as any).audioElement) {
          await audioEngine.connect(audio)
        }
        audio.crossOrigin = 'anonymous'
        audio.src = audioUrl
        audio.load()
      }
    })()
    return () => { cancelled = true }
  }, [currentMusic])

  const loadCoverColors = useCallback(() => {
    if (!currentMusic?.coverUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const colors = extractColorsFromImage(img)
      setCoverColors(colors)
      document.documentElement.style.setProperty('--cover-vibrant', colors.vibrant)
      document.documentElement.style.setProperty('--cover-muted', colors.muted)
    }
    img.src = currentMusic.coverUrl
  }, [currentMusic?.coverUrl, setCoverColors])

  useEffect(() => {
    loadCoverColors()
  }, [loadCoverColors])

  useEffect(() => {
    if (isPlaying) {
      syncIntervalRef.current = window.setInterval(() => {
        wsService.send('SYNC', {
          time: audioRef.current?.currentTime || 0,
          musicId: currentMusic?.id,
          isPlaying: true,
        })
      }, 3000)
    }
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [isPlaying, currentMusic])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [setCurrentTime])

  return { audioRef, seek }
}
