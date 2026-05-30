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

function scoreColor([r, g, b]: RGB): number {
  const [h, s, l] = rgbToHsl(r, g, b)
  return s * 0.5 + (1 - Math.abs(l - 0.45)) * 0.5
}

export function extractColorsFromImage(img: HTMLImageElement): ExtractedColors {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  if (!ctx) return getFallbackColors()

  const size = 100
  c.width = size
  c.height = size
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data

  const pixels: RGB[] = []
  for (let i = 0; i < data.length; i += 8) {
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }

  const sorted = [...pixels].sort((a, b) => luminance(b) - luminance(a))
  const topQuarter = sorted.slice(0, Math.floor(sorted.length / 4))
  const midHalf = sorted.slice(Math.floor(sorted.length * 0.2), Math.floor(sorted.length * 0.7))
  const bottomQuarter = sorted.slice(Math.floor(sorted.length * 0.75))

  const bestByScore = (pool: RGB[]) => pool.reduce((best, c) => scoreColor(c) > scoreColor(best) ? c : best)

  const vibrant = topQuarter.length > 0 ? bestByScore(topQuarter) : sorted[0]
  const muted = midHalf.length > 0 ? averageColor(midHalf) : sorted[Math.floor(sorted.length / 2)]
  const dark = bottomQuarter.length > 0 ? averageColor(bottomQuarter) : sorted[sorted.length - 1]
  const light = topQuarter.length > 0 ? averageColor(topQuarter) : sorted[0]

  const f = (rgb: RGB, maxL: number, maxS: number) => {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
    const [r, g, b] = hslToRgb(h, Math.min(s, maxS), Math.min(l, maxL))
    return toRgbString(r, g, b)
  }

  return {
    vibrant: f(vibrant, 0.60, 0.80),
    muted: f(muted, 0.50, 0.65),
    dark: f(dark, 0.20, 0.50),
    light: f(light, 0.65, 0.70),
  }
}

function averageColor(pixels: RGB[]): RGB {
  if (pixels.length === 0) return [60, 60, 70]
  let r = 0, g = 0, b = 0
  for (const p of pixels) { r += p[0]; g += p[1]; b += p[2] }
  return [~~(r / pixels.length), ~~(g / pixels.length), ~~(b / pixels.length)]
}

function getFallbackColors(): ExtractedColors {
  return {
    vibrant: 'rgb(60, 55, 70)',
    muted: 'rgb(45, 40, 50)',
    dark: 'rgb(18, 16, 22)',
    light: 'rgb(55, 50, 65)',
  }
}
