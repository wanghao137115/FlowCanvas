import type { Vector2, CanvasElement, ElementType } from '@/types/canvas.types'
import { BaseTool, type ToolEvent, type ToolState } from './BaseTool'
import { Vector2Utils } from '@/utils/math/Vector2'

/**
 * 画笔工具
 * 负责自由绘制路径
 */
export class PenTool extends BaseTool {
  private currentPath: Vector2[] = []
  private isDrawing: boolean = false
  private onPathComplete?: (path: Vector2[], penSettings: PenSettings) => void
  private onDrawingStateChange?: (isDrawing: boolean) => void
  private penSettings: PenSettings

  constructor() {
    super()
    this.penSettings = {
      strokeColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      smoothing: true,
      minDistance: 2,
      lineStyle: PenLineStyle.SOLID
    }
  }

  /**
   * 获取工具名称
   */
  getName(): string {
    return '画笔工具'
  }

  /**
   * 获取工具图标
   */
  getIcon(): string {
    return 'edit-pen'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '自由绘制路径'
  }

  /**
   * 设置路径完成回调
   */
  setOnPathComplete(callback: (path: Vector2[], penSettings: PenSettings) => void): void {
    this.onPathComplete = callback
  }

  /**
   * 设置绘制状态变化回�?
   */
  setOnDrawingStateChange(callback: (isDrawing: boolean) => void): void {
    this.onDrawingStateChange = callback
  }

  /**
   * 设置画笔设置
   */
  setPenSettings(settings: Partial<PenSettings>): void {
    this.penSettings = { ...this.penSettings, ...settings }
  }

  /**
   * 设置线条样式
   */
  setLineStyle(lineStyle: PenLineStyle): void {
    this.penSettings.lineStyle = lineStyle
  }

  /**
   * 获取线条样式
   */
  getLineStyle(): PenLineStyle {
    return this.penSettings.lineStyle
  }

  /**
   * 获取画笔设置
   */
  getPenSettings(): PenSettings {
    return { ...this.penSettings }
  }

  /**
   * 处理鼠标按下事件
   */
  onMouseDown(event: ToolEvent): void {
    const { position } = event
    
    this.isDrawing = true
    this.currentPath = [position]
    
    // 🔍 调试打印 - 画笔工具鼠标按下
    const viewport = this.canvasEngine?.viewportManager?.getViewport()
    const virtualPosition = this.screenToVirtual(position)
    
    
    // 更新工具状态
    this.setState({ isDrawing: true })
    
    // 通知绘制状态变�?
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
    if (!this.isDrawing) return

    const { position } = event
    
    // 检查距离，避免添加过于密集的点
    if (this.currentPath.length > 0) {
      const lastPoint = this.currentPath[this.currentPath.length - 1]
      const distance = Vector2Utils.distance(lastPoint, position)
      
      if (distance < this.penSettings.minDistance) {
        return
      }
    }
    
    this.currentPath.push(position)
    
    // 确保绘制状态为true
    this.isDrawing = true
    
    // 只在第一次移动时设置状态，避免频繁更新
    if (this.currentPath.length === 1) {
      this.setState({ isDrawing: true })
    }
    
    this.updateState({
      currentPosition: position
    })
  }

  /**
   * 处理鼠标抬起事件
   */
  onMouseUp(event: ToolEvent): void {
    if (!this.isDrawing) return

    const { position } = event
    this.isDrawing = false
    
    
    // 通知绘制状态变�?
    if (this.onDrawingStateChange) {

      this.onDrawingStateChange(false)
    }
    
    // 完成路径绘制
    if (this.currentPath.length > 1 && this.onPathComplete) {
      let finalPath = [...this.currentPath]
      
      // 应用路径平滑
      if (this.penSettings.smoothing) {
        finalPath = this.smoothPath(finalPath)
      }
      

      this.onPathComplete(finalPath, this.penSettings)
    } else {

    }
    
    this.currentPath = []
    
    this.updateState({
      startPosition: undefined,
      currentPosition: undefined
    })
  }

  /**
   * 处理键盘事件
   */
  onKeyDown(event: ToolEvent): void {
    const { originalEvent } = event
    
    if (originalEvent instanceof KeyboardEvent) {
      switch (originalEvent.key) {
        case 'Escape':
          if (this.isDrawing) {
            // 撤销当前笔画
            this.cancelCurrentStroke()
          }
          break
      }
    }
  }

  onKeyUp(event: ToolEvent): void {
    // 不需要处理键盘抬起
  }

  /**
   * 渲染画笔工具相关的UI
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 渲染当前绘制的路�?
    if (this.currentPath.length > 1) {
      this.renderCurrentPath(ctx)
    }
  }

  /**
   * 渲染当前路径
   */
  private renderCurrentPath(ctx: CanvasRenderingContext2D): void {
    if (this.currentPath.length < 2) return

    ctx.save()
    ctx.strokeStyle = '#000000'  // 黑色预览
    ctx.lineWidth = Math.max(this.penSettings.strokeWidth, 3)  // 至少3px宽度
    ctx.globalAlpha = 0.8  // 固定透明度
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // 设置虚线样式
    setLineDash(ctx, this.penSettings.lineStyle)
    
    ctx.beginPath()
    ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y)
    
    // 使用平滑路径绘制预览
    this.drawSmoothPreviewPath(ctx, this.currentPath)
    
    ctx.stroke()
    ctx.restore()
  }

  /**
   * 绘制平滑预览路径
   */
  private drawSmoothPreviewPath(ctx: CanvasRenderingContext2D, points: Vector2[]): void {
    if (points.length < 2) return

    if (points.length === 2) {
      // 两个点，绘制直线
      ctx.lineTo(points[1].x, points[1].y)
    } else {
      // 多个点，使用贝塞尔曲线绘制平滑路径
      for (let i = 1; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        
        // 计算控制点（当前点和下一个点的中点）
        const controlX = (current.x + next.x) / 2
        const controlY = (current.y + next.y) / 2
        
        ctx.quadraticCurveTo(current.x, current.y, controlX, controlY)
      }
      
      // 连接到最后一个点
      const lastPoint = points[points.length - 1]
      ctx.lineTo(lastPoint.x, lastPoint.y)
    }
  }

  /**
   * 撤销当前笔画
   */
  private cancelCurrentStroke(): void {
    this.isDrawing = false
    this.currentPath = []
    
    this.updateState({
      startPosition: undefined,
      currentPosition: undefined
    })
  }

  /**
   * 路径平滑算法
   */
  private smoothPath(path: Vector2[]): Vector2[] {
    if (path.length < 3) return path

    const smoothed: Vector2[] = []
    smoothed.push(path[0]) // 保留第一个点

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1]
      const curr = path[i]
      const next = path[i + 1]

      // 简单的三点平滑
      const smoothedPoint = {
        x: (prev.x + curr.x + next.x) / 3,
        y: (prev.y + curr.y + next.y) / 3
      }

      smoothed.push(smoothedPoint)
    }

    smoothed.push(path[path.length - 1]) // 保留最后一个点
    return smoothed
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'pen'
  }
}

/**
 * 画笔线条样式枚举
 */
export enum PenLineStyle {
  SOLID = 'solid',      // 实线
  DASHED = 'dashed',    // 虚线
  DOTTED = 'dotted',    // 点线
  DASH_DOT = 'dash-dot' // 点划�?
}

/**
 * 画笔设置接口
 */
export interface PenSettings {
  strokeColor: string
  strokeWidth: number
  opacity: number
  smoothing: boolean
  minDistance: number
  lineStyle: PenLineStyle
}

/**
 * 设置虚线样式
 */
function setLineDash(ctx: CanvasRenderingContext2D, lineStyle: PenLineStyle): void {
  switch (lineStyle) {
    case PenLineStyle.SOLID:
      ctx.setLineDash([])
      break
    case PenLineStyle.DASHED:
      ctx.setLineDash([10, 5])
      break
    case PenLineStyle.DOTTED:
      ctx.setLineDash([2, 3])
      break
    case PenLineStyle.DASH_DOT:
      ctx.setLineDash([10, 5, 2, 5])
      break
    default:
      ctx.setLineDash([])
      break
  }
}

