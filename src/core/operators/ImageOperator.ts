import { ImageElement } from '../elements/ImageElement'
import { Vector2 } from '@/types/canvas.types'

/**
 * 图片操作类型
 */
export enum ImageOperationType {
  MOVE = 'move',
  RESIZE = 'resize',
  ROTATE = 'rotate',
  DELETE = 'delete',
  COPY = 'copy',
  PASTE = 'paste'
}

/**
 * 图片操作结果
 */
export interface ImageOperationResult {
  success: boolean
  element?: ImageElement
  error?: string
}

/**
 * 图片操作器
 */
export class ImageOperator {
  private selectedImages: ImageElement[] = []
  private clipboard: ImageElement[] = []

  constructor() {}

  /**
   * 设置选中的图片
   */
  setSelectedImages(images: ImageElement[]): void {
    this.selectedImages = [...images]
  }

  /**
   * 获取选中的图片
   */
  getSelectedImages(): ImageElement[] {
    return [...this.selectedImages]
  }

  /**
   * 移动图片
   */
  moveImage(image: ImageElement, newPosition: Vector2): ImageOperationResult {
    try {
      image.setPosition(newPosition)
      return { success: true, element: image }
    } catch (error) {
      return { success: false, error: '移动图片失败' }
    }
  }

  /**
   * 批量移动图片
   */
  moveImages(images: ImageElement[], offset: Vector2): ImageOperationResult {
    try {
      images.forEach(image => {
        const newPosition = {
          x: image.position.x + offset.x,
          y: image.position.y + offset.y
        }
        image.setPosition(newPosition)
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: '批量移动图片失败' }
    }
  }

  /**
   * 调整图片大小
   */
  resizeImage(image: ImageElement, newSize: Vector2): ImageOperationResult {
    try {
      // 检查最小尺寸
      if (newSize.x < 10 || newSize.y < 10) {
        return { success: false, error: '图片尺寸不能小于10x10像素' }
      }

      // 检查最大尺寸
      const maxSize = 10000
      if (newSize.x > maxSize || newSize.y > maxSize) {
        return { success: false, error: '图片尺寸不能超过10000x10000像素' }
      }

      image.setSize(newSize)
      return { success: true, element: image }
    } catch (error) {
      return { success: false, error: '调整图片大小失败' }
    }
  }

  /**
   * 按比例调整图片大小
   */
  resizeImageProportional(image: ImageElement, newSize: Vector2, keepAspectRatio: boolean = true): ImageOperationResult {
    try {
      if (!keepAspectRatio) {
        return this.resizeImage(image, newSize)
      }

      const originalSize = image.getOriginalSize()
      const aspectRatio = originalSize.x / originalSize.y
      
      let finalSize: Vector2
      if (newSize.x / newSize.y > aspectRatio) {
        // 以高度为准
        finalSize = {
          x: newSize.y * aspectRatio,
          y: newSize.y
        }
      } else {
        // 以宽度为准
        finalSize = {
          x: newSize.x,
          y: newSize.x / aspectRatio
        }
      }

      return this.resizeImage(image, finalSize)
    } catch (error) {
      return { success: false, error: '按比例调整图片大小失败' }
    }
  }

  /**
   * 旋转图片
   */
  rotateImage(image: ImageElement, angle: number): ImageOperationResult {
    try {
      // 标准化角度到0-360度
      const normalizedAngle = ((angle % 360) + 360) % 360
      image.setRotation(normalizedAngle)
      return { success: true, element: image }
    } catch (error) {
      return { success: false, error: '旋转图片失败' }
    }
  }

  /**
   * 批量旋转图片
   */
  rotateImages(images: ImageElement[], angle: number): ImageOperationResult {
    try {
      images.forEach(image => {
        const currentRotation = image.rotation
        const newRotation = currentRotation + angle
        image.setRotation(newRotation)
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: '批量旋转图片失败' }
    }
  }

  /**
   * 删除图片
   */
  deleteImage(image: ImageElement): ImageOperationResult {
    try {
      // 这里只是标记删除，实际的删除操作由调用者处理
      return { success: true, element: image }
    } catch (error) {
      return { success: false, error: '删除图片失败' }
    }
  }

  /**
   * 批量删除图片
   */
  deleteImages(images: ImageElement[]): ImageOperationResult {
    try {
      return { success: true }
    } catch (error) {
      return { success: false, error: '批量删除图片失败' }
    }
  }

  /**
   * 复制图片
   */
  copyImage(image: ImageElement): ImageOperationResult {
    try {
      const clonedImage = image.clone()
      this.clipboard = [clonedImage]
      return { success: true, element: clonedImage }
    } catch (error) {
      return { success: false, error: '复制图片失败' }
    }
  }

  /**
   * 批量复制图片
   */
  copyImages(images: ImageElement[]): ImageOperationResult {
    try {
      const clonedImages = images.map(image => image.clone())
      this.clipboard = clonedImages
      return { success: true }
    } catch (error) {
      return { success: false, error: '批量复制图片失败' }
    }
  }

  /**
   * 粘贴图片
   */
  pasteImage(position: Vector2): ImageOperationResult {
    try {
      if (this.clipboard.length === 0) {
        return { success: false, error: '剪贴板为空' }
      }

      const imageToPaste = this.clipboard[0]
      const pastedImage = imageToPaste.clone()
      pastedImage.setPosition(position)
      
      return { success: true, element: pastedImage }
    } catch (error) {
      return { success: false, error: '粘贴图片失败' }
    }
  }

  /**
   * 批量粘贴图片
   */
  pasteImages(positions: Vector2[]): ImageOperationResult {
    try {
      if (this.clipboard.length === 0) {
        return { success: false, error: '剪贴板为空' }
      }

      const pastedImages = this.clipboard.map((image, index) => {
        const position = positions[index] || positions[0]
        const pastedImage = image.clone()
        pastedImage.setPosition(position)
        return pastedImage
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: '批量粘贴图片失败' }
    }
  }

  /**
   * 获取剪贴板内容
   */
  getClipboard(): ImageElement[] {
    return [...this.clipboard]
  }

  /**
   * 清空剪贴板
   */
  clearClipboard(): void {
    this.clipboard = []
  }

  /**
   * 检查剪贴板是否有内容
   */
  hasClipboardContent(): boolean {
    return this.clipboard.length > 0
  }

  /**
   * 对齐图片
   */
  alignImages(images: ImageElement[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): ImageOperationResult {
    try {
      if (images.length < 2) {
        return { success: false, error: '至少需要2个图片才能对齐' }
      }

      const positions = images.map(img => img.position)
      
      let targetX: number
      let targetY: number

      switch (alignment) {
        case 'left':
          targetX = Math.min(...positions.map(p => p.x))
          images.forEach(img => img.setPosition({ x: targetX, y: img.position.y }))
          break
        case 'right':
          targetX = Math.max(...positions.map(p => p.x + img.size.x))
          images.forEach(img => img.setPosition({ x: targetX - img.size.x, y: img.position.y }))
          break
        case 'center':
          targetX = positions.reduce((sum, p, i) => sum + p.x + images[i].size.x / 2, 0) / positions.length
          images.forEach(img => img.setPosition({ x: targetX - img.size.x / 2, y: img.position.y }))
          break
        case 'top':
          targetY = Math.min(...positions.map(p => p.y))
          images.forEach(img => img.setPosition({ x: img.position.x, y: targetY }))
          break
        case 'bottom':
          targetY = Math.max(...positions.map(p => p.y + img.size.y))
          images.forEach(img => img.setPosition({ x: img.position.x, y: targetY - img.size.y }))
          break
        case 'middle':
          targetY = positions.reduce((sum, p, i) => sum + p.y + images[i].size.y / 2, 0) / positions.length
          images.forEach(img => img.setPosition({ x: img.position.x, y: targetY - img.size.y / 2 }))
          break
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '对齐图片失败' }
    }
  }

  /**
   * 分布图片
   */
  distributeImages(images: ImageElement[], direction: 'horizontal' | 'vertical'): ImageOperationResult {
    try {
      if (images.length < 3) {
        return { success: false, error: '至少需要3个图片才能分布' }
      }

      const positions = images.map(img => img.position)
      
      if (direction === 'horizontal') {
        const sortedImages = images.sort((a, b) => a.position.x - b.position.x)
        const startX = sortedImages[0].position.x
        const endX = sortedImages[sortedImages.length - 1].position.x
        const spacing = (endX - startX) / (sortedImages.length - 1)
        
        sortedImages.forEach((img, index) => {
          img.setPosition({ x: startX + spacing * index, y: img.position.y })
        })
      } else {
        const sortedImages = images.sort((a, b) => a.position.y - b.position.y)
        const startY = sortedImages[0].position.y
        const endY = sortedImages[sortedImages.length - 1].position.y
        const spacing = (endY - startY) / (sortedImages.length - 1)
        
        sortedImages.forEach((img, index) => {
          img.setPosition({ x: img.position.x, y: startY + spacing * index })
        })
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '分布图片失败' }
    }
  }

  /**
   * 获取图片边界框
   */
  getImageBounds(image: ImageElement): { x: number; y: number; width: number; height: number } {
    return {
      x: image.position.x,
      y: image.position.y,
      width: image.size.x,
      height: image.size.y
    }
  }

  /**
   * 获取多个图片的联合边界框
   */
  getImagesBounds(images: ImageElement[]): { x: number; y: number; width: number; height: number } {
    if (images.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const bounds = images.map(img => this.getImageBounds(img))
    const minX = Math.min(...bounds.map(b => b.x))
    const minY = Math.min(...bounds.map(b => b.y))
    const maxX = Math.max(...bounds.map(b => b.x + b.width))
    const maxY = Math.max(...bounds.map(b => b.y + b.height))

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 检查点是否在图片内
   */
  isPointInImage(point: Vector2, image: ImageElement): boolean {
    const bounds = this.getImageBounds(image)
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    )
  }

  /**
   * 获取图片在指定点的图片
   */
  getImageAtPoint(point: Vector2, images: ImageElement[]): ImageElement | null {
    // 从最上层开始检查
    for (let i = images.length - 1; i >= 0; i--) {
      if (this.isPointInImage(point, images[i])) {
        return images[i]
      }
    }
    return null
  }
}
