import type { Vector2, Viewport } from '@/types/canvas.types'
import { Vector2Utils } from '@/utils/math/Vector2'

/**
 * 坐标转换�?
 * 负责屏幕坐标和虚拟坐标之间的转换
 */
export class CoordinateTransformer {
  private viewport: Viewport

  constructor(viewport: Viewport) {
    this.viewport = viewport
  }

  /**
   * 更新视口信息
   */
  updateViewport(viewport: Viewport): void {
    this.viewport = viewport
  }

  /**
   * 屏幕坐标转虚拟坐标
   * 与 applyTransform 一致: x' = scale * x - offset * scale
   */
  screenToVirtual(screenPos: Vector2): Vector2 {
    return {
      x: screenPos.x / this.viewport.scale + this.viewport.offset.x,
      y: screenPos.y / this.viewport.scale + this.viewport.offset.y
    }
  }

  /**
   * 虚拟坐标转屏幕坐标
   * 与 applyTransform 一致: x' = scale * x - offset * scale
   * 即: screenX = (virtualX - offsetX) * scale
   */
  virtualToScreen(virtualPos: Vector2): Vector2 {
    return {
      x: (virtualPos.x - this.viewport.offset.x) * this.viewport.scale,
      y: (virtualPos.y - this.viewport.offset.y) * this.viewport.scale
    }
  }

  /**
   * 虚拟边界转屏幕边界
   */
  virtualToScreenBounds(virtualBounds: { x: number; y: number; width: number; height: number }): { x: number; y: number; width: number; height: number } {
    const topLeft = this.virtualToScreen({ x: virtualBounds.x, y: virtualBounds.y })
    const bottomRight = this.virtualToScreen({ x: virtualBounds.x + virtualBounds.width, y: virtualBounds.y + virtualBounds.height })
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    }
  }

  /**
   * 屏幕距离转虚拟距�?
   */
  screenDistanceToVirtual(screenDistance: number): number {
    return screenDistance / this.viewport.scale
  }

  /**
   * 虚拟距离转屏幕距�?
   */
  virtualDistanceToScreen(virtualDistance: number): number {
    return virtualDistance * this.viewport.scale
  }

  /**
   * 虚拟尺寸转屏幕尺寸
   */
  virtualToScreenSize(virtualSize: Vector2): Vector2 {
    return {
      x: virtualSize.x * this.viewport.scale,
      y: virtualSize.y * this.viewport.scale
    }
  }

  /**
   * 获取视口在虚拟坐标中的边�?
   */
  getViewportBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.viewport.offset.x,
      y: this.viewport.offset.y,
      width: this.viewport.width / this.viewport.scale,
      height: this.viewport.height / this.viewport.scale
    }
  }

  /**
   * 检查虚拟坐标点是否在视口内
   */
  isPointInViewport(virtualPos: Vector2): boolean {
    const bounds = this.getViewportBounds()
    return virtualPos.x >= bounds.x &&
           virtualPos.x <= bounds.x + bounds.width &&
           virtualPos.y >= bounds.y &&
           virtualPos.y <= bounds.y + bounds.height
  }

  /**
   * 获取视口中心点的虚拟坐标
   */
  getViewportCenter(): Vector2 {
    const bounds = this.getViewportBounds()
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    }
  }

  /**
   * 将虚拟坐标点移动到视口中�?
   */
  centerOnPoint(virtualPos: Vector2): void {
    this.viewport.offset.x = virtualPos.x - this.viewport.width / (2 * this.viewport.scale)
    this.viewport.offset.y = virtualPos.y - this.viewport.height / (2 * this.viewport.scale)
  }

  /**
   * 将虚拟坐标区域适配到视口
   */
  fitToViewport(bounds: { x: number; y: number; width: number; height: number }, padding: number = 50): void {
    const scaleX = (this.viewport.width - padding * 2) / bounds.width
    const scaleY = (this.viewport.height - padding * 2) / bounds.height
    // 缩放限制：最小 0.4096，最大 1.5625
    const minScale = 0.4096
    const maxScale = 1.5625
    let scale = Math.min(scaleX, scaleY)
    if (scale < minScale) scale = minScale
    if (scale > maxScale) scale = maxScale

    this.viewport.scale = scale

    // 计算居中偏移
    const scaledWidth = bounds.width * this.viewport.scale
    const scaledHeight = bounds.height * this.viewport.scale

    this.viewport.offset.x = bounds.x - (this.viewport.width - scaledWidth) / (2 * this.viewport.scale)
    this.viewport.offset.y = bounds.y - (this.viewport.height - scaledHeight) / (2 * this.viewport.scale)
  }

  /**
   * 获取当前缩放级别
   */
  getScale(): number {
    return this.viewport.scale
  }

  /**
   * 获取当前视口偏移
   */
  getOffset(): Vector2 {
    return Vector2Utils.clone(this.viewport.offset)
  }

  /**
   * 设置缩放级别（以指定点为中心）
   */
  setScale(scale: number, centerPoint?: Vector2): void {
    const oldScale = this.viewport.scale
    // 缩放限制：最小 0.4096，最大 1.5625
    const minScale = 0.4096
    const maxScale = 1.5625
    let newScale = scale
    if (newScale < minScale) newScale = minScale
    if (newScale > maxScale) newScale = maxScale

    if (centerPoint) {
      // 以指定点为中心缩放
      const scaleRatio = newScale / oldScale
      this.viewport.offset.x = centerPoint.x - (centerPoint.x - this.viewport.offset.x) * scaleRatio
      this.viewport.offset.y = centerPoint.y - (centerPoint.y - this.viewport.offset.y) * scaleRatio
    }

    this.viewport.scale = newScale
  }

  /**
   * 设置视口偏移
   */
  setOffset(offset: Vector2): void {
    this.viewport.offset = Vector2Utils.clone(offset)
  }

  /**
   * 平移视口
   */
  translate(delta: Vector2): void {
    this.viewport.offset.x -= delta.x / this.viewport.scale
    this.viewport.offset.y -= delta.y / this.viewport.scale
  }

  /**
   * 获取视口变换矩阵
   */
  getTransformMatrix(): DOMMatrix {
    const matrix = new DOMMatrix()
    matrix.scaleSelf(this.viewport.scale, this.viewport.scale)
    matrix.translateSelf(-this.viewport.offset.x, -this.viewport.offset.y)
    return matrix
  }

  /**
   * 应用视口变换到Canvas 2D上下�?
   */
  applyToContext(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(
      this.viewport.scale, 0, 0, this.viewport.scale,
      -this.viewport.offset.x * this.viewport.scale,
      -this.viewport.offset.y * this.viewport.scale
    )
  }

  /**
   * 重置视口变换
   */
  resetContext(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
}
