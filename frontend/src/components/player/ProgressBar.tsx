'use client'

import { useRef, useCallback } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { formatTime } from '@/utils/format'

export function ProgressBar() {
  const { currentTime, duration, seek } = usePlayerStore()
  const barRef = useRef<HTMLDivElement>(null)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleClick = useCallback((e: React.MouseEvent) => {
    const bar = barRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    seek(x * duration)
  }, [duration, seek])

  return (
    <div className="flex items-center gap-3 flex-1">
      <span className="text-xs text-white/50 w-10 text-right tabular-nums">
        {formatTime(currentTime)}
      </span>
      <div
        ref={barRef}
        className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative overflow-hidden"
        onClick={handleClick}
      >
        <div
          className="h-full bg-white rounded-full transition-[width] duration-75 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>
      <span className="text-xs text-white/50 w-10 tabular-nums">
        {formatTime(duration)}
      </span>
    </div>
  )
}
