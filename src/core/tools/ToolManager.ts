import { BaseTool } from './BaseTool'
import { PenTool } from './PenTool'
import { SelectTool } from './SelectTool'
import { ShapeTool } from './ShapeTool'
import { TextTool } from './TextTool'
import { ArrowTool } from './ArrowTool'
import { LineTool } from './LineTool'
import { StyleBrushTool } from './StyleBrushTool'
import { ImageTool } from './ImageTool'
import { ToolType } from '@/types/canvas.types'
import type { CanvasElement, ToolEvent } from '@/types/canvas.types'

export interface ToolState {
  isDrawing?: boolean
  isEditing?: boolean
  editingElementId?: string | null
  currentText?: string
  textSize?: { x: number; y: number }
  showCursor?: boolean
  hasCurrentTool?: boolean
  position?: { x: number; y: number }
  ctrlKey?: boolean
  currentToolName?: string
}

export class ToolManager {
  private tools: Map<ToolType, BaseTool> = new Map()
  private currentTool: BaseTool | null = null
  private isSwitching: boolean = false
  private onToolChange?: (tool: ToolType, toolInstance: BaseTool) => void
  private onStateChange?: (state: ToolState) => void

  constructor() {
    this.initializeTools()
  }

  /**
   * 初始化所有工具
   */
  private initializeTools(): void {

    this.tools.set(ToolType.SELECT, new SelectTool())
    this.tools.set(ToolType.PEN, new PenTool())
    this.tools.set(ToolType.SHAPE, new ShapeTool())
    this.tools.set(ToolType.TEXT, new TextTool())
    this.tools.set(ToolType.ARROW, new ArrowTool())
    this.tools.set(ToolType.LINE, new LineTool())
    this.tools.set(ToolType.STYLE_BRUSH, new StyleBrushTool())
    this.tools.set(ToolType.IMAGE, new ImageTool())
  
  }

  /**
   * 注册自定义工具
   */
  registerTool(toolName: string, tool: BaseTool): void {
    this.tools.set(toolName as any, tool)
  }

  /**
   * 设置当前工具
   */
  setCurrentTool(toolType: ToolType): void {
    if (this.isSwitching) return

    try {
      this.isSwitching = true

      // 停用当前工具
      if (this.currentTool) {
        this.currentTool.deactivate()
      }

      // 激活新工具
      const newTool = this.tools.get(toolType)
      if (newTool) {
        this.currentTool = newTool
        newTool.activate()

        // 通知工具变化
        if (this.onToolChange) {
          this.onToolChange(toolType, newTool)
        }
      } else {
        console.error('ToolManager: 找不到工具', toolType)
      }
    } finally {
      this.isSwitching = false
    }
  }

  /**
   * 设置工具（别名方法）
   */
  setTool(toolType: ToolType): void {
    this.setCurrentTool(toolType)
  }

  /**
   * 获取当前工具
   */
  getCurrentTool(): BaseTool | null {
    return this.currentTool
  }

  /**
   * 获取当前工具类型
   */
  getCurrentToolType(): ToolType {
    return this.currentTool?.getToolType() || ToolType.SELECT
  }

  /**
   * 获取指定工具
   */
  getTool(toolType: ToolType): BaseTool | null {
    return this.tools.get(toolType) || null
  }

  /**
   * 处理鼠标按下事件
   */
  handleMouseDown(event: ToolEvent): void {

    
    // 调试信息
    if (this.onStateChange) {
      this.onStateChange({
        hasCurrentTool: !!this.currentTool,
        position: event.position,
        ctrlKey: event.ctrlKey,
        currentToolName: this.currentTool?.getName()
      })
    }

    if (this.currentTool && typeof this.currentTool.onMouseDown === 'function') {

      this.currentTool.onMouseDown(event)
    } else {
      console.warn('ToolManager: 没有激活的工具或工具没有实现onMouseDown方法')
    }
  }

  /**
   * 处理鼠标移动事件
   */
  handleMouseMove(event: ToolEvent): boolean {
    if (this.currentTool && typeof this.currentTool.onMouseMove === 'function') {
      this.currentTool.onMouseMove(event)
      // 只有在绘制过程中才需要渲染
      return this.currentTool.getState().isDrawing || false
    }
    return false
  }

  /**
   * 处理鼠标抬起事件
   */
  handleMouseUp(event: ToolEvent): void {
    if (this.currentTool && typeof this.currentTool.onMouseUp === 'function') {
      this.currentTool.onMouseUp(event)
    }
  }

  /**
   * 处理键盘按下事件
   */
  handleKeyDown(event: ToolEvent): void {
    if (this.currentTool && typeof this.currentTool.onKeyDown === 'function') {
      this.currentTool.onKeyDown(event)
    }
  }

  /**
   * 处理键盘抬起事件
   */
  handleKeyUp(event: ToolEvent): void {
    if (this.currentTool && typeof this.currentTool.onKeyUp === 'function') {
      this.currentTool.onKeyUp(event)
    }
  }

  /**
   * 渲染当前工具
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.currentTool) {
      this.currentTool.render(ctx)
    } else {
    }
  }

  /**
   * 设置选中元素
   */
  setSelectedElements(elements: CanvasElement[]): void {
    this.tools.forEach(tool => {
      if (tool.setSelectedElements) {
        tool.setSelectedElements(elements)
      }
    })
  }

  /**
   * 设置工具变化回调
   */
  setOnToolChange(callback: (tool: ToolType, toolInstance: BaseTool) => void): void {
    this.onToolChange = callback
  }

  /**
   * 设置状态变化回调
   */
  setOnStateChange(callback: (state: ToolState) => void): void {
    this.onStateChange = callback
  }

  /**
   * 更新当前样式
   */
  updateCurrentStyle(style: any): void {
    this.tools.forEach(tool => {
      if (tool.updateCurrentStyle) {
        tool.updateCurrentStyle(style)
      }
    })
  }

  /**
   * 获取所有工具
   */
  getAllTools(): Map<ToolType, BaseTool> {
    return new Map(this.tools)
  }

  /**
   * 获取工具列表
   */
  getToolList(): Array<{ type: ToolType; name: string; icon: string; description: string }> {
    const toolList: Array<{ type: ToolType; name: string; icon: string; description: string }> = []
    
    this.tools.forEach((tool, type) => {
      toolList.push({
        type,
        name: tool.getName(),
        icon: this.getToolIcon(type),
        description: this.getToolDescription(type)
      })
    })
    
    return toolList
  }

  /**
   * 获取工具图标
   */
  private getToolIcon(toolType: ToolType): string {
    const iconMap: Record<ToolType, string> = {
      [ToolType.SELECT]: 'mdi:cursor-pointer',
      [ToolType.PEN]: 'mdi:pen',
      [ToolType.SHAPE]: 'mdi:shape',
      [ToolType.TEXT]: 'mdi:format-text',
      [ToolType.ARROW]: 'mdi:arrow-right',
      [ToolType.LINE]: 'mdi:minus',
      [ToolType.STYLE_BRUSH]: 'mdi:format-paint',
      [ToolType.IMAGE]: 'mdi:image'
    }
    return iconMap[toolType] || 'mdi:help-circle'
  }

  /**
   * 获取工具描述
   */
  private getToolDescription(toolType: ToolType): string {
    const descriptionMap: Record<ToolType, string> = {
      [ToolType.SELECT]: '选择工具',
      [ToolType.PEN]: '画笔工具',
      [ToolType.SHAPE]: '形状工具',
      [ToolType.TEXT]: '文本工具',
      [ToolType.ARROW]: '箭头工具',
      [ToolType.LINE]: '直线工具',
      [ToolType.STYLE_BRUSH]: '样式刷工具',
      [ToolType.IMAGE]: '图片工具'
    }
    return descriptionMap[toolType] || '未知工具'
  }

  /**
   * 销毁工具管理器
   */
  destroy(): void {
    this.tools.forEach(tool => {
      tool.deactivate()
    })
    this.tools.clear()
    this.currentTool = null
  }
}