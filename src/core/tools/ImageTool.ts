import { BaseTool } from './BaseTool'
import { ToolType } from '@/types/canvas.types'
import { ImageElement, ImageElementData } from '../elements/ImageElement'
import type { ToolEvent, CanvasElement } from '@/types/canvas.types'

/**
 * 图片工具类
 */
export class ImageTool extends BaseTool {
  private isSelecting: boolean = false
  private fileInput: HTMLInputElement | null = null
  private onImageAdd?: (element: ImageElement) => void

  constructor() {
    super()
    this.setupFileInput()
  }

  /**
   * 获取工具类型
   */
  getToolType(): ToolType {
    return ToolType.IMAGE
  }

  /**
   * 获取工具名称
   */
  getName(): string {
    return '图片工具'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '插入和管理图片'
  }

  /**
   * 设置图片添加回调
   */
  setOnImageAdd(callback: (element: ImageElement) => void): void {
    this.onImageAdd = callback
  }

  /**
   * 设置文件输入框
   */
  private setupFileInput(): void {
    this.fileInput = document.createElement('input')
    this.fileInput.type = 'file'
    this.fileInput.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp'
    this.fileInput.style.display = 'none'
    this.fileInput.multiple = false
    
    this.fileInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        this.handleFileSelect(target.files[0])
      }
    })
    
    document.body.appendChild(this.fileInput)
  }

  /**
   * 处理文件选择
   */
  private async handleFileSelect(file: File): Promise<void> {
    try {
      // 检查文件大小（10MB限制）
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert('文件大小不能超过10MB')
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
        alert('不支持的文件格式，请选择JPG、PNG、GIF、SVG或WebP格式的图片')
        return
      }

      // 读取文件并处理
      const imageData = await this.processImageFile(file)
      
      // 创建图片元素
      const imageElement = new ImageElement(
        'image_' + Date.now(),
        { x: 100, y: 100 }, // 默认位置
        imageData,
        'default'
      )

      // 通知添加图片
      if (this.onImageAdd) {
        this.onImageAdd(imageElement)
      }

    } catch (error) {
      console.error('处理图片文件失败:', error)
      alert('图片处理失败，请重试')
    }
  }

  /**
   * 处理图片文件
   */
  private async processImageFile(file: File): Promise<ImageElementData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string
          const base64 = result.split(',')[1] // 移除data:image/xxx;base64,前缀
          
          // 创建图片对象获取尺寸
          const img = new Image()
          img.onload = async () => {
            const { width, height } = img
            
            // 检查是否需要压缩 - 最大宽度限制为500px
            const maxWidth = 500
            let processedSrc = result
            let compressed = false
            
            if (width > maxWidth) {
              // 需要压缩
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
   * 激活工具
   */
  activate(): void {
    super.activate()
    this.isSelecting = false
  }

  /**
   * 停用工具
   */
  deactivate(): void {
    super.deactivate()
    this.isSelecting = false
  }

  /**
   * 处理鼠标按下事件
   */
  onMouseDown(event: ToolEvent): void {
    // 点击选择文件
    this.selectFile()
  }

  /**
   * 处理鼠标移动事件
   */
  onMouseMove(event: ToolEvent): boolean {
    return false
  }

  /**
   * 处理鼠标抬起事件
   */
  onMouseUp(event: ToolEvent): void {
    // 图片工具不需要处理鼠标抬起事件
  }

  /**
   * 处理键盘事件
   */
  onKeyDown(event: ToolEvent): void {
    // 图片工具不需要处理键盘事件
  }

  onKeyUp(event: ToolEvent): void {
    // 图片工具不需要处理键盘事件
  }

  /**
   * 渲染工具
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 图片工具不需要渲染
  }

  /**
   * 选择文件
   */
  selectFile(): void {
    if (this.fileInput) {
      this.fileInput.click()
    }
  }

  /**
   * 处理拖拽放置
   */
  handleDrop(event: DragEvent): void {
    event.preventDefault()
    
    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        this.handleFileSelect(file)
      }
    }
  }

  /**
   * 处理拖拽进入
   */
  handleDragEnter(event: DragEvent): void {
    event.preventDefault()
  }

  /**
   * 处理拖拽悬停
   */
  handleDragOver(event: DragEvent): void {
    event.preventDefault()
  }

  /**
   * 处理拖拽离开
   */
  handleDragLeave(event: DragEvent): void {
    // 可以添加视觉反馈
  }

  /**
   * 销毁工具
   */
  destroy(): void {
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput)
    }
    this.fileInput = null
    super.destroy()
  }
}
