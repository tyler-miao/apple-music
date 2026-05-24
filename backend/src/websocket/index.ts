import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { WSMessage } from '../types'

interface WsClient extends WebSocket {
  userId?: string
  roomId?: string
  isAlive?: boolean
}

export class WSManager {
  private wss: WebSocketServer
  private rooms: Map<string, Set<WsClient>> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(port: number) {
    this.wss = new WebSocketServer({ port })
    this.setup()
  }

  private setup() {
    this.wss.on('connection', (ws: WsClient, req: IncomingMessage) => {
      ws.isAlive = true

      ws.on('pong', () => { ws.isAlive = true })

      ws.on('message', (data) => {
        try {
          const msg: WSMessage = JSON.parse(data.toString())
          this.handleMessage(ws, msg)
        } catch { /* ignore malformed */ }
      })

      ws.on('close', () => {
        if (ws.userId && ws.roomId) {
          this.leaveRoom(ws)
        }
      })

      ws.send(JSON.stringify({ type: 'CONNECTED', payload: { message: 'WebSocket connected' } }))
    })

    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((client) => {
        const ws = client as WsClient
        if (ws.isAlive === false) return ws.terminate()
        ws.isAlive = false
        ws.ping()
      })
    }, 30000)

    this.wss.on('close', () => {
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    })
  }

  private handleMessage(client: WsClient, msg: WSMessage) {
    switch (msg.type) {
      case 'JOIN':
        client.userId = msg.userId
        client.roomId = msg.payload.roomId as string
        this.joinRoom(client)
        break
      case 'LEAVE':
        this.leaveRoom(client)
        break
      case 'PLAY':
      case 'PAUSE':
      case 'SEEK':
      case 'TRACK_CHANGE':
      case 'SYNC':
      case 'VOLUME':
        this.broadcastToRoom(client.roomId, msg, client.userId)
        break
    }
  }

  private joinRoom(client: WsClient) {
    if (!client.roomId) return
    if (!this.rooms.has(client.roomId)) {
      this.rooms.set(client.roomId, new Set())
    }
    this.rooms.get(client.roomId)!.add(client)
    this.broadcastToRoom(client.roomId, {
      type: 'SYNC',
      payload: { message: `${client.userId} joined room` },
    })
  }

  private leaveRoom(client: WsClient) {
    if (!client.roomId) return
    const room = this.rooms.get(client.roomId)
    if (room) {
      room.delete(client)
      if (room.size === 0) this.rooms.delete(client.roomId)
    }
    this.broadcastToRoom(client.roomId, {
      type: 'SYNC',
      payload: { message: `${client.userId} left room` },
    })
  }

  private broadcastToRoom(roomId: string | undefined, msg: WSMessage, excludeUserId?: string) {
    if (!roomId) return
    const room = this.rooms.get(roomId)
    if (!room) return
    const data = JSON.stringify(msg)
    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== excludeUserId) {
        client.send(data)
      }
    })
  }
}
