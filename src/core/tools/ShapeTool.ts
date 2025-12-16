import { BaseTool } from './BaseTool'
import { ToolType, ElementType } from '@/types/canvas.types'
import type { CanvasElement, Vector2, ElementStyle } from '@/types/canvas.types'
import type { ToolEvent } from './BaseTool'

/**
 * 形状类型枚举
 */
export enum ShapeType {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  DIAMOND = 'diamond',
  STAR = 'star',
  ELLIPSE = 'ellipse'
}

/**
 * 形状工具
 * 负责绘制基础几何形状
 */
export class ShapeTool extends BaseTool {
  private startPoint: Vector2 | null = null
  private currentPoint: Vector2 | null = null
  private shapeType: ShapeType = ShapeType.RECTANGLE
  private isDrawing: boolean = false
  private snapThreshold: number = 15 // 增加吸附阈值
  private snapToGrid: boolean = false
  private gridSize: number = 20
  
  // 拖拽相关属性
  private isDragging: boolean = false
  private draggedElement: CanvasElement | null = null
  private dragStartPosition: Vector2 | null = null
  
  // 拖拽回调
  private onDragStart?: (elements: CanvasElement[]) => void
  private onDragEnd?: (elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => void

  constructor() {
    super()
  }

  getName(): string {
    return 'shape'
  }

  activate(): void {
    super.activate()
    this.setCursor('crosshair')
  }

  deactivate(): void {
    super.deactivate()
    this.resetState()
  }

  onMouseDown(event: ToolEvent): void {
    if (this.isDrawing) return

    // 检查是否点击了已创建的形状元素
    if (this.canvasEngine) {
      // 将屏幕坐标转换为虚拟坐标
      const virtualPosition = this.canvasEngine.getViewportManager().getCoordinateTransformer().screenToVirtual(event.position)
      
      const clickedElement = this.canvasEngine.getElementAtPositionPublic(virtualPosition)
      
      if (clickedElement && clickedElement.type === ElementType.SHAPE) {
        // 开始拖拽已创建的形状元素
        this.startDragging(clickedElement, virtualPosition)
        return
      }
      
      // 检查是否点击了连接点（需要先找到悬浮的元素）
      const hoveredElement = this.canvasEngine.getHoveredElement()
      if (hoveredElement) {
        const connectionPoint = this.checkConnectionPointHover(event.position, hoveredElement)
        if (connectionPoint) {
          // 开始连接线拖拽
          this.startConnectionDrag(connectionPoint, hoveredElement)
          return
        }
      }
    }

    // 开始绘制新形状
    this.startPoint = { ...event.position }
    this.currentPoint = { ...event.position }
    this.isDrawing = true


    // 更新工具状态
    this.setState({ 
      isActive: true,
      isDrawing: true,
      selectedElements: []
    })

    // 通知开始绘制
    if (this.onDrawingStateChange) {
      this.onDrawingStateChange(true)
    }
    if (this.onStateChange) {
      this.onStateChange({ 
        isActive: true,
        isDrawing: true,
        selectedElements: []
      })
    }
  }

  onMouseMove(event: ToolEvent): void {
    // 如果正在拖拽连接线，更新连接线
    if (this.isConnectionDragging()) {
      this.updateConnectionDrag(event.position)
      return
    }

    // 如果正在拖拽已创建的形状元素
    if (this.isDragging && this.draggedElement && this.dragStartPosition) {
      // 将屏幕坐标转换为虚拟坐标
      const virtualPosition = this.canvasEngine.getViewportManager().getCoordinateTransformer().screenToVirtual(event.position)
      
      const delta = {
        x: virtualPosition.x - this.dragStartPosition.x,
        y: virtualPosition.y - this.dragStartPosition.y
      }
      
      // 计算新位置
      const newPosition = {
        x: this.draggedElement.position.x + delta.x,
        y: this.draggedElement.position.y + delta.y
      }
      
      // 使用 CanvasEngine 的 updateElementPosition 方法来更新位置和连接线
      if (this.canvasEngine) {
        this.canvasEngine.updateElementPosition(this.draggedElement.id, newPosition)
      }
      
      // 更新拖拽起始位置
      this.dragStartPosition = { ...virtualPosition }
      
      return
    }

    if (!this.isDrawing || !this.startPoint) return

    this.currentPoint = { ...event.position }

    // 应用网格吸附
    if (this.snapToGrid) {
      this.currentPoint = this.snapToGridPoint(this.currentPoint)
    }

    // 实时打印预览尺寸（可选）
    const width = Math.abs(this.currentPoint.x - this.startPoint.x)
    const height = Math.abs(this.currentPoint.y - this.startPoint.y)

    // 确保绘制状态为true
    this.isDrawing = true
    this.setState({ 
      isActive: true,
      isDrawing: true,
      selectedElements: []
    })

    // 通知状态变化
    if (this.onStateChange) {
      this.onStateChange({ 
        isActive: true,
        isDrawing: true,
        selectedElements: []
      })
    }
  }

  onMouseUp(event: ToolEvent): void {
    // 如果正在拖拽连接线，结束连接线拖拽
    if (this.isConnectionDragging()) {
      this.endConnectionDrag()
      return
    }

    // 如果正在拖拽已创建的形状元素，结束拖拽
    if (this.isDragging && this.draggedElement) {
      this.endDragging()
      return
    }

    if (!this.isDrawing || !this.startPoint || !this.currentPoint) return


    // 检查是否是最小尺寸
    const width = Math.abs(this.currentPoint.x - this.startPoint.x)
    const height = Math.abs(this.currentPoint.y - this.startPoint.y)

    if (width < 5 && height < 5) {
      this.resetState()
      return
    }


    // 创建形状元素
    const element = this.createShapeElement(this.startPoint, this.currentPoint)
    
    if (element) {

      
      if (this.onElementCreated) {
        this.onElementCreated(element)
      }
    }

    this.resetState()
  }

  onKeyDown(event: ToolEvent): void {
    // 处理键盘快捷键
    if (event.key === 'Escape') {
      this.resetState()
    }
  }

  onKeyUp(event: ToolEvent): void {
    // 不需要处理键盘抬起
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.startPoint || !this.currentPoint) {
      return
    }
    
    // 计算预览尺寸
    const width = Math.abs(this.currentPoint.x - this.startPoint.x)
    const height = Math.abs(this.currentPoint.y - this.startPoint.y)
    
    ctx.save()

    // 设置绘制样式 - 半透明蓝色边框，透明填充
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)'  // 半透明蓝色边框
    ctx.lineWidth = 3  // 适中的线条宽度
    ctx.setLineDash([8, 4])  // 虚线样式
    ctx.fillStyle = 'transparent'  // 透明填充
    ctx.globalAlpha = 1.0  // 完全不透明
    ctx.lineCap = 'round'  // 圆角线条
    ctx.lineJoin = 'round'  // 圆角连接

    // 绘制预览形状（直接使用屏幕坐标）
    this.drawShape(ctx, this.startPoint, this.currentPoint, this.shapeType)

    ctx.restore()
  }

  /**
   * 设置形状类型
   */
  setShapeType(type: ShapeType): void {
    this.shapeType = type
  }

  /**
   * 获取当前形状类型
   */
  getShapeType(): ShapeType {
    return this.shapeType
  }

  /**
   * 设置网格吸附
   */
  setSnapToGrid(enabled: boolean): void {
    this.snapToGrid = enabled
  }

  /**
   * 设置网格大小
   */
  setGridSize(size: number): void {
    this.gridSize = size
  }

  /**
   * 创建形状元素
   */
  private createShapeElement(start: Vector2, end: Vector2): CanvasElement | null {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)


    // ✅ 修复：将屏幕坐标转换为虚拟坐标
    const virtualPosition = this.screenToVirtual({ x, y })
    const virtualSize = {
      x: this.screenToVirtual({ x: width, y: 0 }).x,
      y: this.screenToVirtual({ x: 0, y: height }).y
    }

    const element: CanvasElement = {
      id: this.generateId(),
      type: ElementType.SHAPE,
      position: virtualPosition, // ✅ 使用虚拟坐标
      size: virtualSize, // ✅ 使用虚拟尺寸
      rotation: 0,
      style: this.getDefaultStyle(),
      layer: 'default', // 这里需要从CanvasEngine获取当前图层ID
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        shapeType: this.shapeType,
        points: this.getShapePoints(this.shapeType, virtualSize.x, virtualSize.y)
      }
    }

    return element
  }

  /**
   * 绘制形状
   */
  private drawShape(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2, type: ShapeType): void {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    let width = Math.abs(end.x - start.x)
    let height = Math.abs(end.y - start.y)
    
    // 确保最小尺寸，避免getImageData错误
    const minSize = 1
    if (width < minSize) width = minSize
    if (height < minSize) height = minSize

    switch (type) {
      case ShapeType.RECTANGLE:
        this.drawRectangle(ctx, x, y, width, height)
        break
      case ShapeType.CIRCLE:
        this.drawCircle(ctx, x, y, width, height)
        break
      case ShapeType.TRIANGLE:
        this.drawTriangle(ctx, x, y, width, height)
        break
      case ShapeType.DIAMOND:
        this.drawDiamond(ctx, x, y, width, height)
        break
      case ShapeType.STAR:
        this.drawStar(ctx, x, y, width, height)
        break
      case ShapeType.ELLIPSE:
        this.drawEllipse(ctx, x, y, width, height)
        break
    }
  }

  /**
   * 绘制矩形
   */
  private drawRectangle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    
    // 先填充，再描边，确保可见性
    ctx.fill()
    ctx.stroke()
    
    // 添加额外的描边，确保可见性
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)'  // 稍浅的蓝色描边
    ctx.lineWidth = 1
    ctx.setLineDash([])  // 实线描边
    ctx.stroke()
  }

  /**
   * 绘制圆形
   */
  private drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radius = Math.min(width, height) / 2

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 绘制三角形
   */
  private drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const centerX = x + width / 2
    const topY = y
    const bottomY = y + height
    
    ctx.beginPath()
    ctx.moveTo(centerX, topY)
    ctx.lineTo(x, bottomY)
    ctx.lineTo(x + width, bottomY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 绘制菱形
   */
  private drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const halfWidth = width / 2
    const halfHeight = height / 2

    ctx.beginPath()
    ctx.moveTo(centerX, y)
    ctx.lineTo(x + width, centerY)
    ctx.lineTo(centerX, y + height)
    ctx.lineTo(x, centerY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 绘制星形
   */
  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const outerRadius = Math.min(width, height) / 2
    const innerRadius = outerRadius * 0.4
    const points = 5
    
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const pointX = centerX + Math.cos(angle) * radius
      const pointY = centerY + Math.sin(angle) * radius

      if (i === 0) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 绘制椭圆
   */
  private drawEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radiusX = width / 2
    const radiusY = height / 2

    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 获取形状点
   */
  private getShapePoints(type: ShapeType, width: number, height: number): Vector2[] {
    switch (type) {
      case ShapeType.RECTANGLE:
        return [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height }
        ]
      case ShapeType.CIRCLE:
        return this.generateCirclePoints(width, height)
      case ShapeType.TRIANGLE:
        return [
          { x: width / 2, y: 0 },
          { x: 0, y: height },
          { x: width, y: height }
        ]
      case ShapeType.DIAMOND:
        return [
          { x: width / 2, y: 0 },
          { x: width, y: height / 2 },
          { x: width / 2, y: height },
          { x: 0, y: height / 2 }
        ]
      case ShapeType.STAR:
        return this.generateStarPoints(width, height)
      default:
        return []
    }
  }

  /**
   * 生成圆形点
   */
  private generateCirclePoints(width: number, height: number): Vector2[] {
    const points: Vector2[] = []
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2
    const segments = 32

    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      })
    }

    return points
  }

  /**
   * 生成星形点
   */
  private generateStarPoints(width: number, height: number): Vector2[] {
    const points: Vector2[] = []
    const centerX = width / 2
    const centerY = height / 2
    const outerRadius = Math.min(width, height) / 2
    const innerRadius = outerRadius * 0.4
    const starPoints = 5

    for (let i = 0; i < starPoints * 2; i++) {
      const angle = (i * Math.PI) / starPoints
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      })
    }

    return points
  }

  /**
   * 网格吸附
   */
  private snapToGridPoint(point: Vector2): Vector2 {
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize
    }
  }

  /**
   * 开始拖拽已创建的形状元素
   */
  private startDragging(element: CanvasElement, position: Vector2): void {
    this.isDragging = true
    this.draggedElement = element
    this.dragStartPosition = { ...position }
    
    // 更新工具状态
    this.setState({ 
      isActive: true,
      isDrawing: true,
      selectedElements: [element]
    })
    
    // 通知开始拖拽
    if (this.onDrawingStateChange) {
      this.onDrawingStateChange(true)
    }
    
    // 触发拖拽开始回调
    if (this.onDragStart) {
      this.onDragStart([element])
    }
  }

  /**
   * 结束拖拽已创建的形状元素
   */
  private endDragging(): void {
    if (this.draggedElement && this.dragStartPosition) {
      // 触发拖拽结束回调
      if (this.onDragEnd) {
        this.onDragEnd([this.draggedElement], [this.dragStartPosition], [{ ...this.draggedElement.position }])
      }
    }
    
    // 重置拖拽状态
    this.isDragging = false
    this.draggedElement = null
    this.dragStartPosition = null
    
    // 更新工具状态
    this.setState({ 
      isActive: false,
      isDrawing: false,
      selectedElements: []
    })
    
    // 通知结束拖拽
    if (this.onDrawingStateChange) {
      this.onDrawingStateChange(false)
    }
  }

  /**
   * 重置状态
   */
  private resetState(): void {
    this.startPoint = null
    this.currentPoint = null
    this.isDrawing = false

    // 更新工具状态
    this.setState({ 
      isActive: false,
      isDrawing: false,
      selectedElements: []
    })

    // 通知绘制状态结束
    if (this.onDrawingStateChange) {
      this.onDrawingStateChange(false)
    }
    if (this.onStateChange) {
      this.onStateChange({ 
        isActive: false,
        isDrawing: false,
        selectedElements: []
      })
    }
  }

  /**
   * 检查鼠标是否悬浮在连接点上
   */
  checkConnectionPointHover(mousePos: Vector2, element: CanvasElement): Vector2 | null {
    const coordinateTransformer = this.canvasEngine?.getViewportManager().getCoordinateTransformer()
    const virtualMousePos = coordinateTransformer
      ? coordinateTransformer.screenToVirtual(mousePos)
      : mousePos
    const baseScreenThreshold = 8 // 屏幕像素阈值，控制悬浮范围
    const threshold = coordinateTransformer
      ? coordinateTransformer.screenDistanceToVirtual(baseScreenThreshold)
      : baseScreenThreshold
    const connectionPoints = this.calculateConnectionPoints(element)

    for (let i = 0; i < connectionPoints.length; i++) {
      const point = connectionPoints[i]
      const distance = Math.sqrt(
        Math.pow(virtualMousePos.x - point.x, 2) + Math.pow(virtualMousePos.y - point.y, 2)
      )
      
      if (distance <= threshold) {
        return point
      }
    }
    
    return null
  }

  /**
   * 计算元素的连接点
   */
  calculateConnectionPoints(element: CanvasElement): Vector2[] {
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
   * 获取默认样式
   */
  private getDefaultStyle(): ElementStyle {
    return {
      fill: '#e3f2fd',  // 浅蓝色填充，在白色背景上可见
      fillEnabled: true,
      fillType: 'solid',
      gradientDirection: 'horizontal',
      stroke: '#1976d2',  // 深蓝色描边
      strokeWidth: 2,
      lineStyle: 'solid',
      lineCap: 'round',
      fontSize: 16,
      fontFamily: 'Arial',
      textAlign: 'left',
      textDecoration: 'none'
  }
}

  /**
   * 获取工具图标
   */
  getIcon(): string {
    return 'square'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '绘制基础几何形状'
  }

  /**
   * 获取工具配置
   */
  getConfig(): Record<string, any> {
    return {
      shapeType: this.shapeType,
      snapToGrid: this.snapToGrid,
      gridSize: this.gridSize
    }
  }

  /**
   * 设置工具配置
   */
  setConfig(config: Record<string, any>): void {
    if (config.shapeType) {
      this.shapeType = config.shapeType
    }
    if (config.snapToGrid !== undefined) {
      this.snapToGrid = config.snapToGrid
    }
    if (config.gridSize) {
      this.gridSize = config.gridSize
    }
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'shape'
  }

  /**
   * 开始连接线拖拽
   */
  private startConnectionDrag(startPoint: Vector2, element: CanvasElement): void {
    if (this.canvasEngine) {
      this.canvasEngine.startConnectionDrag(startPoint, element)
    }
  }

  /**
   * 更新连接线拖拽
   */
  private updateConnectionDrag(mousePosition: Vector2): void {
    if (this.canvasEngine) {
      this.canvasEngine.updateConnectionDrag(mousePosition)
    }
  }

  /**
   * 结束连接线拖拽
   */
  private endConnectionDrag(): void {
    if (this.canvasEngine) {
      this.canvasEngine.endConnectionDrag()
    }
  }

  /**
   * 检查是否在拖拽连接线
   */
  private isConnectionDragging(): boolean {
    return this.canvasEngine ? this.canvasEngine.isConnectionDragging() : false
  }

  /**
   * 设置拖拽开始回调
   */
  public setOnDragStart(callback: (elements: CanvasElement[]) => void): void {
    this.onDragStart = callback
  }

  /**
   * 设置拖拽结束回调
   */
  public setOnDragEnd(callback: (elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => void): void {
    this.onDragEnd = callback
  }
}