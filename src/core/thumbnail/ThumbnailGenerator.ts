import { CanvasElement, ElementType } from '../../types/canvas.types'
import { Layer } from '../../types/canvas.types'
import { ShapeType } from '../tools/ShapeTool'
import { ImageElementData } from '../elements/ImageElement'

/**
 * 缩略图生成器
 * 负责生成图层的缩略图预览
 */
export class ThumbnailGenerator {
  private static instance: ThumbnailGenerator
  private thumbnailCache = new Map<string, string>() // 缓存缩略图数据URL
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private readonly THUMBNAIL_SIZE = 32

  private constructor() {
    // 创建离屏canvas用于生成缩略图
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.THUMBNAIL_SIZE
    this.canvas.height = this.THUMBNAIL_SIZE
    this.ctx = this.canvas.getContext('2d')!
  }

  static getInstance(): ThumbnailGenerator {
    if (!ThumbnailGenerator.instance) {
      ThumbnailGenerator.instance = new ThumbnailGenerator()
    }
    return ThumbnailGenerator.instance
  }

  /**
   * 生成图层缩略图
   */
  async generateThumbnail(layer: Layer, elements: CanvasElement[]): Promise<string> {
    const cacheKey = this.getCacheKey(layer, elements)
    
    
    // 检查缓存
    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)!
    }

    // 清空画布
    this.ctx.clearRect(0, 0, this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE)

    // 获取图层中的元素
    const layerElements = elements.filter(el => el.layer === layer.id)
    

    if (layerElements.length === 0) {
      // 空图层 - 显示默认图标
      this.drawEmptyLayerIcon(layer)
    } else if (layer.isGroup) {
      // 分组图层 - 显示子图层合并预览
      this.drawGroupThumbnail(layer, layerElements)
    } else {
      // 普通图层 - 显示所有元素预览
      await this.drawLayerThumbnail(layer, layerElements)
    }

    // 如果是隐藏图层，添加半透明效果
    if (!layer.visible) {
      this.ctx.globalAlpha = 0.5
      this.ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'
      this.ctx.fillRect(0, 0, this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE)
      this.ctx.globalAlpha = 1
    }

    // 生成数据URL并缓存
    const dataURL = this.canvas.toDataURL('image/png')
    this.thumbnailCache.set(cacheKey, dataURL)
    
    
    return dataURL
  }

  /**
   * 绘制空图层图标
   */
  private drawEmptyLayerIcon(layer: Layer): void {
    this.ctx.fillStyle = layer.color || '#e5e7eb'
    this.ctx.fillRect(2, 2, this.THUMBNAIL_SIZE - 4, this.THUMBNAIL_SIZE - 4)
    
    // 绘制默认图标
    this.ctx.strokeStyle = '#9ca3af'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(8, 16)
    this.ctx.lineTo(24, 16)
    this.ctx.moveTo(16, 8)
    this.ctx.lineTo(16, 24)
    this.ctx.stroke()
  }

  /**
   * 绘制分组图层缩略图
   */
  private drawGroupThumbnail(layer: Layer, elements: CanvasElement[]): void {
    // 绘制背景
    this.ctx.fillStyle = layer.color || '#f3f4f6'
    this.ctx.fillRect(2, 2, this.THUMBNAIL_SIZE - 4, this.THUMBNAIL_SIZE - 4)
    
    // 绘制文件夹图标
    this.ctx.fillStyle = '#6b7280'
    this.ctx.fillRect(6, 8, 20, 16)
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(8, 6, 16, 2)
    
    // 如果有子元素，显示数量
    if (elements.length > 0) {
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = 'bold 10px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(elements.length.toString(), 16, 20)
    }
  }

  /**
   * 绘制普通图层缩略图
   */
  private async drawLayerThumbnail(layer: Layer, elements: CanvasElement[]): Promise<void> {
    // 计算元素的边界框
    const bounds = this.calculateBounds(elements)
    if (!bounds) {
      this.drawEmptyLayerIcon(layer)
      return
    }

    // 计算缩放比例
    const scale = Math.min(
      (this.THUMBNAIL_SIZE - 4) / bounds.width,
      (this.THUMBNAIL_SIZE - 4) / bounds.height
    )

    // 计算偏移量（居中）
    const offsetX = (this.THUMBNAIL_SIZE - bounds.width * scale) / 2
    const offsetY = (this.THUMBNAIL_SIZE - bounds.height * scale) / 2

    // 绘制背景（透明或浅色）
    this.ctx.fillStyle = '#f9fafb'
    this.ctx.fillRect(0, 0, this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE)

    // 保存上下文
    this.ctx.save()

    // 应用变换
    this.ctx.translate(offsetX, offsetY)
    this.ctx.scale(scale, scale)

    // 绘制所有元素（异步等待）
    for (const element of elements) {
      await this.drawElement(element, bounds)
    }

    // 恢复上下文
    this.ctx.restore()
  }

  /**
   * 绘制单个元素
   */
  private async drawElement(element: CanvasElement, bounds: { x: number; y: number; width: number; height: number }): Promise<void> {
    const size = this.getElementSize(element)

    this.ctx.save()

    // 计算元素中心点（相对于缩略图边界）
    const centerX = element.position.x + size.x / 2 - bounds.x
    const centerY = element.position.y + size.y / 2 - bounds.y

    // 移动到元素中心点
    this.ctx.translate(centerX, centerY)

    // 应用旋转（以中心点为基准）
    this.ctx.rotate(((element.rotation || 0) * Math.PI) / 180) // 将角度转换为弧度

    // 移动到元素的左上角（相对于中心点）
    this.ctx.translate(-size.x / 2, -size.y / 2)

    // 设置样式
    this.ctx.fillStyle = element.style.fill || 'transparent'
    this.ctx.strokeStyle = element.style.stroke || '#000000'
    this.ctx.lineWidth = element.style.strokeWidth || 1

    // 根据元素类型绘制
    switch (element.type) {
      case ElementType.SHAPE:
        this.drawShapeElement(element)
        break
      case ElementType.TEXT:
        this.drawTextElement(element)
        break
      case ElementType.PATH:
        this.drawPenElement(element)
        break
      case ElementType.LINE:
        this.drawLineElement(element)
        break
      case ElementType.ARROW:
        this.drawArrowElement(element)
        break
      case ElementType.IMAGE:
        await this.drawImageElement(element)
        break
      default:
        break
    }

    this.ctx.restore()
  }

  /**
   * 绘制形状元素
   */
  private drawShapeElement(element: CanvasElement): void {
    const size = this.getElementSize(element)
    const width = size.x
    const height = size.y
    const shapeType = element.data?.shapeType || 'rectangle'

    this.ctx.beginPath()
    
    switch (shapeType) {
      case ShapeType.RECTANGLE:
        this.ctx.rect(0, 0, width, height)
        break
      case ShapeType.CIRCLE:
        this.ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
        break
      case ShapeType.TRIANGLE:
        this.ctx.moveTo(width / 2, 0)
        this.ctx.lineTo(0, height)
        this.ctx.lineTo(width, height)
        this.ctx.closePath()
        break
      case ShapeType.DIAMOND:
        this.ctx.moveTo(width / 2, 0)
        this.ctx.lineTo(width, height / 2)
        this.ctx.lineTo(width / 2, height)
        this.ctx.lineTo(0, height / 2)
        this.ctx.closePath()
        break
      case ShapeType.STAR:
        // 简化的五角星
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) / 2
        this.ctx.moveTo(centerX, centerY - radius)
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
          const x = centerX + radius * Math.cos(angle)
          const y = centerY + radius * Math.sin(angle)
          this.ctx.lineTo(x, y)
        }
        this.ctx.closePath()
        break
      case ShapeType.ELLIPSE:
        this.ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        break
    }

    if (element.style.fill) {
      this.ctx.fill()
    }
    if (element.style.stroke) {
      this.ctx.stroke()
    }
  }

  /**
   * 绘制文本元素
   */
  private drawTextElement(element: CanvasElement): void {
    const size = this.getElementSize(element)
    const width = size.x
    const height = size.y
    const text = element.data?.text || 'Text'
    const fontSize = Math.min(width, height) * 0.3

    this.ctx.fillStyle = element.style.fill || '#000000'
    this.ctx.font = `${fontSize}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(text, width / 2, height / 2)
  }

  /**
   * 绘制画笔元素
   */
  private drawPenElement(element: CanvasElement): void {
    const points = element.data?.points || []
    
    if (points.length < 2) {
      return
    }

    this.ctx.strokeStyle = element.style.stroke || '#000000'
    this.ctx.lineWidth = element.style.strokeWidth || 2
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    this.ctx.beginPath()
    
    // 直接使用路径点坐标（与Renderer保持一致）
    this.ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y)
    }
    
    this.ctx.stroke()
  }

  /**
   * 绘制线条元素
   */
  private drawLineElement(element: CanvasElement): void {
    const size = this.getElementSize(element)
    const width = size.x
    const height = size.y
    const points = element.data?.points || []

    this.ctx.strokeStyle = element.style.stroke || '#000000'
    this.ctx.lineWidth = element.style.strokeWidth || 2
    this.ctx.lineCap = 'round'

    this.ctx.beginPath()

    if (points.length >= 2) {
      // 如果有路径点，直接使用路径点坐标（与Renderer保持一致）
      this.ctx.moveTo(points[0].x, points[0].y)

      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y)
      }
    } else {
      // 使用元素大小绘制
      this.ctx.moveTo(0, height / 2)
      this.ctx.lineTo(width, height / 2)
    }

    this.ctx.stroke()
  }

  /**
   * 绘制箭头元素
   */
  private drawArrowElement(element: CanvasElement): void {
    const size = this.getElementSize(element)
    const width = size.x
    const height = size.y
    const points = element.data?.points || []

    this.ctx.strokeStyle = element.style.stroke || '#000000'
    this.ctx.lineWidth = element.style.strokeWidth || 2
    this.ctx.lineCap = 'round'

    this.ctx.beginPath()
    
    if (points.length >= 2) {
      // 如果有路径点，直接使用路径点坐标（与Renderer保持一致）
      this.ctx.moveTo(points[0].x, points[0].y)
      
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y)
      }
      
      this.ctx.stroke()
    } else {
      // 使用元素大小绘制
      this.ctx.moveTo(0, height / 2)
      this.ctx.lineTo(width, height / 2)
      this.ctx.stroke()
    }
  }

  /**
   * 安全获取元素尺寸
   * 处理不同类型元素可能没有 size 属性的情况
   */
  private getElementSize(element: CanvasElement): { x: number; y: number } {
    // 如果元素有 size 属性，直接使用
    if (element.size && element.size.x !== undefined && element.size.y !== undefined) {
      return { x: element.size.x, y: element.size.y }
    }

    // LINE 和 ARROW：从 points 属性计算
    if (element.type === 'line' || element.type === 'arrow') {
      const points = (element as any).points
      if (points && points.length >= 2) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const p of points) {
          minX = Math.min(minX, p.x)
          maxX = Math.max(maxX, p.x)
          minY = Math.min(minY, p.y)
          maxY = Math.max(maxY, p.y)
        }
        return { x: maxX - minX || 1, y: maxY - minY || 1 }
      }
    }

    // TEXT：使用 fontSize 估算
    if (element.type === 'text') {
      const fontSize = (element as any).fontSize || 16
      return { x: fontSize * 10, y: fontSize * 1.5 }
    }

    // 默认返回小尺寸
    return { x: 50, y: 50 }
  }

  /**
   * 计算元素边界框
   */
  private calculateBounds(elements: CanvasElement[]): { x: number; y: number; width: number; height: number } | null {
    if (elements.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    elements.forEach(element => {
      const size = this.getElementSize(element)
      minX = Math.min(minX, element.position.x)
      minY = Math.min(minY, element.position.y)
      maxX = Math.max(maxX, element.position.x + size.x)
      maxY = Math.max(maxY, element.position.y + size.y)
    })

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }

    return bounds
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(layer: Layer, elements: CanvasElement[]): string {
    // 获取图层中的元素
    const layerElements = elements.filter(el => el.layer === layer.id)
    
    // 为每个元素生成包含关键属性的哈希
    const elementHashes = layerElements.map(el => {
      const keyProps = {
        id: el.id,
        type: el.type,
        position: el.position,
        size: el.size,
        rotation: el.rotation || 0,
        visible: el.visible !== false, // 默认为true
        // 对于图片元素，还需要包含图片相关的属性
        ...(el.type === 'image' && el.data ? {
          imageData: el.data.src || el.data.url || '',
          filter: el.data.filter || 'none',
          borderRadius: el.data.borderRadius || 0
        } : {}),
        // 对于文本元素，包含文本内容
        ...(el.type === 'text' && el.data ? {
          text: el.data.text || '',
          fontSize: el.data.fontSize || 16
        } : {})
      }
      return `${el.id}-${JSON.stringify(keyProps)}`
    }).sort()
    
    const layerHash = `${layer.id}-${layer.visible ? 'v' : 'h'}-${layer.color || ''}`
    return `${layerHash}-${elementHashes.join('|')}`
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.thumbnailCache.clear()
  }

  /**
   * 绘制图片元素
   */
  private async drawImageElement(element: CanvasElement): Promise<void> {
    const size = this.getElementSize(element)
    const width = size.x
    const height = size.y
    const imageData = element.data as ImageElementData


    // 如果有缩略图，直接使用
    if (imageData?.thumbnail) {
      await this.drawImageWithPromise(imageData.thumbnail, width, height)
    } else if (imageData?.src) {
      await this.drawImageWithPromise(imageData.src, width, height)
    } else {
      // 没有图片数据，绘制占位符
      this.drawImagePlaceholder(width, height)
    }
  }

  /**
   * 使用Promise等待图片加载完成再绘制
   */
  private async drawImageWithPromise(src: string, width: number, height: number): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')
          if (tempCtx) {
            tempCanvas.width = width
            tempCanvas.height = height
            
            // 绘制图片到临时canvas
            tempCtx.drawImage(img, 0, 0, width, height)
            
            // 将临时canvas的内容绘制到缩略图canvas
            this.ctx.drawImage(tempCanvas, 0, 0, width, height)
          }
          resolve()
        } catch (error) {
          this.drawImagePlaceholder(width, height)
          resolve()
        }
      }
      
      img.onerror = () => {
        this.drawImagePlaceholder(width, height)
        resolve()
      }
      
      img.src = src
    })
  }

  /**
   * 绘制图片占位符
   */
  private drawImagePlaceholder(width: number, height: number): void {
    // 绘制背景
    this.ctx.fillStyle = '#f3f4f6'
    this.ctx.fillRect(0, 0, width, height)
    
    // 绘制边框
    this.ctx.strokeStyle = '#d1d5db'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(0, 0, width, height)
    
    // 绘制图片图标
    this.ctx.fillStyle = '#9ca3af'
    this.ctx.font = `${Math.min(width, height) * 0.3}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('📷', width / 2, height / 2)
  }

  /**
   * 清除特定图层的缓存
   */
  clearLayerCache(layerId: string): void {
    for (const [key] of this.thumbnailCache) {
      if (key.startsWith(layerId)) {
        this.thumbnailCache.delete(key)
      }
    }
  }
}
