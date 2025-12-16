import type { Vector2, Bounds } from '@/types/canvas.types'

/**
 * 变换手柄类型
 */
export enum TransformHandleType {
  MOVE = 'move',
  RESIZE_NW = 'resize-nw',
  RESIZE_N = 'resize-n',
  RESIZE_NE = 'resize-ne',
  RESIZE_E = 'resize-e',
  RESIZE_SE = 'resize-se',
  RESIZE_S = 'resize-s',
  RESIZE_SW = 'resize-sw',
  RESIZE_W = 'resize-w',
  ROTATE = 'rotate'
}

/**
 * 变换手柄�?
 * 负责管理单个变换手柄的显示和交互
 */
export class TransformHandle {
  private type: TransformHandleType
  private position: Vector2
  private size: number
  private isVisible: boolean = false
  private isActive: boolean = false
  private style: TransformHandleStyle

  constructor(type: TransformHandleType, style?: Partial<TransformHandleStyle>) {
    this.type = type
    this.position = { x: 0, y: 0 }
    this.size = 8
    this.style = {
      fillColor: '#ffffff',
      strokeColor: '#007ACC',
      strokeWidth: 2,
      activeFillColor: '#007ACC',
      activeStrokeColor: '#ffffff',
      ...style
    }
  }

  /**
   * 设置位置
   */
  setPosition(position: Vector2): void {
    this.position = { ...position }
  }

  /**
   * 获取位置
   */
  getPosition(): Vector2 {
    return { ...this.position }
  }

  /**
   * 设置可见�?
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible
  }

  /**
   * 设置激活状�?
   */
  setActive(active: boolean): void {
    this.isActive = active
  }

  /**
   * 获取类型
   */
  getType(): TransformHandleType {
    return this.type
  }

  /**
   * 渲染手柄
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible) return

    ctx.save()
    
    // 设置样式
    const fillColor = this.isActive ? this.style.activeFillColor : this.style.fillColor
    const strokeColor = this.isActive ? this.style.activeStrokeColor : this.style.strokeColor
    
    ctx.fillStyle = fillColor
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = this.style.strokeWidth
    
    // 绘制手柄
    const halfSize = this.size / 2
    ctx.fillRect(
      this.position.x - halfSize,
      this.position.y - halfSize,
      this.size,
      this.size
    )
    
    ctx.strokeRect(
      this.position.x - halfSize,
      this.position.y - halfSize,
      this.size,
      this.size
    )
    
    ctx.restore()
  }

  /**
   * 检查点是否在手柄内
   */
  contains(point: Vector2): boolean {
    const halfSize = this.size / 2
    return point.x >= this.position.x - halfSize &&
           point.x <= this.position.x + halfSize &&
           point.y >= this.position.y - halfSize &&
           point.y <= this.position.y + halfSize
  }

  /**
   * 获取手柄边界
   */
  getBounds(): Bounds {
    const halfSize = this.size / 2
    return {
      x: this.position.x - halfSize,
      y: this.position.y - halfSize,
      width: this.size,
      height: this.size
    }
  }

  /**
   * 获取光标样式
   */
  getCursorStyle(): string {
    switch (this.type) {
      case TransformHandleType.MOVE:
        return 'move'
      case TransformHandleType.RESIZE_NW:
      case TransformHandleType.RESIZE_SE:
        return 'nw-resize'
      case TransformHandleType.RESIZE_N:
      case TransformHandleType.RESIZE_S:
        return 'n-resize'
      case TransformHandleType.RESIZE_NE:
      case TransformHandleType.RESIZE_SW:
        return 'ne-resize'
      case TransformHandleType.RESIZE_E:
      case TransformHandleType.RESIZE_W:
        return 'e-resize'
      case TransformHandleType.ROTATE:
        return 'crosshair'
      default:
        return 'default'
    }
  }
}

/**
 * 变换手柄样式接口
 */
export interface TransformHandleStyle {
  fillColor: string
  strokeColor: string
  strokeWidth: number
  activeFillColor: string
  activeStrokeColor: string
}
