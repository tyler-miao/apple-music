export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export function parseRgb(str: string): [number, number, number] {
  const m = str.match(/(?:rgb|rgba)\((\d+),\s*(\d+),\s*(\d+)/)
  return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [100, 60, 80]
}

export function toRgbString(r: number, g: number, b: number, a = 1): string {
  return a < 1 ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`
}

export function processCoverColors(vibrant: string, muted: string, dark: string): [string, string, string] {
  return [vibrant, muted, dark].map((c) => {
    const rgb = parseRgb(c)
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
    const clampedL = Math.max(0.20, Math.min(l, 0.45))
    const clampedS = Math.min(s, 0.65)
    const [r, g, b] = hslToRgb(h, clampedS, clampedL)
    return toRgbString(r, g, b, 0.75)
  }) as [string, string, string]
}
