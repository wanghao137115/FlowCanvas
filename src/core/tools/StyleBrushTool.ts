import { BaseTool } from './BaseTool'
import type { CanvasElement, Vector2 } from '@/types/canvas.types'
import type { ToolEvent } from './BaseTool'

/**
 * 样式刷工具
 * 用于复制和应用元素样式
 */
export class StyleBrushTool extends BaseTool {
  private sourceElement: CanvasElement | null = null
  private hoveredElement: CanvasElement | null = null
  private onStyleApplied?: (sourceElement: CanvasElement, targetElement: CanvasElement) => void
  private onSourceSelected?: (element: CanvasElement) => void
  private onVisualFeedbackChange?: (sourceElement: CanvasElement | null, hoveredElement: CanvasElement | null) => void
  private onDeactivateCallback?: () => void
  private allElements: CanvasElement[] = []
  
  // 拖动相关属性
  private isDragging: boolean = false
  private dragStartPosition: Vector2 | null = null
  private draggedElement: CanvasElement | null = null
  private onElementMove?: (element: CanvasElement, delta: Vector2) => void
  private onDragStart?: (elements: CanvasElement[]) => void
  private onDragEnd?: (elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => void
  private onHideFloatingToolbar?: () => void
  private onShowFloatingToolbar?: (element: CanvasElement) => void

  constructor() {
    super()
  }

  getName(): string {
    return 'styleBrush'
  }

  getIcon(): string {
    return 'mdi:format-paint'
  }

  getDescription(): string {
    return '复制和应用元素样式'
  }

  getConfig(): any {
    return {}
  }

  setConfig(_config: any): void {
    // 样式刷工具不需要配置
  }

  activate(): void {
    if (this.isActive()) return
    super.activate()
    this.setStyleBrushCursor()
  }

  deactivate(): void {
    super.deactivate()
    this.resetState()
    this.resetCursor()
    
    if (this.onDeactivateCallback) {
      this.onDeactivateCallback()
    }
    
    if (this.onVisualFeedbackChange) {
      this.onVisualFeedbackChange(null, null)
    }
  }

  onMouseDown(event: ToolEvent): void {
    const element = this.getElementAtPosition(event.position)
    
    if (element) {
      if (this.sourceElement && element.id !== this.sourceElement.id) {
        // 有源元素且不是同一个元素，应用样式
        this.applyStyle(this.sourceElement, element)
        
        if (this.onStyleApplied) {
          this.onStyleApplied(this.sourceElement, element)
        }
      } else if (!this.sourceElement) {
        // 没有源元素，开始拖动
        this.isDragging = true
        this.draggedElement = element
        this.dragStartPosition = event.position
        
        // 隐藏浮动工具栏
        if (this.onHideFloatingToolbar) {
          this.onHideFloatingToolbar()
        }
        
        // 触发拖动开始回调
        if (this.onDragStart) {
          this.onDragStart([element])
        }
      }
    } else {
      // 点击空白区域，重置状态
      this.resetState()
      // 触发停用回调
      if (this.onDeactivateCallback) {
        this.onDeactivateCallback()
      }
    }
  }

  onMouseMove(event: ToolEvent): void {
    if (this.isDragging && this.draggedElement && this.dragStartPosition) {
      // ✅ 修复：将屏幕坐标转换为虚拟坐标进行计算
      const virtualPosition = this.screenToVirtual(event.position)
      const virtualDragStartPosition = this.screenToVirtual(this.dragStartPosition)
      
      const delta = {
        x: virtualPosition.x - virtualDragStartPosition.x,
        y: virtualPosition.y - virtualDragStartPosition.y
      }
      
      // 计算新位置
      const newPosition = {
        x: this.draggedElement.position.x + delta.x,
        y: this.draggedElement.position.y + delta.y
      }
      
      // 使用 CanvasEngine 的 updateElementPosition 方法来更新位置和连接线
      // 这样可以确保 canvasStore 被正确更新，触发 MiniMap 的响应式更新
      if (this.canvasEngine) {
        const toolName = this.getName()
        console.log(`🖌️ [StyleBrushTool] 拖动中 - 调用 updateElementPosition`, {
          tool: toolName,
          elementId: this.draggedElement.id,
          oldPos: { x: this.draggedElement.position.x, y: this.draggedElement.position.y },
          newPos: newPosition,
          delta
        })
        const result = this.canvasEngine.updateElementPosition(this.draggedElement.id, newPosition)
        console.log(`🖌️ [StyleBrushTool] updateElementPosition 返回结果:`, result)
      } else {
        console.warn(`⚠️ [StyleBrushTool] canvasEngine 不存在，无法更新位置`)
      }
      
      // 更新拖动起始位置
      this.dragStartPosition = event.position
      
      // 触发移动回调
      if (this.onElementMove) {
        this.onElementMove(this.draggedElement, delta)
      }
    } else {
      // 处理悬停
      const element = this.getElementAtPosition(event.position)
      
      if (element !== this.hoveredElement) {
        this.hoveredElement = element
        if (this.onVisualFeedbackChange) {
          this.onVisualFeedbackChange(this.sourceElement, this.hoveredElement)
        }
      }
    }
  }

  onMouseUp(_event: ToolEvent): void {
    if (this.isDragging && this.draggedElement) {
      // 结束拖动
      const draggedElement = this.draggedElement
      this.isDragging = false
      this.draggedElement = null
      this.dragStartPosition = null
      
      // 显示浮动工具栏
      if (this.onShowFloatingToolbar) {
        this.onShowFloatingToolbar(draggedElement)
      }
      
      // 触发拖动结束回调
      if (this.onDragEnd) {
        this.onDragEnd([draggedElement], [], [])
      }
    }
  }

  onKeyDown(event: ToolEvent): void {
    if (event.originalEvent instanceof KeyboardEvent && event.originalEvent.key === 'Escape') {
      this.resetState()
      if (this.onVisualFeedbackChange) {
        this.onVisualFeedbackChange(null, null)
      }
    }
  }

  onKeyUp(_event: ToolEvent): void {
    // 不需要处理键盘抬起
  }

  render(_ctx: CanvasRenderingContext2D): void {
    // 样式刷工具不需要渲染
  }

  /**
   * 设置样式应用回调
   */
  setOnStyleApplied(callback: (sourceElement: CanvasElement, targetElement: CanvasElement) => void): void {
    this.onStyleApplied = callback
  }

  /**
   * 设置源元素选择回调
   */
  setOnSourceSelected(callback: (element: CanvasElement) => void): void {
    this.onSourceSelected = callback
  }

  /**
   * 设置视觉反馈变化回调
   */
  setOnVisualFeedbackChange(callback: (sourceElement: CanvasElement | null, hoveredElement: CanvasElement | null) => void): void {
    this.onVisualFeedbackChange = callback
  }

  /**
   * 设置停用回调
   */
  setOnDeactivate(callback: () => void): void {
    this.onDeactivateCallback = callback
  }

  /**
   * 设置样式刷光标
   */
  private setStyleBrushCursor(): void {
    // 创建样式刷光标
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // 绘制画笔图标
      ctx.fillStyle = '#007ACC'
      ctx.fillRect(8, 8, 16, 16)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(10, 10, 12, 12)
    }
    
    const cursorUrl = canvas.toDataURL()
    document.body.style.cursor = `url(${cursorUrl}) 16 16, auto`
  }

  /**
   * 重置光标
   */
  resetCursor(): void {
    super.resetCursor()
  }

  /**
   * 设置源元素
   */
  setSourceElement(element: CanvasElement): void {
    this.sourceElement = element
    
    if (this.onSourceSelected) {
      this.onSourceSelected(element)
    }
    if (this.onVisualFeedbackChange) {
      this.onVisualFeedbackChange(this.sourceElement, this.hoveredElement)
    }
  }

  /**
   * 重置状态
   */
  resetState(): void {
    this.sourceElement = null
    this.hoveredElement = null
    
    // 触发视觉反馈更新
    if (this.onVisualFeedbackChange) {
      this.onVisualFeedbackChange(null, null)
    }
  }

  /**
   * 检查是否有源元素
   */
  hasSourceElement(): boolean {
    return this.sourceElement !== null
  }

  /**
   * 应用样式
   */
  private applyStyle(sourceElement: CanvasElement, targetElement: CanvasElement): void {
    if (!sourceElement.style || !targetElement.style) return

    // 复制样式属性
    const sourceStyle = sourceElement.style
    const targetStyle = { ...targetElement.style }

    // 复制基本样式属性
    if (sourceStyle.fill !== undefined) {
      targetStyle.fill = sourceStyle.fill
    }
    if (sourceStyle.stroke !== undefined) {
      targetStyle.stroke = sourceStyle.stroke
    }
    if (sourceStyle.strokeWidth !== undefined) {
      targetStyle.strokeWidth = sourceStyle.strokeWidth
    }
    if (sourceStyle.opacity !== undefined) {
      targetStyle.opacity = sourceStyle.opacity
    }

    // 复制文本样式（如果目标元素是文本）
    if (targetElement.type === 'text' && sourceElement.type === 'text') {
      if (sourceStyle.fontSize !== undefined) {
        targetStyle.fontSize = sourceStyle.fontSize
      }
      if (sourceStyle.fontFamily !== undefined) {
        targetStyle.fontFamily = sourceStyle.fontFamily
      }
    }

    // 更新目标元素样式
    targetElement.style = targetStyle
  }

  /**
   * 获取指定位置的元素
   */
  private getElementAtPosition(position: Vector2): CanvasElement | null {
    const virtualPosition = this.screenToVirtual(position)
    // 从后往前遍历，优先选择上层的元素
    for (let i = this.allElements.length - 1; i >= 0; i--) {
      const element = this.allElements[i]
      const isInside = this.canvasEngine
        ? this.canvasEngine.isPointInElementPublic(virtualPosition, element)
        : this.isPointInElement(virtualPosition, element)
      if (isInside) {
        return element
      }
    }
    return null
  }

  /**
   * 检查点是否在元素内
   */
  private isPointInElement(point: Vector2, element: CanvasElement): boolean {
    const { position, size } = element
    return point.x >= position.x &&
           point.x <= position.x + size.x &&
           point.y >= position.y &&
           point.y <= position.y + size.y
  }

  /**
   * 获取源元素
   */
  getSourceElement(): CanvasElement | null {
    return this.sourceElement
  }

  /**
   * 获取悬停元素
   */
  getHoveredElement(): CanvasElement | null {
    return this.hoveredElement
  }

  /**
   * 更新元素列表
   */
  updateElements(elements: CanvasElement[]): void {
    this.allElements = elements
  }

  /**
   * 设置拖动回调
   */
  setDragCallbacks(
    onElementMove?: (element: CanvasElement, delta: Vector2) => void,
    onDragStart?: (elements: CanvasElement[]) => void,
    onDragEnd?: (elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => void
  ): void {
    this.onElementMove = onElementMove
    this.onDragStart = onDragStart
    this.onDragEnd = onDragEnd
  }

  /**
   * 设置浮动工具栏回调
   */
  setFloatingToolbarCallbacks(
    onHideFloatingToolbar?: () => void,
    onShowFloatingToolbar?: (element: CanvasElement) => void
  ): void {
    this.onHideFloatingToolbar = onHideFloatingToolbar
    this.onShowFloatingToolbar = onShowFloatingToolbar
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'styleBrush'
  }
}