'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'

export function useLyricsSync() {
  const { currentTime, isPlaying } = usePlayerStore()
  const { lyrics, setCurrentLineIndex } = useLyricStore()
  const prevIndexRef = useRef(-1)

  useEffect(() => {
    let activeIndex = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) activeIndex = i
      else break
    }

    if (activeIndex !== prevIndexRef.current) {
      prevIndexRef.current = activeIndex
      setCurrentLineIndex(activeIndex)
    }
  }, [currentTime, lyrics, setCurrentLineIndex])

  useEffect(() => {
    if (!isPlaying || lyrics.length === 0) return
    let rafId: number
    const tick = () => {
      const { currentTime: ct } = usePlayerStore.getState()
      let activeIndex = -1
      for (let i = 0; i < lyrics.length; i++) {
        if (ct >= lyrics[i].time) activeIndex = i
        else break
      }
      if (activeIndex !== prevIndexRef.current) {
        prevIndexRef.current = activeIndex
        setCurrentLineIndex(activeIndex)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying, lyrics, setCurrentLineIndex])
}
