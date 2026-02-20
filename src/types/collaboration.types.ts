/**
 * 协作系统类型定义
 */

/**
 * 协作用户
 */
export interface CollaborationUser {
  id: string
  name: string
  color: string
  avatar?: string
  cursor: Vector2 | null
  lastActive: number
  isLocal: boolean
}

/**
 * 光标状态
 */
export interface CursorState {
  position: Vector2
  color: string
  userId: string
  userName: string
  lastUpdate: number
}

/**
 * 协作事件类型
 */
export type CollaborationEventType = 
  | 'user-join'
  | 'user-leave'
  | 'user-list'
  | 'operation'
  | 'cursor'
  | 'sync-request'
  | 'sync-response'

/**
 * 协作消息
 */
export interface CollaborationMessage {
  type: CollaborationEventType
  userId: string
  timestamp: number
  payload: any
}

/**
 * 操作类型
 */
export type OperationType = 
  | 'add-element'
  | 'delete-element'
  | 'update-element'
  | 'move-element'
  | 'resize-element'
  | 'rotate-element'
  | 'add-layer'
  | 'delete-layer'
  | 'update-layer'
  | 'clear-canvas'

/**
 * 操作数据
 */
export interface Operation {
  id: string
  type: OperationType
  elementId?: string
  layerId?: string
  data: any
  previousData?: any
  userId: string
  timestamp: number
}

/**
 * 协作设置
 */
export interface CollaborationSettings {
  enabled: boolean
  channelName: string
  userName: string
  showCursors: boolean
  cursorFollowDelay: number
  showUserList: boolean
}

/**
 * 2D向量
 */
export interface Vector2 {
  x: number
  y: number
}

/**
 * 协作者在线状态
 */
export interface UserPresence {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
}
