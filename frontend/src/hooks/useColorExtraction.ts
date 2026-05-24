'use client'

import { useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { extractColorsFromImage } from '@/lib/color-thief'

export function useColorExtraction() {
  const { setCoverColors } = useUIStore()

  const extractFromUrl = useCallback((url: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const colors = extractColorsFromImage(img)
      setCoverColors(colors)
    }
    img.src = url
  }, [setCoverColors])

  const extractFromFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const colors = extractColorsFromImage(img)
      setCoverColors(colors)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [setCoverColors])

  return { extractFromUrl, extractFromFile }
}
