import type { CanvasElement, Vector2, ElementStyle } from '@/types/canvas.types'
import { ShapeType } from '../tools/ShapeTool'
import { ImageRenderer } from '../renderers/ImageRenderer'

/**
 * 导出管理器
 * 负责将画布内容导出为图片
 */
export class ExportManager {
  /**
   * 计算元素的边界框
   */
  private calculateBounds(elements: CanvasElement[]): {
    minX: number
    minY: number
    maxX: number
    maxY: number
  } {
    if (elements.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    elements.forEach(element => {
      if (!element.visible) return

      // 对于有points的元素（箭头、线条、路径），需要计算所有点的边界
      const points = element.data?.points || []
      if (points.length > 0) {
        points.forEach((point: Vector2) => {
          const absX = element.position.x + point.x
          const absY = element.position.y + point.y
          minX = Math.min(minX, absX)
          minY = Math.min(minY, absY)
          maxX = Math.max(maxX, absX)
          maxY = Math.max(maxY, absY)
        })
      } else {
        // 普通元素使用位置和大小
        const elementMinX = element.position.x
        const elementMinY = element.position.y
        const elementMaxX = element.position.x + element.size.x
        const elementMaxY = element.position.y + element.size.y

        minX = Math.min(minX, elementMinX)
        minY = Math.min(minY, elementMinY)
        maxX = Math.max(maxX, elementMaxX)
        maxY = Math.max(maxY, elementMaxY)
      }
    })

    // 添加一些边距
    const padding = 20
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    }
  }

  /**
   * 将元素渲染到canvas上
   */
  private async renderElementToCanvas(
    ctx: CanvasRenderingContext2D,
    element: CanvasElement,
    offsetX: number,
    offsetY: number,
    imageRenderer?: ImageRenderer
  ): Promise<void> {
    if (!element.visible) return

    ctx.save()

    // 应用偏移（使元素相对于边界框左上角定位）
    const x = element.position.x - offsetX
    const y = element.position.y - offsetY

    // 移动到元素中心点
    const centerX = x + element.size.x / 2
    const centerY = y + element.size.y / 2
    ctx.translate(centerX, centerY)

    // 应用旋转
    if (element.rotation !== 0) {
      ctx.rotate((element.rotation * Math.PI) / 180)
    }

    // 移动到元素的左上角（相对于中心点）
    ctx.translate(-element.size.x / 2, -element.size.y / 2)

    // 根据元素类型渲染
    switch (element.type) {
      case 'shape':
        this.renderShape(ctx, element)
        break
      case 'text':
        this.renderText(ctx, element)
        break
      case 'path':
        this.renderPath(ctx, element)
        break
      case 'image':
        await this.renderImage(ctx, element, imageRenderer)
        break
      case 'arrow':
        this.renderArrow(ctx, element, offsetX, offsetY)
        break
      case 'line':
        this.renderLine(ctx, element, offsetX, offsetY)
        break
    }

    ctx.restore()
  }

  /**
   * 渲染形状
   */
  private renderShape(ctx: CanvasRenderingContext2D, element: CanvasElement): void {
    const width = element.size.x
    const height = element.size.y
    const style = element.style
    const shapeType = element.data?.shapeType || element.data?.shape || ShapeType.RECTANGLE

    this.applyStyle(ctx, style)

    ctx.beginPath()

    switch (shapeType) {
      case ShapeType.RECTANGLE:
      case 'rectangle':
        ctx.rect(0, 0, width, height)
        break
      case ShapeType.CIRCLE:
      case 'circle':
        ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
        break
      case ShapeType.TRIANGLE:
      case 'triangle':
        ctx.moveTo(width / 2, 0)
        ctx.lineTo(0, height)
        ctx.lineTo(width, height)
        ctx.closePath()
        break
      case ShapeType.DIAMOND:
      case 'diamond':
        ctx.moveTo(width / 2, 0)
        ctx.lineTo(width, height / 2)
        ctx.lineTo(width / 2, height)
        ctx.lineTo(0, height / 2)
        ctx.closePath()
        break
      case 'ellipse':
      case ShapeType.ELLIPSE:
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        break
      case ShapeType.STAR:
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) / 2
        ctx.moveTo(centerX, centerY - radius)
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
          ctx.lineTo(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          )
        }
        ctx.closePath()
        break
    }

    if (style.fill) {
      ctx.fill()
    }
    if (style.stroke) {
      ctx.stroke()
    }

    // 渲染形状中的文字
    this.renderShapeText(ctx, element)
  }

  /**
   * 渲染形状中的文字
   */
  private renderShapeText(ctx: CanvasRenderingContext2D, element: CanvasElement): void {
    const text = element.data?.text
    if (!text) return

    const width = element.size.x
    const height = element.size.y
    const textStyle = element.data?.textStyle || {}

    const fontSize = textStyle.fontSize || 16
    const fontFamily = textStyle.fontFamily || 'Arial'
    const fontWeight = textStyle.fontWeight || 'normal'
    const fontStyle = textStyle.fontStyle || 'normal'
    const textAlign = textStyle.textAlign || 'center'
    const textColor = textStyle.color || '#000000'

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.textAlign = textAlign as CanvasTextAlign
    ctx.textBaseline = 'middle'

    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2
    const totalTextHeight = lines.length * lineHeight
    const startY = (height - totalTextHeight) / 2 + lineHeight / 2

    let drawX = width / 2
    if (textAlign === 'left') {
      drawX = 10
    } else if (textAlign === 'right') {
      drawX = width - 10
    }

    let currentY = startY
    for (const line of lines) {
      ctx.fillText(line, drawX, currentY)
      currentY += lineHeight
    }
  }

  /**
   * 渲染文本
   */
  private renderText(ctx: CanvasRenderingContext2D, element: CanvasElement): void {
    const width = element.size.x
    const height = element.size.y
    const style = element.style
    const text = element.data?.text || ''

    this.applyStyle(ctx, style)

    const fontSize = style.fontSize || 16
    const fontFamily = style.fontFamily || 'Arial'
    const fontWeight = style.fontWeight || 'normal'
    const fontStyle = style.fontStyle || 'normal'
    const textAlign = style.textAlign || 'left'
    const textColor = style.fill || '#000000'

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.textAlign = textAlign as CanvasTextAlign
    ctx.textBaseline = 'top'

    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2
    let currentY = 0

    for (const line of lines) {
      let drawX = 0
      if (textAlign === 'center') {
        drawX = width / 2
      } else if (textAlign === 'right') {
        drawX = width
      }
      ctx.fillText(line, drawX, currentY)
      currentY += lineHeight
    }
  }

  /**
   * 渲染路径
   */
  private renderPath(ctx: CanvasRenderingContext2D, element: CanvasElement): void {
    const style = element.style
    const pathData = element.data?.pathData || ''

    this.applyStyle(ctx, style)

    const path = new Path2D(pathData)
    if (style.fill) {
      ctx.fill(path)
    }
    if (style.stroke) {
      ctx.stroke(path)
    }
  }

  /**
   * 渲染图片
   */
  private async renderImage(
    ctx: CanvasRenderingContext2D,
    element: CanvasElement,
    _imageRenderer?: ImageRenderer
  ): Promise<void> {
    const width = element.size.x
    const height = element.size.y
    const imageData = element.data as any
    const imageSrc = imageData?.src || imageData?.imageSrc

    if (!imageSrc) {
      this.renderImagePlaceholder(ctx, width, height)
      this.renderImageOverlayText(ctx, element)
      return
    }

    try {
      // 加载图片
      const img = await this.loadImage(imageSrc)
      
      if (!img) {
        this.renderImagePlaceholder(ctx, width, height)
        this.renderImageOverlayText(ctx, element)
        return
      }

      // 保存上下文状态
      ctx.save()

      // 应用透明度
      if (element.style.opacity !== undefined) {
        ctx.globalAlpha = element.style.opacity
      }

      // 检查是否有裁剪形状或圆角
      const hasCropShape = imageData.cropShape && imageData.cropShape !== 'rectangle'
      const hasBorderRadius = imageData.borderRadius && imageData.borderRadius > 0

      if (hasCropShape || hasBorderRadius) {
        // 创建裁剪路径
        this.createImageClipPath(ctx, 0, 0, width, height, imageData)
        
        // 应用滤镜
        this.applyImageFilter(ctx, imageData)
        
        // 绘制图片
        if (imageData.isCropped) {
          // 裁剪后的图片直接填充
          ctx.drawImage(img, 0, 0, width, height)
        } else {
          // 原始图片保持宽高比
          const imgAspectRatio = img.naturalWidth / img.naturalHeight
          const canvasAspectRatio = width / height
          
          let drawWidth, drawHeight, drawX, drawY
          
          if (imgAspectRatio > canvasAspectRatio) {
            drawWidth = width
            drawHeight = width / imgAspectRatio
            drawX = 0
            drawY = (height - drawHeight) / 2
          } else {
            drawHeight = height
            drawWidth = height * imgAspectRatio
            drawX = (width - drawWidth) / 2
            drawY = 0
          }
          
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
        }
        
        ctx.restore()
        
        // 绘制边框（在裁剪路径外）
        this.drawImageBorder(ctx, element, width, height, imageData)
      } else {
        // 没有裁剪，直接绘制
        // 应用滤镜
        this.applyImageFilter(ctx, imageData)
        
        // 绘制图片
        if (imageData.isCropped) {
          ctx.drawImage(img, 0, 0, width, height)
        } else {
          // 原始图片保持宽高比
          const imgAspectRatio = img.naturalWidth / img.naturalHeight
          const canvasAspectRatio = width / height
          
          let drawWidth, drawHeight, drawX, drawY
          
          if (imgAspectRatio > canvasAspectRatio) {
            drawWidth = width
            drawHeight = width / imgAspectRatio
            drawX = 0
            drawY = (height - drawHeight) / 2
          } else {
            drawHeight = height
            drawWidth = height * imgAspectRatio
            drawX = (width - drawWidth) / 2
            drawY = 0
          }
          
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
        }
        
        ctx.restore()
        
        // 绘制边框
        this.drawImageBorder(ctx, element, width, height, imageData)
      }

      // 渲染图片上的叠加文字
      this.renderImageOverlayText(ctx, element)
    } catch (error) {
      console.error('导出图片渲染失败:', error)
      this.renderImagePlaceholder(ctx, width, height)
      this.renderImageOverlayText(ctx, element)
    }
  }

  /**
   * 加载图片
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片加载失败'))
      
      img.src = src
    })
  }

  /**
   * 创建图片裁剪路径
   */
  private createImageClipPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    imageData: any
  ): void {
    ctx.beginPath()
    
    if (imageData.borderRadius && imageData.borderRadius > 0) {
      // 圆角矩形
      const radius = Math.min(imageData.borderRadius, Math.min(width, height) / 2)
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
    } else if (imageData.cropShape && imageData.cropShape !== 'rectangle') {
      // 自定义形状
      const centerX = x + width / 2
      const centerY = y + height / 2
      const radius = Math.min(width, height) / 2
      
      switch (imageData.cropShape) {
        case 'circle':
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
          break
        case 'ellipse':
          ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, 2 * Math.PI)
          break
        case 'triangle':
          ctx.moveTo(centerX, y)
          ctx.lineTo(x, y + height)
          ctx.lineTo(x + width, y + height)
          break
        case 'diamond':
          ctx.moveTo(centerX, y)
          ctx.lineTo(x + width, centerY)
          ctx.lineTo(centerX, y + height)
          ctx.lineTo(x, centerY)
          break
        default:
          ctx.rect(x, y, width, height)
      }
    } else {
      ctx.rect(x, y, width, height)
    }
    
    ctx.closePath()
    ctx.clip()
  }

  /**
   * 应用图片滤镜
   */
  private applyImageFilter(ctx: CanvasRenderingContext2D, imageData: any): void {
    if (!imageData.filter || imageData.filter === 'none') return

    switch (imageData.filter) {
      case 'grayscale':
        ctx.filter = 'grayscale(100%)'
        break
      case 'sepia':
        ctx.filter = 'sepia(100%)'
        break
      case 'blur':
        ctx.filter = 'blur(2px)'
        break
      case 'brightness':
        ctx.filter = 'brightness(1.2)'
        break
      default:
        ctx.filter = 'none'
    }
  }

  /**
   * 绘制图片边框
   */
  private drawImageBorder(
    ctx: CanvasRenderingContext2D,
    element: CanvasElement,
    width: number,
    height: number,
    imageData: any
  ): void {
    ctx.save()

    // 绘制自定义边框
    if (imageData.border && imageData.border.width > 0) {
      ctx.strokeStyle = imageData.border.color
      ctx.lineWidth = imageData.border.width
      
      if (imageData.border.style === 'dashed') {
        ctx.setLineDash([5, 5])
      } else if (imageData.border.style === 'dotted') {
        ctx.setLineDash([2, 2])
      } else {
        ctx.setLineDash([])
      }
      
      if (imageData.borderRadius && imageData.borderRadius > 0) {
        this.drawRoundedRect(ctx, 0, 0, width, height, imageData.borderRadius)
        ctx.stroke()
      } else {
        ctx.strokeRect(0, 0, width, height)
      }
    }

    // 绘制默认边框
    if (element.style.stroke && element.style.stroke !== 'transparent' && element.style.strokeWidth && element.style.strokeWidth > 0) {
      ctx.strokeStyle = element.style.stroke
      ctx.lineWidth = element.style.strokeWidth
      ctx.setLineDash(element.style.lineDash || [])
      
      if (imageData.borderRadius && imageData.borderRadius > 0) {
        this.drawRoundedRect(ctx, 0, 0, width, height, imageData.borderRadius)
        ctx.stroke()
      } else {
        ctx.strokeRect(0, 0, width, height)
      }
    }

    ctx.restore()
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const maxRadius = Math.min(width, height) / 2
    const actualRadius = Math.min(radius, maxRadius)
    
    ctx.beginPath()
    ctx.moveTo(x + actualRadius, y)
    ctx.lineTo(x + width - actualRadius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + actualRadius)
    ctx.lineTo(x + width, y + height - actualRadius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - actualRadius, y + height)
    ctx.lineTo(x + actualRadius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - actualRadius)
    ctx.lineTo(x, y + actualRadius)
    ctx.quadraticCurveTo(x, y, x + actualRadius, y)
    ctx.closePath()
  }

  /**
   * 渲染图片占位符
   */
  private renderImagePlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save()
    ctx.fillStyle = '#f0f0f0'
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    ctx.fillRect(0, 0, width, height)
    ctx.strokeRect(0, 0, width, height)
    ctx.fillStyle = '#999'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📷', width / 2, height / 2)
    ctx.restore()
  }

  /**
   * 渲染图片叠加文字
   */
  private renderImageOverlayText(ctx: CanvasRenderingContext2D, element: CanvasElement): void {
    const overlayText = element.data?.overlayText
    if (!overlayText || !overlayText.visible || !overlayText.text) {
      return
    }

    ctx.save()

    const fontSize = overlayText.fontSize || 20
    const fontFamily = overlayText.fontFamily || 'Arial'
    const fontWeight = overlayText.fontWeight || 'normal'
    const fontStyle = overlayText.fontStyle || 'normal'
    const textAlign = overlayText.textAlign || 'center'
    const color = overlayText.color || '#ff0000'

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = textAlign as CanvasTextAlign
    ctx.textBaseline = 'middle'

    const textX = element.size.x * overlayText.position.x
    const textY = element.size.y * overlayText.position.y

    ctx.fillText(overlayText.text, textX, textY)
    ctx.restore()
  }

  /**
   * 渲染箭头
   */
  private renderArrow(
    ctx: CanvasRenderingContext2D,
    element: CanvasElement,
    offsetX: number,
    offsetY: number
  ): void {
    const style = element.style
    let points = element.data?.points || []

    // 如果没有points数组，尝试从startPoint和endPoint构建
    if (points.length === 0 && element.data?.startPoint && element.data?.endPoint) {
      points = [
        {
          x: element.data.startPoint.x - element.position.x,
          y: element.data.startPoint.y - element.position.y
        },
        {
          x: element.data.endPoint.x - element.position.x,
          y: element.data.endPoint.y - element.position.y
        }
      ]
    }

    // 转换为绝对坐标
    const absolutePoints = points.map((point: Vector2) => ({
      x: element.position.x + point.x - offsetX,
      y: element.position.y + point.y - offsetY
    }))

    const arrowStyle = element.data?.arrowStyle || {}
    const arrowType = element.data?.arrowType || 'line'

    ctx.save()
    ctx.translate(-element.position.x + offsetX, -element.position.y + offsetY)

    this.applyStyle(ctx, style)

    if (absolutePoints.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(absolutePoints[0].x, absolutePoints[0].y)

      for (let i = 1; i < absolutePoints.length; i++) {
        ctx.lineTo(absolutePoints[i].x, absolutePoints[i].y)
      }

      if (style.stroke) {
        ctx.stroke()
      }

      // 绘制箭头头部
      if (arrowType === 'bidirectional') {
        this.drawArrowHead(ctx, absolutePoints[1], absolutePoints[0], arrowStyle)
        this.drawArrowHead(
          ctx,
          absolutePoints[absolutePoints.length - 2],
          absolutePoints[absolutePoints.length - 1],
          arrowStyle
        )
      } else {
        this.drawArrowHead(
          ctx,
          absolutePoints[absolutePoints.length - 2],
          absolutePoints[absolutePoints.length - 1],
          arrowStyle
        )
      }
    }

    ctx.restore()
  }

  /**
   * 渲染线条
   */
  private renderLine(
    ctx: CanvasRenderingContext2D,
    element: CanvasElement,
    offsetX: number,
    offsetY: number
  ): void {
    const style = element.style
    const points = element.data?.points || []

    // 转换为绝对坐标
    const absolutePoints = points.map((point: Vector2) => ({
      x: element.position.x + point.x - offsetX,
      y: element.position.y + point.y - offsetY
    }))

    ctx.save()
    ctx.translate(-element.position.x + offsetX, -element.position.y + offsetY)

    this.applyStyle(ctx, style)

    if (absolutePoints.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(absolutePoints[0].x, absolutePoints[0].y)

      for (let i = 1; i < absolutePoints.length; i++) {
        ctx.lineTo(absolutePoints[i].x, absolutePoints[i].y)
      }

      if (style.stroke) {
        ctx.stroke()
      }
    }

    ctx.restore()
  }

  /**
   * 绘制箭头头部
   */
  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    start: Vector2,
    end: Vector2,
    arrowStyle: any
  ): void {
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const arrowLength = arrowStyle.size || 10
    const arrowShape = arrowStyle.shape || 'triangle'

    ctx.save()
    ctx.fillStyle = arrowStyle.color || '#000000'
    ctx.strokeStyle = arrowStyle.strokeColor || '#000000'
    ctx.lineWidth = arrowStyle.strokeWidth || 2

    ctx.beginPath()

    switch (arrowShape) {
      case 'triangle':
        const tipX = end.x
        const tipY = end.y
        const leftX = end.x - Math.cos(angle - Math.PI / 6) * arrowLength
        const leftY = end.y - Math.sin(angle - Math.PI / 6) * arrowLength
        const rightX = end.x - Math.cos(angle + Math.PI / 6) * arrowLength
        const rightY = end.y - Math.sin(angle + Math.PI / 6) * arrowLength

        ctx.moveTo(tipX, tipY)
        ctx.lineTo(leftX, leftY)
        ctx.lineTo(rightX, rightY)
        ctx.closePath()
        ctx.fill()
        break

      case 'circle':
        ctx.arc(end.x, end.y, arrowLength * 0.3, 0, 2 * Math.PI)
        ctx.fill()
        break

      case 'square':
        const size = arrowLength * 0.4
        ctx.rect(end.x - size / 2, end.y - size / 2, size, size)
        ctx.fill()
        break
    }

    ctx.restore()
  }

  /**
   * 应用样式
   */
  private applyStyle(ctx: CanvasRenderingContext2D, style: ElementStyle): void {
    if (style.fill) {
      ctx.fillStyle = style.fill
    }
    if (style.stroke) {
      ctx.strokeStyle = style.stroke
    }
    if (style.strokeWidth) {
      ctx.lineWidth = style.strokeWidth
    }
    if (style.lineCap) {
      ctx.lineCap = style.lineCap as CanvasLineCap
    }
    if (style.opacity !== undefined) {
      ctx.globalAlpha = style.opacity
    }

    if (style.lineDash) {
      ctx.setLineDash(style.lineDash)
    } else if (style.lineStyle) {
      this.applyLineStyle(ctx, style.lineStyle)
    }
  }

  /**
   * 应用线条样式
   */
  private applyLineStyle(ctx: CanvasRenderingContext2D, lineStyle: string): void {
    switch (lineStyle) {
      case 'solid':
        ctx.setLineDash([])
        break
      case 'dashed':
        ctx.setLineDash([10, 5])
        break
      case 'dotted':
        ctx.setLineDash([2, 3])
        break
      case 'dash-dot':
        ctx.setLineDash([10, 5, 2, 5])
        break
      default:
        ctx.setLineDash([])
        break
    }
  }

  /**
   * 导出为图片
   * @param elements 要导出的元素列表，如果为空则导出所有元素
   * @param format 导出格式：'png' | 'jpg'
   * @param quality JPG质量（0-1），仅对JPG格式有效
   * @param backgroundColor 背景颜色
   */
  async exportToImage(
    elements: CanvasElement[],
    format: 'png' | 'jpg' = 'png',
    quality: number = 0.92,
    backgroundColor: string = '#ffffff',
    imageRenderer?: ImageRenderer
  ): Promise<string> {
    // 计算边界框
    const bounds = this.calculateBounds(elements)
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // 创建离屏canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('无法创建canvas上下文')
    }

    // 设置背景色
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // 按图层顺序排序元素
    const sortedElements = [...elements].sort((a, b) => {
      const layerA = typeof a.layer === 'string' ? parseInt(a.layer) || 0 : a.layer
      const layerB = typeof b.layer === 'string' ? parseInt(b.layer) || 0 : b.layer
      return layerA - layerB
    })

    // 渲染所有元素（等待图片加载完成）
    for (const element of sortedElements) {
      await this.renderElementToCanvas(ctx, element, bounds.minX, bounds.minY, imageRenderer)
    }

    // 转换为图片
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
    const dataUrl = canvas.toDataURL(mimeType, format === 'jpg' ? quality : undefined)

    return dataUrl
  }

  /**
   * 下载图片
   */
  downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  /**
   * 导出并下载图片
   */
  async exportAndDownload(
    elements: CanvasElement[],
    filename: string,
    format: 'png' | 'jpg' = 'png',
    quality: number = 0.92,
    backgroundColor: string = '#ffffff',
    imageRenderer?: ImageRenderer
  ): Promise<void> {
    const dataUrl = await this.exportToImage(elements, format, quality, backgroundColor, imageRenderer)
    const extension = format === 'jpg' ? 'jpg' : 'png'
    const fullFilename = filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`
    this.downloadImage(dataUrl, fullFilename)
  }
}

