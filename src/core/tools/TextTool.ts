import { BaseTool } from './BaseTool'
import { ToolType, ElementType } from '@/types/canvas.types'
import type { CanvasElement, Vector2, ElementStyle } from '@/types/canvas.types'
import type { ToolEvent } from './BaseTool'

export interface TextSettings {
  fontSize: number
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  textDecoration: 'none' | 'underline' | 'line-through'
  maxWidth: number
  lineHeight: number
}

export class TextTool extends BaseTool {
  private isEditing: boolean = false
  private currentText: string = ''
  private textPosition: Vector2 | null = null
  private textSize: Vector2 = { x: 100, y: 20 }
  private showCursor: boolean = false
  private cursorBlinkTimer: number | null = null
  private editingElementId: string | null = null
  private isNewText: boolean = false
  private isDragging: boolean = false
  private dragStartPosition: Vector2 | null = null
  private selectedTextElement: any = null
  private textSettings: TextSettings = {
    fontSize: 16,
    fontFamily: 'Arial',
    textAlign: 'left',
    textDecoration: 'none',
    maxWidth: 300,
    lineHeight: 1.2
  }

  constructor() {
    super()
  }

  getName(): string {
    return 'text'
  }

  activate(): void {
    super.activate()
    this.setCursor('text')
  }

  deactivate(): void {
    super.deactivate()
    this.stopEditing()
  }

  /**
   * 选择文本元素
   */
  private selectTextElement(textInfo: any): void {
    
    // 通知画布引擎选择该元素
    if (this.canvasEngine) {
      this.canvasEngine.selectElement(textInfo.id)
    }
  }

  /**
   * 获取工具状态
   */
  getState(): any {
    return {
      ...super.getState(),
      isEditing: this.isEditing,
      isDragging: this.isDragging,
      editingElementId: this.editingElementId,
      currentText: this.currentText,
      textSize: this.textSize,
      showCursor: this.showCursor
    }
  }

  onMouseDown(event: ToolEvent): void {
    
    // 检查是否点击在现有文本上
    const textInfo = this.getTextAtPosition(event.position)

    if (this.isEditing) {
      // 如果正在编辑，检查是否点击在输入框内
      if (this.isClickInsideInputBox(event.position)) {
        return // 点击在输入框内，不处理
      } else {
        // 点击在输入框外，完成编辑
        this.finishEditing()
        return
      }
    }
    
    if (textInfo) {
      // 检查是否是双击
      const isDoubleClick = (event.originalEvent as MouseEvent)?.detail === 2
      
      if (isDoubleClick) {
        // 双击：开始编辑
        this.startEditing(textInfo.id, textInfo.position, textInfo.size, textInfo.content)
      } else {
        // 单击：选择文本元素，准备拖动
        this.selectTextElement(textInfo)
        this.isDragging = true
        this.dragStartPosition = event.position
        this.selectedTextElement = textInfo
      }
    } else {
      // 点击在空白处，取消选择并创建新文本
      
      // 通知画布引擎取消选择
      if (this.canvasEngine) {
        this.canvasEngine.clearSelection()
      }
      
      // 创建新文本 - 转换为虚拟坐标
      this.startNewText(this.screenToVirtual(event.position))
    }
  }

  onMouseMove(event: ToolEvent): void {
    // 处理文本拖动
    if (this.isDragging && this.selectedTextElement && this.dragStartPosition) {
      // ✅ 修复：将屏幕坐标转换为虚拟坐标进行计算
      const virtualPosition = this.screenToVirtual(event.position)
      const virtualDragStartPosition = this.screenToVirtual(this.dragStartPosition)
      
      const deltaX = virtualPosition.x - virtualDragStartPosition.x
      const deltaY = virtualPosition.y - virtualDragStartPosition.y
      
      // 更新文本元素位置（使用虚拟坐标）
      if (this.canvasEngine) {
        this.canvasEngine.updateElementPosition(this.selectedTextElement.id, {
          x: this.selectedTextElement.position.x + deltaX,
          y: this.selectedTextElement.position.y + deltaY
        })
      }
    }
  }

  onMouseUp(event: ToolEvent): void {
    
    // 结束拖动
    if (this.isDragging) {
      this.isDragging = false
      this.dragStartPosition = null
      this.selectedTextElement = null
    }
  }

  onKeyDown(event: ToolEvent): void {

    if (!this.isEditing) {
      return
    }

    if (event.key === 'Enter') {
      // 换行
      this.currentText += '\n'
      this.updateTextSize()
    } else if (event.key === 'Backspace') {
      // 删除字符
      if (this.currentText.length > 0) {
        this.currentText = this.currentText.slice(0, -1)
        this.updateTextSize()
      }
    } else if (event.key === 'Escape') {
      // 取消编辑
      this.cancelEditing()
    } else if (event.key === 'Tab') {
      // 插入制表符
      this.currentText += '  ' // 两个空格作为制表符
      this.updateTextSize()
    } else if (event.key && event.key.length === 1) {
      // 插入普通字符
      this.currentText += event.key
      this.updateTextSize()
    }
  }

  onKeyUp(event: ToolEvent): void {
    // 文本工具不需要处理键盘抬起
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 只在编辑状态时才渲染
    if (this.isEditing) {
      this.renderTextInput(ctx)
    }
  }

  // 开始编辑现有文本
  private startEditing(elementId: string, position: Vector2, size: Vector2, content: string): void {

    this.isEditing = true
    this.currentText = content
    this.textPosition = position
    this.textSize = size
    this.editingElementId = elementId
    this.isNewText = false
    this.startCursorBlink()
    
    
    // 通知画布引擎开始编辑
    if (this.onStateChange) {
      this.onStateChange({
        ...this.state,
        isEditing: true,
        editingElementId: elementId,
        currentText: this.currentText
      })
    }
  }

  // 开始创建新文本
  private startNewText(position: Vector2): void {

    this.isEditing = true
    this.currentText = ''
    this.textPosition = position
    this.textSize = { x: 100, y: 20 }
    this.editingElementId = null
    this.isNewText = true
    this.startCursorBlink()
    
    
    // 通知画布引擎开始编辑
    if (this.onStateChange) {
      this.onStateChange({
        ...this.state,
        isEditing: true,
        editingElementId: null,
        currentText: this.currentText
      })
    }
  }

  // 完成编辑
  private finishEditing(): void {

    if (!this.isEditing || !this.textPosition) return

    if (this.currentText.trim()) {
      if (this.isNewText) {
        // 创建新文本元素
        const textElement: CanvasElement = {
          id: this.generateId(),
          type: ElementType.TEXT,
          layer: this.canvasEngine?.getCurrentLayerId() || 'default', // 添加layer属性
          position: this.textPosition,
          size: this.textSize,
          rotation: 0,
          locked: false,
          visible: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          style: {
            fill: '#000000',
            fillEnabled: true,
            fillType: 'solid',
            gradientDirection: 'horizontal',
            stroke: '#000000',
            strokeWidth: 0,
            lineStyle: 'solid',
            lineCap: 'round',
            fontSize: this.textSettings.fontSize,
            fontFamily: this.textSettings.fontFamily,
            textAlign: this.textSettings.textAlign,
            textDecoration: this.textSettings.textDecoration
          },
          data: {
            text: this.currentText,
            settings: { ...this.textSettings }
          }
        }


        // 通知画布引擎创建元素
        if (this.onElementCreated) {
          this.onElementCreated(textElement)
        }
        
        // 创建元素后，停止编辑状态
        this.stopEditing()
        return
      } else if (this.editingElementId) {
        // 更新现有文本元素
        if (this.canvasEngine) {
          this.canvasEngine.updateElementText(this.editingElementId, this.currentText)
        }
      }
    }

    this.stopEditing()
  }

  // 取消编辑
  private cancelEditing(): void {
    this.stopEditing()
  }

  // 停止编辑
  private stopEditing(): void {
    this.isEditing = false
    this.currentText = ''
    this.textPosition = null
    this.textSize = { x: 100, y: 20 }
    this.editingElementId = null
    this.isNewText = false
    this.stopCursorBlink()
    
    // 通知画布引擎停止编辑
    if (this.onStateChange) {
      this.onStateChange({
        ...this.state,
        isEditing: false,
        editingElementId: null,
        currentText: ''
      })
    }
  }

  // 更新文本尺寸
  private updateTextSize(): void {
    if (!this.textPosition) return

    const lines = this.currentText.split('\n')
    const lineHeight = this.textSettings.fontSize * this.textSettings.lineHeight
    const newHeight = Math.max(20, lines.length * lineHeight)
    
    // 使用更准确的文本宽度计算
    const textWidth = this.getTextWidth(this.currentText)
    const newWidth = Math.max(100, Math.min(this.textSettings.maxWidth, textWidth + 10)) // 10px的padding
    
    // 只有当尺寸真正改变时才更新
    if (this.textSize.y !== newHeight || this.textSize.x !== newWidth) {
      this.textSize.y = newHeight
      this.textSize.x = newWidth
      
      // 文本内容变化时直接请求渲染，不触发状态变化
      if (this.canvasEngine && this.canvasEngine.requestRender) {
        this.canvasEngine.requestRender()
      }
    }
  }

  // 渲染文本输入框
  private renderTextInput(ctx: CanvasRenderingContext2D): void {
    if (!this.textPosition) return

    ctx.save()

    // 设置字体 - 使用当前文本设置
    ctx.font = `${this.textSettings.fontSize}px ${this.textSettings.fontFamily}`
    ctx.fillStyle = '#000000'
    ctx.textAlign = this.textSettings.textAlign as CanvasTextAlign
    ctx.textBaseline = 'top'

    // 计算文本尺寸
    const textMetrics = ctx.measureText(this.currentText || 'Text')
    const textWidth = textMetrics.width
    const textHeight = this.textSettings.fontSize * this.textSettings.lineHeight

    // 绘制背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(
      this.textPosition.x - 2,
      this.textPosition.y - 2,
      Math.max(textWidth + 4, 100),
      textHeight + 4
    )

    // 绘制文本
    ctx.fillStyle = '#000000'
    ctx.fillText(this.currentText || 'Text', this.textPosition.x, this.textPosition.y)

    // 绘制光标
    if (this.isEditing && this.showCursor) {
      const cursorX = this.textPosition.x + textWidth
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cursorX, this.textPosition.y)
      ctx.lineTo(cursorX, this.textPosition.y + textHeight)
      ctx.stroke()
    }

    ctx.restore()
  }

  // 检查是否正在编辑
  isCurrentlyEditing(): boolean {
    return this.isEditing
  }

  // 获取正在编辑的元素ID
  getEditingElementId(): string | null {
    return this.isEditing ? 'current' : null
  }

  // 获取当前文本
  getCurrentText(): string {
    return this.currentText
  }

  // 获取文本位置
  getTextPosition(): Vector2 | null {
    return this.textPosition
  }

  // 设置文本设置
  setTextSettings(settings: Partial<TextSettings>): void {
    this.textSettings = { ...this.textSettings, ...settings }
    
    // 如果正在编辑，通知画布引擎重新渲染
    if (this.isEditing && this.onStateChange) {
      this.onStateChange({
        ...this.state,
        isEditing: true,
        editingElementId: this.editingElementId,
        currentText: this.currentText
      })
    }
  }

  // 获取文本设置
  getTextSettings(): TextSettings {
    return { ...this.textSettings }
  }

  // 检查点击是否在输入框内
  private isClickInsideInputBox(position: Vector2): boolean {
    if (!this.textPosition) return false

    const textWidth = this.getTextWidth(this.currentText)
    const textHeight = this.textSettings.fontSize * this.textSettings.lineHeight
    const padding = 2

    return position.x >= this.textPosition.x - padding &&
           position.x <= this.textPosition.x + Math.max(textWidth, 100) + padding &&
           position.y >= this.textPosition.y - padding &&
           position.y <= this.textPosition.y + textHeight + padding
  }

  // 计算文本宽度
  private getTextWidth(text: string): number {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    ctx.font = `${this.textSettings.fontSize}px ${this.textSettings.fontFamily}`
    const metrics = ctx.measureText(text)
    return metrics.width
  }

  // 开始光标闪烁
  private startCursorBlink(): void {
    this.stopCursorBlink() // 先停止之前的定时器

    this.showCursor = true
    this.cursorBlinkTimer = window.setInterval(() => {
      this.showCursor = !this.showCursor
      // 光标闪烁时请求渲染，使用动画帧避免频繁渲染
      if (this.canvasEngine && this.canvasEngine.requestRender) {
        this.canvasEngine.requestRender()
      }
    }, 500)
  }

  // 停止光标闪烁
  private stopCursorBlink(): void {
    if (this.cursorBlinkTimer) {
      clearInterval(this.cursorBlinkTimer)
      this.cursorBlinkTimer = null
    }
    this.showCursor = false
  }

  // 获取指定位置的文本元素信息
  private getTextAtPosition(position: Vector2): { id: string; position: Vector2; size: Vector2; content: string } | null {
    // 从画布引擎获取所有文本元素
    if (!this.canvasEngine) {
      return null
    }

    const elements = this.canvasEngine.getElements()
    const textElements = elements.filter((element: CanvasElement) => element.type === 'text')
    

    // 从后往前检查（后绘制的元素在上层）
    for (let i = textElements.length - 1; i >= 0; i--) {
      const element = textElements[i] as CanvasElement
      const isInArea = this.isPointInTextArea(position, element.position, element.size)
      
      if (isInArea) {
        return {
          id: element.id,
          position: element.position,
          size: element.size,
          content: element.data?.text || ''
        }
      }
    }

    return null
  }

  // 检查点是否在文本区域内
  private isPointInTextArea(point: Vector2, textPosition: Vector2, textSize: Vector2): boolean {
    const pointX = point.x
    const pointY = point.y
    const textX = textPosition.x
    const textY = textPosition.y
    const textWidth = textSize.x
    const textHeight = textSize.y

    const isInArea = pointX >= textX && 
           pointX <= textX + textWidth && 
           pointY >= textY && 
           pointY <= textY + textHeight


    return isInArea
  }

  /**
   * 获取工具图标
   */
  getIcon(): string {
    return 'text'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '文本工具'
  }

  /**
   * 获取工具配置
   */
  getConfig(): any {
    return this.textSettings
  }

  /**
   * 设置工具配置
   */
  setConfig(config: any): void {
    this.textSettings = { ...this.textSettings, ...config }
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'text'
  }
}