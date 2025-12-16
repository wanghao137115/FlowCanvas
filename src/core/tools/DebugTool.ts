import { BaseTool } from './BaseTool'
import type { ToolEvent, ToolState } from './BaseTool'
import type { Vector2, CanvasElement } from '@/types/canvas.types'

/**
 * 调试工具
 * 用于分析坐标转换和绘制位置问题
 */
export class DebugTool extends BaseTool {
  private debugInfo: {
    mousePosition: Vector2 | null
    screenPosition: Vector2 | null
    virtualPosition: Vector2 | null
    viewport: any
    scale: number
    offset: Vector2
    elements: CanvasElement[]
    selectedElements: CanvasElement[]
  } = {
    mousePosition: null,
    screenPosition: null,
    virtualPosition: null,
    viewport: null,
    scale: 1,
    offset: { x: 0, y: 0 },
    elements: [],
    selectedElements: []
  }

  constructor() {
    super()
  }

  getName(): string {
    return 'debug'
  }

  getIcon(): string {
    return 'bug'
  }

  getDescription(): string {
    return '调试工具 - 分析坐标转换问题'
  }

  getToolType(): string {
    return 'debug'
  }

  getConfig(): Record<string, any> {
    return {}
  }

  setConfig(config: Record<string, any>): void {
    // 不需要配置
  }

  onMouseDown(event: ToolEvent): void {
    this.updateDebugInfo(event)
    this.printDebugInfo('MouseDown')
  }

  onMouseMove(event: ToolEvent): void {
    this.updateDebugInfo(event)
    // 只在移动时打印关键信息，避免过多输出
    if (event.position.x % 50 === 0 || event.position.y % 50 === 0) {
      this.printDebugInfo('MouseMove')
    }
  }

  onMouseUp(event: ToolEvent): void {
    this.updateDebugInfo(event)
    this.printDebugInfo('MouseUp')
  }

  onKeyDown(event: ToolEvent): void {
    if (event.key === 'd' || event.key === 'D') {
      this.printDebugInfo('KeyDown-D')
    }
  }

  onKeyUp(event: ToolEvent): void {
    // 不需要处理
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 绘制调试信息
    this.renderDebugInfo(ctx)
  }

  private updateDebugInfo(event: ToolEvent): void {
    this.debugInfo.mousePosition = event.position
    
    // 获取视口信息
    if (this.canvasEngine?.viewportManager) {
      const viewport = this.canvasEngine.viewportManager.getViewport()
      this.debugInfo.viewport = viewport
      this.debugInfo.scale = viewport.scale
      this.debugInfo.offset = viewport.offset
      
      // 坐标转换
      this.debugInfo.screenPosition = event.position
      this.debugInfo.virtualPosition = this.screenToVirtual(event.position)
    }
    
    // 获取所有元素
    if (this.canvasEngine) {
      this.debugInfo.elements = this.canvasEngine.getElements() || []
      this.debugInfo.selectedElements = this.canvasEngine.getSelectedElements() || []
    }
  }

  private printDebugInfo(event: string): void {
    console.group(`🔍 DebugTool - ${event}`)
    
    console.log('📍 鼠标位置:', this.debugInfo.mousePosition)
    console.log('🖥️ 屏幕坐标:', this.debugInfo.screenPosition)
    console.log('🌐 虚拟坐标:', this.debugInfo.virtualPosition)
    
    if (this.debugInfo.viewport) {
      console.log('📐 视口信息:', {
        scale: this.debugInfo.scale,
        offset: this.debugInfo.offset,
        width: this.debugInfo.viewport.width,
        height: this.debugInfo.viewport.height
      })
    }
    
    console.log('📦 元素总数:', this.debugInfo.elements.length)
    console.log('✅ 选中元素:', this.debugInfo.selectedElements.length)
    
    // 打印最近的元素
    if (this.debugInfo.mousePosition && this.debugInfo.elements.length > 0) {
      const nearestElement = this.findNearestElement(this.debugInfo.mousePosition)
      if (nearestElement) {
        console.log('🎯 最近元素:', {
          id: nearestElement.id,
          type: nearestElement.type,
          position: nearestElement.position,
          size: nearestElement.size,
          distance: nearestElement.distance
        })
      }
    }
    
    console.groupEnd()
  }

  private findNearestElement(position: Vector2): { element: CanvasElement; distance: number } | null {
    let nearest: { element: CanvasElement; distance: number } | null = null
    
    for (const element of this.debugInfo.elements) {
      const elementCenter = {
        x: element.position.x + element.size.x / 2,
        y: element.position.y + element.size.y / 2
      }
      
      const distance = Math.sqrt(
        Math.pow(position.x - elementCenter.x, 2) + 
        Math.pow(position.y - elementCenter.y, 2)
      )
      
      if (!nearest || distance < nearest.distance) {
        nearest = { element, distance }
      }
    }
    
    return nearest
  }

  private renderDebugInfo(ctx: CanvasRenderingContext2D): void {
    if (!this.debugInfo.mousePosition) return
    
    ctx.save()
    
    // 绘制鼠标位置
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(this.debugInfo.mousePosition.x, this.debugInfo.mousePosition.y, 5, 0, 2 * Math.PI)
    ctx.fill()
    
    // 绘制坐标信息
    ctx.fillStyle = '#000000'
    ctx.font = '12px Arial'
    const text = `Mouse: (${Math.round(this.debugInfo.mousePosition.x)}, ${Math.round(this.debugInfo.mousePosition.y)})`
    ctx.fillText(text, this.debugInfo.mousePosition.x + 10, this.debugInfo.mousePosition.y - 10)
    
    if (this.debugInfo.virtualPosition) {
      const virtualText = `Virtual: (${Math.round(this.debugInfo.virtualPosition.x)}, ${Math.round(this.debugInfo.virtualPosition.y)})`
      ctx.fillText(virtualText, this.debugInfo.mousePosition.x + 10, this.debugInfo.mousePosition.y + 5)
    }
    
    // 绘制视口信息
    if (this.debugInfo.viewport) {
      const viewportText = `Scale: ${this.debugInfo.scale.toFixed(2)}`
      ctx.fillText(viewportText, this.debugInfo.mousePosition.x + 10, this.debugInfo.mousePosition.y + 20)
    }
    
    ctx.restore()
  }
}
