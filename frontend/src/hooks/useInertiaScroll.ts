'use client'

import { useRef, useCallback, useEffect, useState } from 'react'

export function useInertiaScroll(options = { damping: 0.92, maxVelocity: 40 }) {
  const velocityRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const userScrolledRef = useRef(false)
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isFollowing, setIsFollowing] = useState(true)

  const markUserScroll = useCallback(() => {
    userScrolledRef.current = true
    setIsFollowing(false)
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current)
    userScrollTimeoutRef.current = setTimeout(() => {
      userScrolledRef.current = false
      setIsFollowing(true)
    }, 30000)
  }, [])

  const onWheel = useCallback((e: WheelEvent) => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollTop })
    velocityRef.current += e.deltaY * 0.5
    velocityRef.current = Math.min(Math.max(velocityRef.current, -options.maxVelocity), options.maxVelocity)
    markUserScroll()
    e.preventDefault()
  }, [options.maxVelocity, markUserScroll])

  const onPointerDown = useCallback((e: PointerEvent) => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollTop })
    isDraggingRef.current = true
    lastYRef.current = e.clientY
    velocityRef.current = 0
    markUserScroll()
  }, [markUserScroll])

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return
    const delta = lastYRef.current - e.clientY
    velocityRef.current = delta * 0.5
    lastYRef.current = e.clientY
  }, [])

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointerleave', onPointerUp)
    container.style.touchAction = 'none'

    const animate = () => {
      if (userScrolledRef.current && Math.abs(velocityRef.current) > 0.1 && container) {
        container.scrollTop += velocityRef.current
        velocityRef.current *= options.damping
        if (container.scrollTop <= 0) velocityRef.current = 0
        if (container.scrollTop >= container.scrollHeight - container.clientHeight) velocityRef.current = 0
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointerleave', onPointerUp)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [onWheel, onPointerDown, onPointerMove, onPointerUp, options.damping])

  const resetUserScroll = useCallback(() => {
    userScrolledRef.current = false
    velocityRef.current = 0
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current)
      userScrollTimeoutRef.current = null
    }
    setIsFollowing(true)
  }, [])

  return { containerRef, resetUserScroll, isFollowing }
}
