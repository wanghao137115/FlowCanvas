import type { CollaborationMessage } from '@/types/collaboration.types'
import type { TransportAdapter } from './TransportAdapter'

/**
 * WebSocket 传输适配器
 * 支持自动重连、心跳检测
 */
export class WebSocketAdapter implements TransportAdapter {
  private socket: WebSocket | null = null
  private messageHandler: ((msg: CollaborationMessage) => void) | null = null
  private statusHandler: ((connected: boolean) => void) | null = null
  private errorHandler: ((error: Error) => void) | null = null
  
  private _isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private heartbeatInterval: number | null = null
  private reconnectTimeout: number | null = null
  
  private readonly url: string
  private readonly protocols?: string | string[]

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
  }

  isConnected(): boolean {
    return this._isConnected && this.socket?.readyState === WebSocket.OPEN
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果已连接，不再重复连接
      if (this._isConnected && this.socket?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      // 关闭现有连接
      if (this.socket) {
        this.socket.close()
        this.socket = null
      }

      try {
        console.log('[WebSocket] 正在连接:', this.url)
        this.socket = new WebSocket(this.url, this.protocols)

        this.socket.addEventListener('open', () => {
          console.log('[WebSocket] 连接成功')
          this._isConnected = true
          this.reconnectAttempts = 0
          this.statusHandler?.(true)
          this.startHeartbeat()
          resolve()
        })

        this.socket.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data as string) as CollaborationMessage
            // console.log('[WebSocket] 收到消息:', message.type)
            this.messageHandler?.(message)
          } catch (e) {
            console.error('[WebSocket] 消息解析失败:', e)
          }
        })

        this.socket.addEventListener('close', (event) => {
          console.log('[WebSocket] 连接关闭:', event.code, event.reason)
          this._isConnected = false
          this.statusHandler?.(false)
          this.stopHeartbeat()
          
          // 非正常关闭时尝试重连
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect()
          }
        })

        this.socket.addEventListener('error', (error) => {
          console.error('[WebSocket] 连接错误')
          this.errorHandler?.(new Error('WebSocket connection error'))
          reject(error)
        })
      } catch (error) {
        console.error('[WebSocket] 创建连接失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] 最大重连次数已到达，停止重连')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts
    
    console.log(`[WebSocket] ${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连...`)
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect().catch(() => {
        // 连接失败会触发 close 事件，继续重连流程
      })
    }, delay)
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.socket?.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      }
    }, 30000) // 每 30 秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  send(message: CollaborationMessage): void {
    if (this.isConnected()) {
      try {
        this.socket?.send(JSON.stringify(message))
      } catch (error) {
        console.error('[WebSocket] 发送消息失败:', error)
      }
    } else {
      console.warn('[WebSocket] 未连接，消息无法发送:', message.type)
    }
  }

  onMessage(handler: (message: CollaborationMessage) => void): void {
    this.messageHandler = handler
  }

  onStatusChange(handler: (connected: boolean) => void): void {
    this.statusHandler = handler
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler
  }

  /**
   * 断开连接（不自动重连）
   */
  disconnect(): void {
    console.log('[WebSocket] 主动断开连接')
    
    // 停止所有定时器
    this.stopHeartbeat()
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    // 阻止自动重连
    this.maxReconnectAttempts = 0
    
    // 关闭连接
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }
    
    this._isConnected = false
    this.statusHandler?.(false)
  }

  /**
   * 手动触发重连
   */
  reconnect(): void {
    this.maxReconnectAttempts = 5
    this.reconnectAttempts = 0
    this.disconnect()
    this.connect().catch(() => {})
  }

  /**
   * 获取重连次数
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts
  }

  /**
   * 设置最大重连次数
   */
  setMaxReconnectAttempts(max: number): void {
    this.maxReconnectAttempts = max
  }
}
