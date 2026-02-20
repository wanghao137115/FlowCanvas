import { CursorState, Vector2 } from '@/types/collaboration.types'

/**
 * 光标渲染配置
 */
export interface CursorRenderConfig {
  showLabel: boolean
  showTrail: boolean
  trailLength: number
  fadeTrail: boolean
  cursorSize: number
  labelOffset: number
}

/**
 * 默认光标配置 - 关闭拖尾以避免"运动轨迹"
 */
const DEFAULT_CURSOR_CONFIG: CursorRenderConfig = {
  showLabel: true,
  showTrail: false, // 关闭拖尾
  trailLength: 10,
  fadeTrail: true,
  cursorSize: 14, // 稍微大一点更容易看到
  labelOffset: 18
}

/**
 * 光标管理器 - 负责渲染远程用户光标
 */
export class CursorManager {
  private cursors: Map<string, CursorState> = new Map()
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private config: CursorRenderConfig = DEFAULT_CURSOR_CONFIG
  private animationFrameId: number | null = null
  private isRendering: boolean = false
  // 光标拖尾历史位置
  private cursorTrails: Map<string, Vector2[]> = new Map()
  // 光标变化回调
  private onCursorChangeCallback: ((cursors: CursorState[]) => void) | null = null

  constructor(config?: Partial<CursorRenderConfig>) {
    if (config) {
      this.config = { ...DEFAULT_CURSOR_CONFIG, ...config }
    }
  }

  /**
   * 初始化画布上下文
   */
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  /**
   * 设置画布上下文（外部调用）
   */
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx
  }

  /**
   * 添加或更新光标
   */
  updateCursor(userId: string, position: Vector2, userName: string, color: string): void {
    const cursor: CursorState = {
      position,
      color,
      userId,
      userName,
      lastUpdate: Date.now()
    }

    // 更新光标位置
    const existingCursor = this.cursors.get(userId)
    if (existingCursor) {
      // 记录拖尾
      if (this.config.showTrail) {
        this.addToTrail(userId, existingCursor.position)
      }
    }

    this.cursors.set(userId, cursor)
    
    // 通知变化
    this.notifyCursorChange()
  }

  /**
   * 添加位置到拖尾历史
   */
  private addToTrail(userId: string, position: Vector2): void {
    let trail = this.cursorTrails.get(userId) || []
    trail.push({ ...position })
    
    // 限制拖尾长度
    if (trail.length > this.config.trailLength) {
      trail = trail.slice(-this.config.trailLength)
    }
    
    this.cursorTrails.set(userId, trail)
  }

  /**
   * 移除光标
   */
  removeCursor(userId: string): void {
    this.cursors.delete(userId)
    this.cursorTrails.delete(userId)
    this.notifyCursorChange()
  }

  /**
   * 获取所有光标
   */
  getCursors(): CursorState[] {
    return Array.from(this.cursors.values())
  }

  /**
   * 获取指定用户的光标
   */
  getCursor(userId: string): CursorState | undefined {
    return this.cursors.get(userId)
  }

  /**
   * 清除所有光标
   */
  clearAllCursors(): void {
    this.cursors.clear()
    this.cursorTrails.clear()
    this.notifyCursorChange()
  }

  /**
   * 设置光标变化回调
   */
  onCursorChange(callback: (cursors: CursorState[]) => void): void {
    this.onCursorChangeCallback = callback
  }

  /**
   * 通知光标变化
   */
  private notifyCursorChange(): void {
    if (this.onCursorChangeCallback) {
      this.onCursorChangeCallback(this.getCursors())
    }
  }

  /**
   * 渲染所有光标
   */
  render(viewportOffset: Vector2 = { x: 0, y: 0 }, scale: number = 1): void {
    if (!this.ctx || this.cursors.size === 0) return

    const ctx = this.ctx
    ctx.save()

    // 渲染每个远程用户的光标 - 直接使用屏幕坐标，不需要转换
    this.cursors.forEach((cursor, userId) => {
      const screenX = cursor.position.x
      const screenY = cursor.position.y

      // 渲染光标
      this.renderCursor(ctx, screenX, screenY, cursor)

      // 渲染用户名标签
      if (this.config.showLabel) {
        this.renderLabel(ctx, screenX, screenY, cursor)
      }
    })

    ctx.restore()
  }

  /**
   * 渲染光标拖尾
   */
  private renderTrail(
    ctx: CanvasRenderingContext2D, 
    userId: string, 
    viewportOffset: Vector2,
    scale: number
  ): void {
    const trail = this.cursorTrails.get(userId)
    if (!trail || trail.length < 2) return

    const cursor = this.cursors.get(userId)
    if (!cursor) return

    ctx.save()
    ctx.beginPath()

    // 绘制拖尾线条
    const points: Vector2[] = [...trail, cursor.position]
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      
      const screenX1 = (p1.x - viewportOffset.x) * scale
      const screenY1 = (p1.y - viewportOffset.y) * scale
      const screenX2 = (p2.x - viewportOffset.x) * scale
      const screenY2 = (p2.y - viewportOffset.y) * scale

      // 计算透明度（越旧越透明）
      const alpha = this.config.fadeTrail 
        ? (i / points.length) * 0.5 
        : 0.3

      ctx.beginPath()
      ctx.moveTo(screenX1, screenY1)
      ctx.lineTo(screenX2, screenY2)
      ctx.strokeStyle = cursor.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      ctx.lineWidth = 2 * scale
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * 渲染单个光标
   */
  private renderCursor(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    cursor: CursorState
  ): void {
    const size = this.config.cursorSize

    ctx.save()
    
    // 绘制光标箭头形状
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x + size * 0.4, y + size * 0.7)
    ctx.lineTo(x + size, y + size * 0.5)
    ctx.lineTo(x + size * 0.7, y + size * 0.35)
    ctx.lineTo(x + size * 0.8, y)
    ctx.closePath()

    // 填充光标
    ctx.fillStyle = cursor.color
    ctx.fill()

    // 描边光标
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.restore()
  }

  /**
   * 渲染用户名标签
   */
  private renderLabel(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    cursor: CursorState
  ): void {
    const offset = this.config.labelOffset

    ctx.save()

    // 测量文字宽度
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textWidth = ctx.measureText(cursor.userName).width
    const padding = 8
    const labelWidth = textWidth + padding * 2
    const labelHeight = 20

    // 标签背景
    const labelX = x + offset
    const labelY = y + offset

    ctx.beginPath()
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 4)
    ctx.fillStyle = cursor.color
    ctx.fill()

    // 标签文字
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.fillText(cursor.userName, labelX + padding, labelY + labelHeight / 2)

    ctx.restore()
  }

  /**
   * 开始持续渲染
   */
  startRendering(viewportOffset: Vector2, scale: number): void {
    if (this.isRendering) return
    
    this.isRendering = true
    const render = () => {
      if (!this.isRendering) return
      
      this.render(viewportOffset, scale)
      this.animationFrameId = requestAnimationFrame(render)
    }
    
    render()
  }

  /**
   * 停止渲染
   */
  stopRendering(): void {
    this.isRendering = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<CursorRenderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopRendering()
    this.clearAllCursors()
    this.canvas = null
    this.ctx = null
  }
}
