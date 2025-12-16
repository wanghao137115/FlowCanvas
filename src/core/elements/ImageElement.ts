import { CanvasElement, ElementType, Vector2, ElementStyle } from '@/types/canvas.types'

/**
 * 图片元素数据接口
 */
export interface ImageElementData {
  src: string // base64 或 URL
  originalWidth: number
  originalHeight: number
  fileName?: string
  fileSize?: number
  mimeType?: string
  compressed?: boolean // 是否已压缩
  thumbnail?: string // 缩略图 base64
  border?: {
    width: number
    color: string
    style: 'solid' | 'dashed' | 'dotted'
  }
  shadow?: {
    x: number
    y: number
    blur: number
    color: string
  }
  borderRadius?: number
  filter?: string
  // 裁剪形状
  cropShape?: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'hexagon' | 'octagon' | 'heart' | 'star' | 'cloud' | 'flower' | 'egg' | 'parallelogram' | 'pentagon' | 'squircle' | 'stadium' | 'clover' | 'wave' | 'blob'
  // 裁剪相关数据
  cropData?: {
    x: number
    y: number
    width: number
    height: number
    rotate: number
    scaleX: number
    scaleY: number
  }
  originalSrc?: string // 原始图片源（用于撤销裁剪）
  isCropped?: boolean // 是否为裁剪后的图片
  // 图片上的文字叠加
  overlayText?: {
    text: string
    fontSize: number
    fontFamily: string
    fontWeight: string
    fontStyle: string
    textAlign: 'left' | 'center' | 'right'
    textDecoration: 'none' | 'underline' | 'line-through'
    color: string
    position: {
      x: number // 相对于图片的位置 (0-1)
      y: number // 相对于图片的位置 (0-1)
    }
    visible: boolean
  }
}

/**
 * 图片元素类
 */
export class ImageElement implements CanvasElement {
  id: string
  type: ElementType = ElementType.IMAGE
  position: Vector2
  size: Vector2
  rotation: number = 0
  style: ElementStyle
  layer: string
  locked: boolean = false
  visible: boolean = true
  createdAt: number
  updatedAt: number
  data: ImageElementData

  // 图片特有属性
  private _image: HTMLImageElement | null = null
  private _loaded: boolean = false
  private _loading: boolean = false
  private _onImageLoaded: (() => void) | null = null

  constructor(
    id: string,
    position: Vector2,
    data: ImageElementData,
    layer: string = 'default'
  ) {
    this.id = id
    this.position = position
    this.data = data
    this.layer = layer
    this.createdAt = Date.now()
    this.updatedAt = Date.now()
    
    // 计算初始尺寸
    this.size = this.calculateInitialSize()
    
    // 默认样式
    this.style = {
      opacity: 1,
      stroke: 'transparent',
      strokeWidth: 0
    }
  }

  /**
   * 计算初始尺寸
   */
  private calculateInitialSize(): Vector2 {
    const { originalWidth, originalHeight } = this.data
    const maxWidth = 500 // 最大宽度限制为500px
    
    if (originalWidth <= maxWidth) {
      return { x: originalWidth, y: originalHeight }
    }
    
    // 按比例缩放，保持宽高比
    const scale = maxWidth / originalWidth
    return {
      x: maxWidth,
      y: Math.round(originalHeight * scale)
    }
  }

  /**
   * 设置图片加载完成回调
   */
  setOnImageLoaded(callback: (() => void) | null): void {
    this._onImageLoaded = callback
  }

  /**
   * 加载图片
   */
  async loadImage(): Promise<HTMLImageElement> {
    if (this._image && this._loaded) {
      return this._image
    }

    if (this._loading) {
      // 如果正在加载，等待加载完成
      return new Promise((resolve, reject) => {
        const checkLoaded = () => {
          if (this._loaded && this._image) {
            resolve(this._image)
          } else if (!this._loading) {
            reject(new Error('图片加载失败'))
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
      })
    }

    this._loading = true
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        this._image = img
        this._loaded = true
        this._loading = false
        
        // 图片加载完成后触发重新渲染
        if (this._onImageLoaded) {
          this._onImageLoaded()
        }
        
        resolve(img)
      }
      
      img.onerror = () => {
        this._loading = false
        reject(new Error('图片加载失败'))
      }
      
      img.src = this.data.src
    })
  }

  /**
   * 获取图片对象
   */
  getImage(): HTMLImageElement | null {
    return this._image
  }

  /**
   * 检查图片是否已加载
   */
  isLoaded(): boolean {
    return this._loaded
  }

  /**
   * 检查图片是否正在加载
   */
  isLoading(): boolean {
    return this._loading
  }

  /**
   * 重置图片加载状态（用于裁剪后重新加载）
   */
  resetImageLoading(): void {
    this._image = null
    this._loaded = false
    this._loading = false
  }

  /**
   * 获取图片的原始尺寸
   */
  getOriginalSize(): Vector2 {
    return {
      x: this.data.originalWidth,
      y: this.data.originalHeight
    }
  }

  /**
   * 获取图片的显示尺寸
   */
  getDisplaySize(): Vector2 {
    return { ...this.size }
  }

  /**
   * 设置图片尺寸
   */
  setSize(size: Vector2): void {
    this.size = size
    this.updatedAt = Date.now()
  }

  /**
   * 设置图片位置
   */
  setPosition(position: Vector2): void {
    this.position = position
    this.updatedAt = Date.now()
  }

  /**
   * 设置图片旋转角度
   */
  setRotation(rotation: number): void {
    this.rotation = rotation
    this.updatedAt = Date.now()
  }

  /**
   * 获取图片文件名
   */
  getFileName(): string {
    return this.data.fileName || 'image'
  }

  /**
   * 获取文件大小（字节）
   */
  getFileSize(): number {
    return this.data.fileSize || 0
  }

  /**
   * 获取文件大小（格式化字符串）
   */
  getFormattedFileSize(): string {
    const bytes = this.getFileSize()
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 获取MIME类型
   */
  getMimeType(): string {
    return this.data.mimeType || 'image/jpeg'
  }

  /**
   * 检查是否为压缩图片
   */
  isCompressed(): boolean {
    return this.data.compressed || false
  }

  /**
   * 获取缩略图
   */
  getThumbnail(): string | undefined {
    return this.data.thumbnail
  }

  /**
   * 设置缩略图
   */
  setThumbnail(thumbnail: string): void {
    this.data.thumbnail = thumbnail
    this.updatedAt = Date.now()
  }

  /**
   * 设置边框
   */
  setBorder(border: { width: number; color: string; style: 'solid' | 'dashed' | 'dotted' }): void {
    this.data.border = border
    this.updatedAt = Date.now()
  }

  /**
   * 设置阴影
   */
  setShadow(shadow: { x: number; y: number; blur: number; color: string }): void {
    this.data.shadow = shadow
    this.updatedAt = Date.now()
  }

  /**
   * 设置圆角
   */
  setBorderRadius(radius: number): void {
    this.data.borderRadius = radius
    this.updatedAt = Date.now()
  }

  /**
   * 设置滤镜
   */
  setFilter(filter: string): void {
    this.data.filter = filter
    this.updatedAt = Date.now()
  }

  /**
   * 设置透明度
   */
  setOpacity(opacity: number): void {
    this.style.opacity = opacity
    this.updatedAt = Date.now()
  }

  /**
   * 设置裁剪形状
   */
  setCropShape(shape: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'hexagon' | 'octagon' | 'heart' | 'star' | 'cloud' | 'flower' | 'egg' | 'parallelogram' | 'pentagon' | 'squircle' | 'stadium' | 'clover' | 'wave' | 'blob'): void {
    this.data.cropShape = shape
    this.updatedAt = Date.now()
  }

  /**
   * 应用裁剪
   */
  applyCrop(croppedData: string, cropData: any): void {
    // 保存原始图片源（如果还没有保存）
    if (!this.data.originalSrc) {
      this.data.originalSrc = this.data.src
    }
    
    // 更新图片源为裁剪后的数据
    this.data.src = croppedData
    
    // 保存裁剪数据
    this.data.cropData = {
      x: cropData.x || 0,
      y: cropData.y || 0,
      width: cropData.width || 0,
      height: cropData.height || 0,
      rotate: cropData.rotate || 0,
      scaleX: cropData.scaleX || 1,
      scaleY: cropData.scaleY || 1
    }
    
    // 重新计算尺寸
    this.recalculateSize()
    
    this.updatedAt = Date.now()
  }

  /**
   * 撤销裁剪
   */
  resetCrop(): void {
    if (this.data.originalSrc) {
      this.data.src = this.data.originalSrc
      this.data.originalSrc = undefined
      this.data.cropData = undefined
      
      // 重新计算尺寸
      this.recalculateSize()
      
      this.updatedAt = Date.now()
    }
  }

  /**
   * 检查是否已裁剪
   */
  isCropped(): boolean {
    return !!this.data.cropData
  }

  /**
   * 重新计算图片尺寸
   */
  private recalculateSize(): void {
    if (this._image) {
      // 如果图片已加载，直接使用其尺寸
      this.size.x = this._image.naturalWidth
      this.size.y = this._image.naturalHeight
    } else {
      // 否则创建临时图片来获取尺寸
      const img = new Image()
      img.onload = () => {
        this.size.x = img.naturalWidth
        this.size.y = img.naturalHeight
        this.updatedAt = Date.now()
      }
      img.src = this.data.src
    }
  }

  /**
   * 更新图片数据
   */
  updateData(data: Partial<ImageElementData>): void {
    this.data = { ...this.data, ...data }
    this.updatedAt = Date.now()
  }

  /**
   * 克隆图片元素
   */
  clone(): ImageElement {
    const cloned = new ImageElement(
      this.id + '_clone_' + Date.now(),
      { ...this.position },
      { ...this.data },
      this.layer
    )
    
    cloned.size = { ...this.size }
    cloned.rotation = this.rotation
    cloned.style = { ...this.style }
    cloned.locked = this.locked
    cloned.visible = this.visible
    
    return cloned
  }

  /**
   * 序列化为JSON
   */
  toJSON(): CanvasElement {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      size: this.size,
      rotation: this.rotation,
      style: this.style,
      layer: this.layer,
      locked: this.locked,
      visible: this.visible,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      data: this.data
    }
  }

  /**
   * 从JSON创建图片元素
   */
  static fromJSON(json: CanvasElement): ImageElement {
    const element = new ImageElement(
      json.id,
      json.position,
      json.data as ImageElementData,
      json.layer
    )
    
    element.size = json.size
    element.rotation = json.rotation
    element.style = json.style
    element.locked = json.locked
    element.visible = json.visible
    element.createdAt = json.createdAt
    element.updatedAt = json.updatedAt
    
    return element
  }
}
