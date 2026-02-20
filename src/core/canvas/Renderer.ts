import type { CanvasElement, Vector2, ElementStyle } from '@/types/canvas.types'
import { ViewportManager } from './ViewportManager'
import { CoordinateTransformer } from './CoordinateTransformer'
import { ImageRenderer } from '../renderers/ImageRenderer'
import { ShapeType } from '../tools/ShapeTool'

/**
 * 渲染器
 * 负责将画布元素渲染到Canvas上，支持预览和最终绘制分离
 */
export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private viewportManager: ViewportManager
  private coordinateTransformer: CoordinateTransformer
  private selectedElements: CanvasElement[] = []
  private imageRenderer: ImageRenderer
  
  // 预览系统
  private previewLayer: HTMLCanvasElement | null = null
  private previewCtx: CanvasRenderingContext2D | null = null
  private isPreviewMode: boolean = false
  private previewElements: CanvasElement[] = []
  
  // 连接点系统
  private hoveredElement: CanvasElement | null = null
  private hoveredConnectionPoint: Vector2 | null = null
  private connectionPoints: Vector2[] = []
  
  // 连接线拖拽相关
  private isDraggingConnection: boolean = false
  private connectionStartPoint: Vector2 | null = null
  private connectionEndPoint: Vector2 | null = null
  
  // 智能参考线系统
  private smartGuides: any[] = [] // 存储当前需要渲染的参考线

  // 无限画布相关
  private canvasBounds: { minX: number; minY: number; maxX: number; maxY: number } = {
    minX: 0,    // 边界从0开始
    minY: 0,    // 边界从0开始
    maxX: 1000,
    maxY: 1000
  }

  // 性能优化
  private lastRenderTime: number = 0
  private renderThrottleMs: number = 16 // 60fps
  private dirtyRegions: Array<{ x: number; y: number; width: number; height: number }> = []
  private needsFullRender: boolean = true
  
  // LOD (Level of Detail) 级别
  private lodLevel: 'low' | 'medium' | 'high' = 'medium'
  
  // 离屏缓存：针对静态元素（主要是形状和文本）
  private elementCache: Map<
    string,
    {
      canvas: HTMLCanvasElement
      version: string
    }
  > = new Map()

  constructor(canvas: HTMLCanvasElement, viewportManager: ViewportManager, coordinateTransformer: CoordinateTransformer) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.viewportManager = viewportManager
    this.coordinateTransformer = coordinateTransformer
    
    // 初始化图片渲染器
    this.imageRenderer = new ImageRenderer(this.ctx, {
      scale: 1,
      offset: { x: 0, y: 0 }
    })
    
    // 初始化预览层
    this.initializePreviewLayer()
  }

  /**
   * 设置 LOD 级别
   */
  setLODLevel(level: 'low' | 'medium' | 'high'): void {
    this.lodLevel = level
  }

  /**
   * 获取当前 LOD 级别
   */
  getLODLevel(): 'low' | 'medium' | 'high' {
    return this.lodLevel
  }

  /**
   * 初始化预览层
   */
  private initializePreviewLayer(): void {
    // 创建预览层Canvas
    this.previewLayer = document.createElement('canvas')
    this.previewLayer.style.position = 'absolute'
    this.previewLayer.style.top = '0'
    this.previewLayer.style.left = '0'
    this.previewLayer.style.pointerEvents = 'none'
    this.previewLayer.style.zIndex = '1000'
    
    // 设置预览层尺寸
    this.updatePreviewLayerSize()
    
    // 获取预览层上下文
    this.previewCtx = this.previewLayer.getContext('2d')!
    
    // 将预览层添加到画布容器
    if (this.canvas.parentNode) {
      this.canvas.parentNode.appendChild(this.previewLayer)
    }
  }

  /**
   * 更新预览层尺寸
   */
  private updatePreviewLayerSize(): void {
    if (!this.previewLayer) return
    
    const rect = this.canvas.getBoundingClientRect()
    this.previewLayer.width = this.canvas.width
    this.previewLayer.height = this.canvas.height
    this.previewLayer.style.width = `${rect.width}px`
    this.previewLayer.style.height = `${rect.height}px`
  }

  /**
   * 只渲染智能参考线（不清空画布）
   */
  renderSmartGuidesOnly(): void {
    if (this.smartGuides.length === 0) {
      return
    }
    
    this.renderSmartGuides()
  }

  /**
   * 渲染所有元素（带性能优化）
   */
  render(elements: CanvasElement[]): void {
    const now = performance.now()

    // 节流渲染，避免过度渲染
    // 但是如果有智能参考线，需要跳过节流
    if (now - this.lastRenderTime < this.renderThrottleMs && this.smartGuides.length === 0) {
      // 即使被节流，也要渲染连接点（如果存在悬浮元素）
      if (this.hoveredElement && this.connectionPoints.length > 0) {
        this.renderConnectionPoints()
      }
      return
    }
    this.lastRenderTime = now

    // 如果既不需要全量渲染、也没有脏区域、也没有智能参考线，则无需渲染
    if (!this.needsFullRender && this.dirtyRegions.length === 0 && this.smartGuides.length === 0) {
      // 即使跳过渲染，也要渲染连接点（如果存在悬浮元素）
      if (this.hoveredElement && this.connectionPoints.length > 0) {
        this.renderConnectionPoints()
      }
      return
    }

    // 有智能参考线时，仍然执行全量渲染，确保画面一致性
    if (this.needsFullRender || this.smartGuides.length > 0) {
      // 清空画布
      this.clearCanvas()
      
      // 获取视口信息
      const viewport = this.viewportManager.getViewport()
      const visibleElements = this.getVisibleElements(elements, viewport)
      
      // 渲染所有可见元素
      visibleElements.forEach(element => {
        this.renderElement(element)
      })
    } else if (this.dirtyRegions.length > 0) {
      // 仅渲染脏区域
      this.renderDirtyRegions(elements)
    }

    // 如果处于预览模式，渲染预览元素
    if (this.isPreviewMode && this.previewElements.length > 0) {
      this.renderPreviewElements()
    }

    // 渲染连接点（在最后渲染，确保在最上层）
    this.renderConnectionPoints()

    // 渲染连接线（拖拽时）
    this.renderConnectionLine()

    // 渲染智能参考线（在最后渲染，确保在最上层）
    this.renderSmartGuides()

    // 重置渲染状态
    this.needsFullRender = false
    this.dirtyRegions = []
  }

  /**
   * 清空画布
   */
  private clearCanvas(): void {
    const { width, height } = this.canvas
    this.ctx.clearRect(0, 0, width, height)
  }

  /**
   * 标记需要全量渲染
   */
  markDirty(): void {
    this.needsFullRender = true
  }

  /**
   * 标记脏区域
   */
  markDirtyRegion(x: number, y: number, width: number, height: number): void {
    this.dirtyRegions.push({ x, y, width, height })
  }

  /**
   * 仅重绘脏区域（增量渲染）
   */
  private renderDirtyRegions(elements: CanvasElement[]): void {
    if (this.dirtyRegions.length === 0) return

    const viewport = this.viewportManager.getViewport()
    const visibleElements = this.getVisibleElements(elements, viewport)

    // 合并重叠或相邻的脏区域，减少重复绘制
    const mergedRegions = this.mergeDirtyRegions(this.dirtyRegions)

    mergedRegions.forEach(region => {
      // 在该区域内裁剪 + 清空，再只绘制与该区域相交的元素
      this.ctx.save()

      this.ctx.beginPath()
      this.ctx.rect(region.x, region.y, region.width, region.height)
      this.ctx.clip()

      // 先清空该区域
      this.ctx.clearRect(region.x, region.y, region.width, region.height)

      // 渲染与该脏区域相交的元素
      visibleElements.forEach(element => {
        const rect = this.getElementScreenRect(element)
        if (this.rectsIntersect(region, rect)) {
          this.renderElement(element)
        }
      })

      this.ctx.restore()
    })
  }

  /**
   * 计算元素在屏幕坐标系下的包围盒（近似，未考虑旋转后的精确外接矩形）
   */
  private getElementScreenRect(element: CanvasElement): { x: number; y: number; width: number; height: number } {
    const screenPos = this.coordinateTransformer.virtualToScreen(element.position)
    const screenSize = this.coordinateTransformer.virtualToScreenSize(element.size)

    return {
      x: screenPos.x,
      y: screenPos.y,
      width: screenSize.x,
      height: screenSize.y
    }
  }

  /**
   * 判断两个矩形是否相交
   */
  private rectsIntersect(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    )
  }

  /**
   * 合并重叠或相邻的脏区域，减少渲染次数
   */
  private mergeDirtyRegions(
    regions: Array<{ x: number; y: number; width: number; height: number }>
  ): Array<{ x: number; y: number; width: number; height: number }> {
    if (regions.length <= 1) return regions.slice()

    const merged: Array<{ x: number; y: number; width: number; height: number }> = []

    regions.forEach(region => {
      let hasMerged = false

      for (let i = 0; i < merged.length; i++) {
        const existing = merged[i]

        // 如果重叠或接近（允许 1 像素的间隙），就合并成一个更大的矩形
        const extendedExisting = {
          x: existing.x - 1,
          y: existing.y - 1,
          width: existing.width + 2,
          height: existing.height + 2
        }

        if (this.rectsIntersect(extendedExisting, region)) {
          const minX = Math.min(existing.x, region.x)
          const minY = Math.min(existing.y, region.y)
          const maxX = Math.max(existing.x + existing.width, region.x + region.width)
          const maxY = Math.max(existing.y + existing.height, region.y + region.height)

          merged[i] = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          }

          hasMerged = true
          break
        }
      }

      if (!hasMerged) {
        merged.push({ ...region })
      }
    })

    return merged
  }

  /**
   * 设置悬浮的元素
   */
  setHoveredElement(element: CanvasElement | null): void {
    this.hoveredElement = element
    if (element) {
      this.connectionPoints = this.calculateConnectionPoints(element)
    } else {
      this.connectionPoints = []
      this.hoveredConnectionPoint = null
    }
  }

  /**
   * 计算元素的连接点
   */
  private calculateConnectionPoints(element: CanvasElement): Vector2[] {
    const { position, size } = element
    const centerX = position.x + size.x / 2
    const centerY = position.y + size.y / 2
    
    // 四个边的中心点
    return [
      { x: centerX, y: position.y },           // 上
      { x: position.x + size.x, y: centerY },   // 右
      { x: centerX, y: position.y + size.y },  // 下
      { x: position.x, y: centerY }            // 左
    ]
  }

  /**
   * 设置悬浮的连接点
   */
  setHoveredConnectionPoint(point: Vector2 | null): void {
    this.hoveredConnectionPoint = point
  }

  /**
   * 获取悬浮的连接点
   */
  getHoveredConnectionPoint(): Vector2 | null {
    return this.hoveredConnectionPoint
  }

  /**
   * 渲染连接点
   */
  renderConnectionPoints(): void {
    if (!this.hoveredElement || this.connectionPoints.length === 0) {
      return
    }

    this.ctx.save()
    
    this.connectionPoints.forEach(point => {
      // 将世界坐标转换为屏幕坐标
      const screenPoint = this.coordinateTransformer.virtualToScreen(point)
      
      const isHovered = this.hoveredConnectionPoint && 
        Math.abs(point.x - this.hoveredConnectionPoint.x) < 1 && 
        Math.abs(point.y - this.hoveredConnectionPoint.y) < 1
      
      // 设置连接点样式
      this.ctx.fillStyle = isHovered ? '#64b5f6' : '#1976d2' // 悬浮时浅蓝色，否则深蓝色
      this.ctx.strokeStyle = '#ffffff'
      this.ctx.lineWidth = 2
      
      // 绘制连接点
      this.ctx.beginPath()
      this.ctx.arc(screenPoint.x, screenPoint.y, 6, 0, 2 * Math.PI)
      this.ctx.fill()
      this.ctx.stroke()
    })
    
    this.ctx.restore()
  }

  /**
   * 渲染连接线（拖拽时）
   */
  renderConnectionLine(): void {

    if (!this.isDraggingConnection || !this.connectionStartPoint || !this.connectionEndPoint) {
      return
    }

    this.ctx.save()
    
    // 设置虚线样式
    this.ctx.setLineDash([8, 4])
    this.ctx.strokeStyle = '#1976d2'
    this.ctx.lineWidth = 2
    
    // 将世界坐标转换为屏幕坐标
    const startScreen = this.coordinateTransformer.virtualToScreen(this.connectionStartPoint)
    const endScreen = this.coordinateTransformer.virtualToScreen(this.connectionEndPoint)
    
    
    // 绘制虚线
    this.ctx.beginPath()
    this.ctx.moveTo(startScreen.x, startScreen.y)
    this.ctx.lineTo(endScreen.x, endScreen.y)
    this.ctx.stroke()
    
    // 绘制箭头
    this.drawArrow(endScreen, startScreen, 12, 8)

    this.ctx.restore()
  }

  /**
   * 绘制箭头
   */
  private drawArrow(to: Vector2, from: Vector2, arrowLength: number, arrowWidth: number): void {
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    
    this.ctx.save()
    this.ctx.fillStyle = '#1976d2'
    this.ctx.beginPath()
    
    // 箭头顶点
    this.ctx.moveTo(to.x, to.y)
    
    // 箭头左侧点
    this.ctx.lineTo(
      to.x - arrowLength * Math.cos(angle - Math.PI / 6),
      to.y - arrowLength * Math.sin(angle - Math.PI / 6)
    )
    
    // 箭头右侧点
    this.ctx.lineTo(
      to.x - arrowLength * Math.cos(angle + Math.PI / 6),
      to.y - arrowLength * Math.sin(angle + Math.PI / 6)
    )
    
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.restore()
  }

  /**
   * 设置连接线拖拽状态
   */
  setConnectionDragState(isDragging: boolean, startPoint?: Vector2, endPoint?: Vector2): void {
    this.isDraggingConnection = isDragging
    this.connectionStartPoint = startPoint || null
    this.connectionEndPoint = endPoint || null
  }

  /**
   * 获取当前连接终点
   */
  getConnectionEndPoint(): Vector2 | null {
    return this.connectionEndPoint
  }

  /**
   * 更新连接线终点
   */
  updateConnectionEndPoint(endPoint: Vector2): void {
    this.connectionEndPoint = endPoint
  }

  /**
   * 获取当前悬浮的元素
   */
  getHoveredElement(): CanvasElement | null {
    return this.hoveredElement
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 清理预览层
    if (this.previewLayer && this.previewLayer.parentNode) {
      this.previewLayer.parentNode.removeChild(this.previewLayer)
    }
    this.previewLayer = null
    this.previewCtx = null
    
    // 清理图片渲染器
    if (this.imageRenderer && 'destroy' in this.imageRenderer) {
      (this.imageRenderer as any).destroy()
    }
    
    // 清理数组
    this.selectedElements = []
    this.previewElements = []
    this.dirtyRegions = []
  }

  /**
   * 获取可见元素
   */
  private getVisibleElements(elements: CanvasElement[], viewport: any): CanvasElement[] {
    return elements.filter(element => {
      const screenPos = this.coordinateTransformer.virtualToScreen(element.position)
      const screenSize = this.coordinateTransformer.virtualToScreen({
        x: element.size.x,
        y: element.size.y
      })

      return screenPos.x < viewport.width &&
             screenPos.y < viewport.height &&
             screenPos.x + screenSize.x > 0 &&
             screenPos.y + screenSize.y > 0
    })
  }

  /**
   * 渲染单个元素
   */
  renderElement(element: CanvasElement): void {
    if (!element.visible) {
      return
    }
    
    // 获取屏幕坐标
    const screenPos = this.coordinateTransformer.virtualToScreen(element.position)
    const screenSize = this.coordinateTransformer.virtualToScreenSize(element.size)
    
    // LOD 优化：极低细节级别时，跳过太小的元素
    if (this.lodLevel === 'low' && (screenSize.x < 2 || screenSize.y < 2)) {
      return
    }
    
    this.ctx.save()

    // 计算元素中心点（屏幕坐标）
    const centerX = screenPos.x + screenSize.x / 2
    const centerY = screenPos.y + screenSize.y / 2

    // 移动到元素中心点
    this.ctx.translate(centerX, centerY)

    // 应用旋转（以中心点为基准）
    if (element.rotation !== 0) {
      this.ctx.rotate((element.rotation * Math.PI) / 180) // 将角度转换为弧度
    }

    // 移动到元素的左上角（相对于中心点）
    this.ctx.translate(-screenSize.x / 2, -screenSize.y / 2)

    // LOD 优化：低细节级别时不使用离屏缓存，直接绘制简化版本
    const useCache = (element.type === 'shape' || element.type === 'text') && this.lodLevel !== 'low'
    
    if (useCache) {
      const version = this.getElementVersion(element)
      let cacheEntry = this.elementCache.get(element.id)

      // 如果没有缓存或版本不一致，重新生成离屏缓存
      if (!cacheEntry || cacheEntry.version !== version) {
        cacheEntry = this.renderElementToCache(element, version)
        this.elementCache.set(element.id, cacheEntry)
      }

      const cacheCanvas = cacheEntry.canvas

      // 将离屏 Canvas 绘制到主画布（这里已经在元素坐标系下，只需画内容）
      this.ctx.drawImage(cacheCanvas, 0, 0, screenSize.x, screenSize.y)
    } else if (this.lodLevel === 'low') {
      // LOD 低细节：绘制简化版本（只有填充矩形）
      this.renderElementLowDetail(element, screenSize)
    } else {
      // 其它类型保持原有渲染路径
      switch (element.type) {
        case 'shape':
          this.renderShapeElement(element)
          break
        case 'text':
          this.renderTextElement(element)
          break
        case 'path':
          this.renderPathElement(element)
          break
        case 'image':
          this.renderImageElement(element)
          break
        case 'arrow':
          this.renderArrowElement(element)
          break
        case 'line':
          this.renderLineElement(element)
          break
      }
    }

    this.ctx.restore()
  }

  /**
   * LOD 低细节渲染：只绘制简化版本
   */
  private renderElementLowDetail(element: CanvasElement, screenSize: { x: number; y: number }): void {
    const ctx = this.ctx
    
    // 获取元素样式
    const fill = element.style?.fill || '#cccccc'
    const stroke = element.style?.stroke || 'transparent'
    const strokeWidth = element.style?.strokeWidth || 1
    
    // 绘制填充矩形
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, screenSize.x, screenSize.y)
    
    // 如果有描边则绘制
    if (stroke && stroke !== 'transparent') {
      ctx.strokeStyle = stroke
      ctx.lineWidth = Math.max(1, strokeWidth)
      ctx.strokeRect(0, 0, screenSize.x, screenSize.y)
    }
  }

  /**
   * 将元素内容渲染到离屏 Canvas（不包含位移/旋转，只渲染局部内容）
   */
  private renderElementToCache(
    element: CanvasElement,
    version: string
  ): { canvas: HTMLCanvasElement; version: string } {
    // 使用元素自身的尺寸作为离屏画布尺寸（虚拟坐标系）
    const width = Math.max(1, Math.round(element.size.x || 1))
    const height = Math.max(1, Math.round(element.size.y || 1))

    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height
    const offCtx = offscreen.getContext('2d')!

    // 暂时切换 ctx，让现有渲染逻辑在离屏画布上执行
    const originalCtx = this.ctx
    this.ctx = offCtx

    try {
      switch (element.type) {
        case 'shape':
          this.renderShapeElement(element)
          break
        case 'text':
          this.renderTextElement(element)
          break
      }
    } finally {
      this.ctx = originalCtx
    }

    return {
      canvas: offscreen,
      version
    }
  }

  /**
   * 生成用于判断缓存是否失效的版本标识
   * 简单做法：基于元素的关键字段序列化；包含当前缩放，缩放变化时会重建缓存
   */
  private getElementVersion(element: CanvasElement): string {
    const viewport = this.viewportManager.getViewport()

    // 只包含与渲染结果强相关的字段
    return JSON.stringify({
      type: element.type,
      size: element.size,
      style: element.style,
      data: element.data,
      rotation: element.rotation,
      scale: viewport.scale
    })
  }

  /**
   * 外部可显式使某个元素的缓存失效
   */
  invalidateElementCache(elementId: string): void {
    this.elementCache.delete(elementId)
  }

  /**
   * 清空所有离屏缓存
   */
  clearElementCache(): void {
    this.elementCache.clear()
  }

  /**
   * 应用元素样式
   */
  private applyElementStyle(style: ElementStyle): void {
    if (style.fill) {
      this.ctx.fillStyle = style.fill
    }
    if (style.stroke) {
      this.ctx.strokeStyle = style.stroke
    }
    if (style.strokeWidth) {
      this.ctx.lineWidth = style.strokeWidth
    }
    if (style.lineCap) {
      this.ctx.lineCap = style.lineCap as CanvasLineCap
    }
    if (style.opacity !== undefined) {
      this.ctx.globalAlpha = style.opacity
    }
    
    // 处理虚线样式
    if (style.lineDash) {
      this.ctx.setLineDash(style.lineDash)
    } else if (style.lineStyle) {
      this.applyLineStyle(style.lineStyle)
    }
  }

  /**
   * 应用线条样式
   */
  private applyLineStyle(lineStyle: string): void {
    switch (lineStyle) {
      case 'solid':
        this.ctx.setLineDash([])
        break
      case 'dashed':
        this.ctx.setLineDash([10, 5])
        break
      case 'dotted':
        this.ctx.setLineDash([2, 3])
        break
      case 'dash-dot':
        this.ctx.setLineDash([10, 5, 2, 5])
        break
      default:
        this.ctx.setLineDash([])
        break
    }
  }

  /**
   * 渲染形状元素
   */
  private renderShapeElement(element: CanvasElement): void {
    const width = element.size.x
    const height = element.size.y
    const style = element.style
    const shapeType = element.data?.shapeType || element.data?.shape || ShapeType.RECTANGLE

    this.applyElementStyle(style)

    this.ctx.beginPath()
    
    switch (shapeType) {
      case ShapeType.RECTANGLE:
      case 'rectangle':
        this.ctx.rect(0, 0, width, height)
        break
      case ShapeType.CIRCLE:
      case 'circle':
        this.ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
        break
      case ShapeType.TRIANGLE:
      case 'triangle':
        this.ctx.moveTo(width / 2, 0)
        this.ctx.lineTo(0, height)
        this.ctx.lineTo(width, height)
        this.ctx.closePath()
        break
      case ShapeType.DIAMOND:
      case 'diamond':
        this.ctx.moveTo(width / 2, 0)
        this.ctx.lineTo(width, height / 2)
        this.ctx.lineTo(width / 2, height)
        this.ctx.lineTo(0, height / 2)
        this.ctx.closePath()
        break
      case 'ellipse':
        this.ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        break
      case ShapeType.STAR:
        // 简化的五角星
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) / 2
        this.ctx.moveTo(centerX, centerY - radius)
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
          const x = centerX + radius * Math.cos(angle)
          const y = centerY + radius * Math.sin(angle)
          this.ctx.lineTo(x, y)
        }
        this.ctx.closePath()
        break
      case ShapeType.ELLIPSE:
        this.ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        break
    }

    if (style.fill) {
      this.ctx.fill()
    }
    if (style.stroke) {
      this.ctx.stroke()
    }

    // 渲染形状中的文字
    this.renderShapeText(element)
  }

  /**
   * 渲染形状中的文字
   */
  private renderShapeText(element: CanvasElement): void {
    const text = element.data?.text
    if (!text) return

    const width = element.size.x
    const height = element.size.y
    const textStyle = element.data?.textStyle || {}

    // 设置文字样式
    const fontSize = textStyle.fontSize || 16
    const fontFamily = textStyle.fontFamily || 'Arial'
    const fontWeight = textStyle.fontWeight || 'normal'
    const fontStyle = textStyle.fontStyle || 'normal'
    const textAlign = textStyle.textAlign || 'center'
    const textColor = textStyle.color || '#000000'

    // 构建字体字符串
    const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.font = fontString
    this.ctx.fillStyle = textColor
    this.ctx.textAlign = textAlign as CanvasTextAlign
    this.ctx.textBaseline = 'middle'

    // 处理多行文字
    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2
    const totalTextHeight = lines.length * lineHeight
    const startY = (height - totalTextHeight) / 2 + lineHeight / 2

    // 计算绘制位置（考虑对齐方式）
    let drawX = width / 2
    if (textAlign === 'left') {
      drawX = 10 // 左边距
    } else if (textAlign === 'right') {
      drawX = width - 10 // 右边距
    }

    // 绘制文字
    let currentY = startY
    for (const line of lines) {
      this.ctx.fillText(line, drawX, currentY)
      currentY += lineHeight
    }

    // 绘制文字装饰
    if (textStyle.textDecoration && textStyle.textDecoration !== 'none') {
      this.ctx.strokeStyle = textColor
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      
      const textWidth = this.ctx.measureText(text).width
      let decorationX = drawX
      
      if (textAlign === 'center') {
        decorationX = drawX - textWidth / 2
      } else if (textAlign === 'right') {
        decorationX = drawX - textWidth
      }
      
      if (textStyle.textDecoration === 'underline') {
        const underlineY = currentY - lineHeight + 2
        this.ctx.moveTo(decorationX, underlineY)
        this.ctx.lineTo(decorationX + textWidth, underlineY)
      } else if (textStyle.textDecoration === 'line-through') {
        const strikeY = currentY / 2
        this.ctx.moveTo(decorationX, strikeY)
        this.ctx.lineTo(decorationX + textWidth, strikeY)
      }
      
      this.ctx.stroke()
    }
  }

  /**
   * 渲染文本元素
   */
  private renderTextElement(element: CanvasElement): void {
    const width = element.size.x
    const height = element.size.y
    const style = element.style

    // 应用元素样式（包括填充颜色）
    this.applyElementStyle(style)

    // 设置文本样式
    const fontSize = style.fontSize || 16
    
    
    const fontFamily = style.fontFamily || 'Arial'
    const fontWeight = style.fontWeight || 'normal'
    const fontStyle = style.fontStyle || 'normal'
    const textAlign = style.textAlign || 'left'
    // 优先使用 fill 颜色，然后是 textColor，最后是默认黑色
    const textColor = style.fill || '#000000'
    
    // 构建字体字符串
    const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.font = fontString
    this.ctx.fillStyle = textColor
    this.ctx.textAlign = textAlign as CanvasTextAlign
    this.ctx.textBaseline = 'middle' // 改为 middle，让文字垂直居中

    // 获取文本内容
    const text = element.data?.text || 'Text'
    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2
    
    // 计算文本宽度（用于对齐）
    let maxWidth = 0
    for (const line of lines) {
      const lineWidth = this.ctx.measureText(line).width
      maxWidth = Math.max(maxWidth, lineWidth)
    }
    
    // 计算绘制位置（考虑对齐方式）
    let drawX = 0
    if (textAlign === 'center') {
      drawX = width / 2
    } else if (textAlign === 'right') {
      drawX = width
    }
    
    // 计算垂直居中位置
    const totalTextHeight = lines.length * lineHeight
    const startY = (height - totalTextHeight) / 2 + lineHeight / 2
    
    // 绘制文本（支持多行）
    let currentY = startY
    for (const line of lines) {
      
      // 绘制文字
      this.ctx.fillText(line, drawX, currentY)
      currentY += lineHeight
    }
    
    // 绘制文本装饰
    if (style.textDecoration && style.textDecoration !== 'none') {
      this.ctx.strokeStyle = textColor
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      
      if (style.textDecoration === 'underline') {
        const underlineY = currentY - lineHeight + 2
        this.ctx.moveTo(0, underlineY)
        this.ctx.lineTo(maxWidth, underlineY)
      } else if (style.textDecoration === 'line-through') {
        const strikeY = currentY / 2
        this.ctx.moveTo(0, strikeY)
        this.ctx.lineTo(maxWidth, strikeY)
      }
      
      this.ctx.stroke()
    }
  }

  /**
   * 渲染路径元素
   */
  private renderPathElement(element: CanvasElement): void {
    const style = element.style
    const path = element.data?.points || []

    this.applyElementStyle(style)

    if (path.length > 0) {
      this.ctx.beginPath()
      this.ctx.moveTo(path[0].x, path[0].y)

      if (path.length === 1) {
        // 单点，绘制一个小圆点
        const radius = (style.strokeWidth || 2) / 2
        this.ctx.arc(path[0].x, path[0].y, radius, 0, Math.PI * 2)
      } else if (path.length === 2) {
        // 两个点，绘制直线
        this.ctx.lineTo(path[1].x, path[1].y)
      } else {
        // 多个点，使用贝塞尔曲线绘制平滑路径
        this.drawSmoothPath(path)
      }

      if (style.fill) {
        this.ctx.fill()
      }
      if (style.stroke) {
        this.ctx.stroke()
      }
    }
  }

  /**
   * 绘制平滑路径
   */
  private drawSmoothPath(points: Vector2[]): void {
    if (points.length < 2) return

    // 使用二次贝塞尔曲线绘制平滑路径
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      
      // 计算控制点（当前点和下一个点的中点）
      const controlX = (current.x + next.x) / 2
      const controlY = (current.y + next.y) / 2
      
      this.ctx.quadraticCurveTo(current.x, current.y, controlX, controlY)
    }
    
    // 连接到最后一个点
    const lastPoint = points[points.length - 1]
    this.ctx.lineTo(lastPoint.x, lastPoint.y)
  }

  /**
   * 渲染图片元素
   */
  private renderImageElement(element: CanvasElement): void {
    const width = element.size.x
    const height = element.size.y
    
    // 更新ImageRenderer的视口信息
    const viewport = this.viewportManager.getViewport()
    this.imageRenderer.updateViewport({
      scale: viewport.scale,
      offset: viewport.offset
    })
    
    // 检查是否是ImageElement类型
    if (element.type === 'image' && 'loadImage' in element) {
      const imageElement = element as any
      
      // 检查图片是否已经加载
      if (imageElement.isLoaded && imageElement.isLoaded()) {
        const image = imageElement.getImage()
        if (image) {
          // 只使用ImageRenderer渲染图片（包含所有样式、滤镜和变换）
          this.imageRenderer.renderImage(element)
          
          // 渲染图片上的叠加文字
          this.renderImageOverlayText(element)
          return
        }
      }
      
      // 如果图片正在加载或未加载，显示占位符
      this.renderImagePlaceholder(width, height)
      
      // 异步加载图片（用于下次渲染）
      if (!imageElement.isLoading || !imageElement.isLoading()) {
        imageElement.loadImage().catch(() => {
          // 图片加载失败，静默处理
        })
      }
    } else {
      // 兼容旧的数据结构
      const image = element.data?.image
      if (image) {
        // 只使用ImageRenderer渲染图片
        this.imageRenderer.renderImage(element)
        
        // 渲染图片上的叠加文字
        this.renderImageOverlayText(element)
      } else {
        // 渲染占位符
        this.renderImagePlaceholder(width, height)
      }
    }
  }

  
  /**
   * 渲染图片占位符
   */
  private renderImagePlaceholder(width: number, height: number): void {
    this.ctx.save()
    
    // 设置占位符样式
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.strokeStyle = '#ccc'
    this.ctx.lineWidth = 1
    
    // 绘制占位符矩形
    this.ctx.fillRect(0, 0, width, height)
    this.ctx.strokeRect(0, 0, width, height)
    
    // 绘制图片图标
    this.ctx.fillStyle = '#999'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('📷', width / 2, height / 2)
    
    this.ctx.restore()
  }

  /**
   * 渲染图片上的叠加文字
   */
  private renderImageOverlayText(element: CanvasElement): void {
    const overlayText = element.data?.overlayText
    if (!overlayText || !overlayText.visible || !overlayText.text) {
      return
    }


    this.ctx.save()

    // 设置文字样式
    const fontSize = overlayText.fontSize || 20
    const fontFamily = overlayText.fontFamily || 'Arial'
    const fontWeight = overlayText.fontWeight || 'normal'
    const fontStyle = overlayText.fontStyle || 'normal'
    const textAlign = overlayText.textAlign || 'center'
    const color = overlayText.color || '#ff0000'

    // 构建字体字符串
    const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.font = fontString
    this.ctx.fillStyle = color
    this.ctx.textAlign = textAlign as CanvasTextAlign
    this.ctx.textBaseline = 'middle'

    // 计算文字位置（相对于图片的百分比位置）
    const textX = element.size.x * overlayText.position.x
    const textY = element.size.y * overlayText.position.y


    // 绘制文字
    this.ctx.fillText(overlayText.text, textX, textY)

    // 绘制文字装饰
    if (overlayText.textDecoration && overlayText.textDecoration !== 'none') {
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      
      const textWidth = this.ctx.measureText(overlayText.text).width
      let decorationX = textX
      
      if (textAlign === 'center') {
        decorationX = textX - textWidth / 2
      } else if (textAlign === 'right') {
        decorationX = textX - textWidth
      }
      
      if (overlayText.textDecoration === 'underline') {
        const underlineY = textY + fontSize / 2 + 2
        this.ctx.moveTo(decorationX, underlineY)
        this.ctx.lineTo(decorationX + textWidth, underlineY)
      } else if (overlayText.textDecoration === 'line-through') {
        this.ctx.moveTo(decorationX, textY)
        this.ctx.lineTo(decorationX + textWidth, textY)
      }
      
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  /**
   * 渲染箭头元素
   */
  private renderArrowElement(element: CanvasElement): void {

    const style = element.style
    let points = element.data?.points || []
    
    // 如果没有points数组，尝试从startPoint和endPoint构建
    if (points.length === 0 && element.data?.startPoint && element.data?.endPoint) {
      points = [element.data.startPoint, element.data.endPoint]
    }
    
    const arrowStyle = element.data?.arrowStyle || {}
    const arrowType = element.data?.arrowType || 'line'

    // ✅ 修复：将虚拟坐标的points转换为屏幕坐标
    // 由于画布上下文已经被移动到元素的左上角（屏幕坐标），
    // 我们需要将points中的虚拟坐标转换为屏幕坐标
    const screenPoints = points.map(point => {
      // 计算绝对虚拟坐标
      const absoluteVirtualPoint = {
        x: element.position.x + point.x,
        y: element.position.y + point.y
      }
      // 转换为屏幕坐标
      const screenPoint = this.coordinateTransformer.virtualToScreen(absoluteVirtualPoint)
      // 获取元素左上角的屏幕坐标
      const screenPos = this.coordinateTransformer.virtualToScreen(element.position)
      // 返回相对于元素左上角的屏幕坐标
      return {
        x: screenPoint.x - screenPos.x,
        y: screenPoint.y - screenPos.y
      }
    })

    this.applyElementStyle(style)

    if (screenPoints.length >= 2) {

      this.ctx.beginPath()
      this.ctx.moveTo(screenPoints[0].x, screenPoints[0].y)
      
      for (let i = 1; i < screenPoints.length; i++) {
        this.ctx.lineTo(screenPoints[i].x, screenPoints[i].y)
      }
      
      if (style.stroke) {
        this.ctx.stroke()
      }

      // 根据箭头类型绘制箭头头部（使用屏幕坐标）
      if (arrowType === 'bidirectional') {
        // 双向箭头：在两端都绘制箭头头部
        // 起始端箭头：反向绘制（从 screenPoints[1] 指向 screenPoints[0]）
        this.drawArrowHead(screenPoints[1], screenPoints[0], arrowStyle)
        // 结束端箭头：正向绘制（从 screenPoints[screenPoints.length - 2] 指向 screenPoints[screenPoints.length - 1]）
        this.drawArrowHead(screenPoints[screenPoints.length - 2], screenPoints[screenPoints.length - 1], arrowStyle)
      } else {
        // 单向箭头：只在结束端绘制箭头头部
        this.drawArrowHead(screenPoints[screenPoints.length - 2], screenPoints[screenPoints.length - 1], arrowStyle)
      }
    } else {
    }
  }

  /**
   * 绘制箭头头部
   */
  private drawArrowHead(start: Vector2, end: Vector2, arrowStyle: any): void {
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const arrowLength = arrowStyle.size || 10
    const arrowShape = arrowStyle.shape || 'triangle'
    
    
    this.ctx.save()
    this.ctx.fillStyle = arrowStyle.color || '#000000'
    this.ctx.strokeStyle = arrowStyle.strokeColor || '#000000'
    this.ctx.lineWidth = arrowStyle.strokeWidth || 2
    
    this.ctx.beginPath()
    
    switch (arrowShape) {
      case 'triangle':
        // 三角形箭头 - 修复：箭头应该指向终点，而不是从终点向后
        // 计算箭头头部的三个顶点：尖端在终点，两个底角向后
        const tipX = end.x
        const tipY = end.y
        const leftX = end.x - Math.cos(angle - Math.PI / 6) * arrowLength
        const leftY = end.y - Math.sin(angle - Math.PI / 6) * arrowLength
        const rightX = end.x - Math.cos(angle + Math.PI / 6) * arrowLength
        const rightY = end.y - Math.sin(angle + Math.PI / 6) * arrowLength
        
        
        // 绘制指向终点的三角形箭头
        this.ctx.moveTo(tipX, tipY)      // 从尖端开始
        this.ctx.lineTo(leftX, leftY)     // 到底角1
        this.ctx.lineTo(rightX, rightY)   // 到底角2
        this.ctx.closePath()              // 闭合到尖端
        this.ctx.fill()
        break
        
      case 'circle':
        // 圆形箭头
        this.ctx.arc(end.x, end.y, arrowLength * 0.3, 0, 2 * Math.PI)
        this.ctx.fill()
        break
        
      case 'square':
        // 方形箭头
        const size = arrowLength * 0.4
        this.ctx.rect(end.x - size / 2, end.y - size / 2, size, size)
        this.ctx.fill()
        break
    }
    
    this.ctx.restore()
  }

  /**
   * 渲染线条元素
   */
  private renderLineElement(element: CanvasElement): void {
    const style = element.style
    const points = element.data?.points || []

    // ✅ 修复：将虚拟坐标的points转换为屏幕坐标
    // 由于画布上下文已经被移动到元素的左上角（屏幕坐标），
    // 我们需要将points中的虚拟坐标转换为屏幕坐标
    const screenPoints = points.map(point => {
      // 计算绝对虚拟坐标
      const absoluteVirtualPoint = {
        x: element.position.x + point.x,
        y: element.position.y + point.y
      }
      // 转换为屏幕坐标
      const screenPoint = this.coordinateTransformer.virtualToScreen(absoluteVirtualPoint)
      // 获取元素左上角的屏幕坐标
      const screenPos = this.coordinateTransformer.virtualToScreen(element.position)
      // 返回相对于元素左上角的屏幕坐标
      return {
        x: screenPoint.x - screenPos.x,
        y: screenPoint.y - screenPos.y
      }
    })

    this.applyElementStyle(style)

    if (screenPoints.length >= 2) {
    this.ctx.beginPath()
    this.ctx.moveTo(screenPoints[0].x, screenPoints[0].y)
    
    for (let i = 1; i < screenPoints.length; i++) {
      this.ctx.lineTo(screenPoints[i].x, screenPoints[i].y)
    }
    
      if (style.stroke) {
    this.ctx.stroke()
      }
    }
  }

  /**
   * 开始预览模式
   */
  startPreview(): void {
    this.isPreviewMode = true
    this.clearPreviewLayer()
  }

  /**
   * 结束预览模式
   */
  endPreview(): void {
    this.isPreviewMode = false
    this.previewElements = []
    this.clearPreviewLayer()
  }

  /**
   * 设置预览元素
   */
  setPreviewElements(elements: CanvasElement[]): void {
    this.previewElements = elements
    if (this.isPreviewMode) {
      this.renderPreviewElements()
    }
  }

  /**
   * 清空预览层
   */
  private clearPreviewLayer(): void {
    if (!this.previewCtx) return
    
    const { width, height } = this.previewLayer!
    this.previewCtx.clearRect(0, 0, width, height)
  }

  /**
   * 渲染预览元素
   */
  private renderPreviewElements(): void {
    if (!this.previewCtx || !this.isPreviewMode) return
    
    // 清空预览层
    this.clearPreviewLayer()
    
    // 获取视口信息
    const viewport = this.viewportManager.getViewport()
    const visibleElements = this.getVisibleElements(this.previewElements, viewport)
    
    // 渲染预览元素（带虚线效果）
    visibleElements.forEach(element => {
      this.renderPreviewElement(element)
    })
  }

  /**
   * 渲染预览元素（带虚线效果）
   */
  private renderPreviewElement(element: CanvasElement): void {
    if (!this.previewCtx || !element.visible) return
    
    this.previewCtx.save()

    // ✅ 修复：预览使用与最终绘制相同的坐标系统
    // 应用视口变换（与最终绘制保持一致）
    this.viewportManager.applyTransform(this.previewCtx)
    
    // 使用虚拟坐标
    this.previewCtx.translate(element.position.x, element.position.y)

    // 应用旋转
    if (element.rotation !== 0) {
      this.previewCtx.rotate(element.rotation)
    }

    // 设置预览样式（虚线效果）
    this.previewCtx.globalAlpha = 0.7
    this.previewCtx.setLineDash([5, 5])

    // 根据元素类型渲染预览
    switch (element.type) {
      case 'shape':
        this.renderShapePreview(element)
        break
      case 'text':
        this.renderTextPreview(element)
        break
      case 'path':
        this.renderPathPreview(element)
        break
      case 'image':
        this.renderImagePreview(element)
        break
      case 'arrow':
        this.renderArrowPreview(element)
        break
      case 'line':
        this.renderLinePreview(element)
        break
    }

    this.previewCtx.restore()
  }

  /**
   * 渲染形状预览
   */
  private renderShapePreview(element: CanvasElement): void {
    if (!this.previewCtx) return
    
    const width = element.size.x
    const height = element.size.y
    const style = element.style

    this.applyElementStyle(style)

    // 绘制矩形预览
    this.previewCtx.beginPath()
    this.previewCtx.rect(0, 0, width, height)

    if (style.fill) {
      this.previewCtx.fill()
    }
    if (style.stroke) {
      this.previewCtx.stroke()
    }
  }

  /**
   * 渲染文本预览
   */
  private renderTextPreview(element: CanvasElement): void {
    if (!this.previewCtx) return
    
    const width = element.size.x
    const style = element.style

    // 应用元素样式
    this.applyElementStyle(style)

    // 设置文本样式
    const fontSize = style.fontSize || 16
    
    const fontFamily = style.fontFamily || 'Arial'
    const fontWeight = style.fontWeight || 'normal'
    const fontStyle = style.fontStyle || 'normal'
    const textAlign = style.textAlign || 'left'
    const textColor = style.fill || '#000000'
    
    // 构建字体字符串
    const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    this.previewCtx.font = fontString
    this.previewCtx.fillStyle = textColor
    this.previewCtx.textAlign = textAlign as CanvasTextAlign
    this.previewCtx.textBaseline = 'top'

    // 获取文本内容
    const text = element.data?.text || 'Text'
    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2
    
    // 计算绘制位置
    let drawX = 0
    if (textAlign === 'center') {
      drawX = width / 2
    } else if (textAlign === 'right') {
      drawX = width
    }
    
    // 绘制文本
    let currentY = 0
    for (const line of lines) {
      this.previewCtx.fillText(line, drawX, currentY)
      currentY += lineHeight
    }
  }

  /**
   * 渲染路径预览
   */
  private renderPathPreview(element: CanvasElement): void {
    if (!this.previewCtx) return
    
    const style = element.style
    const path = element.data?.points || []

    this.applyElementStyle(style)

    if (path.length > 0) {
      this.previewCtx.beginPath()
      
      // ✅ 修复：路径点坐标是相对于元素位置的
      // 由于已经应用了 translate(element.position.x, element.position.y)
      // 路径点坐标应该直接使用，不需要额外转换
      this.previewCtx.moveTo(path[0].x, path[0].y)

      if (path.length === 1) {
        // 单点，绘制一个小圆点
        const radius = (style.strokeWidth || 2) / 2
        this.previewCtx.arc(path[0].x, path[0].y, radius, 0, Math.PI * 2)
      } else if (path.length === 2) {
        // 两个点，绘制直线
        this.previewCtx.lineTo(path[1].x, path[1].y)
      } else {
        // 多个点，使用贝塞尔曲线绘制平滑路径
        this.drawSmoothPath(path)
      }

      if (style.fill) {
        this.previewCtx.fill()
      }
      if (style.stroke) {
        this.previewCtx.stroke()
      }
    }
  }

  /**
   * 渲染图片预览
   */
  private renderImagePreview(element: CanvasElement): void {
    if (!this.previewCtx) return
    
    const width = element.size.x
    const height = element.size.y
    const image = element.data?.image

    if (image) {
      this.previewCtx.drawImage(image, 0, 0, width, height)
    }
  }

  /**
   * 渲染箭头预览
   */
  private renderArrowPreview(element: CanvasElement): void {
    if (!this.previewCtx) return
    
    const style = element.style
    const points = element.data?.points || []
    const arrowStyle = element.data?.arrowStyle || {}
    const arrowType = element.data?.arrowType || 'line'

    this.applyElementStyle(style)

    if (points.length >= 2) {
      this.previewCtx.beginPath()
      this.previewCtx.moveTo(points[0].x, points[0].y)
      
      for (let i = 1; i < points.length; i++) {
        this.previewCtx.lineTo(points[i].x, points[i].y)
      }
      
      if (style.stroke) {
        this.previewCtx.stroke()
      }

      // 根据箭头类型绘制箭头头部
      if (arrowType === 'bidirectional') {
        // 双向箭头：在两端都绘制箭头头部
        this.drawArrowHeadPreview(points[1], points[0], arrowStyle)
        this.drawArrowHeadPreview(points[points.length - 2], points[points.length - 1], arrowStyle)
      } else {
        // 单向箭头：只在结束端绘制箭头头部
        this.drawArrowHeadPreview(points[points.length - 2], points[points.length - 1], arrowStyle)
      }
    }
  }

  /**
   * 绘制箭头头部预览
   */
  private drawArrowHeadPreview(start: Vector2, end: Vector2, arrowStyle: any): void {
    if (!this.previewCtx) return
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const arrowLength = arrowStyle.size || 16
    const arrowShape = arrowStyle.shape || 'triangle'
    
    this.previewCtx.save()
    this.previewCtx.fillStyle = arrowStyle.color || '#000000'
    this.previewCtx.strokeStyle = arrowStyle.strokeColor || '#000000'
    this.previewCtx.lineWidth = arrowStyle.strokeWidth || 2
    
    this.previewCtx.beginPath()
    
    switch (arrowShape) {
      case 'triangle':
        // 三角形箭头
        const tipX = end.x
        const tipY = end.y
        const leftX = end.x - Math.cos(angle - Math.PI / 6) * arrowLength
        const leftY = end.y - Math.sin(angle - Math.PI / 6) * arrowLength
        const rightX = end.x - Math.cos(angle + Math.PI / 6) * arrowLength
        const rightY = end.y - Math.sin(angle + Math.PI / 6) * arrowLength
        
        this.previewCtx.moveTo(tipX, tipY)
        this.previewCtx.lineTo(leftX, leftY)
        this.previewCtx.lineTo(rightX, rightY)
        this.previewCtx.closePath()
        this.previewCtx.fill()
        break
        
      case 'circle':
        // 圆形箭头
        this.previewCtx.arc(end.x, end.y, arrowLength * 0.3, 0, 2 * Math.PI)
        this.previewCtx.fill()
        break
        
      case 'square':
        // 方形箭头
        const size = arrowLength * 0.4
        this.previewCtx.rect(end.x - size / 2, end.y - size / 2, size, size)
        this.previewCtx.fill()
        break
    }
    
    this.previewCtx.restore()
  }

  /**
   * 渲染线条预览
   */
  private renderLinePreview(element: CanvasElement): void {
    if (!this.previewCtx) return
    
    const style = element.style
    const points = element.data?.points || []

    this.applyElementStyle(style)

    if (points.length >= 2) {
      this.previewCtx.beginPath()
      this.previewCtx.moveTo(points[0].x, points[0].y)
      
      for (let i = 1; i < points.length; i++) {
        this.previewCtx.lineTo(points[i].x, points[i].y)
      }
      
      if (style.stroke) {
        this.previewCtx.stroke()
      }
    }
  }

  /**
   * 更新画布尺寸
   */
  updateCanvasSize(): void {
    // 获取逻辑像素尺寸
    const rect = this.canvas.getBoundingClientRect()
    this.viewportManager.updateViewportSize(rect.width, rect.height)
    
    // 更新预览层尺寸
    this.updatePreviewLayerSize()
  }

  /**
   * 设置选中的元素
   */
  setSelectedElements(elements: CanvasElement[]): void {
    this.selectedElements = elements
  }

  /**
   * 设置样式刷视觉反馈
   */
  setStyleBrushVisualFeedback(_sourceElement: CanvasElement | null, _targetElement: CanvasElement | null): void {
    // 这个方法暂时为空实现，后续可以添加样式刷的视觉反馈
  }

  /**
   * 渲染网格（支持无限画布）
   */
  renderGrid(): void {
    const viewport = this.viewportManager.getViewport()
    const gridSize = 20
    const rulerSize = 20 // 标尺大小


    this.ctx.strokeStyle = '#e0e0e0'
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([])

    // 使用扩展的画布边界
    const canvasBounds = this.getCanvasBounds()
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
    
    // 计算当前视口在虚拟坐标中的范围
    const viewportLeft = viewport.offset.x
    const viewportTop = viewport.offset.y
    const viewportRight = viewport.offset.x + canvasWidth / viewport.scale
    const viewportBottom = viewport.offset.y + canvasHeight / viewport.scale
    
    // 优化网格渲染范围，控制性能
    const margin = Math.min(500, Math.max(canvasWidth, canvasHeight) / viewport.scale) // 限制边距，控制性能
    
    // 计算网格渲染范围，确保覆盖整个可见区域
    const renderStartX = Math.floor((viewportLeft - margin) / gridSize) * gridSize
    const renderStartY = Math.floor((viewportTop - margin) / gridSize) * gridSize
    const renderEndX = viewportRight + margin
    const renderEndY = viewportBottom + margin
    
    // 预渲染整个3.0k画布的网格
    const startX = -3000
    const startY = -3000
    const endX = 3000
    const endY = 3000

    const verticalLines = Math.floor((endX - startX) / gridSize) + 1
    const horizontalLines = Math.floor((endY - startY) / gridSize) + 1

    this.ctx.beginPath()

    // 绘制垂直线 - 直接计算屏幕坐标，确保无限画布渲染
    let renderedVerticalLines = 0
    for (let x = startX; x <= endX; x += gridSize) {
      // 直接计算屏幕坐标，不依赖coordinateTransformer
      const screenX = rulerSize + (x - viewport.offset.x) * viewport.scale
      // 放宽可见范围检查，确保大坐标时也能渲染
      if (screenX >= -50 && screenX <= canvasWidth + 50) {
        this.ctx.moveTo(screenX, rulerSize)
        this.ctx.lineTo(screenX, canvasHeight)
        renderedVerticalLines++
      }
    }
    
    // 绘制水平线 - 直接计算屏幕坐标，确保无限画布渲染
    let renderedHorizontalLines = 0
    for (let y = startY; y <= endY; y += gridSize) {
      // 直接计算屏幕坐标，不依赖coordinateTransformer
      const screenY = rulerSize + (y - viewport.offset.y) * viewport.scale
      // 放宽可见范围检查，确保大坐标时也能渲染
      if (screenY >= -50 && screenY <= canvasHeight + 50) {
        this.ctx.moveTo(rulerSize, screenY)
        this.ctx.lineTo(canvasWidth, screenY)
        renderedHorizontalLines++
      }
    }
    
    this.ctx.stroke()
  }

  /**
   * 渲染标尺（固定在屏幕位置）
   */
  renderRulers(): void {
    const viewport = this.viewportManager.getViewport()
    const rulerSize = 20

    // 保存当前画布状态
    this.ctx.save()

    // 绘制顶部标尺背景
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.fillRect(0, 0, this.canvas.width, rulerSize)

    // 绘制左侧标尺背景
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.fillRect(0, 0, rulerSize, this.canvas.height)

    // 绘制标尺边框
    this.ctx.strokeStyle = '#ccc'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    // 顶部标尺底边
    this.ctx.moveTo(0, rulerSize)
    this.ctx.lineTo(this.canvas.width, rulerSize)
    // 左侧标尺右边
    this.ctx.moveTo(rulerSize, 0)
    this.ctx.lineTo(rulerSize, this.canvas.height)
    this.ctx.stroke()

    // 绘制标尺刻度
    this.ctx.fillStyle = '#666'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    
    // 智能计算刻度间隔，确保数字不会挤在一起
    const scale = viewport.scale
    
    // 根据缩放级别动态调整字体大小
    let fontSize = 12
    if (scale < 0.5) {
      fontSize = 14 // 缩小视图时使用大字体
    } else if (scale < 1) {
      fontSize = 13
    } else if (scale > 4) {
      fontSize = 10 // 高度放大时使用小字体
    } else if (scale > 2) {
      fontSize = 11
    }
    
    this.ctx.font = `${fontSize}px Arial`
    const minScreenInterval = 60 // 最小屏幕间隔（像素），确保数字有足够空间
    const maxScreenInterval = 200 // 最大屏幕间隔（像素）
    
    // 计算合适的虚拟坐标间隔
    let interval = minScreenInterval / scale
    
    // 使用更智能的间隔选择算法
    const baseIntervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
    
    // 找到最接近的合适间隔
    for (const baseInterval of baseIntervals) {
      const screenInterval = baseInterval * scale
      if (screenInterval >= minScreenInterval && screenInterval <= maxScreenInterval) {
        interval = baseInterval
        break
      }
    }
    
    // 如果找不到合适的间隔，使用计算出的间隔
    if (interval < 1) {
      interval = Math.max(1, minScreenInterval / scale)
    }

    // 预渲染整个3.0k画布的顶部标尺
    const startX = -3000
    const endX = 3000
    
    for (let x = startX; x <= endX; x += interval) {
      const screenX = rulerSize + (x - viewport.offset.x) * scale  // 修复：减去偏移而不是加上
      if (screenX >= rulerSize && screenX <= this.canvas.width) {
        const value = Math.round(x)
        const displayText = this.formatRulerValue(value)
        
        this.ctx.fillText(displayText, screenX + 2, 2)
      }
    }

    // 预渲染整个3.0k画布的左侧标尺
    const startY = -3000
    const endY = 3000
    
    for (let y = startY; y <= endY; y += interval) {
      const screenY = rulerSize + (y - viewport.offset.y) * scale  // 修复：减去偏移而不是加上
      if (screenY >= rulerSize && screenY <= this.canvas.height) {
        this.ctx.save()
        this.ctx.translate(2, screenY)
        this.ctx.rotate(-Math.PI / 2)
        const value = Math.round(y)
        const displayText = this.formatRulerValue(value)
        
        // 特殊处理Y轴0.00的位置，确保显示在两个标尺交接的右下角
        if (value === 0) {
          // 对于Y轴的0.00，调整位置避免与X轴0.00重叠
          // 向右偏移更多像素，确保显示在标尺交接的右下角
          this.ctx.fillText(displayText, -35, 0) // 向右偏移35像素
        } else {
          this.ctx.fillText(displayText, 0, 0)
        }
        
        this.ctx.restore()
      }
    }

    // 恢复画布状态
    this.ctx.restore()
  }

  /**
   * 获取画布边界
   */
  private getCanvasBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    return this.canvasBounds
  }

  /**
   * 设置画布边界
   */
  setCanvasBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    this.canvasBounds = { ...bounds }
  }

  /**
   * 格式化标尺数值显示
   */
  private formatRulerValue(value: number): string {
    const absValue = Math.abs(value)
    
    // 根据数值大小选择合适的显示格式
    if (absValue >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (absValue >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    } else if (absValue >= 100) {
      return value.toString()
    } else if (absValue >= 10) {
      return value.toFixed(1)
    } else {
      return value.toFixed(2)
    }
  }

  /**
   * 计算标尺刻度间隔
   */
  private calculateRulerInterval(scale: number, _width: number, _height: number): { interval: number; fontSize: number } {
    // 根据缩放级别和视口大小动态调整间隔
    const baseInterval = 20
    const minScreenInterval = 40 // 最小屏幕间隔（像素）
    const maxScreenInterval = 200 // 最大屏幕间隔（像素）
    
    // 计算当前缩放下的基础间隔
    let interval = baseInterval
    
    // 根据缩放级别调整间隔
    if (scale < 0.5) {
      interval = Math.max(100, baseInterval * 5) // 缩小视图时使用更大间隔
    } else if (scale < 1) {
      interval = Math.max(50, baseInterval * 2) // 中等缩放
    } else if (scale > 2) {
      interval = Math.max(10, baseInterval / 2) // 放大视图时使用更小间隔
    } else if (scale > 4) {
      interval = Math.max(5, baseInterval / 4) // 高度放大时使用更小间隔
    }
    
    // 确保屏幕间隔在合理范围内
    const screenInterval = interval * scale
    if (screenInterval < minScreenInterval) {
      interval = minScreenInterval / scale
    } else if (screenInterval > maxScreenInterval) {
      interval = maxScreenInterval / scale
    }
    
    // 根据间隔大小调整字体大小
    let fontSize = 10
    if (interval >= 100) {
      fontSize = 12 // 大间隔使用大字体
    } else if (interval >= 50) {
      fontSize = 11
    } else if (interval <= 10) {
      fontSize = 8 // 小间隔使用小字体
    } else if (interval <= 20) {
      fontSize = 9
    }
    
    return { interval: Math.round(interval), fontSize }
  }

  /**
   * 渲染覆盖层（选中元素高亮等）
   */
  renderOverlay(isInternalUpdate: boolean = false): void {
    if (this.selectedElements.length === 0) return
    
    // 如果是内部更新（如变换过程中），不渲染选中样式
    if (isInternalUpdate) return

    this.ctx.save()
    
    // 渲染选中元素的高亮边框
    this.selectedElements.forEach(element => {
      if (!element.visible) return

      // 检查是否是连接线
      if (element.data?.isConnectionLine) {
        // 为连接线渲染连接点（圆点）
        this.renderConnectionLineEndpoints(element)
        this.ctx.restore()
        return
      }

      // 转换到屏幕坐标
      const screenPos = this.coordinateTransformer.virtualToScreen(element.position)
      const screenSize = this.coordinateTransformer.virtualToScreen({
        x: element.size.x,
        y: element.size.y
      })

      this.ctx.save()

      // 如果有旋转角度，应用旋转变换
      if (element.rotation && element.rotation !== 0) {
        const centerX = screenPos.x + screenSize.x / 2
        const centerY = screenPos.y + screenSize.y / 2
        this.ctx.translate(centerX, centerY)
        this.ctx.rotate((element.rotation * Math.PI) / 180) // 将角度转换为弧度
        this.ctx.translate(-centerX, -centerY)
      }

      // 设置高亮样式
      this.ctx.strokeStyle = '#007AFF'
      this.ctx.lineWidth = 2
      this.ctx.setLineDash([5, 5])
      this.ctx.globalAlpha = 0.8

      // 绘制高亮边框
      this.ctx.strokeRect(
        screenPos.x - 2,
        screenPos.y - 2,
        screenSize.x + 4,
        screenSize.y + 4
      )

      this.ctx.restore()

      // 绘制角点控制点
      this.renderSelectionHandles(screenPos, screenSize)
    })

    this.ctx.restore()
  }

  /**
   * 渲染连接线的连接点（圆点）
   */
  private renderConnectionLineEndpoints(connectionLine: CanvasElement): void {
    if (!connectionLine.data?.points || connectionLine.data.points.length < 2) {
      return
    }

    const points = connectionLine.data.points
    const startPoint = points[0]
    const endPoint = points[points.length - 1]

    // 将虚拟坐标转换为屏幕坐标
    const startScreen = this.coordinateTransformer.virtualToScreen({
      x: connectionLine.position.x + startPoint.x,
      y: connectionLine.position.y + startPoint.y
    })
    const endScreen = this.coordinateTransformer.virtualToScreen({
      x: connectionLine.position.x + endPoint.x,
      y: connectionLine.position.y + endPoint.y
    })

    // 绘制连接点（圆点）
    const radius = 6
    const strokeWidth = 2

    // 绘制起点圆点
    this.ctx.beginPath()
    this.ctx.arc(startScreen.x, startScreen.y, radius, 0, Math.PI * 2)
    this.ctx.fillStyle = '#1976d2'
    this.ctx.fill()
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = strokeWidth
    this.ctx.stroke()

    // 绘制终点圆点
    this.ctx.beginPath()
    this.ctx.arc(endScreen.x, endScreen.y, radius, 0, Math.PI * 2)
    this.ctx.fillStyle = '#1976d2'
    this.ctx.fill()
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = strokeWidth
    this.ctx.stroke()
  }

  /**
   * 渲染选中元素的控制点
   */
  private renderSelectionHandles(screenPos: Vector2, screenSize: Vector2): void {
    const handleSize = 8
    const halfHandle = handleSize / 2

    this.ctx.fillStyle = '#007AFF'
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([])
    this.ctx.globalAlpha = 1

    // 四个角的控制点
    const corners = [
      { x: screenPos.x - halfHandle, y: screenPos.y - halfHandle }, // 左上
      { x: screenPos.x + screenSize.x - halfHandle, y: screenPos.y - halfHandle }, // 右上
      { x: screenPos.x + screenSize.x - halfHandle, y: screenPos.y + screenSize.y - halfHandle }, // 右下
      { x: screenPos.x - halfHandle, y: screenPos.y + screenSize.y - halfHandle } // 左下
    ]

    corners.forEach(corner => {
      this.ctx.fillRect(corner.x, corner.y, handleSize, handleSize)
      this.ctx.strokeRect(corner.x, corner.y, handleSize, handleSize)
    })

    // 边中点控制点（用于缩放）
    const midPoints = [
      { x: screenPos.x + screenSize.x / 2 - halfHandle, y: screenPos.y - halfHandle }, // 上中
      { x: screenPos.x + screenSize.x - halfHandle, y: screenPos.y + screenSize.y / 2 - halfHandle }, // 右中
      { x: screenPos.x + screenSize.x / 2 - halfHandle, y: screenPos.y + screenSize.y - halfHandle }, // 下中
      { x: screenPos.x - halfHandle, y: screenPos.y + screenSize.y / 2 - halfHandle } // 左中
    ]

    midPoints.forEach(point => {
      this.ctx.fillRect(point.x, point.y, handleSize, handleSize)
      this.ctx.strokeRect(point.x, point.y, handleSize, handleSize)
    })
  }

  /**
   * 渲染智能参考线
   */
  private renderSmartGuides(): void {
    if (this.smartGuides.length === 0) {
      return
    }

    this.ctx.save()

    for (const guide of this.smartGuides) {
      
      this.ctx.strokeStyle = '#007AFF'
      this.ctx.lineWidth = 1
      this.ctx.setLineDash([4, 4])
      this.ctx.globalAlpha = 0.8

      if (guide.type === 'horizontal') {
        // 渲染水平参考线
        this.ctx.beginPath()
        this.ctx.moveTo(0, guide.position)
        this.ctx.lineTo(this.canvas.width, guide.position)
        this.ctx.stroke()

        // 渲染标签
        if (guide.label) {
          this.renderGuideLabel(guide.label, 10, guide.position - 5)
        }
      } else if (guide.type === 'vertical') {
        // 渲染垂直参考线
        this.ctx.beginPath()
        this.ctx.moveTo(guide.position, 0)
        this.ctx.lineTo(guide.position, this.canvas.height)
        this.ctx.stroke()

        // 渲染标签
        if (guide.label) {
          this.renderGuideLabel(guide.label, guide.position + 5, 20)
        }
      }
    }

    this.ctx.restore()
  }

  /**
   * 渲染参考线标签
   */
  private renderGuideLabel(text: string, x: number, y: number): void {
    this.ctx.save()
    
    // 设置标签样式
    this.ctx.fillStyle = '#007AFF'
    this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    
    // 计算文本尺寸
    const textMetrics = this.ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = 16
    
    // 绘制标签背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    this.ctx.fillRect(x - 2, y - 2, textWidth + 4, textHeight + 4)
    
    // 绘制标签边框
    this.ctx.strokeStyle = '#007AFF'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x - 2, y - 2, textWidth + 4, textHeight + 4)
    
    // 绘制标签文字
    this.ctx.fillStyle = '#007AFF'
    this.ctx.fillText(text, x, y)
    
    this.ctx.restore()
  }

  /**
   * 设置智能参考线
   */
  setSmartGuides(guides: any[]): void {
    this.smartGuides = guides
  }

  /**
   * 清除智能参考线
   */
  clearSmartGuides(): void {
    this.smartGuides = []
  }
}
