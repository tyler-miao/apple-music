import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import config from '../config'

const execAsync = promisify(exec)

export class FFmpegService {
  static async extractCover(audioPath: string, outputPath?: string): Promise<string | null> {
    const outPath = outputPath || path.join(config.uploadDir, `cover_${path.basename(audioPath)}.jpg`)
    if (fs.existsSync(outPath)) return outPath

    try {
      await execAsync(`ffmpeg -i "${audioPath}" -an -vcodec copy "${outPath}" -y`)
      return outPath
    } catch {
      return null
    }
  }

  static async convertToMp3(inputPath: string, outputPath?: string): Promise<string> {
    const outPath = outputPath || inputPath.replace(path.extname(inputPath), '.mp3')
    try {
      await execAsync(`ffmpeg -i "${inputPath}" -codec:a libmp3lame -qscale:a 2 "${outPath}" -y`)
      return outPath
    } catch {
      throw new Error('音频转换失败')
    }
  }

  static async getDuration(audioPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      )
      return parseFloat(stdout.trim()) || 0
    } catch {
      return 0
    }
  }

  static async generateWaveform(audioPath: string): Promise<number[]> {
    try {
      const { stdout } = await execAsync(
        `ffmpeg -i "${audioPath}" -ac 1 -filter:a "aresample=8000" -f f32le pipe:1 2>nul | ffmpeg -f f32le -ar 8000 -ac 1 -i pipe:0 -filter:a "compand" -f null - 2>&1`
      )
      const samples = Buffer.from(stdout, 'binary')
      const waveform: number[] = []
      for (let i = 0; i < samples.length; i += 4) {
        waveform.push(samples.readFloatLE(i))
      }
      return waveform
    } catch {
      return []
    }
  }
}
