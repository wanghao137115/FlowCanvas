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
  // 缩放状态追踪
  private isZooming: boolean = false
  private zoomEndTimer: ReturnType<typeof setTimeout> | null = null

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
   * 是否正在缩放中
   */
  getIsZooming(): boolean {
    return this.isZooming
  }

  /**
   * 开始缩放（设置缩放状态）
   */
  private startZooming(): void {
    this.isZooming = true
    // 清除之前的定时器
    if (this.zoomEndTimer) {
      clearTimeout(this.zoomEndTimer)
    }
  }

  /**
   * 结束缩放（延迟重置状态，让用户感觉更流畅）
   */
  private endZooming(): void {
    // 延迟 150ms 后重置状态，给用户一个短暂的"隐藏"体验
    if (this.zoomEndTimer) {
      clearTimeout(this.zoomEndTimer)
    }
    this.zoomEndTimer = setTimeout(() => {
      this.isZooming = false
    }, 150)
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
   * 只限制超出边界的方向，其他方向仍然可以拖动
   */
  updatePanWithExpansion(screenPoint: Vector2, canvasEngine: any): void {
    if (!this.isPanning) return

    const deltaX = screenPoint.x - this.lastPanPoint.x
    const deltaY = screenPoint.y - this.lastPanPoint.y

    const canvasWidth = this.viewport.width
    const canvasHeight = this.viewport.height
    const maxBoundary = 3000

    // 计算新的偏移值（这是没有限制的理论值）
    let newOffsetX = this.panStartOffset.x - deltaX / this.viewport.scale
    let newOffsetY = this.panStartOffset.y - deltaY / this.viewport.scale

    // 获取元素边界（如果有选中元素，使用元素边界；否则使用画布边界）
    const elementBounds = canvasEngine?.getSelectedElementsBounds?.()
    const canvasBounds = canvasEngine?.getCanvasBounds?.()

    // 确定内容边界
    let contentMinX = elementBounds?.minX ?? canvasBounds?.minX ?? 0
    let contentMinY = elementBounds?.minY ?? canvasBounds?.minY ?? 0
    let contentMaxX = elementBounds?.maxX ?? canvasBounds?.maxX ?? maxBoundary
    let contentMaxY = elementBounds?.maxY ?? canvasBounds?.maxY ?? maxBoundary

    // 当前视口边界
    const currentLeft = this.viewport.offset.x
    const currentTop = this.viewport.offset.y
    const currentRight = currentLeft + canvasWidth / this.viewport.scale
    const currentBottom = currentTop + canvasHeight / this.viewport.scale

    // 判断拖动方向（相对于鼠标）
    const mouseMovingRight = deltaX > 0   // 鼠标向右移动
    const mouseMovingDown = deltaY > 0    // 鼠标向下移动

    // 内容是否在左边界
    const contentAtLeftEdge = contentMinX <= 0
    const contentAtTopEdge = contentMinY <= 0
    const contentAtRightEdge = contentMaxX >= maxBoundary
    const contentAtBottomEdge = contentMaxY >= maxBoundary

    // 视口是否在边界
    const viewportAtLeftEdge = currentLeft <= 0
    const viewportAtTopEdge = currentTop <= 0
    const viewportAtRightEdge = currentRight >= maxBoundary
    const viewportAtBottomEdge = currentBottom >= maxBoundary

    // 只在以下情况限制：
    // 1. 内容在左边界 + 拖动向左会导致 offset < 0
    // 2. 内容在右边界 + 拖动向右会导致视口超出边界
    // 3. 内容在上边界 + 拖动向上会导致 offset < 0
    // 4. 内容在下边界 + 拖动向下会导致视口超出边界

    // 对于 X 轴：
    if (contentAtLeftEdge && viewportAtLeftEdge) {
      // 左边界：不允许拖动导致 offsetX < 0
      if (newOffsetX < 0) {
        newOffsetX = 0
      }
    }
    if (contentAtRightEdge && viewportAtRightEdge) {
      // 右边界：不允许拖动导致视口超出 maxBoundary
      const maxOffsetX = maxBoundary - canvasWidth / this.viewport.scale
      if (newOffsetX > maxOffsetX) {
        newOffsetX = maxOffsetX
      }
    }

    // 对于 Y 轴：
    if (contentAtTopEdge && viewportAtTopEdge) {
      // 上边界：不允许拖动导致 offsetY < 0
      if (newOffsetY < 0) {
        newOffsetY = 0
      }
    }
    if (contentAtBottomEdge && viewportAtBottomEdge) {
      // 下边界：不允许拖动导致视口超出 maxBoundary
      const maxOffsetY = maxBoundary - canvasHeight / this.viewport.scale
      if (newOffsetY > maxOffsetY) {
        newOffsetY = maxOffsetY
      }
    }

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
   * @param scale 缩放系数（如 1.1 表示放大 10%，0.9 表示缩小 10%）
   * @param centerPoint 缩放中心点（虚拟坐标）
   */
  zoom(scale: number, centerPoint?: Vector2): void {
    const oldScale = this.viewport.scale
    // 使用当前 scale 乘以系数，得到新的缩放级别
    let newScale = oldScale * scale

    // 缩放限制：最小 0.4096，最大 1.5625
    const minScale = 0.4096
    const maxScale = 1.5625

    if (newScale < minScale) {
      newScale = minScale
      console.log('[缩放] 已达到最小缩放倍数: 0.4096')
    } else if (newScale > maxScale) {
      newScale = maxScale
      console.log('[缩放] 已达到最大缩放倍数: 1.5625')
    }

   

    // 开始缩放状态
    this.startZooming()

    if (centerPoint) {
      // 以指定点为中心缩放
      // 正确的公式：缩放后，屏幕上的 centerPoint 位置应该对应同一个虚拟坐标
      // screenX = (virtualX - offsetX) * scale
      // 缩放前后：screenX = (centerPoint.x - oldOffsetX) * oldScale = (centerPoint.x - newOffsetX) * newScale
      // 所以：newOffsetX = centerPoint.x - (centerPoint.x - oldOffsetX) * oldScale / newScale
      const oldOffsetX = this.viewport.offset.x
      const oldOffsetY = this.viewport.offset.y
      const scaleRatio = oldScale / newScale
      this.viewport.offset.x = centerPoint.x - (centerPoint.x - oldOffsetX) * scaleRatio
      this.viewport.offset.y = centerPoint.y - (centerPoint.y - oldOffsetY) * scaleRatio
   
    }

    this.viewport.scale = newScale
    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
    // 结束缩放状态
    this.endZooming()
  }

  /**
   * 缩放到指定级别（绝对值）
   * @param scale 目标缩放级别（如 2.0 表示放大到 200%）
   * @param centerPoint 缩放中心点（虚拟坐标）
   */
  zoomTo(scale: number, centerPoint?: Vector2): void {
    const oldScale = this.viewport.scale
    // 缩放限制：最小 0.4096，最大 1.5625
    const minScale = 0.4096
    const maxScale = 1.5625
    let newScale = scale
    if (newScale < minScale) newScale = minScale
    if (newScale > maxScale) newScale = maxScale

    console.log(`[缩放] 倍数: ${newScale.toFixed(4)} (从 ${oldScale.toFixed(4)} 变化)`)

    // 开始缩放状态
    this.startZooming()

    if (centerPoint) {
      // 以指定点为中心缩放
      const scaleRatio = oldScale / newScale
      this.viewport.offset.x = centerPoint.x - (centerPoint.x - this.viewport.offset.x) * scaleRatio
      this.viewport.offset.y = centerPoint.y - (centerPoint.y - this.viewport.offset.y) * scaleRatio
    }

    this.viewport.scale = newScale
    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
    // 结束缩放状态
    this.endZooming()
  }

  /**
   * 缩放到适合
   */
  zoomToFit(bounds: { x: number; y: number; width: number; height: number }, padding: number = 50): void {
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

    this.coordinateTransformer.updateViewport(this.viewport)
    this.triggerViewportChange()
  }

  /**
   * 缩放�?00%
   */
  zoomToActualSize(): void {
    this.zoomTo(1)
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
