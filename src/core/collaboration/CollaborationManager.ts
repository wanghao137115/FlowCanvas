import {
  CollaborationUser,
  CollaborationMessage,
  Operation,
  CursorState,
  Vector2,
  CollaborationSettings
} from '@/types/collaboration.types'
import { UserManager } from './UserManager'
import { CursorManager } from './CursorManager'
import { WebSocketAdapter } from './WebSocketAdapter'
import type { TransportAdapter, TransportConfig } from './TransportAdapter'

/**
 * 消息类型常量
 */
const MESSAGE_TYPES = {
  USER_JOIN: 'user-join',
  USER_LEAVE: 'user-leave',
  USER_LIST: 'user-list',
  OPERATION: 'operation',
  CURSOR: 'cursor',
  SYNC_REQUEST: 'sync-request',
  SYNC_RESPONSE: 'sync-response'
} as const

/**
 * 默认协作设置
 */
const DEFAULT_SETTINGS: CollaborationSettings = {
  enabled: true,
  channelName: 'flowcanvas-collab',
  userName: '',
  showCursors: true,
  cursorFollowDelay: 50,
  showUserList: true
}

/**
 * 协作事件回调
 */
export interface CollaborationCallbacks {
  onUserJoin?: (user: CollaborationUser) => void
  onUserLeave?: (userId: string) => void
  onOperation?: (operation: Operation) => void
  onCursorUpdate?: (cursors: CursorState[]) => void
  onUserListChange?: (users: CollaborationUser[]) => void
  onSyncRequest?: () => void
  onSyncResponse?: (data: any) => void
  onError?: (error: Error) => void
}

/**
 * 协作管理器 - 支持多种传输层 (WebSocket / BroadcastChannel)
 */
export class CollaborationManager {
  private adapter: TransportAdapter | null = null
  private userManager: UserManager
  private cursorManager: CursorManager
  private settings: CollaborationSettings
  private callbacks: CollaborationCallbacks = {}
  private isConnected: boolean = false
  private cursorThrottleTimer: number | null = null
  private heartbeatInterval: number | null = null
  private cleanupInterval: number | null = null

  constructor(
    settings: Partial<CollaborationSettings> = {},
    userName?: string,
    transportConfig?: TransportConfig
  ) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings }

    // 初始化用户管理器
    this.userManager = new UserManager(this.settings.userName || undefined)

    // 初始化光标管理器
    this.cursorManager = new CursorManager({
      showLabel: this.settings.showCursors,
      showTrail: true
    })

    // 设置用户变化监听
    this.userManager.onUserChange((users) => {
      this.callbacks.onUserListChange?.(users)
    })

    // 设置光标变化监听
    this.cursorManager.onCursorChange((cursors) => {
      this.callbacks.onCursorUpdate?.(cursors)
    })

    // 初始化传输层
    this.initTransport(transportConfig)
  }

  /**
   * 初始化传输层
   */
  private initTransport(config?: TransportConfig): void {
    const type = config?.type || 'websocket'
    const url = config?.url || 'ws://localhost:8080'

    switch (type) {
      case 'websocket':
        this.adapter = new WebSocketAdapter(url)
        break
      case 'broadcast':
        // BroadcastChannel 暂时禁用
        console.warn('[Collaboration] BroadcastChannel 已禁用，请使用 WebSocket')
        this.adapter = new WebSocketAdapter(url)
        break
      default:
        this.adapter = new WebSocketAdapter(url)
    }

    // 设置适配器回调
    this.adapter.onMessage(this.handleMessage.bind(this))
    this.adapter.onStatusChange((connected) => {
      this.isConnected = connected
      if (connected) {
        console.log('[Collaboration] 传输层已连接')
      } else {
        console.log('[Collaboration] 传输层已断开')
      }
    })
    this.adapter.onError?.((error) => {
      this.callbacks.onError?.(error)
    })
  }

  /**
   * 获取传输适配器
   */
  getAdapter(): TransportAdapter | null {
    return this.adapter
  }

  /**
   * 切换传输层
   */
  switchTransport(config: TransportConfig): void {
    const wasConnected = this.isConnected
    if (wasConnected) {
      this.disconnect()
    }
    this.initTransport(config)
    if (wasConnected) {
      this.connect()
    }
  }

  /**
   * 初始化并连接协作频道
   */
  async connect(): Promise<void> {
    if (this.isConnected) return

    try {
      // 使用传输适配器连接
      await this.adapter?.connect()

      // 发送加入消息
      this.broadcastMessage({
        type: MESSAGE_TYPES.USER_JOIN,
        userId: this.userManager.getLocalUser().id,
        timestamp: Date.now(),
        payload: this.userManager.exportUserData()
      })

      // 请求同步当前状态
      this.broadcastMessage({
        type: MESSAGE_TYPES.SYNC_REQUEST,
        userId: this.userManager.getLocalUser().id,
        timestamp: Date.now(),
        payload: {}
      })

      // 启动心跳
      this.startHeartbeat()

      // 启动清理定时器
      this.startCleanup()

      this.isConnected = true
      console.log('[Collaboration] 已连接到协作服务')
    } catch (error) {
      console.error('[Collaboration] 连接失败:', error)
      this.callbacks.onError?.(error as Error)
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (!this.isConnected) return

    // 发送离开消息
    this.broadcastMessage({
      type: MESSAGE_TYPES.USER_LEAVE,
      userId: this.userManager.getLocalUser().id,
      timestamp: Date.now(),
      payload: {}
    })

    // 清理资源
    this.stopHeartbeat()
    this.stopCleanup()

    // 断开传输层
    this.adapter?.disconnect()

    // 清理远程用户
    this.userManager.getAllUsers()
      .filter(u => !u.isLocal)
      .forEach(u => this.userManager.removeRemoteUser(u.id))

    this.isConnected = false
    console.log('[Collaboration] 已断开连接')
  }

  /**
   * 广播消息
   */
  private broadcastMessage(message: CollaborationMessage): void {
    if (this.adapter?.isConnected()) {
      // console.log('[Collab] 发送消息:', message.type, message.userId)
      try {
        const serializableMessage = this.makeSerializable(message)
        this.adapter.send(serializableMessage)
      } catch (error) {
        console.error('[Collab] 发送消息失败:', error)
      }
    }
  }

  /**
   * 确保消息可以被序列化（用于 BroadcastChannel）
   * 移除不可序列化的属性，如 HTMLImageElement、Blob 等
   */
  private makeSerializable(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    // 如果是数组，递归处理每个元素
    if (Array.isArray(obj)) {
      return obj.map(item => this.makeSerializable(item))
    }

    // 如果是对象，递归处理每个属性
    if (typeof obj === 'object') {
      const result: any = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key]
          
          // 跳过不可序列化的类型
          if (value instanceof HTMLImageElement || 
              value instanceof Blob || 
              value instanceof File ||
              value instanceof HTMLCanvasElement ||
              value instanceof OffscreenCanvas) {
            console.log(`[Collab] 跳过不可序列化的属性: ${key}`)
            continue
          }
          
          // 递归处理
          result[key] = this.makeSerializable(value)
        }
      }
      return result
    }

    // 基本类型直接返回
    return obj
  }

  /**
   * 处理接收到的消息（从传输适配器）
   */
  private handleMessage(message: CollaborationMessage): void {
    const { type, userId, payload } = message

    // 忽略自己的消息
    if (userId === this.userManager.getLocalUser().id) return

    switch (type) {
      case 'ping':
        // 心跳响应，忽略
        return

      case MESSAGE_TYPES.USER_JOIN:
        this.handleUserJoin(userId, payload)
        break

      case MESSAGE_TYPES.USER_LEAVE:
        this.handleUserLeave(userId)
        break

      case MESSAGE_TYPES.USER_LIST:
        this.handleUserList(payload)
        break

      case MESSAGE_TYPES.OPERATION:
        this.handleOperation(userId, payload)
        break
        
      case MESSAGE_TYPES.CURSOR:
        this.handleCursor(userId, payload)
        break
        
      case MESSAGE_TYPES.SYNC_REQUEST:
        this.handleSyncRequest(userId)
        break
        
      case MESSAGE_TYPES.SYNC_RESPONSE:
        this.handleSyncResponse(userId, payload)
        break
    }
  }

  /**
   * 处理用户加入
   */
  private handleUserJoin(userId: string, payload: CollaborationUser): void {
    const user: CollaborationUser = {
      ...payload,
      id: userId,
      isLocal: false,
      cursor: null
    }
    
    this.userManager.addRemoteUser(user)
    this.callbacks.onUserJoin?.(user)
    
    // 响应新用户，发送当前用户列表
    this.broadcastMessage({
      type: MESSAGE_TYPES.USER_LIST,
      userId: this.userManager.getLocalUser().id,
      timestamp: Date.now(),
      payload: this.userManager.getAllUsers().filter(u => u.isLocal)
    })
  }

  /**
   * 处理用户离开
   */
  private handleUserLeave(userId: string): void {
    this.userManager.removeRemoteUser(userId)
    this.cursorManager.removeCursor(userId)
    this.callbacks.onUserLeave?.(userId)
  }

  /**
   * 处理用户列表更新
   */
  private handleUserList(users: CollaborationUser[]): void {
    users.forEach(user => {
      if (user.id !== this.userManager.getLocalUser().id) {
        this.userManager.addRemoteUser(user)
      }
    })
  }

  /**
   * 处理远程操作
   */
  private handleOperation(userId: string, operation: Operation): void {
    // 添加用户信息
    const enhancedOperation = {
      ...operation,
      userId
    }
    this.callbacks.onOperation?.(enhancedOperation)
  }

  /**
   * 处理远程光标更新
   */
  private handleCursor(userId: string, payload: { position: Vector2; userName: string; color: string }): void {
    const user = this.userManager.getUserById(userId)
    if (user) {
      // 更新远程用户的光标和活跃时间
      this.userManager.updateRemoteCursor(userId, payload.position)
      
      this.cursorManager.updateCursor(
        userId, 
        payload.position, 
        payload.userName || user.name, 
        payload.color || user.color
      )
    }
  }

  /**
   * 处理同步请求
   */
  private handleSyncRequest(userId: string): void {
    // 响应同步请求
    this.broadcastMessage({
      type: MESSAGE_TYPES.SYNC_RESPONSE,
      userId: this.userManager.getLocalUser().id,
      timestamp: Date.now(),
      payload: {
        users: this.userManager.getAllUsers().filter(u => u.isLocal)
      }
    })
  }

  /**
   * 处理同步响应
   */
  private handleSyncResponse(userId: string, payload: { users: CollaborationUser[] }): void {
    if (payload.users) {
      payload.users.forEach(user => {
        if (user.id !== this.userManager.getLocalUser().id) {
          this.userManager.addRemoteUser(user)
        }
      })
    }
    this.callbacks.onSyncResponse?.(payload)
  }

  /**
   * 广播操作
   */
  broadcastOperation(operation: Omit<Operation, 'userId' | 'timestamp'>): void {
    const fullOperation: Operation = {
      ...operation,
      userId: this.userManager.getLocalUser().id,
      timestamp: Date.now()
    }

    this.broadcastMessage({
      type: MESSAGE_TYPES.OPERATION,
      userId: this.userManager.getLocalUser().id,
      timestamp: Date.now(),
      payload: fullOperation
    })
  }

  /**
   * 更新本地光标位置（带节流）
   */
  updateCursor(position: Vector2): void {
    // 更新本地用户的光标
    this.userManager.updateLocalCursor(position)

    // 节流发送光标位置
    if (this.cursorThrottleTimer === null) {
      this.cursorThrottleTimer = window.setTimeout(() => {
        this.cursorThrottleTimer = null
      }, this.settings.cursorFollowDelay)

      const localUser = this.userManager.getLocalUser()
      this.broadcastMessage({
        type: MESSAGE_TYPES.CURSOR,
        userId: localUser.id,
        timestamp: Date.now(),
        payload: {
          position,
          userName: localUser.name,
          color: localUser.color
        }
      })
    }
  }

  /**
   * 启动心跳（定期广播用户状态）
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      const localUser = this.userManager.getLocalUser()
      this.broadcastMessage({
        type: MESSAGE_TYPES.USER_LIST,
        userId: localUser.id,
        timestamp: Date.now(),
        payload: [localUser]
      })
    }, 5000) // 每5秒广播一次
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

  /**
   * 启动清理定时器
   */
  private startCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.userManager.cleanupInactiveUsers(30000) // 30秒超时
    }, 10000) // 每10秒检查一次
  }

  /**
   * 停止清理定时器
   */
  private stopCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * 设置回调
   */
  setCallbacks(callbacks: CollaborationCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * 获取用户管理器
   */
  getUserManager(): UserManager {
    return this.userManager
  }

  /**
   * 获取光标管理器
   */
  getCursorManager(): CursorManager {
    return this.cursorManager
  }

  /**
   * 获取所有用户
   */
  getUsers(): CollaborationUser[] {
    return this.userManager.getAllUsers()
  }

  /**
   * 获取远程用户数量
   */
  getRemoteUserCount(): number {
    return this.userManager.getRemoteUserCount()
  }

  /**
   * 获取本地用户
   */
  getLocalUser(): CollaborationUser {
    return this.userManager.getLocalUser()
  }

  /**
   * 是否已连接
   */
  isActive(): boolean {
    return this.isConnected
  }

  /**
   * 获取设置
   */
  getSettings(): CollaborationSettings {
    return { ...this.settings }
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<CollaborationSettings>): void {
    this.settings = { ...this.settings, ...settings }
    
    // 更新光标显示
    this.cursorManager.updateConfig({
      showLabel: this.settings.showCursors
    })
  }

  /**
   * 设置用户名
   */
  setUserName(name: string): void {
    this.userManager.setUserName(name)
    
    // 广播用户名更新
    this.broadcastMessage({
      type: MESSAGE_TYPES.USER_LIST,
      userId: this.userManager.getLocalUser().id,
      timestamp: Date.now(),
      payload: [this.userManager.exportUserData()]
    })
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.disconnect()
    this.cursorManager.dispose()
  }
}

/**
 * 单例实例
 */
let collaborationInstance: CollaborationManager | null = null

/**
 * 获取协作管理器单例
 */
export function getCollaborationManager(
  settings?: Partial<CollaborationSettings>,
  userName?: string,
  transportConfig?: TransportConfig
): CollaborationManager {
  if (!collaborationInstance) {
    collaborationInstance = new CollaborationManager(settings, userName, transportConfig)
  }
  return collaborationInstance
}

/**
 * 销毁协作管理器单例
 */
export function destroyCollaborationManager(): void {
  if (collaborationInstance) {
    collaborationInstance.dispose()
    collaborationInstance = null
  }
}
