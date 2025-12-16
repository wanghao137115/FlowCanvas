import type { EventHandler } from '@/types/canvas.types'

/**
 * 事件管理�?
 * 负责统一管理画布的所有事�?
 */
export class EventManager {
  private canvas: HTMLCanvasElement
  private eventHandlers: Map<string, EventHandler[]> = new Map()
  private isEnabled: boolean = true

  constructor(canvas: HTMLCanvasElement) {

    this.canvas = canvas
    this.setupEventListeners()
  }

  /**
   * 设置事件监听�?
   */
  private setupEventListeners(): void {

    // 鼠标事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this))


    // 触摸事件
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this))

    // 键盘事件（需要在document上监听）
    // 键盘事件 - 移除，由 WhiteboardCanvas.vue 统一处理
    // document.addEventListener('keydown', this.handleKeyDown.bind(this))
    // document.addEventListener('keyup', this.handleKeyUp.bind(this))

    // 拖拽事件
    this.canvas.addEventListener('dragstart', this.handleDragStart.bind(this))
    this.canvas.addEventListener('dragover', this.handleDragOver.bind(this))
    this.canvas.addEventListener('drop', this.handleDrop.bind(this))
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(event: MouseEvent): void {

    if (!this.isEnabled) {

      return
    }
    this.dispatchEvent('mousedown', event)
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('mousemove', event)
  }

  /**
   * 处理鼠标抬起事件
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('mouseup', event)
  }

  /**
   * 处理鼠标进入事件
   */
  private handleMouseEnter(event: MouseEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('mouseenter', event)
  }

  /**
   * 处理鼠标离开事件
   */
  private handleMouseLeave(event: MouseEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('mouseleave', event)
  }

  /**
   * 处理滚轮事件
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('wheel', event)
  }

  /**
   * 处理右键菜单事件
   */
  private handleContextMenu(event: MouseEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('contextmenu', event)
  }

  /**
   * 处理触摸开始事�?
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('touchstart', event)
  }

  /**
   * 处理触摸移动事件
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('touchmove', event)
  }

  /**
   * 处理触摸结束事件
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('touchend', event)
  }

  /**
   * 处理触摸取消事件
   */
  private handleTouchCancel(event: TouchEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('touchcancel', event)
  }

  /**
   * 处理键盘按下事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('keydown', event)
  }

  /**
   * 处理键盘抬起事件
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('keyup', event)
  }

  /**
   * 处理拖拽开始事�?
   */
  private handleDragStart(event: DragEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('dragstart', event)
  }

  /**
   * 处理拖拽悬停事件
   */
  private handleDragOver(event: DragEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('dragover', event)
  }

  /**
   * 处理拖拽放置事件
   */
  private handleDrop(event: DragEvent): void {
    if (!this.isEnabled) return
    this.dispatchEvent('drop', event)
  }

  /**
   * 注册事件处理�?
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  /**
   * 移除事件处理�?
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 移除所有事件处理器
   */
  offAll(eventType?: string): void {
    if (eventType) {
      this.eventHandlers.delete(eventType)
    } else {
      this.eventHandlers.clear()
    }
  }

  /**
   * 分发事件
   */
  private dispatchEvent(eventType: string, event: Event): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * 启用事件处理
   */
  enable(): void {
    this.isEnabled = true
  }

  /**
   * 禁用事件处理
   */
  disable(): void {
    this.isEnabled = false
  }

  /**
   * 检查事件处理是否启�?
   */
  isEventEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * 获取画布元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  /**
   * 销毁事件管理器
   */
  destroy(): void {
    // 移除所有事件监听器
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('mouseenter', this.handleMouseEnter.bind(this))
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu.bind(this))

    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    this.canvas.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))

    // 键盘事件 - 已移除，无需清理
    // document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    // document.removeEventListener('keyup', this.handleKeyUp.bind(this))

    this.canvas.removeEventListener('dragstart', this.handleDragStart.bind(this))
    this.canvas.removeEventListener('dragover', this.handleDragOver.bind(this))
    this.canvas.removeEventListener('drop', this.handleDrop.bind(this))

    // 清空事件处理�?
    this.eventHandlers.clear()
  }
}
