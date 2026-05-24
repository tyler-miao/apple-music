import { WS_URL } from '@/utils/constants'
import { usePlayerStore } from '@/stores/playerStore'

type WSMessageHandler = (data: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, WSMessageHandler[]> = new Map()
  private reconnectTimer: number | null = null
  private roomId: string | null = null
  private userId: string | null = null

  connect(roomId: string, userId?: string) {
    this.roomId = roomId
    this.userId = userId || 'anonymous'
    this.init()
  }

  private init() {
    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        this.send('JOIN', { roomId: this.roomId })
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit(data.type, data.payload)
          if (data.type === 'PLAY' || data.type === 'PAUSE' || data.type === 'SEEK') {
            this.handleSync(data)
          }
        } catch { /* ignore */ }
      }

      this.ws.onclose = () => {
        this.reconnectTimer = window.setTimeout(() => this.init(), 3000)
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } catch { /* ignore */ }
  }

  private handleSync(data: any) {
    const store = usePlayerStore.getState()
    switch (data.type) {
      case 'PLAY':
        store.setIsPlaying(true)
        break
      case 'PAUSE':
        store.setIsPlaying(false)
        break
      case 'SEEK':
        store.setCurrentTime(data.payload.time || 0)
        break
    }
  }

  send(type: string, payload: Record<string, unknown> = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, userId: this.userId, timestamp: Date.now() }))
    }
  }

  on(type: string, handler: WSMessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type)!.push(handler)
  }

  off(type: string, handler: WSMessageHandler) {
    const handlers = this.handlers.get(type)
    if (handlers) {
      this.handlers.set(type, handlers.filter((h) => h !== handler))
    }
  }

  private emit(type: string, payload: any) {
    this.handlers.get(type)?.forEach((h) => h(payload))
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }
}

export const wsService = new WebSocketService()
