import { ImageElement } from '../elements/ImageElement'
import { ImageRenderer } from '../renderers/ImageRenderer'

/**
 * 图片管理器
 */
export class ImageManager {
  private loadedImages: Map<string, HTMLImageElement> = new Map()
  private loadingImages: Set<string> = new Set()
  private renderer: ImageRenderer | null = null
  private viewport: { scale: number; offset: { x: number; y: number } } = { scale: 1, offset: { x: 0, y: 0 } }

  constructor() {
    // 监听视口变化
    this.setupViewportListener()
  }

  /**
   * 设置渲染器
   */
  setRenderer(renderer: ImageRenderer): void {
    this.renderer = renderer
  }

  /**
   * 设置视口
   */
  setViewport(viewport: { scale: number; offset: { x: number; y: number } }): void {
    this.viewport = viewport
  }

  /**
   * 设置视口监听器
   */
  private setupViewportListener(): void {
    // 这里可以监听视口变化事件
    // 当视口变化时，检查哪些图片需要加载或卸载
  }

  /**
   * 预加载图片
   */
  async preloadImage(element: ImageElement): Promise<void> {
    const imageId = element.id
    
    // 如果已经加载，直接返回
    if (this.loadedImages.has(imageId)) {
      return
    }

    // 如果正在加载，等待加载完成
    if (this.loadingImages.has(imageId)) {
      return this.waitForImageLoad(imageId)
    }

    // 开始加载
    this.loadingImages.add(imageId)
    
    try {
      const img = await element.loadImage()
      this.loadedImages.set(imageId, img)
    } catch (error) {
      console.warn(`图片加载失败: ${imageId}`, error)
    } finally {
      this.loadingImages.delete(imageId)
    }
  }

  /**
   * 等待图片加载完成
   */
  private async waitForImageLoad(imageId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (this.loadedImages.has(imageId) || !this.loadingImages.has(imageId)) {
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  /**
   * 批量预加载图片
   */
  async preloadImages(elements: ImageElement[]): Promise<void> {
    const loadPromises = elements.map(element => this.preloadImage(element))
    await Promise.allSettled(loadPromises)
  }

  /**
   * 懒加载图片（只加载视口内的图片）
   */
  async lazyLoadImages(elements: ImageElement[]): Promise<void> {
    const visibleElements = elements.filter(element => {
      if (!this.renderer) return false
      return this.renderer.isImageInViewport(element)
    })

    await this.preloadImages(visibleElements)
  }

  /**
   * 获取已加载的图片
   */
  getLoadedImage(imageId: string): HTMLImageElement | null {
    return this.loadedImages.get(imageId) || null
  }

  /**
   * 检查图片是否已加载
   */
  isImageLoaded(imageId: string): boolean {
    return this.loadedImages.has(imageId)
  }

  /**
   * 检查图片是否正在加载
   */
  isImageLoading(imageId: string): boolean {
    return this.loadingImages.has(imageId)
  }

  /**
   * 卸载图片
   */
  unloadImage(imageId: string): void {
    this.loadedImages.delete(imageId)
    this.loadingImages.delete(imageId)
  }

  /**
   * 批量卸载图片
   */
  unloadImages(imageIds: string[]): void {
    imageIds.forEach(id => this.unloadImage(id))
  }

  /**
   * 清理未使用的图片
   */
  cleanupUnusedImages(activeImageIds: string[]): void {
    const activeSet = new Set(activeImageIds)
    
    for (const imageId of this.loadedImages.keys()) {
      if (!activeSet.has(imageId)) {
        this.unloadImage(imageId)
      }
    }
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): { loadedCount: number; loadingCount: number } {
    return {
      loadedCount: this.loadedImages.size,
      loadingCount: this.loadingImages.size
    }
  }

  /**
   * 压缩图片
   */
  async compressImage(
    img: HTMLImageElement, 
    maxWidth: number = 2000, 
    maxHeight: number = 2000,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve(img.src)
        return
      }

      // 计算新尺寸
      const { width, height } = img
      const scale = Math.min(maxWidth / width, maxHeight / height, 1)
      const newWidth = Math.round(width * scale)
      const newHeight = Math.round(height * scale)

      canvas.width = newWidth
      canvas.height = newHeight

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      // 转换为base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    })
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(
    img: HTMLImageElement, 
    size: number = 150, 
    quality: number = 0.7
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve('')
        return
      }

      // 计算缩略图尺寸
      const { width, height } = img
      const scale = Math.min(size / width, size / height)
      const thumbWidth = Math.round(width * scale)
      const thumbHeight = Math.round(height * scale)

      canvas.width = thumbWidth
      canvas.height = thumbHeight

      // 绘制缩略图
      ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)

      // 转换为base64
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(thumbnailDataUrl)
    })
  }

  /**
   * 获取图片信息
   */
  getImageInfo(img: HTMLImageElement): {
    width: number
    height: number
    size: number
    format: string
  } {
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      size: this.estimateImageSize(img),
      format: this.getImageFormat(img)
    }
  }

  /**
   * 估算图片大小
   */
  private estimateImageSize(img: HTMLImageElement): number {
    // 这是一个粗略的估算，实际大小可能不同
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return 0

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    
    return canvas.toDataURL().length
  }

  /**
   * 获取图片格式
   */
  private getImageFormat(img: HTMLImageElement): string {
    // 从src中提取格式信息
    const src = img.src
    if (src.startsWith('data:')) {
      const match = src.match(/data:image\/([^;]+)/)
      return match ? match[1] : 'unknown'
    }
    return 'unknown'
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.loadedImages.clear()
    this.loadingImages.clear()
    this.renderer = null
  }
}
