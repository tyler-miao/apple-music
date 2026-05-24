import { ParsedLyrics, LyricLine, WordTiming } from '@/types'

export class LRCParser {
  static parse(content: string): ParsedLyrics {
    const lines = content.split('\n')
    const result: LyricLine[] = []
    const metadata: Record<string, string> = {}
    let format: ParsedLyrics['format'] = 'lrc'
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/
    const metadataRegex = /^\[(\w+):(.+)\]$/
    const wordRegex = /<(\d{1,3}:\d{2}\.\d{2,3})>([^<]+)/g
    let lastPrimary: LyricLine | null = null

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue

      const metaMatch = metadataRegex.exec(line)
      if (metaMatch) {
        metadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim()
        continue
      }

      const match = timeRegex.exec(line)
      if (!match) continue

      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3].padEnd(3, '0'))
      const time = minutes * 60 + seconds + ms / 1000
      const text = line.replace(timeRegex, '').trim()
      if (!text) continue

      if (wordRegex.test(line)) format = 'enhanced'
      wordRegex.lastIndex = 0

      const wordTimings = LRCParser.parseWordTimings(line)
      const isChinese = /[\u4e00-\u9fa5]/.test(text)

      if (result.length > 0 && Math.abs(result[result.length - 1].time - time) < 0.15) {
        result[result.length - 1].translation = text
      } else if (lastPrimary && isChinese && !/[a-zA-Z]/.test(text) && time - lastPrimary.time < 1.5) {
        lastPrimary.translation = text
      } else {
        const entry: LyricLine = { time, text }
        if (wordTimings.length > 0) entry.wordTimings = wordTimings
        result.push(entry)
        lastPrimary = entry
      }
    }

    return {
      format,
      lines: result.sort((a, b) => a.time - b.time),
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    }
  }

  static parseWordTimings(line: string): WordTiming[] {
    const timings: WordTiming[] = []
    const regex = /<(\d{1,3}:\d{2}\.\d{2,3})>([^<]+)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(line)) !== null) {
      const [_, timeStr, word] = match
      const [m, s] = timeStr.split(':')
      const sec = parseInt(m) * 60 + parseFloat(s)
      timings.push({ word: word.trim(), start: sec, end: sec + 0.3 })
      if (timings.length > 1) {
        timings[timings.length - 2].end = sec
      }
    }
    return timings
  }

  static generateTimeline(lines: LyricLine[]): LyricLine[] {
    for (let i = 0; i < lines.length; i++) {
      const next = lines[i + 1]
      lines[i].duration = next ? next.time - lines[i].time : 5
    }
    return lines
  }
}
