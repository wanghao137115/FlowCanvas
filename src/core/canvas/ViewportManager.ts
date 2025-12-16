import type { Vector2, Viewport } from '@/types/canvas.types'
import { CoordinateTransformer } from './CoordinateTransformer'
import { Vector2Utils } from '@/utils/math/Vector2'

/**
 * 视口管理�?
 * 负责管理画布的视口状态和操作
 */
export class ViewportManager {
  private viewport: Viewport
  private coordinateTransformer: CoordinateTransformer
  private isPanning: boolean = false
  private lastPanPoint: Vector2 = { x: 0, y: 0 }
  private panStartOffset: Vector2 = { x: 0, y: 0 }
  private onViewportChange?: (viewport: Viewport) => void

  constructor(initialViewport: Viewport, onViewportChange?: (viewport: Viewport) => void) {
    this.viewport = { ...initialViewport }
    this.coordinateTransformer = new CoordinateTransformer(this.viewport)
    this.onViewportChange = onViewportChange
  }

  /**
   * 获取当前视口
   */
  getViewport(): Viewport {
    return { ...this.viewport }
  }

  /**
   * 获取坐标转换�?
   */
  getCoordinateTransformer(): CoordinateTransformer {
    return this.coordinateTransformer
  }

  /**
   * 更新视口尺寸
   */
  updateViewportSize(width: number, height: number): void {
    this.viewport.width = width
    this.viewport.height = height
    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 开始平�?
   */
  startPan(screenPoint: Vector2): void {
    this.isPanning = true
    this.lastPanPoint = Vector2Utils.clone(screenPoint)
    this.panStartOffset = Vector2Utils.clone(this.viewport.offset)
  }

  /**
   * 更新平移
   */
  updatePan(screenPoint: Vector2): void {
    if (!this.isPanning) return

    const deltaX = screenPoint.x - this.lastPanPoint.x
    const deltaY = screenPoint.y - this.lastPanPoint.y

    // 更新视口偏移
    this.viewport.offset.x = this.panStartOffset.x - deltaX / this.viewport.scale
    this.viewport.offset.y = this.panStartOffset.y - deltaY / this.viewport.scale

    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 更新平移（支持无限画布扩展，限制方向）
   */
  updatePanWithExpansion(screenPoint: Vector2, canvasEngine: any): void {
    if (!this.isPanning) return

    const deltaX = screenPoint.x - this.lastPanPoint.x
    const deltaY = screenPoint.y - this.lastPanPoint.y



    // 检查当前可视范围内是否包含3.0k坐标，如果包含就禁止拖动
    const canvasWidth = 800  // 默认画布宽度
    const canvasHeight = 600  // 默认画布高度
    
    // 计算当前可视范围的虚拟坐标边界
    const visibleLeft = this.panStartOffset.x
    const visibleTop = this.panStartOffset.y
    const visibleRight = this.panStartOffset.x + canvasWidth / this.viewport.scale
    const visibleBottom = this.panStartOffset.y + canvasHeight / this.viewport.scale
    
    // 检查是否到达3.0k边界，如果到达则完全禁止拖动
    const maxBoundary = 3000
    const is3kVisibleX = visibleLeft <= maxBoundary && visibleRight >= maxBoundary
    const is3kVisibleY = visibleTop <= maxBoundary && visibleBottom >= maxBoundary
    

    
    // 如果3.0k在可视范围内，完全禁止拖动（不显示右边空白）
    if (is3kVisibleX || is3kVisibleY) {

      return
    }
    
    // 计算新的偏移值
    let newOffsetX = this.panStartOffset.x - deltaX / this.viewport.scale
    let newOffsetY = this.panStartOffset.y - deltaY / this.viewport.scale
    
    // 确保偏移值在边界内
    newOffsetX = Math.max(0, Math.min(maxBoundary, newOffsetX))
    newOffsetY = Math.max(0, Math.min(maxBoundary, newOffsetY))


    // 更新视口偏移
    this.viewport.offset.x = newOffsetX
    this.viewport.offset.y = newOffsetY


    // 检查是否需要扩展画布
    if (canvasEngine) {
      canvasEngine.checkAndExpandCanvas(this.viewport.offset)
    }

    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 结束平移
   */
  endPan(): void {
    this.isPanning = false
  }

  /**
   * 是否正在平移
   */
  isCurrentlyPanning(): boolean {
    return this.isPanning
  }

  /**
   * 缩放操作
   */
  zoom(scale: number, centerPoint?: Vector2): void {
    const oldScale = this.viewport.scale
    const newScale = Math.max(0.1, Math.min(5, scale))

    if (centerPoint) {
      // 以指定点为中心缩�?
      const scaleRatio = newScale / oldScale
      this.viewport.offset.x = centerPoint.x - (centerPoint.x - this.viewport.offset.x) * scaleRatio
      this.viewport.offset.y = centerPoint.y - (centerPoint.y - this.viewport.offset.y) * scaleRatio
    }

    this.viewport.scale = newScale
    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 缩放到指定级�?
   */
  zoomTo(scale: number, centerPoint?: Vector2): void {
    this.zoom(scale, centerPoint)
  }

  /**
   * 缩放到适合
   */
  zoomToFit(bounds: { x: number; y: number; width: number; height: number }, padding: number = 50): void {
    const scaleX = (this.viewport.width - padding * 2) / bounds.width
    const scaleY = (this.viewport.height - padding * 2) / bounds.height
    const scale = Math.min(scaleX, scaleY, 5) // 最大缩�?�?

    this.viewport.scale = Math.max(0.1, scale) // 最小缩�?.1�?

    // 计算居中偏移
    const scaledWidth = bounds.width * this.viewport.scale
    const scaledHeight = bounds.height * this.viewport.scale

    this.viewport.offset.x = bounds.x - (this.viewport.width - scaledWidth) / (2 * this.viewport.scale)
    this.viewport.offset.y = bounds.y - (this.viewport.height - scaledHeight) / (2 * this.viewport.scale)

    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 缩放�?00%
   */
  zoomToActualSize(): void {
    this.zoom(1)
  }

  /**
   * 缩放到适合窗口
   */
  zoomToFitWindow(): void {
    // 这里需要根据画布内容来计算边界
    // 暂时使用默认�?
    this.zoomToFit({ x: 0, y: 0, width: 1000, height: 1000 })
  }

  /**
   * 重置视口
   */
  resetViewport(): void {
    this.viewport.scale = 1
    this.viewport.offset = { x: 0, y: 0 }
    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 设置视口偏移
   */
  setOffset(offset: Vector2): void {
    this.viewport.offset = Vector2Utils.clone(offset)
    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 平移视口到指定位�?
   */
  panTo(offset: Vector2): void {
    this.setOffset(offset)
  }

  /**
   * 将指定点移动到视口中�?
   */
  centerOnPoint(virtualPos: Vector2): void {
    this.viewport.offset.x = virtualPos.x - this.viewport.width / (2 * this.viewport.scale)
    this.viewport.offset.y = virtualPos.y - this.viewport.height / (2 * this.viewport.scale)
    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 获取视口在虚拟坐标中的边�?
   */
  getViewportBounds(): { x: number; y: number; width: number; height: number } {
    return this.coordinateTransformer.getViewportBounds()
  }

  /**
   * 获取视口中心点的虚拟坐标
   */
  getViewportCenter(): Vector2 {
    return this.coordinateTransformer.getViewportCenter()
  }

  /**
   * 检查虚拟坐标点是否在视口内
   */
  isPointInViewport(virtualPos: Vector2): boolean {
    return this.coordinateTransformer.isPointInViewport(virtualPos)
  }

  /**
   * 触发视口变化事件
   */
  private triggerViewportChange(): void {
    if (this.onViewportChange) {
      this.onViewportChange(this.getViewport())
    }
  }

  /**
   * 设置视口变化回调
   */
  setOnViewportChange(callback: (viewport: Viewport) => void): void {
    this.onViewportChange = callback
  }

  /**
   * 获取当前缩放级别
   */
  getScale(): number {
    return this.viewport.scale
  }

  /**
   * 获取当前偏移
   */
  getOffset(): Vector2 {
    return Vector2Utils.clone(this.viewport.offset)
  }

  /**
   * 获取视口尺寸
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.viewport.width,
      height: this.viewport.height
    }
  }

  /**
   * 应用视口变换到画布上下文
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    // ✅ 修复：使用与CoordinateTransformer一致的变换矩阵
    ctx.setTransform(
      this.viewport.scale, 0, 0, this.viewport.scale,
      -this.viewport.offset.x * this.viewport.scale,
      -this.viewport.offset.y * this.viewport.scale
    )
  }

  /**
   * 恢复画布上下文变换
   */
  restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore()
  }
}
