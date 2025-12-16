import type { Vector2, CanvasElement } from '@/types/canvas.types'
import { ElementType } from '@/types/canvas.types'
import { BaseTool, type ToolEvent } from './BaseTool'

/**
 * 箭头类型枚举
 */
export enum ArrowType {
  LINE = 'line',
  CURVE = 'curve',
  BIDIRECTIONAL = 'bidirectional'
}

/**
 * 箭头形状枚举
 */
export enum ArrowShape {
  TRIANGLE = 'triangle',
  CIRCLE = 'circle',
  SQUARE = 'square'
}

/**
 * 箭头样式接口
 */
export interface ArrowStyle {
  size: number
  shape: ArrowShape
  color: string
  strokeWidth: number
  strokeColor: string
  opacity: number
}

/**
 * 箭头工具
 * 负责绘制各种类型的箭头
 */
export class ArrowTool extends BaseTool {
  private arrowType: ArrowType = ArrowType.LINE
  private arrowStyle: ArrowStyle = {
    size: 10,
    shape: ArrowShape.TRIANGLE,
    color: '#000000',
    strokeWidth: 2,
    strokeColor: '#000000',
    opacity: 1
  }
  private isDrawing: boolean = false
  private startPosition: Vector2 | null = null
  private currentPosition: Vector2 | null = null
  private pathPoints: Vector2[] = []
  private onArrowComplete?: (arrow: { type: ArrowType; points: Vector2[]; style: ArrowStyle; element?: CanvasElement }) => void
  private onDrawingStateChange?: (isDrawing: boolean) => void
  private snapThreshold: number = 30 // 增加吸附阈值，让吸附更容易触发
  private snapToGrid: boolean = false
  private gridSize: number = 20
  private allElements: CanvasElement[] = []
  private snapPoint: Vector2 | null = null // 当前吸附点，用于视觉反馈
  private minimumDragDistance: number = 5 // 最小拖动距离，小于该距离不创建箭头

  constructor() {
    super()
  }

  /**
   * 获取工具名称
   */
  getName(): string {
    return 'arrow'
  }

  /**
   * 获取工具图标
   */
  getIcon(): string {
    return 'arrow-right'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '绘制各种类型的箭头'
  }

  /**
   * 设置箭头类型
   */
  setArrowType(type: ArrowType): void {
    this.arrowType = type
  }

  /**
   * 获取箭头类型
   */
  getArrowType(): ArrowType {
    return this.arrowType
  }

  /**
   * 更新元素列表（用于吸附功能）
   */
  updateElements(elements: CanvasElement[]): void {
    this.allElements = elements
  }

  /**
   * 设置箭头样式
   */
  setArrowStyle(style: Partial<ArrowStyle>): void {
    this.arrowStyle = { ...this.arrowStyle, ...style }
  }

  /**
   * 获取箭头样式
   */
  getArrowStyle(): ArrowStyle {
    return { ...this.arrowStyle }
  }

  /**
   * 设置箭头完成回调
   */
  setOnArrowComplete(callback: (arrow: { type: ArrowType; points: Vector2[]; style: ArrowStyle }) => void): void {
    this.onArrowComplete = callback
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
    this.snapPoint = null // 清除之前的吸附点
    
    // 🔍 调试打印 - 箭头工具鼠标按下
    const viewport = this.canvasEngine?.viewportManager?.getViewport()
    const virtualPosition = this.screenToVirtual(position)
    
    console.log('🔍 箭头工具鼠标按下:', {
      screenPosition: position,
      virtualPosition,
      viewport: viewport,
      allElementsCount: this.allElements.length,
      allElements: this.allElements.map(el => ({
        id: el.id,
        type: el.type,
        position: el.position,
        size: el.size
      }))
    })
    
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
    
    // 检查自动吸附
    const snapPoint = this.findNearestSnapPoint(position)
    this.snapPoint = snapPoint // 保存吸附点用于视觉反馈
    if (snapPoint) {
      this.currentPosition = snapPoint
      console.log('🔍 箭头工具吸附到点:', {
        originalPosition: position,
        snapPoint,
        distance: Math.sqrt(Math.pow(position.x - snapPoint.x, 2) + Math.pow(position.y - snapPoint.y, 2))
      })
    }
    
    // 更新路径点
    if (this.arrowType === ArrowType.CURVE) {
      this.pathPoints.push(position)
    } else {
      // 对于直线箭头和双向箭头，确保有起点和终点
      if (this.pathPoints.length === 1) {
        // 如果只有起点，添加终点
        this.pathPoints.push(this.currentPosition)
      } else if (this.pathPoints.length === 2) {
        // 如果有起点和终点，更新终点
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
    
    console.log('🔍 箭头工具鼠标抬起:', {
      startPosition: this.startPosition,
      currentPosition: this.currentPosition,
      pathPoints: this.pathPoints,
      arrowType: this.arrowType
    })
    
    // 通知绘制状态变化
    if (this.onDrawingStateChange) {
      this.onDrawingStateChange(false)
    }

    // 如果没有有效拖动，则取消创建箭头
    const hasMeaningfulDrag = this.arrowType === ArrowType.CURVE
      ? this.pathPoints.length > 1
      : this.hasSufficientDragDistance()

    if (!hasMeaningfulDrag) {
      console.log('🔍 箭头工具取消创建：未检测到有效拖动')
      this.clearDrawingState()
      return
    }
    
    // 确保有终点（onMouseMove已经处理了大部分情况）
    if (this.arrowType !== ArrowType.CURVE && this.pathPoints.length === 1) {
      // 如果只有起点，添加终点
      this.pathPoints.push(this.currentPosition)
    }
    
    // 创建最终的箭头元素
    const arrowElement = this.createArrowElement()
    if (arrowElement && this.onArrowComplete) {
      console.log('🔍 箭头工具完成，调用回调:', {
        arrowElement,
        arrowData: {
          type: this.arrowType,
          points: this.pathPoints,
          style: this.arrowStyle,
          element: arrowElement
        }
      })
      
      this.onArrowComplete({
        type: this.arrowType,
        points: this.pathPoints,
        style: this.arrowStyle,
        element: arrowElement
      })
    } else {
      console.log('🔍 箭头工具完成失败:', {
        hasArrowElement: !!arrowElement,
        hasCallback: !!this.onArrowComplete,
        arrowElement
      })
    }
    
    this.clearDrawingState()
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
   * 渲染箭头工具相关的UI
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 渲染当前绘制的箭头预览
    if (this.isDrawing && this.startPosition && this.currentPosition) {
      this.renderArrowPreview(ctx)
    }
    
    // 渲染吸附点指示器
    if (this.snapPoint) {
      this.renderSnapIndicator(ctx)
    }
  }

  /**
   * 创建箭头元素（用于最终绘制）
   */
  createArrowElement(): CanvasElement | null {
    if (!this.startPosition || !this.currentPosition || this.pathPoints.length < 2) {
      console.log('🔍 箭头元素创建失败:', {
        hasStartPosition: !!this.startPosition,
        hasCurrentPosition: !!this.currentPosition,
        pathPointsLength: this.pathPoints.length,
        pathPoints: this.pathPoints
      })
      return null
    }

    console.log('🔍 创建箭头元素:', {
      startPosition: this.startPosition,
      currentPosition: this.currentPosition,
      pathPoints: this.pathPoints,
      arrowType: this.arrowType,
      arrowStyle: this.arrowStyle
    })

    // ✅ 修复：将屏幕坐标转换为虚拟坐标
    const virtualPathPoints = this.pathPoints.map(point => this.screenToVirtual(point))

    console.log('🔍 转换后的虚拟坐标点:', {
      originalPathPoints: this.pathPoints,
      virtualPathPoints
    })

    // 计算虚拟坐标边界
    const minX = Math.min(...virtualPathPoints.map(p => p.x))
    const maxX = Math.max(...virtualPathPoints.map(p => p.x))
    const minY = Math.min(...virtualPathPoints.map(p => p.y))
    const maxY = Math.max(...virtualPathPoints.map(p => p.y))

    const width = maxX - minX
    const height = maxY - minY

    // 调整点坐标到相对位置（使用虚拟坐标）
    const relativePoints = virtualPathPoints.map(point => ({
      x: point.x - minX,
      y: point.y - minY
    }))

    const arrowElement = {
      id: `arrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'arrow',
      position: { x: minX, y: minY }, // ✅ 使用虚拟坐标
      size: { x: width, y: height }, // ✅ 使用虚拟尺寸
      rotation: 0,
      visible: true,
      style: {
        stroke: this.arrowStyle.strokeColor,
        strokeWidth: this.arrowStyle.strokeWidth,
        fill: this.arrowStyle.color,
        opacity: this.arrowStyle.opacity
      },
      data: {
        points: relativePoints,
        arrowType: this.arrowType,
        arrowStyle: this.arrowStyle
      }
    }

    console.log('🔍 创建的箭头元素:', {
      arrowElement,
      bounds: { minX, maxX, minY, maxY, width, height },
      relativePoints
    })

    return arrowElement
  }

  /**
   * 渲染箭头预览
   */
  private renderArrowPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.startPosition || !this.currentPosition) return


    ctx.save()
    ctx.strokeStyle = this.arrowStyle.strokeColor
    ctx.fillStyle = this.arrowStyle.color
    ctx.lineWidth = this.arrowStyle.strokeWidth
    ctx.globalAlpha = this.arrowStyle.opacity
    ctx.setLineDash([5, 5])
    
    switch (this.arrowType) {
      case ArrowType.LINE:
        this.drawLineArrow(ctx, this.startPosition, this.currentPosition)
        break
      case ArrowType.CURVE:
        this.drawCurveArrow(ctx, this.pathPoints)
        break
      case ArrowType.BIDIRECTIONAL:
        this.drawBidirectionalArrow(ctx, this.startPosition, this.currentPosition)
        break
    }
    
    ctx.restore()
  }

  /**
   * 绘制直线箭头
   */
  private drawLineArrow(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2): void {

    // 绘制线条
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
    
    // 绘制箭头头部
    this.drawArrowHead(ctx, start, end)
  }

  /**
   * 绘制曲线箭头
   */
  private drawCurveArrow(ctx: CanvasRenderingContext2D, points: Vector2[]): void {
    if (points.length < 2) return
    
    
    // 绘制平滑曲线
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
    
    // 绘制箭头头部
    if (points.length >= 2) {
      const start = points[0]
      const end = points[points.length - 1]
      this.drawArrowHead(ctx, start, end)
    }
  }

  /**
   * 绘制双向箭头
   */
  private drawBidirectionalArrow(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2): void {

    // 绘制线条
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
    
    // 绘制两个箭头头部
    this.drawArrowHead(ctx, start, end)
    this.drawArrowHead(ctx, end, start)
  }

  /**
   * 绘制箭头头部
   */
  private drawArrowHead(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2): void {
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const arrowLength = this.arrowStyle.size
    
    // 计算箭头头部位置
    const headX = end.x - Math.cos(angle) * arrowLength
    const headY = end.y - Math.sin(angle) * arrowLength
    
    ctx.beginPath()
    
    switch (this.arrowStyle.shape) {
      case ArrowShape.TRIANGLE:
        // 三角形箭头
        const leftX = headX - Math.cos(angle - Math.PI / 6) * arrowLength * 0.5
        const leftY = headY - Math.sin(angle - Math.PI / 6) * arrowLength * 0.5
        const rightX = headX - Math.cos(angle + Math.PI / 6) * arrowLength * 0.5
        const rightY = headY - Math.sin(angle + Math.PI / 6) * arrowLength * 0.5
        
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(leftX, leftY)
        ctx.lineTo(rightX, rightY)
        ctx.closePath()
        ctx.fill()
        break
        
      case ArrowShape.CIRCLE:
        // 圆形箭头
        ctx.arc(end.x, end.y, arrowLength * 0.3, 0, 2 * Math.PI)
        ctx.fill()
        break
        
      case ArrowShape.SQUARE:
        // 方形箭头
        const size = arrowLength * 0.4
        ctx.rect(end.x - size / 2, end.y - size / 2, size, size)
        ctx.fill()
        break
    }
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

    console.log('🔍 查找元素吸附点:', {
      position,
      snapThreshold: this.snapThreshold,
      allElementsCount: this.allElements.length
    })

    for (const element of this.allElements) {
      // ✅ 修复：只对形状元素进行吸附，排除画笔元素
      if (element.type === ElementType.PATH) {
        continue // 跳过画笔元素，不进行吸附
      }
      
      // ✅ 修复：将虚拟坐标转换为屏幕坐标进行吸附计算
      const screenPosition = this.virtualToScreen(element.position)
      const screenSize = this.virtualToScreen({ x: element.size.x, y: element.size.y })
      
      const bounds = {
        x: screenPosition.x,
        y: screenPosition.y,
        width: screenSize.x,
        height: screenSize.y
      }

      console.log('🔍 检查元素吸附:', {
        elementId: element.id,
        elementType: element.type,
        virtualPosition: element.position,
        virtualSize: element.size,
        screenPosition,
        screenSize,
        bounds
      })

      // 检查四个角点
      const corners = [
        { x: bounds.x, y: bounds.y }, // 左上
        { x: bounds.x + bounds.width, y: bounds.y }, // 右上
        { x: bounds.x, y: bounds.y + bounds.height }, // 左下
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height } // 右下
      ]

      for (const corner of corners) {
        const distance = Math.sqrt(
          Math.pow(position.x - corner.x, 2) + Math.pow(position.y - corner.y, 2)
        )
        if (distance < minDistance) {
          nearestPoint = corner
          minDistance = distance
          console.log('🔍 找到角点吸附:', {
            corner,
            distance,
            minDistance
          })
        }
      }

      // 检查边中点
      const midPoints = [
        { x: bounds.x + bounds.width / 2, y: bounds.y }, // 上边中点
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // 下边中点
        { x: bounds.x, y: bounds.y + bounds.height / 2 }, // 左边中点
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 } // 右边中点
      ]

      for (const midPoint of midPoints) {
        const distance = Math.sqrt(
          Math.pow(position.x - midPoint.x, 2) + Math.pow(position.y - midPoint.y, 2)
        )
        if (distance < minDistance) {
          nearestPoint = midPoint
          minDistance = distance
          console.log('🔍 找到边中点吸附:', {
            midPoint,
            distance,
            minDistance
          })
        }
      }
    }

    console.log('🔍 最终吸附结果:', {
      nearestPoint,
      minDistance,
      snapThreshold: this.snapThreshold
    })

    return nearestPoint
  }

  /**
   * 渲染吸附点指示器
   */
  private renderSnapIndicator(ctx: CanvasRenderingContext2D): void {
    if (!this.snapPoint) return

    ctx.save()
    
    // 绘制吸附点圆圈
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
   * 检查是否存在足够的拖动距离
   */
  private hasSufficientDragDistance(): boolean {
    if (!this.startPosition || !this.currentPosition) {
      return false
    }

    const dx = this.currentPosition.x - this.startPosition.x
    const dy = this.currentPosition.y - this.startPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance >= this.minimumDragDistance
  }

  /**
   * 清理绘制状态
   */
  private clearDrawingState(): void {
    this.startPosition = null
    this.currentPosition = null
    this.pathPoints = []
    this.snapPoint = null

    this.updateState({
      startPosition: undefined,
      currentPosition: undefined
    })
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'arrow'
  }
}