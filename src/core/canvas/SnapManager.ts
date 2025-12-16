import type { Vector2, CanvasElement } from '@/types/canvas.types'
import { Vector2Utils } from '@/utils/math/Vector2'
import { AlignmentGuide, GuideType, GuideSettings } from './SmartGuideManager'

/**
 * 吸附管理器
 * 负责处理元素的智能吸附功能
 */
export class SnapManager {
  private settings: GuideSettings
  private snapThreshold: number = 10
  private snapStrength: number = 1

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
    this.snapStrength = this.settings.snapStrength
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<GuideSettings>): void {
    this.settings = { ...this.settings, ...settings }
    this.snapThreshold = this.settings.snapThreshold
    this.snapStrength = this.settings.snapStrength
  }

  /**
   * 计算吸附偏移量
   */
  calculateSnapOffset(
    draggedElement: CanvasElement,
    guides: AlignmentGuide[],
    currentPosition: Vector2
  ): Vector2 {
    if (!this.settings.enabled || guides.length === 0) {
      return Vector2Utils.create(0, 0)
    }

    const draggedBounds = this.getElementBounds(draggedElement, currentPosition)
    let snapOffsetX = 0
    let snapOffsetY = 0

    // 处理水平参考线（垂直方向的吸附）
    const horizontalGuides = guides.filter(g => g.type === GuideType.HORIZONTAL)
    if (horizontalGuides.length > 0) {
      snapOffsetY = this.calculateVerticalSnap(draggedBounds, horizontalGuides)
    }

    // 处理垂直参考线（水平方向的吸附）
    const verticalGuides = guides.filter(g => g.type === GuideType.VERTICAL)
    if (verticalGuides.length > 0) {
      snapOffsetX = this.calculateHorizontalSnap(draggedBounds, verticalGuides)
    }

    return Vector2Utils.create(snapOffsetX, snapOffsetY)
  }

  /**
   * 计算垂直方向的吸附（水平参考线）
   */
  private calculateVerticalSnap(
    draggedBounds: { top: number; centerY: number; bottom: number },
    guides: AlignmentGuide[]
  ): number {
    let bestSnapY = 0
    let minDistance = Infinity

    for (const guide of guides) {
      // 计算三种对齐方式的距离
      const distances = [
        Math.abs(draggedBounds.top - guide.position),
        Math.abs(draggedBounds.centerY - guide.position),
        Math.abs(draggedBounds.bottom - guide.position)
      ]

      const minDist = Math.min(...distances)
      if (minDist < minDistance && minDist < this.snapThreshold) {
        minDistance = minDist
        const minIndex = distances.indexOf(minDist)
        
        switch (minIndex) {
          case 0: // 顶部对齐
            bestSnapY = guide.position - draggedBounds.top
            break
          case 1: // 中心对齐
            bestSnapY = guide.position - draggedBounds.centerY
            break
          case 2: // 底部对齐
            bestSnapY = guide.position - draggedBounds.bottom
            break
        }
      }
    }

    return bestSnapY * this.snapStrength
  }

  /**
   * 计算水平方向的吸附（垂直参考线）
   */
  private calculateHorizontalSnap(
    draggedBounds: { left: number; centerX: number; right: number },
    guides: AlignmentGuide[]
  ): number {
    let bestSnapX = 0
    let minDistance = Infinity

    for (const guide of guides) {
      // 计算三种对齐方式的距离
      const distances = [
        Math.abs(draggedBounds.left - guide.position),
        Math.abs(draggedBounds.centerX - guide.position),
        Math.abs(draggedBounds.right - guide.position)
      ]

      const minDist = Math.min(...distances)
      if (minDist < minDistance && minDist < this.snapThreshold) {
        minDistance = minDist
        const minIndex = distances.indexOf(minDist)
        
        switch (minIndex) {
          case 0: // 左侧对齐
            bestSnapX = guide.position - draggedBounds.left
            break
          case 1: // 中心对齐
            bestSnapX = guide.position - draggedBounds.centerX
            break
          case 2: // 右侧对齐
            bestSnapX = guide.position - draggedBounds.right
            break
        }
      }
    }

    return bestSnapX * this.snapStrength
  }

  /**
   * 应用网格吸附
   */
  applyGridSnap(position: Vector2): Vector2 {
    if (!this.settings.alignToGrid) {
      return position
    }

    const gridSize = this.settings.gridSize
    const snappedX = Math.round(position.x / gridSize) * gridSize
    const snappedY = Math.round(position.y / gridSize) * gridSize

    return Vector2Utils.create(snappedX, snappedY)
  }

  /**
   * 检查是否应该吸附
   */
  shouldSnap(
    draggedElement: CanvasElement,
    guides: AlignmentGuide[],
    currentPosition: Vector2
  ): boolean {
    if (!this.settings.enabled || guides.length === 0) {
      return false
    }

    const draggedBounds = this.getElementBounds(draggedElement, currentPosition)

    // 检查是否有任何参考线在吸附范围内
    for (const guide of guides) {
      if (guide.type === GuideType.HORIZONTAL) {
        const distances = [
          Math.abs(draggedBounds.top - guide.position),
          Math.abs(draggedBounds.centerY - guide.position),
          Math.abs(draggedBounds.bottom - guide.position)
        ]
        if (Math.min(...distances) < this.snapThreshold) {
          return true
        }
      } else if (guide.type === GuideType.VERTICAL) {
        const distances = [
          Math.abs(draggedBounds.left - guide.position),
          Math.abs(draggedBounds.centerX - guide.position),
          Math.abs(draggedBounds.right - guide.position)
        ]
        if (Math.min(...distances) < this.snapThreshold) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 获取元素边界信息（基于当前位置）
   */
  private getElementBounds(element: CanvasElement, position: Vector2): {
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
   * 获取吸附提示信息
   */
  getSnapHint(guides: AlignmentGuide[]): string[] {
    const hints: string[] = []
    
    for (const guide of guides) {
      if (guide.label) {
        hints.push(guide.label)
      }
    }

    return hints
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
   * 启用/禁用吸附
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled
  }

  /**
   * 设置吸附强度
   */
  setSnapStrength(strength: number): void {
    this.settings.snapStrength = Math.max(0, Math.min(1, strength))
    this.snapStrength = this.settings.snapStrength
  }

  /**
   * 设置吸附阈值
   */
  setSnapThreshold(threshold: number): void {
    this.settings.snapThreshold = Math.max(1, threshold)
    this.snapThreshold = this.settings.snapThreshold
  }
}
