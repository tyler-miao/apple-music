import { rgbToHsl, hslToRgb, toRgbString } from './color'

export interface ExtractedColors {
  vibrant: string
  muted: string
  dark: string
  light: string
}

type RGB = [number, number, number]

function luminance([r, g, b]: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function chroma([r, g, b]: RGB): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return (max - min) / 255
}

function scoreColor([r, g, b]: RGB): number {
  const [h, s, l] = rgbToHsl(r, g, b)
  return s * 1.2 + chroma([r, g, b]) * 0.6 + (1 - Math.abs(l - 0.5)) * 0.4
}

export function extractColorsFromImage(img: HTMLImageElement): ExtractedColors {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  if (!ctx) return getFallbackColors()

  const size = 120
  c.width = size
  c.height = size
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data

  const pixels: RGB[] = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 128) continue
    const [h, s, l] = rgbToHsl(r, g, b)
    if (l < 0.05 || l > 0.95 || s < 0.05) continue
    pixels.push([r, g, b])
  }

  if (pixels.length < 10) return getFallbackColors()

  const sorted = [...pixels].sort((a, b) => luminance(b) - luminance(a))
  const topThird = sorted.slice(0, Math.floor(sorted.length / 3))
  const midThird = sorted.slice(Math.floor(sorted.length / 3), Math.floor(sorted.length * 2 / 3))
  const bottomThird = sorted.slice(Math.floor(sorted.length * 2 / 3))

  const bestByScore = (pool: RGB[]) => pool.reduce((best, c) => scoreColor(c) > scoreColor(best) ? c : best)

  const rawVibrant = bestByScore(topThird.length > 0 ? topThird : sorted)
  const rawMuted = bestByScore(midThird.length > 0 ? midThird : sorted)
  const dark = bottomThird.length > 0 ? bottomThird.reduce((a, b) => luminance(a) < luminance(b) ? a : b) : sorted[sorted.length - 1]
  const light = topThird.length > 0 ? topThird.reduce((a, b) => luminance(a) > luminance(b) ? a : b) : sorted[0]

  const f = (rgb: RGB, boostS = 1.0, targetL?: number) => {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
    const ns = Math.min(s * boostS, 0.85)
    const nl = targetL !== undefined ? targetL : Math.max(0.15, Math.min(l, 0.72))
    const [r, g, b] = hslToRgb(h, ns, nl)
    return toRgbString(r, g, b)
  }

  return {
    vibrant: f(rawVibrant, 1.3, 0.55),
    muted: f(rawMuted, 1.1, 0.40),
    dark: f(dark, 1.0, 0.12),
    light: f(light, 0.9, 0.65),
  }
}

function getFallbackColors(): ExtractedColors {
  return {
    vibrant: 'rgb(180, 80, 120)',
    muted: 'rgb(100, 60, 80)',
    dark: 'rgb(16, 14, 22)',
    light: 'rgb(200, 150, 170)',
  }
}
