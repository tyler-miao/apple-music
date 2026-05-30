'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface StereoCoverProps {
  src?: string | null
  alt?: string
  size?: number | string
  className?: string
  rounded?: string
  tilt?: boolean
  tiltAmount?: number
  onClick?: () => void
}

export function StereoCover({
  src,
  alt = '',
  size,
  className = '',
  rounded = 'rounded-2xl',
  tilt = true,
  tiltAmount = 8,
  onClick,
}: StereoCoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tilt || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setRotate({ x: -y * tiltAmount, y: x * tiltAmount })
  }, [tilt, tiltAmount])

  const handleMouseLeave = useCallback(() => {
    setRotate({ x: 0, y: 0 })
    setIsHovered(false)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative cursor-pointer flex-shrink-0 overflow-hidden ${rounded} ${className}`}
      style={{
        perspective: '1000px',
        width: typeof size === 'number' ? size : size || '100%',
        aspectRatio: 1,
        willChange: 'transform',
      }}
    >
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        className="w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover pointer-events-none select-none"
            style={{ backfaceVisibility: 'hidden' }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <svg width="30%" height="30%" viewBox="0 0 24 24" fill="white" opacity="0.15">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 'inherit',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 45%, rgba(255,255,255,0.02) 100%)',
            mixBlendMode: 'overlay',
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 'inherit',
            boxShadow: isHovered
              ? '0 0 0 1px rgba(255,255,255,0.2) inset, 0 40px 80px rgba(0,0,0,0.6)'
              : '0 0 0 1px rgba(255,255,255,0.1) inset, 0 20px 60px rgba(0,0,0,0.4)',
          }}
        />
      </motion.div>
    </div>
  )
}
