import { ThumbnailGenerator } from './ThumbnailGenerator'
import { CanvasElement } from '../../types/canvas.types'
import { Layer } from '../../types/canvas.types'

/**
 * 缩略图管理器
 * 负责管理图层缩略图的生成、缓存和更新
 */
export class ThumbnailManager {
  private static instance: ThumbnailManager
  private generator: ThumbnailGenerator
  private updateQueue = new Set<string>() // 待更新的图层ID队列
  private isUpdating = false
  private updateTimeout: number | null = null

  private constructor() {
    this.generator = ThumbnailGenerator.getInstance()
  }

  static getInstance(): ThumbnailManager {
    if (!ThumbnailManager.instance) {
      ThumbnailManager.instance = new ThumbnailManager()
    }
    return ThumbnailManager.instance
  }

  /**
   * 获取图层缩略图
   */
  async getThumbnail(layer: Layer, elements: CanvasElement[]): Promise<string> {
    return await this.generator.generateThumbnail(layer, elements)
  }

  /**
   * 标记图层需要更新缩略图
   */
  markForUpdate(layerId: string): void {
    this.updateQueue.add(layerId)
    this.scheduleUpdate()
  }

  /**
   * 标记多个图层需要更新
   */
  markMultipleForUpdate(layerIds: string[]): void {
    layerIds.forEach(id => this.updateQueue.add(id))
    this.scheduleUpdate()
  }

  /**
   * 立即更新指定图层的缩略图
   */
  async updateThumbnail(layer: Layer, elements: CanvasElement[]): Promise<string> {
    // 清除该图层的缓存
    this.generator.clearLayerCache(layer.id)
    
    // 生成新的缩略图
    return await this.generator.generateThumbnail(layer, elements)
  }

  /**
   * 批量更新缩略图
   */
  async batchUpdateThumbnails(layers: Layer[], elements: CanvasElement[]): Promise<Map<string, string>> {
    const thumbnails = new Map<string, string>()
    
    for (const layer of layers) {
      const layerElements = elements.filter(el => el.layer === layer.id)
      const thumbnail = await this.generator.generateThumbnail(layer, layerElements)
      thumbnails.set(layer.id, thumbnail)
    }

    return thumbnails
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.generator.clearCache()
  }

  /**
   * 清除指定图层的缓存
   */
  clearLayerCache(layerId: string): void {
    this.generator.clearLayerCache(layerId)
  }

  /**
   * 安排延迟更新
   */
  private scheduleUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }

    this.updateTimeout = window.setTimeout(() => {
      this.processUpdateQueue()
    }, 300) // 300ms延迟更新
  }

  /**
   * 处理更新队列
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.isUpdating || this.updateQueue.size === 0) {
      return
    }

    this.isUpdating = true
    const layersToUpdate = Array.from(this.updateQueue)
    this.updateQueue.clear()

    try {
      // 触发UI更新事件，通知LayerPanel清除缓存
      const layerPanel = document.querySelector('.layer-panel')
      if (layerPanel) {
        const event = new CustomEvent('forceUpdateThumbnails', {
          detail: { layerIds: layersToUpdate }
        })
        layerPanel.dispatchEvent(event)
      }
    } catch (error) {
      console.error('缩略图更新失败:', error)
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * 获取更新状态
   */
  getUpdateStatus(): { isUpdating: boolean; queueSize: number } {
    return {
      isUpdating: this.isUpdating,
      queueSize: this.updateQueue.size
    }
  }
}
