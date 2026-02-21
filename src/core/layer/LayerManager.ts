import type { Layer, CanvasElement, LayerOperationType } from '@/types/canvas.types'
import { generateId } from '@/utils/common'

/**
 * 图层管理器
 * 支持嵌套分组结构，最多200个图层
 */
export class LayerManager {
  private layers: Map<string, Layer> = new Map()
  private layerOrder: string[] = [] // 图层显示顺序
  private currentLayerId: string | null = null
  private maxLayers: number = 200
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private debounceDelay: number = 300 // 300ms防抖

  // 回调函数
  private onLayersChange?: (layers: Layer[]) => void
  private onCurrentLayerChange?: (layerId: string | null) => void
  private onElementLayerChange?: (elementId: string, layerId: string) => void

  constructor() {
    this.initializeDefaultLayer()
  }

  /**
   * 初始化默认图层
   */
  private initializeDefaultLayer(): void {
    const defaultLayer: Layer = {
      id: 'default',
      name: '图层 1',
      visible: true,
      locked: false,
      opacity: 1,
      color: '#3b82f6',
      blendMode: 'normal',
      elements: [],
      order: 0,
      children: [],
      isGroup: false,
      expanded: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.layers.set(defaultLayer.id, defaultLayer)
    this.layerOrder.push(defaultLayer.id)
    this.currentLayerId = defaultLayer.id
  }

  /**
   * 创建新图层
   */
  createLayer(name?: string, parentId?: string): string {
    if (this.layers.size >= this.maxLayers) {
      throw new Error(`最多只能创建 ${this.maxLayers} 个图层`)
    }

    const layerId = generateId()
    const layerName = name || `图层 ${this.layers.size + 1}`
    
    const newLayer: Layer = {
      id: layerId,
      name: layerName,
      visible: true,
      locked: false,
      opacity: 1,
      color: this.getRandomLayerColor(),
      blendMode: 'normal',
      elements: [],
      order: this.getNextOrder(parentId),
      parentId,
      children: [],
      isGroup: false,
      expanded: true,
      hasCustomColor: false, // 默认没有自定义颜色，背景透明
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.layers.set(layerId, newLayer)
    this.insertLayerInOrder(layerId, parentId)
    this.currentLayerId = layerId

    this.triggerLayersChange()
    this.triggerCurrentLayerChange()

    return layerId
  }

  /**
   * 创建分组图层
   */
  createGroup(name?: string, parentId?: string): string {
    if (this.layers.size >= this.maxLayers) {
      throw new Error(`最多只能创建 ${this.maxLayers} 个图层`)
    }

    const groupId = generateId()
    const groupName = name || `分组 ${this.layers.size + 1}`
    
    const newGroup: Layer = {
      id: groupId,
      name: groupName,
      visible: true,
      locked: false,
      opacity: 1,
      color: this.getRandomLayerColor(),
      blendMode: 'normal',
      elements: [],
      order: this.getNextOrder(parentId),
      parentId,
      children: [],
      isGroup: true,
      expanded: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.layers.set(groupId, newGroup)
    this.insertLayerInOrder(groupId, parentId)
    this.currentLayerId = groupId

    this.triggerLayersChange()
    this.triggerCurrentLayerChange()

    return groupId
  }

  /**
   * 删除图层
   */
  deleteLayer(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    // 删除所有子图层
    const childrenToDelete = [...layer.children]
    childrenToDelete.forEach(childId => this.deleteLayer(childId))

    // 删除图层中的所有元素
    layer.elements.forEach(elementId => {
      if (this.onElementLayerChange) {
        this.onElementLayerChange(elementId, '')
      }
    })

    // 从父图层中移除
    if (layer.parentId) {
      const parent = this.layers.get(layer.parentId)
      if (parent) {
        parent.children = parent.children.filter(id => id !== layerId)
      }
    }

    // 删除图层
    this.layers.delete(layerId)
    this.layerOrder = this.layerOrder.filter(id => id !== layerId)

    // 如果删除的是当前图层，切换到默认图层
    if (this.currentLayerId === layerId) {
      this.currentLayerId = this.layerOrder[0] || null
    }

    this.triggerLayersChange()
    this.triggerCurrentLayerChange()
  }

  /**
   * 重命名图层
   */
  renameLayer(layerId: string, newName: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.name = newName
    layer.updatedAt = Date.now()

    this.triggerLayersChange()
  }

  /**
   * 设置图层颜色
   */
  setLayerColor(layerId: string, color: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.color = color
    layer.updatedAt = Date.now()

    this.triggerLayersChange()
  }

  /**
   * 设置图层是否有自定义颜色
   */
  setLayerHasCustomColor(layerId: string, hasCustomColor: boolean): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.hasCustomColor = hasCustomColor
    layer.updatedAt = Date.now()

    this.triggerLayersChange()
  }

  /**
   * 复制图层
   */
  duplicateLayer(layerId: string): string {
    const sourceLayer = this.layers.get(layerId)
    if (!sourceLayer) {
      throw new Error(`图层不存在: ${layerId}`)
    }

    if (this.layers.size >= this.maxLayers) {
      throw new Error(`最多只能创建 ${this.maxLayers} 个图层`)
    }

    const duplicatedLayerId = generateId()
    const duplicatedLayerName = `${sourceLayer.name} 副本`
    
    const duplicatedLayer: Layer = {
      id: duplicatedLayerId,
      name: duplicatedLayerName,
      visible: sourceLayer.visible,
      locked: false, // 复制的图层默认不锁定
      opacity: sourceLayer.opacity,
      color: sourceLayer.color,
      blendMode: sourceLayer.blendMode,
      elements: [], // 元素列表将在CanvasEngine中填充
      order: this.getNextOrder(sourceLayer.parentId),
      parentId: sourceLayer.parentId,
      children: [...sourceLayer.children], // 复制子图层ID列表
      isGroup: sourceLayer.isGroup,
      expanded: sourceLayer.expanded,
      hasCustomColor: sourceLayer.hasCustomColor,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.layers.set(duplicatedLayerId, duplicatedLayer)
    this.insertLayerInOrder(duplicatedLayerId, sourceLayer.parentId)
    
    // 如果源图层是当前图层，将复制的图层设为当前图层
    if (this.currentLayerId === layerId) {
      this.currentLayerId = duplicatedLayerId
    }

    this.triggerLayersChange()

    return duplicatedLayerId
  }

  /**
   * 更新图层的元素列表
   */
  updateLayerElements(layerId: string, elementIds: string[]): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    layer.elements = [...elementIds]
    layer.updatedAt = Date.now()
    this.triggerLayersChange()
  }

  /**
   * 切换图层可见性
   */
  toggleLayerVisibility(layerId: string): void {
    // 暂时禁用防抖，直接执行
    const layer = this.layers.get(layerId)
    if (!layer) return
    
    layer.visible = !layer.visible
    layer.updatedAt = Date.now()

    // 递归切换子图层可见性
    this.toggleChildrenVisibility(layerId, layer.visible)

    this.triggerLayersChange()
  }

  /**
   * 切换图层锁定状态
   */
  toggleLayerLock(layerId: string): void {
    this.debounceOperation(`lock_${layerId}`, () => {
      const layer = this.layers.get(layerId)
      if (!layer) return

      layer.locked = !layer.locked
      layer.updatedAt = Date.now()

      // 递归切换子图层锁定状态
      this.toggleChildrenLock(layerId, layer.locked)

      this.triggerLayersChange()
    })
  }

  /**
   * 设置图层透明度
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    this.debounceOperation(`opacity_${layerId}`, () => {
      const layer = this.layers.get(layerId)
      if (!layer) return

      layer.opacity = Math.max(0, Math.min(1, opacity))
      layer.updatedAt = Date.now()

      this.triggerLayersChange()
    })
  }

  /**
   * 移动图层到指定位置
   */
  moveLayerToPosition(layerId: string, newOrder: number, parentId?: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    // 从原位置移除
    this.layerOrder = this.layerOrder.filter(id => id !== layerId)
    if (layer.parentId) {
      const oldParent = this.layers.get(layer.parentId)
      if (oldParent) {
        oldParent.children = oldParent.children.filter(id => id !== layerId)
        console.log('🔄 从原父图层移除', { oldParentId: layer.parentId, remainingChildren: oldParent.children.length })
      }
    }

    // 设置新的父图层
    layer.parentId = parentId
    layer.order = newOrder

    // 添加到新位置
    if (parentId) {
      const newParent = this.layers.get(parentId)
      if (newParent) {
        newParent.children.push(layerId)
        newParent.children.sort((a, b) => {
          const layerA = this.layers.get(a)
          const layerB = this.layers.get(b)
          return (layerA?.order || 0) - (layerB?.order || 0)
        })
        console.log('🔄 添加到新父图层', { newParentId: parentId, childrenCount: newParent.children.length })
      }
    } else {
      this.insertLayerInOrder(layerId, parentId)
      console.log('🔄 添加到主图层列表', { layerOrderLength: this.layerOrder.length })
    }

    this.triggerLayersChange()
  }

  /**
   * 将图层移到最顶层
   */
  moveLayerToTop(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    // 置顶：order值设为0，在列表最上方
    this.moveLayerToPosition(layerId, 0, layer.parentId)
  }

  /**
   * 将图层移到最底层
   */
  moveLayerToBottom(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    const maxOrder = this.getMaxOrder(layer.parentId)
    // 置底：order值设为最大值，在列表最下方
    this.moveLayerToPosition(layerId, maxOrder + 1, layer.parentId)
  }

  /**
   * 将图层上移一层
   */
  moveLayerUp(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    // 上移：order值减小，在列表中向上移动
    const newOrder = Math.max(0, layer.order - 1)

    this.moveLayerToPosition(layerId, newOrder, layer.parentId)
  }

  /**
   * 将图层下移一层
   */
  moveLayerDown(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    // 下移：order值增大，在列表中向下移动
    const newOrder = layer.order + 1
    this.moveLayerToPosition(layerId, newOrder, layer.parentId)
  }

  /**
   * 将元素移动到指定图层
   */
  moveElementToLayer(elementId: string, targetLayerId: string): void {
    // 从原图层移除
    this.layers.forEach(layer => {
      if (layer.elements.includes(elementId)) {
        layer.elements = layer.elements.filter(id => id !== elementId)
      }
    })

    // 添加到目标图层
    const targetLayer = this.layers.get(targetLayerId)
    if (targetLayer) {
      targetLayer.elements.push(elementId)
      targetLayer.updatedAt = Date.now()
    }

    this.triggerLayersChange()
    if (this.onElementLayerChange) {
      this.onElementLayerChange(elementId, targetLayerId)
    }
  }

  /**
   * 获取所有图层（按显示顺序）
   */
  getAllLayers(): Layer[] {
    return this.layerOrder.map(id => this.layers.get(id)!).filter(Boolean)
  }

  /**
   * 获取当前图层
   */
  getCurrentLayer(): Layer | null {
    if (!this.currentLayerId) return null
    return this.layers.get(this.currentLayerId) || null
  }

  /**
   * 设置当前图层
   */
  setCurrentLayer(layerId: string | null): void {
    this.currentLayerId = layerId
    this.triggerCurrentLayerChange()
  }

  /**
   * 获取图层
   */
  getLayer(layerId: string): Layer | null {
    return this.layers.get(layerId) || null
  }

  /**
   * 检查元素是否可操作（未被锁定且可见）
   */
  isElementOperable(element: CanvasElement): boolean {
    const layer = this.layers.get(element.layer.toString())
    if (!layer) return true

    return layer.visible && !layer.locked
  }

  /**
   * 获取图层的所有子图层（递归）
   */
  getAllChildren(layerId: string): string[] {
    const layer = this.layers.get(layerId)
    if (!layer) return []

    const children = [...layer.children]
    layer.children.forEach(childId => {
      children.push(...this.getAllChildren(childId))
    })

    return children
  }

  /**
   * 设置回调函数
   */
  setOnLayersChange(callback: (layers: Layer[]) => void): void {
    this.onLayersChange = callback
  }

  setOnCurrentLayerChange(callback: (layerId: string | null) => void): void {
    this.onCurrentLayerChange = callback
  }

  setOnElementLayerChange(callback: (elementId: string, layerId: string) => void): void {
    this.onElementLayerChange = callback
  }

  /**
   * 防抖操作
   */
  private debounceOperation(key: string, operation: () => void): void {
    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      operation()
      this.debounceTimers.delete(key)
    }, this.debounceDelay)

    this.debounceTimers.set(key, timer)
  }

  /**
   * 获取下一个图层顺序
   */
  private getNextOrder(parentId?: string): number {
    if (parentId) {
      const parent = this.layers.get(parentId)
      if (parent) {
        return parent.children.length
      }
    }
    return this.layerOrder.length
  }

  /**
   * 获取指定父图层下的最大顺序
   */
  private getMaxOrder(parentId?: string): number {
    if (parentId) {
      const parent = this.layers.get(parentId)
      if (parent) {
        return Math.max(...parent.children.map(id => {
          const child = this.layers.get(id)
          return child?.order || 0
        }), 0)
      }
    }
    return Math.max(...this.layerOrder.map(id => {
      const layer = this.layers.get(id)
      return layer?.order || 0
    }), 0)
  }

  /**
   * 将图层插入到正确位置
   */
  private insertLayerInOrder(layerId: string, parentId?: string): void {
    const layer = this.layers.get(layerId)
    if (!layer) return

    if (parentId) {
      // 插入到父图层的子图层中
      const parent = this.layers.get(parentId)
      if (parent) {
        parent.children.push(layerId)
        parent.children.sort((a, b) => {
          const layerA = this.layers.get(a)
          const layerB = this.layers.get(b)
          return (layerA?.order || 0) - (layerB?.order || 0)
        })
      }
    } else {
      // 插入到主图层列表中
      this.layerOrder.push(layerId)
      this.layerOrder.sort((a, b) => {
        const layerA = this.layers.get(a)
        const layerB = this.layers.get(b)
        return (layerA?.order || 0) - (layerB?.order || 0)
      })
    }
  }

  /**
   * 递归切换子图层可见性
   */
  private toggleChildrenVisibility(parentId: string, visible: boolean): void {
    const parent = this.layers.get(parentId)
    if (!parent) return

    parent.children.forEach(childId => {
      const child = this.layers.get(childId)
      if (child) {
        child.visible = visible
        child.updatedAt = Date.now()
        this.toggleChildrenVisibility(childId, visible)
      }
    })
  }

  /**
   * 递归切换子图层锁定状态
   */
  private toggleChildrenLock(parentId: string, locked: boolean): void {
    const parent = this.layers.get(parentId)
    if (!parent) return

    parent.children.forEach(childId => {
      const child = this.layers.get(childId)
      if (child) {
        child.locked = locked
        child.updatedAt = Date.now()
        this.toggleChildrenLock(childId, locked)
      }
    })
  }

  /**
   * 获取随机图层颜色
   */
  private getRandomLayerColor(): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
      '#ec4899', '#6366f1', '#14b8a6', '#eab308'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * 触发图层变化回调
   */
  private triggerLayersChange(): void {
    if (this.onLayersChange) {
      this.onLayersChange(this.getAllLayers())
    }
  }

  /**
   * 触发当前图层变化回调
   */
  private triggerCurrentLayerChange(): void {
    if (this.onCurrentLayerChange) {
      this.onCurrentLayerChange(this.currentLayerId)
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    this.layers.clear()
    this.layerOrder = []
  }
}
