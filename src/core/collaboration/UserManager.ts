import { CollaborationUser } from '@/types/collaboration.types'

/**
 * 用户名称生成
 */
const ADJECTIVES = ['Happy', 'Clever', 'Swift', 'Bright', 'Bold', 'Calm', 'Eager', 'Gentle', 'Kind', 'Noble']
const ANIMALS = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Bear', 'Hawk', 'Lion', 'Owl']

/**
 * 预设用户颜色
 */
const USER_COLORS = [
  '#FF6B6B', // 红色
  '#4ECDC4', // 青色
  '#45B7D1', // 蓝色
  '#96CEB4', // 绿色
  '#FFEAA7', // 黄色
  '#DDA0DD', // 紫色
  '#98D8C8', // 薄荷
  '#F7DC6F', // 金色
  '#BB8FCE', // 紫罗兰
  '#85C1E9', // 天蓝
  '#F8B500', // 橙色
  '#00CED1', // 深青
]

/**
 * 用户管理器 - 负责管理本地用户和远程用户
 */
export class UserManager {
  private localUser: CollaborationUser
  private remoteUsers: Map<string, CollaborationUser> = new Map()
  private onUserChangeCallback: ((users: CollaborationUser[]) => void) | null = null

  constructor(userName?: string) {
    this.localUser = this.createLocalUser(userName)
  }

  /**
   * 创建本地用户
   */
  private createLocalUser(userName?: string): CollaborationUser {
    const id = this.generateUserId()
    const name = userName || this.generateRandomName()
    const color = this.assignColor()

    return {
      id,
      name,
      color,
      cursor: null,
      lastActive: Date.now(),
      isLocal: true
    }
  }

  /**
   * 生成用户ID
   */
  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成随机用户名
   */
  private generateRandomName(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    const number = Math.floor(Math.random() * 100)
    return `${adj}${animal}${number}`
  }

  /**
   * 分配颜色（尽量选择不重复的颜色）
   */
  private assignColor(): string {
    const usedColors = new Set([
      this.localUser?.color,
      ...Array.from(this.remoteUsers.values()).map(u => u.color)
    ])
    
    for (const color of USER_COLORS) {
      if (!usedColors.has(color)) {
        return color
      }
    }
    
    // 如果都使用了，随机返回一个
    return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  }

  /**
   * 获取本地用户
   */
  getLocalUser(): CollaborationUser {
    return this.localUser
  }

  /**
   * 获取所有用户
   */
  getAllUsers(): CollaborationUser[] {
    return [
      this.localUser,
      ...Array.from(this.remoteUsers.values())
    ]
  }

  /**
   * 获取远程用户数量
   */
  getRemoteUserCount(): number {
    return this.remoteUsers.size
  }

  /**
   * 根据ID获取用户
   */
  getUserById(userId: string): CollaborationUser | undefined {
    if (userId === this.localUser.id) {
      return this.localUser
    }
    return this.remoteUsers.get(userId)
  }

  /**
   * 添加远程用户
   */
  addRemoteUser(user: CollaborationUser): void {
    if (user.id === this.localUser.id) return
    
    // 检查用户是否已存在，如果已存在则不重复添加
    const existingUser = this.remoteUsers.get(user.id)
    if (existingUser) {
      // 用户已存在，不重复触发通知
      return
    }
    
    // 分配一个不重复的颜色
    const userWithColor = {
      ...user,
      color: user.color || this.assignColor()
    }
    
    this.remoteUsers.set(user.id, userWithColor)
    this.notifyUserChange()
  }

  /**
   * 更新远程用户
   */
  updateRemoteUser(userId: string, updates: Partial<CollaborationUser>, notify: boolean = true): void {
    const user = this.remoteUsers.get(userId)
    if (user) {
      this.remoteUsers.set(userId, { ...user, ...updates })
      if (notify) {
        this.notifyUserChange()
      }
    }
  }

  /**
   * 移除远程用户
   */
  removeRemoteUser(userId: string): void {
    if (this.remoteUsers.delete(userId)) {
      this.notifyUserChange()
    }
  }

  /**
   * 更新本地用户光标位置
   */
  updateLocalCursor(position: { x: number; y: number } | null): void {
    this.localUser.cursor = position
    this.localUser.lastActive = Date.now()
  }

  /**
   * 更新远程用户光标位置
   */
  updateRemoteCursor(userId: string, position: { x: number; y: number } | null): void {
    // 只更新 lastActive，不触发用户列表变化通知（避免频繁更新 UI）
    this.updateRemoteUser(userId, { 
      cursor: position, 
      lastActive: Date.now() 
    }, false)
  }

  /**
   * 设置用户变化回调
   */
  onUserChange(callback: (users: CollaborationUser[]) => void): void {
    this.onUserChangeCallback = callback
  }

  /**
   * 通知用户变化
   */
  private notifyUserChange(): void {
    if (this.onUserChangeCallback) {
      this.onUserChangeCallback(this.getAllUsers())
    }
  }

  /**
   * 清理不活跃的用户（超时移除）
   */
  cleanupInactiveUsers(timeout: number = 30000): void {
    const now = Date.now()
    const inactiveUsers: string[] = []

    this.remoteUsers.forEach((user, id) => {
      if (now - user.lastActive > timeout) {
        inactiveUsers.push(id)
      }
    })

    inactiveUsers.forEach(id => this.removeRemoteUser(id))
  }

  /**
   * 导出用户数据（用于同步）
   */
  exportUserData(): CollaborationUser {
    return {
      ...this.localUser,
      cursor: null // 导出时不包含光标位置
    }
  }

  /**
   * 更新本地用户名
   */
  setUserName(name: string): void {
    this.localUser.name = name
    this.notifyUserChange()
  }
}
