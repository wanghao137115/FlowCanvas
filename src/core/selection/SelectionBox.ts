import type { Vector2, Bounds } from '@/types/canvas.types'

/**
 * 选择框类
 * 负责管理选择框的显示和交�?
 */
export class SelectionBox {
  private bounds: Bounds | null = null
  private isVisible: boolean = false
  private style: SelectionBoxStyle

  constructor(style?: Partial<SelectionBoxStyle>) {
    this.style = {
      strokeColor: '#0066FF',
      fillColor: 'rgba(0, 102, 255, 0.2)',
      strokeWidth: 2,
      dashArray: [],
      ...style
    }
  }

  /**
   * 显示选择�?
   */
  show(bounds: Bounds): void {
    this.bounds = bounds
    this.isVisible = true
  }

  /**
   * 更新选择�?
   */
  update(bounds: Bounds): void {
    this.bounds = bounds
  }

  /**
   * 隐藏选择�?
   */
  hide(): void {
    this.isVisible = false
    this.bounds = null
  }

  /**
   * 渲染选择�?
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible || !this.bounds) return

    ctx.save()
    
    // 设置样式
    ctx.strokeStyle = this.style.strokeColor
    ctx.fillStyle = this.style.fillColor
    ctx.lineWidth = this.style.strokeWidth
    ctx.setLineDash(this.style.dashArray)
    
    // 绘制选择�?
    ctx.fillRect(
      this.bounds.x,
      this.bounds.y,
      this.bounds.width,
      this.bounds.height
    )
    
    ctx.strokeRect(
      this.bounds.x,
      this.bounds.y,
      this.bounds.width,
      this.bounds.height
    )
    
    ctx.restore()
  }

  /**
   * 检查点是否在选择框内
   */
  contains(point: Vector2): boolean {
    if (!this.bounds) return false
    
    return point.x >= this.bounds.x &&
           point.x <= this.bounds.x + this.bounds.width &&
           point.y >= this.bounds.y &&
           point.y <= this.bounds.y + this.bounds.height
  }

  /**
   * 获取选择框边�?
   */
  getBounds(): Bounds | null {
    return this.bounds ? { ...this.bounds } : null
  }

  /**
   * 是否可见
   */
  isCurrentlyVisible(): boolean {
    return this.isVisible
  }

  /**
   * 设置样式
   */
  setStyle(style: Partial<SelectionBoxStyle>): void {
    this.style = { ...this.style, ...style }
  }
}

/**
 * 选择框样式接�?
 */
export interface SelectionBoxStyle {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  dashArray: number[]
}
