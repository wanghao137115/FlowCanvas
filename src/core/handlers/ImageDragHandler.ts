import { ImageTool } from '../tools/ImageTool'
import { ImageElement, ImageElementData } from '../elements/ImageElement'

/**
 * 图片拖拽处理器
 */
export class ImageDragHandler {
  private imageTool: ImageTool
  private dropZone: HTMLElement
  private isDragOver: boolean = false
  private onImageAdd?: (element: ImageElement) => void

  constructor(imageTool: ImageTool, dropZone: HTMLElement) {
    this.imageTool = imageTool
    this.dropZone = dropZone
    this.setupDragEvents()
  }

  /**
   * 设置图片添加回调
   */
  setOnImageAdd(callback: (element: ImageElement) => void): void {
    this.onImageAdd = callback
  }

  /**
   * 设置拖拽事件
   */
  private setupDragEvents(): void {
    // 阻止默认拖拽行为
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this))
    this.dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this))
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this))
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this))

    // 防止页面默认的拖拽行为
    document.addEventListener('dragover', (e) => e.preventDefault())
    document.addEventListener('drop', (e) => e.preventDefault())
  }

  /**
   * 处理拖拽悬停
   */
  private handleDragOver(event: DragEvent): void {
    event.preventDefault()
    
    if (this.isValidImageDrop(event)) {
      event.dataTransfer!.dropEffect = 'copy'
      this.showDropIndicator(true)
    } else {
      event.dataTransfer!.dropEffect = 'none'
    }
  }

  /**
   * 处理拖拽进入
   */
  private handleDragEnter(event: DragEvent): void {
    event.preventDefault()
    
    if (this.isValidImageDrop(event)) {
      this.isDragOver = true
      this.showDropIndicator(true)
    }
  }

  /**
   * 处理拖拽离开
   */
  private handleDragLeave(event: DragEvent): void {
    event.preventDefault()
    
    // 只有当离开整个拖拽区域时才隐藏指示器
    if (!this.dropZone.contains(event.relatedTarget as Node)) {
      this.isDragOver = false
      this.showDropIndicator(false)
    }
  }

  /**
   * 处理拖拽放置
   */
  private handleDrop(event: DragEvent): void {
    event.preventDefault()
    this.isDragOver = false
    this.showDropIndicator(false)

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      this.handleFiles(files)
    }
  }

  /**
   * 处理文件
   */
  private async handleFiles(files: FileList): Promise<void> {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      this.showMessage('请拖拽图片文件', 'error')
      return
    }

    // 处理第一个图片文件
    const file = imageFiles[0]
    await this.processImageFile(file)
  }

  /**
   * 处理图片文件
   */
  private async processImageFile(file: File): Promise<void> {
    try {
      // 检查文件大小
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        this.showMessage('文件大小不能超过10MB', 'error')
        return
      }

      // 检查文件类型
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/svg+xml',
        'image/webp'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        this.showMessage('不支持的文件格式', 'error')
        return
      }

      this.showMessage('正在处理图片...', 'info')

      // 处理图片
      const imageData = await this.createImageData(file)
      
      // 创建图片元素
      const imageElement = new ImageElement(
        'image_' + Date.now(),
        { x: 100, y: 100 },
        imageData,
        'default'
      )

      // 通知添加图片
      if (this.onImageAdd) {
        this.onImageAdd(imageElement)
      }

      this.showMessage('图片添加成功', 'success')

    } catch (error) {
      console.error('处理图片文件失败:', error)
      this.showMessage('图片处理失败，请重试', 'error')
    }
  }

  /**
   * 创建图片数据
   */
  private async createImageData(file: File): Promise<ImageElementData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string
          
          // 创建图片对象获取尺寸
          const img = new Image()
          img.onload = async () => {
            const { width, height } = img
            
            // 检查是否需要压缩 - 最大宽度限制为500px
            const maxWidth = 500
            let processedSrc = result
            let compressed = false
            
            if (width > maxWidth) {
              processedSrc = await this.compressImage(img, maxWidth)
              compressed = true
            }
            
            // 生成缩略图
            const thumbnail = await this.generateThumbnail(img, 150)
            
            const imageData: ImageElementData = {
              src: processedSrc,
              originalWidth: width,
              originalHeight: height,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              compressed,
              thumbnail
            }
            
            resolve(imageData)
          }
          
          img.onerror = () => {
            reject(new Error('图片加载失败'))
          }
          
          img.src = result
          
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  /**
   * 压缩图片
   */
  private async compressImage(img: HTMLImageElement, maxWidth: number): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve(img.src)
        return
      }
      
      // 计算新尺寸 - 只限制宽度，保持宽高比
      const { width, height } = img
      const scale = maxWidth / width
      const newWidth = maxWidth
      const newHeight = Math.round(height * scale)
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      // 转换为base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resolve(compressedDataUrl)
    })
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(img: HTMLImageElement, size: number): Promise<string> {
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
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7)
      resolve(thumbnailDataUrl)
    })
  }

  /**
   * 检查是否为有效的图片拖拽
   */
  private isValidImageDrop(event: DragEvent): boolean {
    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return false
    
    const file = files[0]
    return file.type.startsWith('image/')
  }

  /**
   * 显示拖拽指示器
   */
  private showDropIndicator(show: boolean): void {
    if (show) {
      this.dropZone.classList.add('drag-over')
    } else {
      this.dropZone.classList.remove('drag-over')
    }
  }

  /**
   * 显示消息
   */
  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    // 这里可以实现消息提示功能
    console.log(`[${type.toUpperCase()}] ${message}`)
    
    // 可以集成到现有的消息系统
    if (type === 'error') {
      alert(message)
    }
  }

  /**
   * 销毁处理器
   */
  destroy(): void {
    this.dropZone.removeEventListener('dragover', this.handleDragOver.bind(this))
    this.dropZone.removeEventListener('dragenter', this.handleDragEnter.bind(this))
    this.dropZone.removeEventListener('dragleave', this.handleDragLeave.bind(this))
    this.dropZone.removeEventListener('drop', this.handleDrop.bind(this))
  }
}
