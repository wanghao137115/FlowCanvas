import { ImageTool } from '../core/tools/ImageTool'
import { ImageElement } from '../core/elements/ImageElement'
import { ImageRenderer } from '../core/renderers/ImageRenderer'
import { ImageManager } from '../core/managers/ImageManager'
import { ImageDragHandler } from '../core/handlers/ImageDragHandler'
import { ToolType } from '@/types/canvas.types'

/**
 * 图片工具使用示例
 */
export class ImageToolExample {
  private imageTool: ImageTool
  private imageRenderer: ImageRenderer
  private imageManager: ImageManager
  private dragHandler: ImageDragHandler
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private images: ImageElement[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    
    // 初始化组件
    this.imageTool = new ImageTool()
    this.imageRenderer = new ImageRenderer(this.ctx, { scale: 1, offset: { x: 0, y: 0 } })
    this.imageManager = new ImageManager()
    this.dragHandler = new ImageDragHandler(this.imageTool, canvas)
    
    this.setupImageTool()
    this.setupDragHandler()
  }

  /**
   * 设置图片工具
   */
  private setupImageTool(): void {
    // 设置图片添加回调
    this.imageTool.setOnImageAdd((element: ImageElement) => {
      this.addImage(element)
    })
  }

  /**
   * 设置拖拽处理器
   */
  private setupDragHandler(): void {
    // 设置图片添加回调
    this.dragHandler.setOnImageAdd((element: ImageElement) => {
      this.addImage(element)
    })
  }

  /**
   * 添加图片
   */
  private addImage(element: ImageElement): void {
    this.images.push(element)
    this.render()
    console.log('图片已添加:', element.getFileName())
  }

  /**
   * 渲染所有图片
   */
  private async render(): Promise<void> {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 渲染所有图片
    for (const image of this.images) {
      try {
        await this.imageRenderer.renderImage(image)
      } catch (error) {
        console.warn('渲染图片失败:', error)
      }
    }
  }

  /**
   * 选择图片文件
   */
  selectImage(): void {
    this.imageTool.selectFile()
  }

  /**
   * 获取图片列表
   */
  getImages(): ImageElement[] {
    return [...this.images]
  }

  /**
   * 删除图片
   */
  removeImage(imageId: string): void {
    this.images = this.images.filter(img => img.id !== imageId)
    this.render()
  }

  /**
   * 清空所有图片
   */
  clearImages(): void {
    this.images = []
    this.render()
  }

  /**
   * 获取图片统计信息
   */
  getImageStats(): {
    totalImages: number
    totalSize: number
    compressedImages: number
  } {
    const totalImages = this.images.length
    const totalSize = this.images.reduce((sum, img) => sum + img.getFileSize(), 0)
    const compressedImages = this.images.filter(img => img.isCompressed()).length
    
    return {
      totalImages,
      totalSize,
      compressedImages
    }
  }

  /**
   * 导出图片数据
   */
  exportImageData(): string {
    return JSON.stringify(this.images.map(img => img.toJSON()))
  }

  /**
   * 导入图片数据
   */
  importImageData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      this.images = data.map((item: any) => ImageElement.fromJSON(item))
      this.render()
    } catch (error) {
      console.error('导入图片数据失败:', error)
    }
  }

  /**
   * 销毁示例
   */
  destroy(): void {
    this.imageTool.destroy()
    this.dragHandler.destroy()
    this.imageManager.destroy()
    this.images = []
  }
}

/**
 * 使用示例
 */
export function createImageToolExample(canvas: HTMLCanvasElement): ImageToolExample {
  return new ImageToolExample(canvas)
}

/**
 * 快速测试函数
 */
export async function testImageTool(): Promise<void> {
  console.log('开始测试图片工具...')
  
  // 创建测试画布
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  canvas.style.border = '1px solid #ccc'
  document.body.appendChild(canvas)
  
  // 创建图片工具示例
  const example = createImageToolExample(canvas)
  
  // 添加测试按钮
  const buttonContainer = document.createElement('div')
  buttonContainer.style.margin = '10px'
  
  const selectButton = document.createElement('button')
  selectButton.textContent = '选择图片'
  selectButton.onclick = () => example.selectImage()
  
  const clearButton = document.createElement('button')
  clearButton.textContent = '清空图片'
  clearButton.onclick = () => example.clearImages()
  
  const statsButton = document.createElement('button')
  statsButton.textContent = '显示统计'
  statsButton.onclick = () => {
    const stats = example.getImageStats()
    console.log('图片统计:', stats)
    alert(`总图片数: ${stats.totalImages}\n总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB\n压缩图片: ${stats.compressedImages}`)
  }
  
  buttonContainer.appendChild(selectButton)
  buttonContainer.appendChild(clearButton)
  buttonContainer.appendChild(statsButton)
  document.body.appendChild(buttonContainer)
  
  console.log('图片工具测试环境已创建')
  console.log('可以拖拽图片到画布上，或点击"选择图片"按钮')
}
