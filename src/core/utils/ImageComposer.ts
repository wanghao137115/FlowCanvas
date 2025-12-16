import { ImageElement, ImageElementData } from '@/core/elements/ImageElement'

/**
 * 图片合成工具类
 * 用于将文字融合到图片中，生成新的图片
 */
export class ImageComposer {
  /**
   * 将文字融合到图片中
   * @param imageElement 图片元素
   * @param text 要融合的文字
   * @param options 文字样式选项
   * @returns 合成后的图片 base64 数据
   */
  static async composeImageWithText(
    imageElement: ImageElement,
    text: string,
    options: {
      fontSize?: number
      fontFamily?: string
      fontWeight?: string
      fontStyle?: string
      color?: string
      textAlign?: 'left' | 'center' | 'right'
      position?: { x: number; y: number } // 相对位置 (0-1)
    } = {}
  ): Promise<string> {
    try {
      // 加载原始图片
      const img = await imageElement.loadImage()
      
      // 创建画布
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      // 设置画布尺寸为图片尺寸
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      
      // 绘制原始图片
      ctx.drawImage(img, 0, 0)
      
      // 设置文字样式
      const fontSize = options.fontSize || 48
      const fontFamily = options.fontFamily || 'Arial, sans-serif'
      const fontWeight = options.fontWeight || 'bold'
      const fontStyle = options.fontStyle || 'normal'
      const color = options.color || '#ffffff'
      const textAlign = options.textAlign || 'center'
      const position = options.position || { x: 0.5, y: 0.5 }
      
      // 设置字体
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = color
      ctx.textAlign = textAlign
      ctx.textBaseline = 'middle'
      
      // 计算文字位置
      const textX = canvas.width * position.x
      const textY = canvas.height * position.y
      
      // 添加文字阴影效果（可选）
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // 绘制文字
      ctx.fillText(text, textX, textY)
      
      // 清除阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // 返回合成后的图片 base64 数据
      return canvas.toDataURL('image/png', 1.0)
      
    } catch (error) {
      console.error('图片合成失败:', error)
      throw error
    }
  }
  
  /**
   * 为图片元素添加文字叠加
   * @param imageElement 图片元素
   * @param text 要添加的文字
   * @param options 文字样式选项
   * @returns 更新后的图片元素
   */
  static addTextOverlay(
    imageElement: ImageElement,
    text: string,
    options: {
      fontSize?: number
      fontFamily?: string
      fontWeight?: string
      fontStyle?: string
      color?: string
      textAlign?: 'left' | 'center' | 'right'
      position?: { x: number; y: number }
    } = {}
  ): ImageElement {
    try {
      // 创建文字叠加数据
      const overlayText = {
        text,
        fontSize: options.fontSize || 48,
        fontFamily: options.fontFamily || 'Arial, sans-serif',
        fontWeight: options.fontWeight || 'bold',
        fontStyle: options.fontStyle || 'normal',
        textAlign: options.textAlign || 'center',
        textDecoration: 'none' as const,
        color: options.color || '#ffffff',
        position: options.position || { x: 0.5, y: 0.5 },
        visible: true
      }
      
      // 更新图片元素数据
      const updatedImageData: ImageElementData = {
        ...imageElement.data,
        overlayText
      }
      
      // 创建新的图片元素
      const updatedImageElement = new ImageElement(
        imageElement.id,
        imageElement.position,
        updatedImageData,
        imageElement.layer
      )
      
      // 复制其他属性
      updatedImageElement.size = imageElement.size
      updatedImageElement.rotation = imageElement.rotation
      updatedImageElement.style = { ...imageElement.style }
      updatedImageElement.locked = imageElement.locked
      updatedImageElement.visible = imageElement.visible
      updatedImageElement.createdAt = imageElement.createdAt
      updatedImageElement.updatedAt = Date.now()
      
      return updatedImageElement
      
    } catch (error) {
      console.error('添加文字叠加失败:', error)
      throw error
    }
  }

  /**
   * 更新图片元素的文字叠加
   * @param imageElement 图片元素
   * @param text 新的文字内容
   * @param options 文字样式选项
   * @returns 更新后的图片元素
   */
  static updateTextOverlay(
    imageElement: ImageElement,
    text: string,
    options: {
      fontSize?: number
      fontFamily?: string
      fontWeight?: string
      fontStyle?: string
      color?: string
      textAlign?: 'left' | 'center' | 'right'
      position?: { x: number; y: number }
    } = {}
  ): ImageElement {
    try {
      // 如果已有文字叠加，更新它；否则创建新的
      const existingOverlay = imageElement.data.overlayText
      
      const overlayText = {
        text,
        fontSize: options.fontSize || existingOverlay?.fontSize || 48,
        fontFamily: options.fontFamily || existingOverlay?.fontFamily || 'Arial, sans-serif',
        fontWeight: options.fontWeight || existingOverlay?.fontWeight || 'bold',
        fontStyle: options.fontStyle || existingOverlay?.fontStyle || 'normal',
        textAlign: options.textAlign || existingOverlay?.textAlign || 'center',
        textDecoration: existingOverlay?.textDecoration || 'none' as const,
        color: options.color || existingOverlay?.color || '#ffffff',
        position: options.position || existingOverlay?.position || { x: 0.5, y: 0.5 },
        visible: existingOverlay?.visible ?? true
      }
      
      // 更新图片元素数据
      const updatedImageData: ImageElementData = {
        ...imageElement.data,
        overlayText
      }
      
      // 创建新的图片元素
      const updatedImageElement = new ImageElement(
        imageElement.id,
        imageElement.position,
        updatedImageData,
        imageElement.layer
      )
      
      // 复制其他属性
      updatedImageElement.size = imageElement.size
      updatedImageElement.rotation = imageElement.rotation
      updatedImageElement.style = { ...imageElement.style }
      updatedImageElement.locked = imageElement.locked
      updatedImageElement.visible = imageElement.visible
      updatedImageElement.createdAt = imageElement.createdAt
      updatedImageElement.updatedAt = Date.now()
      
      return updatedImageElement
      
    } catch (error) {
      console.error('更新文字叠加失败:', error)
      throw error
    }
  }
}
