import type { Vector2, CanvasElement } from '@/types/canvas.types'
import { BaseTool, type ToolEvent } from './BaseTool'

/**
 * 线条类型枚举
 */
export enum LineType {
  STRAIGHT = 'straight',
  CURVE = 'curve',
  POLYLINE = 'polyline'
}

/**
 * 线条端点样式枚举
 */
export enum LineCap {
  BUTT = 'butt',
  ROUND = 'round',
  SQUARE = 'square'
}

/**
 * 线条样式接口
 */
export interface LineStyle {
  strokeWidth: number
  strokeColor: string
  lineCap: LineCap
  dashPattern: number[]
  opacity: number
}

/**
 * 线条工具
 * 负责绘制各种类型的线条
 */
export class LineTool extends BaseTool {
  private lineType: LineType = LineType.STRAIGHT
  private lineStyle: LineStyle = {
    strokeWidth: 2,
    strokeColor: '#000000',
    lineCap: LineCap.ROUND,
    dashPattern: [],
    opacity: 1
  }
  private isDrawing: boolean = false
  private startPosition: Vector2 | null = null
  private currentPosition: Vector2 | null = null
  private pathPoints: Vector2[] = []
  private onLineComplete?: (line: { type: LineType; points: Vector2[]; style: LineStyle }) => void
  private onDrawingStateChange?: (isDrawing: boolean) => void
  private snapThreshold: number = 15
  private snapToGrid: boolean = false
  private gridSize: number = 20
  private allElements: CanvasElement[] = []
  private snapPoint: Vector2 | null = null

  constructor() {
    super()
  }

  /**
   * 获取工具名称
   */
  getName(): string {
    return 'line'
  }

  /**
   * 获取工具图标
   */
  getIcon(): string {
    return 'minus'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '绘制各种类型的线条'
  }

  /**
   * 设置线条类型
   */
  setLineType(type: LineType | string): void {
    // 支持字符串参数，转换为枚举值
    if (typeof type === 'string') {
      switch (type) {
        case 'straight':
          this.lineType = LineType.STRAIGHT
          break
        case 'curve':
          this.lineType = LineType.CURVE
          break
        case 'free':
        case 'polyline':
          this.lineType = LineType.POLYLINE
          break
        default:
          this.lineType = LineType.STRAIGHT
          break
      }
    } else {
      this.lineType = type
    }
  }

  /**
   * 获取线条类型
   */
  getLineType(): LineType {
    return this.lineType
  }

  /**
   * 设置线条样式
   */
  setLineStyle(style: Partial<LineStyle>): void {
    this.lineStyle = { ...this.lineStyle, ...style }
  }

  /**
   * 获取线条样式
   */
  getLineStyle(): LineStyle {
    return { ...this.lineStyle }
  }

  /**
   * 设置线条完成回调
   */
  setOnLineComplete(callback: (line: { type: LineType; points: Vector2[]; style: LineStyle }) => void): void {
    this.onLineComplete = callback
  }

  /**
   * 设置绘制状态变化回调
   */
  setOnDrawingStateChange(callback: (isDrawing: boolean) => void): void {
    this.onDrawingStateChange = callback
  }

  /**
   * 设置吸附参数
   */
  setSnapSettings(snapToGrid: boolean, gridSize: number, threshold: number = 10): void {
    this.snapToGrid = snapToGrid
    this.gridSize = gridSize
    this.snapThreshold = threshold
  }

  /**
   * 设置所有元素（用于元素吸附）
   */
  setAllElements(elements: CanvasElement[]): void {
    this.allElements = elements
  }

  /**
   * 处理鼠标按下事件
   */
  onMouseDown(event: ToolEvent): void {
    const { position } = event
    
    this.isDrawing = true
    this.startPosition = position
    this.currentPosition = position
    this.pathPoints = [position]
    this.snapPoint = null
    
    // 🔍 调试打印 - 线条工具鼠标按下
    const viewport = this.canvasEngine?.viewportManager?.getViewport()
    const virtualPosition = this.screenToVirtual(position)
    
    
    // 更新工具状态
    this.setState({ isDrawing: true })
    
    // 通知绘制状态变化
    if (this.onDrawingStateChange) {
      this.onDrawingStateChange(true)
    }
    
    this.updateState({
      startPosition: position,
      currentPosition: position
    })
  }

  /**
   * 处理鼠标移动事件
   */
  onMouseMove(event: ToolEvent): void {
    if (!this.isDrawing || !this.startPosition) return

    const { position } = event
    this.currentPosition = position
    
    // 确保绘制状态为true
    this.isDrawing = true
    this.setState({ isDrawing: true })
    
    // 检查自动吸附（仅对直线类型启用）
    if (this.lineType === LineType.STRAIGHT) {
      const snapPoint = this.findNearestSnapPoint(position)
      this.snapPoint = snapPoint
      if (snapPoint) {
        this.currentPosition = snapPoint
      }
    } else {
      this.snapPoint = null
    }
    
    // 更新路径点
    if (this.lineType === LineType.CURVE || this.lineType === LineType.POLYLINE) {
      // 对于曲线和折线，检查距离避免点过于密集
      if (this.pathPoints.length > 0) {
        const lastPoint = this.pathPoints[this.pathPoints.length - 1]
        const dx = position.x - lastPoint.x
        const dy = position.y - lastPoint.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // 只有当移动距离超过阈值时才添加点（避免点太密集）
        if (distance >= 2) {
          this.pathPoints.push(position)
        }
      } else {
        // 第一个点
        this.pathPoints.push(position)
      }
    } else {
      // 对于直线，确保有起点和终点
      if (this.pathPoints.length === 1) {
        this.pathPoints.push(this.currentPosition)
      } else if (this.pathPoints.length === 2) {
        this.pathPoints[1] = this.currentPosition
      }
    }
    
    this.updateState({
      currentPosition: this.currentPosition
    })
  }

  /**
   * 处理鼠标抬起事件
   */
  onMouseUp(event: ToolEvent): void {
    if (!this.isDrawing || !this.startPosition || !this.currentPosition) return

    this.isDrawing = false
    
    // 通知绘制状态变化
    if (this.onDrawingStateChange) {
      this.onDrawingStateChange(false)
    }
    
    // 确保有终点
    if (this.lineType === LineType.STRAIGHT && this.pathPoints.length === 1) {
      this.pathPoints.push(this.currentPosition)
    } else if ((this.lineType === LineType.CURVE || this.lineType === LineType.POLYLINE) && this.pathPoints.length === 1) {
      // 对于曲线和折线，如果只有一个点，添加终点
      this.pathPoints.push(this.currentPosition)
    }
    
    // 检查是否有足够的点来创建线条
    const hasEnoughPoints = this.pathPoints.length >= 2
    
    // 对于曲线和折线，还需要检查是否有足够的拖动距离
    let hasMeaningfulDrag = true
    if (this.lineType === LineType.CURVE || this.lineType === LineType.POLYLINE) {
      if (this.pathPoints.length === 2) {
        const dx = this.pathPoints[1].x - this.pathPoints[0].x
        const dy = this.pathPoints[1].y - this.pathPoints[0].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        hasMeaningfulDrag = distance >= 5 // 至少5像素的拖动距离
      }
    }
    
    // 完成线条绘制（只有当有足够的点且有意义的拖动时才创建）
    if (hasEnoughPoints && hasMeaningfulDrag && this.onLineComplete) {
      this.onLineComplete({
        type: this.lineType,
        points: this.pathPoints,
        style: this.lineStyle
      })
    }
    
    this.startPosition = null
    this.currentPosition = null
    this.pathPoints = []
    this.snapPoint = null
    
    this.updateState({
      startPosition: undefined,
      currentPosition: undefined
    })
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

  /**
   * 渲染线条工具相关的UI
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 渲染当前绘制的线条预览
    if (this.isDrawing) {
      // 对于曲线和折线，需要检查 pathPoints 是否有足够的点
      if (this.lineType === LineType.CURVE || this.lineType === LineType.POLYLINE) {
        if (this.pathPoints.length >= 2) {
          this.renderLinePreview(ctx)
        }
      } else if (this.startPosition && this.currentPosition) {
        // 对于直线，检查起点和终点
        this.renderLinePreview(ctx)
      }
    }
    
    // 渲染吸附点指示器
    if (this.snapPoint) {
      this.renderSnapIndicator(ctx)
    }
  }

  /**
   * 渲染线条预览
   */
  private renderLinePreview(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.strokeStyle = this.lineStyle.strokeColor
    ctx.lineWidth = this.lineStyle.strokeWidth
    ctx.lineCap = this.lineStyle.lineCap
    ctx.globalAlpha = this.lineStyle.opacity
    ctx.setLineDash([5, 5])
    
    switch (this.lineType) {
      case LineType.STRAIGHT:
        if (this.startPosition && this.currentPosition) {
          this.drawStraightLine(ctx, this.startPosition, this.currentPosition)
        }
        break
      case LineType.CURVE:
        if (this.pathPoints.length >= 2) {
          this.drawCurveLine(ctx, this.pathPoints)
        }
        break
      case LineType.POLYLINE:
        if (this.pathPoints.length >= 2) {
          this.drawPolyline(ctx, this.pathPoints)
        }
        break
    }
    
    ctx.restore()
  }

  /**
   * 绘制直线
   */
  private drawStraightLine(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2): void {
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }

  /**
   * 绘制曲线
   */
  private drawCurveLine(ctx: CanvasRenderingContext2D, points: Vector2[]): void {
    if (points.length < 2) return
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const controlX = (current.x + next.x) / 2
      const controlY = (current.y + next.y) / 2
      ctx.quadraticCurveTo(current.x, current.y, controlX, controlY)
    }
    
    const lastPoint = points[points.length - 1]
    ctx.lineTo(lastPoint.x, lastPoint.y)
    ctx.stroke()
  }

  /**
   * 绘制折线
   */
  private drawPolyline(ctx: CanvasRenderingContext2D, points: Vector2[]): void {
    if (points.length < 2) return
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    
    ctx.stroke()
  }

  /**
   * 查找最近的吸附点
   */
  private findNearestSnapPoint(position: Vector2): Vector2 | null {
    let nearestPoint: Vector2 | null = null
    let minDistance = this.snapThreshold

    // 只使用元素吸附
    const elementSnapPoint = this.findElementSnapPoint(position)
    if (elementSnapPoint) {
      const distance = Math.sqrt(
        Math.pow(position.x - elementSnapPoint.x, 2) + Math.pow(position.y - elementSnapPoint.y, 2)
      )
      if (distance < minDistance) {
        nearestPoint = elementSnapPoint
        minDistance = distance
      }
    }

    return nearestPoint
  }

  /**
   * 网格吸附
   */
  private snapToGridPoint(position: Vector2): Vector2 | null {
    const gridX = Math.round(position.x / this.gridSize) * this.gridSize
    const gridY = Math.round(position.y / this.gridSize) * this.gridSize
    return { x: gridX, y: gridY }
  }

  /**
   * 元素吸附
   */
  private findElementSnapPoint(position: Vector2): Vector2 | null {
    let nearestPoint: Vector2 | null = null
    let minDistance = this.snapThreshold

    for (const element of this.allElements) {
      const bounds = {
        x: element.position.x,
        y: element.position.y,
        width: element.size.x,
        height: element.size.y
      }

      // 检查四个角点
      const corners = [
        { x: bounds.x, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y },
        { x: bounds.x, y: bounds.y + bounds.height },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
      ]

      for (const corner of corners) {
        const distance = Math.sqrt(
          Math.pow(position.x - corner.x, 2) + Math.pow(position.y - corner.y, 2)
        )
        if (distance < minDistance) {
          nearestPoint = corner
          minDistance = distance
        }
      }

      // 检查边中点
      const midPoints = [
        { x: bounds.x + bounds.width / 2, y: bounds.y },
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
        { x: bounds.x, y: bounds.y + bounds.height / 2 },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }
      ]

      for (const midPoint of midPoints) {
        const distance = Math.sqrt(
          Math.pow(position.x - midPoint.x, 2) + Math.pow(position.y - midPoint.y, 2)
        )
        if (distance < minDistance) {
          nearestPoint = midPoint
          minDistance = distance
        }
      }
    }

    return nearestPoint
  }

  /**
   * 渲染吸附点指示器
   */
  private renderSnapIndicator(ctx: CanvasRenderingContext2D): void {
    if (!this.snapPoint) return

    ctx.save()
    
    ctx.strokeStyle = '#ff6b6b'
    ctx.fillStyle = '#ff6b6b'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    
    // 外圈
    ctx.beginPath()
    ctx.arc(this.snapPoint.x, this.snapPoint.y, 8, 0, 2 * Math.PI)
    ctx.stroke()
    
    // 内圈
    ctx.beginPath()
    ctx.arc(this.snapPoint.x, this.snapPoint.y, 4, 0, 2 * Math.PI)
    ctx.fill()
    
    // 绘制十字线
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.6
    
    ctx.beginPath()
    ctx.moveTo(this.snapPoint.x - 12, this.snapPoint.y)
    ctx.lineTo(this.snapPoint.x + 12, this.snapPoint.y)
    ctx.moveTo(this.snapPoint.x, this.snapPoint.y - 12)
    ctx.lineTo(this.snapPoint.x, this.snapPoint.y + 12)
    ctx.stroke()
    
    ctx.restore()
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'line'
  }
}