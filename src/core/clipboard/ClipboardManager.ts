import { CanvasElement } from '../types/CanvasElement'

/**
 * 剪贴板管理器
 * 负责处理元素的复制粘贴操作
 */
export class ClipboardManager {
  private static instance: ClipboardManager
  private clipboardData: CanvasElement[] = []
  private lastPasteOffset: { x: number; y: number } = { x: 20, y: 20 }

  private constructor() {}

  static getInstance(): ClipboardManager {
    if (!ClipboardManager.instance) {
      ClipboardManager.instance = new ClipboardManager()
    }
    return ClipboardManager.instance
  }

  /**
   * 复制元素到剪贴板
   */
  copy(elements: CanvasElement[]): void {
    console.log('🔄 ClipboardManager.copy被调用', {
      elementsCount: elements.length,
      elements: elements.map(el => ({ id: el.id, type: el.type }))
    })
    
    if (elements.length === 0) return

    // 深拷贝元素，生成新的ID
    this.clipboardData = elements.map(element => ({
      ...element,
      id: this.generateId(),
      position: { ...element.position }
    }))
    
    console.log('🔄 剪贴板数据已设置', {
      clipboardDataCount: this.clipboardData.length,
      hasData: this.hasData()
    })
  }

  /**
   * 从剪贴板粘贴元素
   */
  paste(): CanvasElement[] {
    if (this.clipboardData.length === 0) return []

    // 深拷贝剪贴板数据，生成新的ID和位置
    const pastedElements = this.clipboardData.map(element => ({
      ...element,
      id: this.generateId(),
      position: {
        x: element.position.x + this.lastPasteOffset.x,
        y: element.position.y + this.lastPasteOffset.y
      }
    }))

    // 更新下次粘贴的偏移量
    this.lastPasteOffset.x += 20
    this.lastPasteOffset.y += 20

    return pastedElements
  }

  /**
   * 检查剪贴板是否有数据
   */
  hasData(): boolean {
    return this.clipboardData.length > 0
  }

  /**
   * 清空剪贴板
   */
  clear(): void {
    this.clipboardData = []
    this.lastPasteOffset = { x: 20, y: 20 }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}
