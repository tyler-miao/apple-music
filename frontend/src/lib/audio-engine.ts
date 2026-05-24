export class AudioEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private audioElement: HTMLAudioElement | null = null
  private animationId: number | null = null
  private listeners: Array<() => void> = []

  private _frequencyData = new Uint8Array(64)
  private _waveformData = new Uint8Array(64)
  private _analyserBlocked = false

  get frequencyData(): Uint8Array { return this._frequencyData }
  get waveformData(): Uint8Array { return this._waveformData }

  connect(audio: HTMLAudioElement) {
    this.audioElement = audio
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    this.source = this.ctx.createMediaElementSource(audio)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 128
    this.gainNode = this.ctx.createGain()
    this.source.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.ctx.destination)
    this._frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this._waveformData = new Uint8Array(this.analyser.frequencyBinCount)
    this.startAnalyzing()
  }

  private startAnalyzing() {
    const analyze = () => {
      if (this.analyser && !this._analyserBlocked) {
        try {
          this.analyser.getByteFrequencyData(this._frequencyData)
          this.analyser.getByteTimeDomainData(this._waveformData)
        } catch {
          this._analyserBlocked = true
        }
      }
      this.animationId = requestAnimationFrame(analyze)
    }
    analyze()
  }

  setVolume(value: number) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(value, this.ctx?.currentTime || 0)
    }
  }

  fadeIn(duration = 500) {
    if (!this.gainNode || !this.ctx) return
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime)
    this.gainNode.gain.linearRampToValueAtTime(1, this.ctx.currentTime + duration / 1000)
  }

  fadeOut(duration = 300) {
    if (!this.gainNode || !this.ctx) return
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime)
    this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration / 1000)
  }

  onEnded(callback: () => void) {
    this.listeners.push(callback)
    if (this.audioElement) {
      this.audioElement.addEventListener('ended', callback)
    }
  }

  disconnect() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    if (this.source) this.source.disconnect()
    if (this.analyser) this.analyser.disconnect()
    if (this.gainNode) this.gainNode.disconnect()
    this.listeners.forEach((cb) => {
      if (this.audioElement) this.audioElement.removeEventListener('ended', cb)
    })
    this.listeners = []
    this.source = null
    this.analyser = null
    this.gainNode = null
  }

  destroy() {
    this.disconnect()
    if (this.ctx) this.ctx.close()
    this.ctx = null
    this.audioElement = null
  }
}

export const audioEngine = new AudioEngine()
