import type { CollaborationMessage } from '@/types/collaboration.types'

/**
 * 传输层适配器接口
 * 所有传输层实现需遵循此接口
 */
export interface TransportAdapter {
  /**
   * 连接状态
   */
  isConnected(): boolean

  /**
   * 连接到传输服务
   */
  connect(): Promise<void>

  /**
   * 断开连接
   */
  disconnect(): void

  /**
   * 发送消息
   */
  send(message: CollaborationMessage): void

  /**
   * 设置消息接收回调
   */
  onMessage(handler: (message: CollaborationMessage) => void): void

  /**
   * 设置连接状态变化回调
   */
  onStatusChange(handler: (connected: boolean) => void): void

  /**
   * 设置错误回调
   */
  onError?(handler: (error: Error) => void): void
}

/**
 * 传输层类型
 */
export type TransportType = 'websocket' | 'partykit' | 'broadcast'

/**
 * 传输层配置
 */
export interface TransportConfig {
  type: TransportType
  url?: string        // WebSocket URL
  room?: string       // PartyKit room name
  channelName?: string // BroadcastChannel name
  host?: string       // PartyKit host
}
