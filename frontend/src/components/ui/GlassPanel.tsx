'use client'

import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { GLASS_MODES } from '@/utils/constants'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function GlassPanel({ children, className = '', style }: Props) {
  const { glassMode } = useUIStore()
  const mode = GLASS_MODES[glassMode]

  return (
    <motion.div
      className={`relative ${className}`}
      style={style}
      animate={{
        background: mode.bg,
        backdropFilter: mode.filter,
        WebkitBackdropFilter: mode.filter,
      }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      <div className="relative z-[1]">
        {children}
      </div>
    </motion.div>
  )
}
