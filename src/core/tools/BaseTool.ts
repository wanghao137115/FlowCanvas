import type { Vector2, CanvasElement } from '@/types/canvas.types'

/**
 * 工具事件接口
 */
export interface ToolEvent {
  type: 'mousedown' | 'mousemove' | 'mouseup' | 'keydown' | 'keyup' | 'touchstart' | 'touchmove' | 'touchend'
  position: Vector2
  originalEvent: MouseEvent | KeyboardEvent | TouchEvent
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  button?: number
  key?: string
}

/**
 * 工具状态接口
 */
export interface ToolState {
  isActive: boolean
  startPosition?: Vector2
  currentPosition?: Vector2
  selectedElements: CanvasElement[]
  isEditing?: boolean
  editingElementId?: string | null
  currentText?: string
  textSize?: { x: number; y: number }
  showCursor?: boolean
  isDrawing?: boolean
}

/**
 * 工具基类
 * 所有绘图工具的基类，定义了工具的基本接口
 */
export abstract class BaseTool {
  protected state: ToolState
  protected onStateChange?: (state: ToolState) => void
  protected onDrawingStateChange?: (isDrawing: boolean) => void
  protected onDeactivate?: () => void
  protected onElementCreated?: (element: CanvasElement) => void
  protected canvasEngine?: any

  constructor() {
    this.state = {
      isActive: false,
      selectedElements: []
    }
  }

  /**
   * 设置状态变化回调
   */
  setOnStateChange(callback: (state: ToolState) => void): void {
    this.onStateChange = callback
  }

  /**
   * 设置绘制状态变化回调
   */
  setOnDrawingStateChange(callback: (isDrawing: boolean) => void): void {
    this.onDrawingStateChange = callback
  }

  /**
   * 设置停用回调
   */
  setOnDeactivate(callback: () => void): void {
    this.onDeactivate = callback
  }

  /**
   * 设置元素创建回调
   */
  setOnElementCreated(callback: (element: CanvasElement) => void): void {
    this.onElementCreated = callback
  }

  /**
   * 设置画布引擎
   */
  setCanvasEngine(canvasEngine: any): void {
    this.canvasEngine = canvasEngine
  }

  /**
   * 屏幕坐标转虚拟坐标
   */
  protected screenToVirtual(screenPoint: Vector2): Vector2 {
    if (this.canvasEngine?.viewportManager) {
      return this.canvasEngine.viewportManager.getCoordinateTransformer().screenToVirtual(screenPoint)
    }
    return screenPoint
  }

  /**
   * 虚拟坐标转屏幕坐标
   */
  protected virtualToScreen(virtualPoint: Vector2): Vector2 {
    if (this.canvasEngine?.viewportManager) {
      return this.canvasEngine.viewportManager.getCoordinateTransformer().virtualToScreen(virtualPoint)
    }
    return virtualPoint
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 更新工具状态
   */
  protected updateState(updates: Partial<ToolState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyStateChange()
  }

  /**
   * 获取工具名称
   */
  abstract getName(): string

  /**
   * 获取工具图标
   */
  abstract getIcon(): string

  /**
   * 获取工具描述
   */
  abstract getDescription(): string

  /**
   * 激活工具
   */
  activate(): void {
    this.state.isActive = true
    this.onActivate()
    this.notifyStateChange()
  }

  /**
   * 停用工具
   */
  deactivate(): void {
    this.state.isActive = false
    if (this.onDeactivate) {
      this.onDeactivate()
    }
    this.resetCursor()
    this.notifyStateChange()
  }

  /**
   * 重置光标
   */
  protected resetCursor(): void {
    document.body.style.cursor = 'default'
  }

  /**
   * 设置光标样式
   */
  protected setCursor(cursor: string): void {
    document.body.style.cursor = cursor
  }

  /**
   * 工具激活时的回调
   */
  protected onActivate(): void {
    // 默认实现为空，子类可以重写
  }

  /**
   * 通知状态变化
   */
  protected notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state })
    }
  }

  /**
   * 处理鼠标按下事件
   */
  abstract onMouseDown(event: ToolEvent): void

  /**
   * 处理鼠标移动事件
   */
  abstract onMouseMove(event: ToolEvent): void

  /**
   * 处理鼠标抬起事件
   */
  abstract onMouseUp(event: ToolEvent): void

  /**
   * 处理键盘按下事件
   */
  abstract onKeyDown(event: ToolEvent): void

  /**
   * 处理键盘抬起事件
   */
  abstract onKeyUp(event: ToolEvent): void

  /**
   * 获取工具状态
   */
  getState(): ToolState {
    return { ...this.state }
  }

  /**
   * 设置工具状态
   */
  setState(state: Partial<ToolState>): void {
    this.state = { ...this.state, ...state }
    this.notifyStateChange()
  }

  /**
   * 重置工具状态
   */
  reset(): void {
    this.state = {
      isActive: false,
      selectedElements: []
    }
    this.resetCursor()
    this.notifyStateChange()
  }

  /**
   * 检查工具是否激活
   */
  isActive(): boolean {
    return this.state.isActive
  }

  /**
   * 获取选中的元素
   */
  getSelectedElements(): CanvasElement[] {
    return [...this.state.selectedElements]
  }

  /**
   * 设置选中的元素
   */
  setSelectedElements(elements: CanvasElement[]): void {
    this.state.selectedElements = [...elements]
    this.notifyStateChange()
  }

  /**
   * 添加选中元素
   */
  addSelectedElement(element: CanvasElement): void {
    if (!this.state.selectedElements.find(el => el.id === element.id)) {
      this.state.selectedElements.push(element)
      this.notifyStateChange()
    }
  }

  /**
   * 移除选中元素
   */
  removeSelectedElement(elementId: string): void {
    this.state.selectedElements = this.state.selectedElements.filter(
      el => el.id !== elementId
    )
    this.notifyStateChange()
  }

  /**
   * 清空选中元素
   */
  clearSelectedElements(): void {
    this.state.selectedElements = []
    this.notifyStateChange()
  }

  /**
   * 检查元素是否被选中
   */
  isElementSelected(elementId: string): boolean {
    return this.state.selectedElements.some(el => el.id === elementId)
  }

  /**
   * 获取选中元素数量
   */
  getSelectedElementCount(): number {
    return this.state.selectedElements.length
  }

  /**
   * 检查是否有选中元素
   */
  hasSelectedElements(): boolean {
    return this.state.selectedElements.length > 0
  }

  /**
   * 获取工具类型
   */
  abstract getToolType(): string

  /**
   * 获取工具配置
   */
  abstract getConfig(): Record<string, any>

  /**
   * 设置工具配置
   */
  abstract setConfig(config: Record<string, any>): void

  /**
   * 序列化工具状态
   */
  serialize(): string {
    return JSON.stringify({
      toolType: this.getToolType(),
      state: this.state,
      config: this.getConfig()
    })
  }

  /**
   * 反序列化工具状态
   */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.state = parsed.state || this.state
      this.setConfig(parsed.config || {})
    } catch (error) {
      console.error('Failed to deserialize tool state:', error)
    }
  }
}