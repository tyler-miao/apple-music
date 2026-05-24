'use client'

import { motion } from 'framer-motion'
import { LyricLine as LyricLineType, WordTiming } from '@/types'
import { usePlayerStore } from '@/stores/playerStore'

interface Props {
  line: LyricLineType
  isActive: boolean
  index: number
  onClick: () => void
}

function WordTimingRender({ timings, currentTime }: { timings: WordTiming[]; currentTime: number }) {
  return (
    <span>
      {timings.map((w, i) => {
        const progress = Math.min(Math.max((currentTime - w.start) / (w.end - w.start), 0), 1)
        return (
          <span key={i} className="relative inline">
            <span className="text-white/30">{w.word}</span>
            <span
              className="absolute inset-0 text-white overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}
            >
              {w.word}
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function LyricLine({ line, isActive, index, onClick }: Props) {
  const { currentTime } = usePlayerStore()

  return (
    <motion.div
      layout
      onClick={onClick}
      className="lyric-line cursor-pointer select-none"
      animate={{
        opacity: isActive ? 1 : 0.25,
        filter: isActive ? 'blur(0px)' : 'blur(1.5px)',
        scale: isActive ? 1 : 0.92,
      }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ opacity: isActive ? 1 : 0.5, filter: 'blur(0px)' }}
    >
      <div className={`font-extrabold tracking-tight leading-tight ${isActive ? 'text-white' : 'text-white/70'}`}
        style={{ fontSize: isActive ? 'clamp(2rem, 5vw, 3.5rem)' : 'clamp(1.6rem, 4vw, 2.8rem)' }}
      >
        {line.wordTimings && line.wordTimings.length > 0 ? (
          <WordTimingRender timings={line.wordTimings} currentTime={currentTime} />
        ) : isActive ? (
          <span className="shimmer-text">{line.text}</span>
        ) : (
          line.text
        )}
      </div>
      {line.translation && (
        <motion.div
          className="mt-2 font-semibold"
          animate={{
            color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
          }}
          transition={{ duration: 0.6 }}
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}
        >
          {line.translation}
        </motion.div>
      )}
    </motion.div>
  )
}
