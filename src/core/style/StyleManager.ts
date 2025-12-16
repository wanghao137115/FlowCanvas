import { ElementStyle, CanvasElement } from '@/types/canvas.types'

/**
 * 样式预设接口
 */
export interface StylePreset {
  id: string
  name: string
  style: ElementStyle
  category: 'shape' | 'text' | 'path' | 'common'
}

/**
 * 样式管理��?
 * 负责管理全局样式预设和样式继��?
 */
export class StyleManager {
  private presets: Map<string, StylePreset> = new Map()
  private currentStyle: ElementStyle = this.getDefaultStyle()
  private selectedElements: CanvasElement[] = []

  constructor() {
    this.initializeDefaultPresets()
  }

  /**
   * 获取默认样式
   */
  private getDefaultStyle(): ElementStyle {
    return {
      fill: '#ffffff', // 默认形状填充为白��?
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 1,
      fontSize: 16,
      fontFamily: 'Arial'
    }
  }

  /**
   * 初始化默认预��?
   */
  private initializeDefaultPresets(): void {
    // 形状预设
    this.addPreset({
      id: 'shape-default',
      name: '默认形状',
      category: 'shape',
      style: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        opacity: 1
      }
    })

    this.addPreset({
      id: 'shape-blue',
      name: '蓝色形状',
      category: 'shape',
      style: {
        fill: '#e3f2fd',
        stroke: '#1976d2',
        strokeWidth: 2,
        opacity: 1
      }
    })

    this.addPreset({
      id: 'shape-green',
      name: '绿色形状',
      category: 'shape',
      style: {
        fill: '#e8f5e8',
        stroke: '#388e3c',
        strokeWidth: 2,
        opacity: 1
      }
    })

    this.addPreset({
      id: 'shape-red',
      name: '红色形状',
      category: 'shape',
      style: {
        fill: '#ffebee',
        stroke: '#d32f2f',
        strokeWidth: 2,
        opacity: 1
      }
    })

    // 文本预设
    this.addPreset({
      id: 'text-default',
      name: '默认文本',
      category: 'text',
      style: {
        fill: '#000000',
        fontSize: 16,
        fontFamily: 'Arial',
        opacity: 1
      }
    })

    this.addPreset({
      id: 'text-heading',
      name: '标题文本',
      category: 'text',
      style: {
        fill: '#000000',
        fontSize: 24,
        fontFamily: 'Arial',
        opacity: 1
      }
    })

    this.addPreset({
      id: 'text-caption',
      name: '说明文本',
      category: 'text',
      style: {
        fill: '#666666',
        fontSize: 12,
        fontFamily: 'Arial',
        opacity: 1
      }
    })

    // 路径预设
    this.addPreset({
      id: 'path-default',
      name: '默认画笔',
      category: 'path',
      style: {
        stroke: '#000000',
        strokeWidth: 2,
        opacity: 1
      }
    })

    this.addPreset({
      id: 'path-thick',
      name: '粗画笔',
      category: 'path',
      style: {
        stroke: '#000000',
        strokeWidth: 5,
        opacity: 1
      }
    })

    this.addPreset({
      id: 'path-thin',
      name: '细画笔',
      category: 'path',
      style: {
        stroke: '#000000',
        strokeWidth: 1,
        opacity: 1
      }
    })
  }

  /**
   * 添加样式预设
   */
  addPreset(preset: StylePreset): void {
    this.presets.set(preset.id, preset)
  }

  /**
   * 获取样式预设
   */
  getPreset(id: string): StylePreset | undefined {
    return this.presets.get(id)
  }

  /**
   * 获取所有预��?
   */
  getAllPresets(): StylePreset[] {
    return Array.from(this.presets.values())
  }

  /**
   * 根据分类获取预设
   */
  getPresetsByCategory(category: 'shape' | 'text' | 'path' | 'common'): StylePreset[] {
    return this.getAllPresets().filter(preset => preset.category === category)
  }

  /**
   * 设置当前样式
   */
  setCurrentStyle(style: Partial<ElementStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style }
  }

  /**
   * 获取当前样式
   */
  getCurrentStyle(): ElementStyle {
    return { ...this.currentStyle }
  }

  /**
   * 更新当前样式
   */
  updateCurrentStyle(styleUpdates: Partial<ElementStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...styleUpdates }

  }

  /**
   * 设置选中的元��?
   */
  setSelectedElements(elements: CanvasElement[]): void {
    this.selectedElements = elements
  }

  /**
   * 获取选中元素的样式（用于继承��?
   */
  getSelectedElementsStyle(): ElementStyle | null {
    if (this.selectedElements.length === 0) {
      return null
    }

    // 如果只有一个选中元素，返回其样式
    if (this.selectedElements.length === 1) {
      return { ...this.selectedElements[0].style }
    }

    // 如果有多个选中元素，返回第一个元素的样式
    return { ...this.selectedElements[0].style }
  }

  /**
   * 应用样式到选中元素
   */
  applyStyleToSelected(style: Partial<ElementStyle>): CanvasElement[] {
    return this.selectedElements.map(element => ({
      ...element,
      style: { ...element.style, ...style },
      updatedAt: Date.now()
    }))
  }

  /**
   * 从选中元素继承样式
   */
  inheritStyleFromSelected(): void {
    const selectedStyle = this.getSelectedElementsStyle()
    if (selectedStyle) {
      this.setCurrentStyle(selectedStyle)
    }
  }

  /**
   * 重置为默认样��?
   */
  resetToDefault(): void {
    this.currentStyle = this.getDefaultStyle()
  }

  /**
   * 应用预设到当前样��?
   */
  applyPreset(presetId: string): void {
    const preset = this.getPreset(presetId)
    if (preset) {
      this.setCurrentStyle(preset.style)
    }
  }

  /**
   * 应用预设到选中元素
   */
  applyPresetToSelected(presetId: string): CanvasElement[] {
    const preset = this.getPreset(presetId)
    if (preset) {
      return this.applyStyleToSelected(preset.style)
    }
    return this.selectedElements
  }

  /**
   * 创建自定义预��?
   */
  createCustomPreset(name: string, style: ElementStyle, category: 'shape' | 'text' | 'path' | 'common'): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const preset: StylePreset = {
      id,
      name,
      style,
      category
    }
    
    this.addPreset(preset)
    return id
  }

  /**
   * 删除预设
   */
  removePreset(presetId: string): boolean {
    return this.presets.delete(presetId)
  }

  /**
   * 导出预设
   */
  exportPresets(): string {
    return JSON.stringify(this.getAllPresets(), null, 2)
  }

  /**
   * 导入预设
   */
  importPresets(presetsJson: string): boolean {
    try {
      const presets: StylePreset[] = JSON.parse(presetsJson)
      presets.forEach(preset => {
        this.addPreset(preset)
      })
      return true
    } catch (error) {
      console.error('导入预设失败:', error)
      return false
    }
  }
}
