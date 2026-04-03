import { BaseTool, type ToolEvent } from './BaseTool'
import { ToolType } from '@/types/canvas.types'

/**
 * 拖动工具（手型工具）
 * 用于自由拖动画布浏览，支持无限画布延伸
 */
export class HandTool extends BaseTool {
  private isPanning: boolean = false
  private isSpacePressed: boolean = false
  private previousTool: ToolType | null = null
  private onRerender?: () => void

  constructor() {
    super()
  }

  /**
   * 设置画布引擎
   */
  setCanvasEngine(canvasEngine: any): void {
    super.setCanvasEngine(canvasEngine)
  }

  /**
   * 获取工具名称
   */
  getName(): string {
    return 'hand'
  }

  /**
   * 获取工具图标
   */
  getIcon(): string {
    return 'mdi:hand-back-right'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '拖动画布，浏览无限画布'
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'hand'
  }

  /**
   * 设置重新渲染回调
   */
  setOnRerender(callback: () => void): void {
    this.onRerender = callback
  }

  /**
   * 激活工具
   */
  activate(): void {
    super.activate()
    this.setCursor('grab')
    console.log('[HandTool] 拖动工具已激活')

    // 清除元素选择，避免显示浮动工具栏和变换手柄
    if (this.canvasEngine) {
      this.canvasEngine.clearSelection()
    }
  }

  /**
   * 停用工具
   */
  deactivate(): void {
    super.deactivate()
    this.resetCursor()
    this.isPanning = false
    console.log('[HandTool] 拖动工具已停用')
  }

  /**
   * 工具激活时的回调
   */
  protected onActivate(): void {
    // 激活时不需要特殊处理
  }

  /**
   * 获取工具配置
   */
  getConfig(): Record<string, any> {
    return {}
  }

  /**
   * 设置工具配置
   */
  setConfig(_config: Record<string, any>): void {
    // 拖动工具不需要特殊配置
  }

  /**
   * 处理鼠标按下事件
   */
  onMouseDown(event: ToolEvent): void {
    this.isPanning = true

    // 开始视口平移
    if (this.canvasEngine?.viewportManager) {
      this.canvasEngine.viewportManager.startPan(event.position)
    }

    this.setCursor('grabbing')
    console.log('[HandTool] 开始拖动画布', event.position)
  }

  /**
   * 处理鼠标移动事件
   */
  onMouseMove(event: ToolEvent): void {
    if (!this.isPanning) return

    // 使用带扩展的平移方法
    if (this.canvasEngine?.viewportManager) {
      this.canvasEngine.viewportManager.updatePanWithExpansion(
        event.position,
        this.canvasEngine
      )
    }

    // 触发重新渲染
    if (this.onRerender) {
      this.onRerender()
    }
  }

  /**
   * 处理鼠标抬起事件
   */
  onMouseUp(_event: ToolEvent): void {
    if (this.isPanning) {
      this.isPanning = false
      this.setCursor('grab')

      // 结束视口平移
      if (this.canvasEngine?.viewportManager) {
        this.canvasEngine.viewportManager.endPan()
      }

      console.log('[HandTool] 结束拖动画布')
    }
  }

  /**
   * 渲染工具状态
   * 拖动工具不需要渲染任何内容
   */
  render(_ctx: CanvasRenderingContext2D): void {
    // 空实现，拖动工具不需要渲染
  }

  /**
   * 处理键盘按下事件
   */
  onKeyDown(event: ToolEvent): void {
    // Space 键临时激活拖动工具
    if (event.key === ' ' && !this.isSpacePressed) {
      this.isSpacePressed = true

      // 如果是通过快捷键激活（而不是点击工具栏），保存当前工具
      if (!this.state.isActive && this.canvasEngine?.toolManager) {
        this.previousTool = this.canvasEngine.toolManager.getCurrentToolType()
      }

      // 激活拖动工具（会清除选择）
      if (!this.state.isActive) {
        this.activate()
      } else {
        // 如果已经激活，只清除选择
        if (this.canvasEngine) {
          this.canvasEngine.clearSelection()
        }
      }
      this.setCursor('grab')
      console.log('[HandTool] Space 键激活拖动工具', { previousTool: this.previousTool })
    }

    // H 键切换到拖动工具
    if ((event.key === 'h' || event.key === 'H') && this.canvasEngine) {
      this.canvasEngine.setTool(ToolType.HAND)
    }

    // Escape 键退出拖动工具
    if (event.key === 'Escape' && this.state.isActive) {
      this.deactivate()

      // 如果是通过 Space 激活的，切换回之前的工具
      if (this.previousTool && this.canvasEngine) {
        this.canvasEngine.setTool(this.previousTool)
        this.previousTool = null
      } else if (this.canvasEngine) {
        // 否则切换回选择工具
        this.canvasEngine.setTool(ToolType.SELECT)
      }
    }
  }

  /**
   * 处理键盘抬起事件
   */
  onKeyUp(event: ToolEvent): void {
    // 释放 Space 键，临时切换回原工具
    if (event.key === ' ') {
      this.isSpacePressed = false

      // 如果是通过 Space 临时激活的，切换回之前的工具
      if (this.previousTool && this.canvasEngine) {
        this.canvasEngine.setTool(this.previousTool)
        this.previousTool = null
        console.log('[HandTool] Space 键释放，切换回工具:', this.previousTool)
      }
    }
  }

  /**
   * 检查是否正在平移
   */
  isCurrentlyPanning(): boolean {
    return this.isPanning
  }

  /**
   * 重置工具状态
   */
  reset(): void {
    super.reset()
    this.isPanning = false
    this.previousTool = null
    this.isSpacePressed = false
  }
}
