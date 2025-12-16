import type { Vector2, CanvasElement } from '@/types/canvas.types'
import { Vector2Utils } from '@/utils/math/Vector2'

/**
 * 参考线类型
 */
export enum GuideType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  DISTANCE = 'distance'
}

/**
 * 参考线接口
 */
export interface AlignmentGuide {
  type: GuideType
  position: number
  elements: CanvasElement[]
  distance?: number
  label?: string
}

/**
 * 参考线设置
 */
export interface GuideSettings {
  enabled: boolean
  snapThreshold: number
  showDistance: boolean
  showLabels: boolean
  guideColor: string
  guideOpacity: number
  snapStrength: number
  alignToGrid: boolean
  gridSize: number
}

/**
 * 智能参考线管理器
 * 负责检测和计算对齐参考线
 */
export class SmartGuideManager {
  private settings: GuideSettings
  private snapThreshold: number = 10 // 像素

  constructor(settings?: Partial<GuideSettings>) {
    this.settings = {
      enabled: true,
      snapThreshold: 10,
      showDistance: true,
      showLabels: true,
      guideColor: '#007AFF',
      guideOpacity: 0.8,
      snapStrength: 1,
      alignToGrid: false,
      gridSize: 20,
      ...settings
    }
    this.snapThreshold = this.settings.snapThreshold
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<GuideSettings>): void {
    this.settings = { ...this.settings, ...settings }
    this.snapThreshold = this.settings.snapThreshold
  }

  /**
   * 检测所有类型的参考线
   */
  detectGuides(
    draggedElement: CanvasElement,
    allElements: CanvasElement[],
    canvasSize: { width: number; height: number },
    tempPosition?: Vector2
  ): AlignmentGuide[] {
    if (!this.settings.enabled) {
      return []
    }

    const guides: AlignmentGuide[] = []
    const draggedBounds = tempPosition 
      ? this.getElementBoundsAtPosition(draggedElement, tempPosition)
      : this.getElementBounds(draggedElement)

    // 检测元素对齐参考线
    const elementGuides = this.detectElementAlignment(draggedElement, allElements, draggedBounds)
    guides.push(...elementGuides)

    // 检测画布边缘对齐参考线
    const edgeGuides = this.detectEdgeAlignment(draggedBounds, canvasSize)
    guides.push(...edgeGuides)

    // 检测画布中心对齐参考线
    const centerGuides = this.detectCenterAlignment(draggedBounds, canvasSize)
    guides.push(...centerGuides)

    return guides
  }

  /**
   * 检测元素对齐参考线
   */
  private detectElementAlignment(
    draggedElement: CanvasElement,
    allElements: CanvasElement[],
    draggedBounds?: { top: number; left: number; bottom: number; right: number; centerX: number; centerY: number }
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = []
    const bounds = draggedBounds || this.getElementBounds(draggedElement)

    for (const element of allElements) {
      if (element.id === draggedElement.id) continue

      const elementBounds = this.getElementBounds(element)

      // 检测水平对齐（顶部、中心、底部）
      const horizontalAlignments = this.detectHorizontalAlignment(bounds, elementBounds, element)
      guides.push(...horizontalAlignments)

      // 检测垂直对齐（左侧、中心、右侧）
      const verticalAlignments = this.detectVerticalAlignment(bounds, elementBounds, element)
      guides.push(...verticalAlignments)
    }

    return guides
  }

  /**
   * 检测水平对齐
   */
  private detectHorizontalAlignment(
    draggedBounds: { top: number; centerY: number; bottom: number },
    elementBounds: { top: number; centerY: number; bottom: number },
    element: CanvasElement
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = []

    // 顶部对齐
    if (Math.abs(draggedBounds.top - elementBounds.top) < this.snapThreshold) {
      guides.push({
        type: GuideType.HORIZONTAL,
        position: elementBounds.top,
        elements: [element],
        label: '顶部对齐'
      })
    }

    // 中心对齐
    if (Math.abs(draggedBounds.centerY - elementBounds.centerY) < this.snapThreshold) {
      guides.push({
        type: GuideType.HORIZONTAL,
        position: elementBounds.centerY,
        elements: [element],
        label: '中心对齐'
      })
    }

    // 底部对齐
    if (Math.abs(draggedBounds.bottom - elementBounds.bottom) < this.snapThreshold) {
      guides.push({
        type: GuideType.HORIZONTAL,
        position: elementBounds.bottom,
        elements: [element],
        label: '底部对齐'
      })
    }

    return guides
  }

  /**
   * 检测垂直对齐
   */
  private detectVerticalAlignment(
    draggedBounds: { left: number; centerX: number; right: number },
    elementBounds: { left: number; centerX: number; right: number },
    element: CanvasElement
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = []

    // 左侧对齐
    if (Math.abs(draggedBounds.left - elementBounds.left) < this.snapThreshold) {
      guides.push({
        type: GuideType.VERTICAL,
        position: elementBounds.left,
        elements: [element],
        label: '左侧对齐'
      })
    }

    // 中心对齐
    if (Math.abs(draggedBounds.centerX - elementBounds.centerX) < this.snapThreshold) {
      guides.push({
        type: GuideType.VERTICAL,
        position: elementBounds.centerX,
        elements: [element],
        label: '中心对齐'
      })
    }

    // 右侧对齐
    if (Math.abs(draggedBounds.right - elementBounds.right) < this.snapThreshold) {
      guides.push({
        type: GuideType.VERTICAL,
        position: elementBounds.right,
        elements: [element],
        label: '右侧对齐'
      })
    }

    return guides
  }

  /**
   * 检测画布边缘对齐
   */
  private detectEdgeAlignment(
    draggedBounds: { top: number; left: number; bottom: number; right: number },
    canvasSize: { width: number; height: number }
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = []

    // 顶部边缘对齐
    if (Math.abs(draggedBounds.top) < this.snapThreshold) {
      guides.push({
        type: GuideType.HORIZONTAL,
        position: 0,
        elements: [],
        label: '画布顶部'
      })
    }

    // 底部边缘对齐
    if (Math.abs(draggedBounds.bottom - canvasSize.height) < this.snapThreshold) {
      guides.push({
        type: GuideType.HORIZONTAL,
        position: canvasSize.height,
        elements: [],
        label: '画布底部'
      })
    }

    // 左侧边缘对齐
    if (Math.abs(draggedBounds.left) < this.snapThreshold) {
      guides.push({
        type: GuideType.VERTICAL,
        position: 0,
        elements: [],
        label: '画布左侧'
      })
    }

    // 右侧边缘对齐
    if (Math.abs(draggedBounds.right - canvasSize.width) < this.snapThreshold) {
      guides.push({
        type: GuideType.VERTICAL,
        position: canvasSize.width,
        elements: [],
        label: '画布右侧'
      })
    }

    return guides
  }

  /**
   * 检测画布中心对齐
   */
  private detectCenterAlignment(
    draggedBounds: { centerX: number; centerY: number },
    canvasSize: { width: number; height: number }
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = []
    const canvasCenterX = canvasSize.width / 2
    const canvasCenterY = canvasSize.height / 2

    // 水平中心对齐
    if (Math.abs(draggedBounds.centerX - canvasCenterX) < this.snapThreshold) {
      guides.push({
        type: GuideType.VERTICAL,
        position: canvasCenterX,
        elements: [],
        label: '画布中心'
      })
    }

    // 垂直中心对齐
    if (Math.abs(draggedBounds.centerY - canvasCenterY) < this.snapThreshold) {
      guides.push({
        type: GuideType.HORIZONTAL,
        position: canvasCenterY,
        elements: [],
        label: '画布中心'
      })
    }

    return guides
  }

  /**
   * 计算吸附偏移量
   */
  calculateSnapOffset(
    draggedElement: CanvasElement,
    guides: AlignmentGuide[]
  ): Vector2 {
    if (!this.settings.enabled || guides.length === 0) {
      return Vector2Utils.create(0, 0)
    }

    const draggedBounds = this.getElementBounds(draggedElement)
    let snapOffsetX = 0
    let snapOffsetY = 0

    for (const guide of guides) {
      if (guide.type === GuideType.HORIZONTAL) {
        // 计算垂直方向的吸附
        const distances = [
          Math.abs(draggedBounds.top - guide.position),
          Math.abs(draggedBounds.centerY - guide.position),
          Math.abs(draggedBounds.bottom - guide.position)
        ]
        
        const minDistance = Math.min(...distances)
        if (minDistance < this.snapThreshold) {
          const minIndex = distances.indexOf(minDistance)
          let targetY = 0
          
          switch (minIndex) {
            case 0: // 顶部对齐
              targetY = guide.position - draggedBounds.top
              break
            case 1: // 中心对齐
              targetY = guide.position - draggedBounds.centerY
              break
            case 2: // 底部对齐
              targetY = guide.position - draggedBounds.bottom
              break
          }
          
          snapOffsetY = targetY * this.settings.snapStrength
        }
      } else if (guide.type === GuideType.VERTICAL) {
        // 计算水平方向的吸附
        const distances = [
          Math.abs(draggedBounds.left - guide.position),
          Math.abs(draggedBounds.centerX - guide.position),
          Math.abs(draggedBounds.right - guide.position)
        ]
        
        const minDistance = Math.min(...distances)
        if (minDistance < this.snapThreshold) {
          const minIndex = distances.indexOf(minDistance)
          let targetX = 0
          
          switch (minIndex) {
            case 0: // 左侧对齐
              targetX = guide.position - draggedBounds.left
              break
            case 1: // 中心对齐
              targetX = guide.position - draggedBounds.centerX
              break
            case 2: // 右侧对齐
              targetX = guide.position - draggedBounds.right
              break
          }
          
          snapOffsetX = targetX * this.settings.snapStrength
        }
      }
    }

    return Vector2Utils.create(snapOffsetX, snapOffsetY)
  }

  /**
   * 获取元素边界信息
   */
  private getElementBounds(element: CanvasElement): {
    top: number
    left: number
    bottom: number
    right: number
    centerX: number
    centerY: number
  } {
    return {
      top: element.position.y,
      left: element.position.x,
      bottom: element.position.y + element.size.y,
      right: element.position.x + element.size.x,
      centerX: element.position.x + element.size.x / 2,
      centerY: element.position.y + element.size.y / 2
    }
  }

  /**
   * 获取元素在指定位置的边界信息
   */
  private getElementBoundsAtPosition(element: CanvasElement, position: Vector2): {
    top: number
    left: number
    bottom: number
    right: number
    centerX: number
    centerY: number
  } {
    return {
      top: position.y,
      left: position.x,
      bottom: position.y + element.size.y,
      right: position.x + element.size.x,
      centerX: position.x + element.size.x / 2,
      centerY: position.y + element.size.y / 2
    }
  }

  /**
   * 获取当前设置
   */
  getSettings(): GuideSettings {
    return { ...this.settings }
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.settings.enabled
  }

  /**
   * 启用/禁用参考线
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled
  }
}
