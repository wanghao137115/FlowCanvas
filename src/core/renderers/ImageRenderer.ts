import { CanvasElement, ElementType } from '@/types/canvas.types'
import { ImageElement } from '../elements/ImageElement'

/**
 * 图片渲染器
 */
export class ImageRenderer {
  private ctx: CanvasRenderingContext2D
  private viewport: { scale: number; offset: { x: number; y: number } }

  constructor(ctx: CanvasRenderingContext2D, viewport: { scale: number; offset: { x: number; y: number } }) {
    this.ctx = ctx
    this.viewport = viewport
  }

  /**
   * 更新视口信息
   */
  updateViewport(viewport: { scale: number; offset: { x: number; y: number } }): void {
    this.viewport = viewport
  }

  /**
   * 渲染图片元素
   */
  async renderImage(element: CanvasElement): Promise<void> {
    if (element.type !== ElementType.IMAGE) {
      return
    }

    const imageElement = element as ImageElement
    
    // 检查图片是否可见
    if (!imageElement.visible) {
      return
    }

    // 获取图片对象
    let img: HTMLImageElement | null = null
    try {
      img = await imageElement.loadImage()
    } catch (error) {
      // 图片加载失败，渲染占位符
      this.renderImagePlaceholder(imageElement)
      return
    }

    if (!img) {
      this.renderImagePlaceholder(imageElement)
      return
    }

    // 保存当前状态
    this.ctx.save()

    try {
      // 应用变换
      this.applyTransforms(imageElement)

      // 应用样式
      this.applyStyles(imageElement)

      // 绘制图片
      this.drawImage(img, imageElement)

      // 绘制文字叠加
      this.renderTextOverlay(imageElement)
    } catch (error) {
      // 渲染过程中出错，渲染占位符
      this.renderImagePlaceholder(imageElement)
    } finally {
      // 恢复状态
      this.ctx.restore()
    }
  }

  /**
   * 应用变换
   */
  private applyTransforms(element: ImageElement): void {
    const { position, size, rotation } = element
    const { scale, offset } = this.viewport

    // 计算画布坐标
    const canvasX = (position.x + offset.x) * scale
    const canvasY = (position.y + offset.y) * scale
    const canvasWidth = size.x * scale
    const canvasHeight = size.y * scale


    // 移动到图片中心
    this.ctx.translate(canvasX + canvasWidth / 2, canvasY + canvasHeight / 2)

    // 应用旋转
    if (rotation !== 0) {
      this.ctx.rotate((rotation * Math.PI) / 180)
    }

    // 移动到图片左上角
    this.ctx.translate(-canvasWidth / 2, -canvasHeight / 2)
  }

  /**
   * 应用样式
   */
  private applyStyles(element: ImageElement): void {
    const { style } = element


    // 应用透明度
    if (style.opacity !== undefined) {
      this.ctx.globalAlpha = style.opacity
    }

    // 应用混合模式
    if ((style as any).blendMode) {
      this.ctx.globalCompositeOperation = (style as any).blendMode
    }
  }

  /**
   * 绘制图片
   */
  private drawImage(img: HTMLImageElement, element: ImageElement): void {
    const { size, data } = element
    const { scale } = this.viewport

    const canvasWidth = size.x * scale
    const canvasHeight = size.y * scale


    // 检查是否有裁剪形状或圆角，如果有则应用裁剪
    if ((data.cropShape && data.cropShape !== 'rectangle') || (data.borderRadius && data.borderRadius > 0)) {
    
    // 保存当前状态
    this.ctx.save()
    
    // 重置滤镜以确保裁剪路径正常工作
    this.ctx.filter = 'none'
    
    // 创建裁剪路径
    this.createClipPath(0, 0, canvasWidth, canvasHeight, element)
    
    // 应用滤镜（在裁剪路径内应用）
    this.applyFilter(element)
    
    // 先填充背景色以确保可见性
    this.ctx.fillStyle = '#f0f0f0' // 浅灰色背景
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    
    // 检查是否为裁剪后的图片
    if (data.isCropped) {
      // 裁剪后的图片直接填充到指定尺寸
      this.ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
    } else {
      // 原始图片保持宽高比
      const imgAspectRatio = img.naturalWidth / img.naturalHeight
      const canvasAspectRatio = canvasWidth / canvasHeight
      
      let drawWidth, drawHeight, drawX, drawY
      
      if (imgAspectRatio > canvasAspectRatio) {
        // 图片更宽，以宽度为准
        drawWidth = canvasWidth
        drawHeight = canvasWidth / imgAspectRatio
        drawX = 0
        drawY = (canvasHeight - drawHeight) / 2
      } else {
        // 图片更高，以高度为准
        drawHeight = canvasHeight
        drawWidth = canvasHeight * imgAspectRatio
        drawX = (canvasWidth - drawWidth) / 2
        drawY = 0
      }
      
      // 绘制图片（保持宽高比并居中）
      this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    }
    
    // 恢复状态（这会清除裁剪路径）
    this.ctx.restore()
    
    // 绘制边框（在裁剪路径外绘制，不会被裁剪）
    this.drawShapeBorder(element, canvasWidth, canvasHeight)
    } else {
      // 应用滤镜
      this.applyFilter(element)
      
      // 先填充背景色以确保可见性
      this.ctx.fillStyle = '#f0f0f0' // 浅灰色背景
      this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      // 检查是否为裁剪后的图片
      if (data.isCropped) {
        // 裁剪后的图片直接填充到指定尺寸
        this.ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      } else {
        // 原始图片保持宽高比
        const imgAspectRatio = img.naturalWidth / img.naturalHeight
        const canvasAspectRatio = canvasWidth / canvasHeight
        
        let drawWidth, drawHeight, drawX, drawY
        
        if (imgAspectRatio > canvasAspectRatio) {
          // 图片更宽，以宽度为准
          drawWidth = canvasWidth
          drawHeight = canvasWidth / imgAspectRatio
          drawX = 0
          drawY = (canvasHeight - drawHeight) / 2
        } else {
          // 图片更高，以高度为准
          drawHeight = canvasHeight
          drawWidth = canvasHeight * imgAspectRatio
          drawX = (canvasWidth - drawWidth) / 2
          drawY = 0
        }
        
        // 绘制图片（保持宽高比并居中）
        this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      }
      
      // 绘制普通边框
      this.drawBorder(element, canvasWidth, canvasHeight)
    }
  }

  /**
   * 应用滤镜
   */
  private applyFilter(element: ImageElement): void {
    const { data } = element
    if (!data.filter || data.filter === 'none') return

    // 注意：Canvas 2D API 的滤镜支持有限
    // 这里只实现基本的滤镜效果
    switch (data.filter) {
      case 'grayscale':
        this.ctx.filter = 'grayscale(100%)'
        break
      case 'sepia':
        this.ctx.filter = 'sepia(100%)'
        break
      case 'blur':
        this.ctx.filter = 'blur(2px)'
        break
      case 'brightness':
        this.ctx.filter = 'brightness(1.2)'
        break
    }
  }

  /**
   * 绘制形状边框
   */
  private drawShapeBorder(element: ImageElement, width: number, height: number): void {
    const { data } = element
    const { scale } = this.viewport
    
    // 如果有圆角，使用圆角边框
    if (data.borderRadius && data.borderRadius > 0) {
      this.drawRoundedBorder(element, width, height, data.borderRadius * scale)
      return
    }
    
    // 如果有裁剪形状，绘制形状边框
    if (data.cropShape && data.cropShape !== 'rectangle') {
      this.drawCustomShapeBorder(element, width, height)
      return
    }
    
    // 默认矩形边框
    this.drawBorder(element, width, height)
  }

  /**
   * 绘制自定义形状边框
   */
  private drawCustomShapeBorder(element: ImageElement, width: number, height: number): void {
    const { style, data } = element
    const { scale } = this.viewport
    
    // 绘制自定义边框
    if (data.border && data.border.width > 0) {
      this.ctx.strokeStyle = data.border.color
      this.ctx.lineWidth = data.border.width * scale
      
      // 设置边框样式
      if (data.border.style === 'dashed') {
        this.ctx.setLineDash([5, 5])
      } else if (data.border.style === 'dotted') {
        this.ctx.setLineDash([2, 2])
      } else {
        this.ctx.setLineDash([])
      }
      
      // 创建形状路径并描边
      this.ctx.beginPath()
      this.createShapePath(0, 0, width, height, data.cropShape!)
      this.ctx.stroke()
    }

    // 绘制默认边框
    if (style.stroke && style.stroke !== 'transparent' && style.strokeWidth && style.strokeWidth > 0) {
      this.ctx.strokeStyle = style.stroke
      this.ctx.lineWidth = style.strokeWidth * scale
      this.ctx.setLineDash(style.lineDash || [])
      this.ctx.lineCap = (style.lineCap as CanvasLineCap) || 'butt'
      
      // 创建形状路径并描边
      this.ctx.beginPath()
      this.createShapePath(0, 0, width, height, data.cropShape!)
      this.ctx.stroke()
    }

    // 如果没有设置任何边框，绘制一个默认的细边框
    if ((!data.border || data.border.width === 0) && 
        (!style.stroke || style.stroke === 'transparent' || style.strokeWidth === 0)) {
      this.ctx.strokeStyle = '#e0e0e0' // 浅灰色边框
      this.ctx.lineWidth = 1 * scale
      this.ctx.setLineDash([])
      
      // 创建形状路径并描边
      this.ctx.beginPath()
      this.createShapePath(0, 0, width, height, data.cropShape!)
      this.ctx.stroke()
    }
  }

  /**
   * 绘制圆角边框（在裁剪路径外）
   */
  private drawRoundedBorder(element: ImageElement, width: number, height: number, radius: number): void {
    const { style, data } = element


    // 绘制自定义边框
    if (data.border && data.border.width > 0) {
      this.ctx.strokeStyle = data.border.color
      this.ctx.lineWidth = data.border.width * this.viewport.scale
      
      // 设置边框样式
      if (data.border.style === 'dashed') {
        this.ctx.setLineDash([5, 5])
      } else if (data.border.style === 'dotted') {
        this.ctx.setLineDash([2, 2])
      } else {
        this.ctx.setLineDash([])
      }
      
      // 绘制圆角边框
      this.drawRoundedRect(0, 0, width, height, radius)
      this.ctx.stroke()
    }

    // 绘制默认边框
    if (style.stroke && style.stroke !== 'transparent' && style.strokeWidth && style.strokeWidth > 0) {
      this.ctx.strokeStyle = style.stroke
      this.ctx.lineWidth = style.strokeWidth * this.viewport.scale
      this.ctx.setLineDash(style.lineDash || [])
      this.ctx.lineCap = (style.lineCap as CanvasLineCap) || 'butt'
      
      // 绘制圆角边框
      this.drawRoundedRect(0, 0, width, height, radius)
      this.ctx.stroke()
    }

    // 如果没有设置任何边框，为圆角图片绘制一个默认的细边框
    if ((!data.border || data.border.width === 0) && 
        (!style.stroke || style.stroke === 'transparent' || style.strokeWidth === 0)) {
      this.ctx.strokeStyle = '#e0e0e0' // 浅灰色边框
      this.ctx.lineWidth = 1 * this.viewport.scale
      this.ctx.setLineDash([])
      
      // 绘制圆角边框
      this.drawRoundedRect(0, 0, width, height, radius)
      this.ctx.stroke()
    }
  }

  /**
   * 绘制边框
   */
  private drawBorder(element: ImageElement, width: number, height: number): void {
    const { style, data } = element


    // 绘制自定义边框
    if (data.border && data.border.width > 0) {
      this.ctx.strokeStyle = data.border.color
      this.ctx.lineWidth = data.border.width * this.viewport.scale
      
      // 设置边框样式
      if (data.border.style === 'dashed') {
        this.ctx.setLineDash([5, 5])
      } else if (data.border.style === 'dotted') {
        this.ctx.setLineDash([2, 2])
      } else {
        this.ctx.setLineDash([])
      }
      
      // 应用圆角
      if (data.borderRadius && data.borderRadius > 0) {
        this.drawRoundedRect(0, 0, width, height, data.borderRadius * this.viewport.scale)
        this.ctx.stroke()
      } else {
        this.ctx.beginPath()
        this.ctx.rect(0, 0, width, height)
        this.ctx.stroke()
      }
    }

    // 绘制默认边框
    if (style.stroke && style.stroke !== 'transparent' && style.strokeWidth && style.strokeWidth > 0) {
      this.ctx.strokeStyle = style.stroke
      this.ctx.lineWidth = style.strokeWidth * this.viewport.scale
      this.ctx.setLineDash(style.lineDash || [])
      this.ctx.lineCap = (style.lineCap as CanvasLineCap) || 'butt'
      
      // 应用圆角到默认边框
      if (data.borderRadius && data.borderRadius > 0) {
        this.drawRoundedRect(0, 0, width, height, data.borderRadius * this.viewport.scale)
        this.ctx.stroke()
      } else {
        this.ctx.strokeRect(0, 0, width, height)
      }
    }
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }

  /**
   * 创建裁剪路径
   */
  private createClipPath(x: number, y: number, width: number, height: number, element: ImageElement): void {
    const { data } = element
    const { scale } = this.viewport
    
    this.ctx.beginPath()
    
    // 如果有圆角，使用圆角矩形
    if (data.borderRadius && data.borderRadius > 0) {
      const radius = data.borderRadius * scale
      const maxRadius = Math.min(width, height) / 2
      const actualRadius = Math.min(radius, maxRadius)
      
      this.ctx.moveTo(x + actualRadius, y)
      this.ctx.lineTo(x + width - actualRadius, y)
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + actualRadius)
      this.ctx.lineTo(x + width, y + height - actualRadius)
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - actualRadius, y + height)
      this.ctx.lineTo(x + actualRadius, y + height)
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - actualRadius)
      this.ctx.lineTo(x, y + actualRadius)
      this.ctx.quadraticCurveTo(x, y, x + actualRadius, y)
    } else if (data.cropShape && data.cropShape !== 'rectangle') {
      // 根据裁剪形状创建路径
      this.createShapePath(x, y, width, height, data.cropShape)
    } else {
      // 默认矩形
      this.ctx.rect(x, y, width, height)
    }
    
    this.ctx.closePath()
    this.ctx.clip()
  }

  /**
   * 创建形状路径
   */
  private createShapePath(x: number, y: number, width: number, height: number, shape: string): void {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radius = Math.min(width, height) / 2
    
    switch (shape) {
      case 'circle':
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        break
        
      case 'ellipse':
        this.ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, 2 * Math.PI)
        break
        
      case 'triangle':
        this.ctx.moveTo(centerX, y)
        this.ctx.lineTo(x, y + height)
        this.ctx.lineTo(x + width, y + height)
        break
        
      case 'diamond':
        this.ctx.moveTo(centerX, y)
        this.ctx.lineTo(x + width, centerY)
        this.ctx.lineTo(centerX, y + height)
        this.ctx.lineTo(x, centerY)
        break
        
      case 'hexagon':
        this.createPolygonPath(centerX, centerY, radius, 6)
        break
        
      case 'octagon':
        this.createPolygonPath(centerX, centerY, radius, 8)
        break
        
      case 'pentagon':
        this.createPolygonPath(centerX, centerY, radius, 5)
        break
        
      case 'heart':
        this.createHeartPath(centerX, centerY, radius)
        break
        
      case 'star':
        this.createStarPath(centerX, centerY, radius)
        break
        
      case 'cloud':
        this.createCloudPath(x, y, width, height)
        break
        
      case 'flower':
        this.createFlowerPath(centerX, centerY, radius)
        break
        
      case 'egg':
        this.createEggPath(centerX, centerY, width / 2, height / 2)
        break
        
      case 'parallelogram':
        this.ctx.moveTo(x + width * 0.2, y)
        this.ctx.lineTo(x + width, y)
        this.ctx.lineTo(x + width * 0.8, y + height)
        this.ctx.lineTo(x, y + height)
        break
        
      case 'squircle':
        this.createSquirclePath(x, y, width, height)
        break
        
      case 'stadium':
        this.createStadiumPath(x, y, width, height)
        break
        
      case 'clover':
        this.createCloverPath(centerX, centerY, radius)
        break
        
      case 'wave':
        this.createWavePath(x, y, width, height)
        break
        
      case 'blob':
        this.createBlobPath(centerX, centerY, radius)
        break
        
      default:
        // 默认矩形
        this.ctx.rect(x, y, width, height)
    }
  }

  /**
   * 创建多边形路径
   */
  private createPolygonPath(centerX: number, centerY: number, radius: number, sides: number): void {
    const angle = (2 * Math.PI) / sides
    
    for (let i = 0; i < sides; i++) {
      const x = centerX + radius * Math.cos(i * angle - Math.PI / 2)
      const y = centerY + radius * Math.sin(i * angle - Math.PI / 2)
      
      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }
  }

  /**
   * 创建心形路径
   */
  private createHeartPath(centerX: number, centerY: number, radius: number): void {
    const topCurveHeight = radius * 0.3
    this.ctx.moveTo(centerX, centerY + topCurveHeight)
    this.ctx.bezierCurveTo(centerX, centerY, centerX - radius, centerY, centerX - radius, centerY + topCurveHeight)
    this.ctx.bezierCurveTo(centerX - radius, centerY + (radius + topCurveHeight) / 2, centerX, centerY + (radius + topCurveHeight) / 2, centerX, centerY + radius)
    this.ctx.bezierCurveTo(centerX, centerY + (radius + topCurveHeight) / 2, centerX + radius, centerY + (radius + topCurveHeight) / 2, centerX + radius, centerY + topCurveHeight)
    this.ctx.bezierCurveTo(centerX + radius, centerY, centerX, centerY, centerX, centerY + topCurveHeight)
  }

  /**
   * 创建星形路径
   */
  private createStarPath(centerX: number, centerY: number, radius: number): void {
    const outerRadius = radius
    const innerRadius = radius * 0.4
    const spikes = 5
    const step = Math.PI / spikes
    
    for (let i = 0; i < 2 * spikes; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius
      const x = centerX + r * Math.cos(i * step - Math.PI / 2)
      const y = centerY + r * Math.sin(i * step - Math.PI / 2)
      
      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }
  }

  /**
   * 创建云朵路径
   */
  private createCloudPath(x: number, y: number, width: number, height: number): void {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radius = Math.min(width, height) / 3
    
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    this.ctx.arc(centerX - radius * 0.5, centerY - radius * 0.3, radius * 0.6, 0, 2 * Math.PI)
    this.ctx.arc(centerX + radius * 0.5, centerY - radius * 0.3, radius * 0.6, 0, 2 * Math.PI)
  }

  /**
   * 创建花朵路径
   */
  private createFlowerPath(centerX: number, centerY: number, radius: number): void {
    const petals = 5
    const petalRadius = radius * 0.6
    const centerRadius = radius * 0.3
    
    // 绘制花瓣
    for (let i = 0; i < petals; i++) {
      const angle = (2 * Math.PI * i) / petals
      const petalX = centerX + Math.cos(angle) * radius * 0.3
      const petalY = centerY + Math.sin(angle) * radius * 0.3
      this.ctx.arc(petalX, petalY, petalRadius, 0, 2 * Math.PI)
    }
    
    // 绘制中心
    this.ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI)
  }

  /**
   * 创建蛋形路径
   */
  private createEggPath(centerX: number, centerY: number, width: number, height: number): void {
    this.ctx.ellipse(centerX, centerY, width, height, 0, 0, 2 * Math.PI)
  }

  /**
   * 创建超圆角路径
   */
  private createSquirclePath(x: number, y: number, width: number, height: number): void {
    const radius = Math.min(width, height) * 0.2
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
  }

  /**
   * 创建体育场形路径
   */
  private createStadiumPath(x: number, y: number, width: number, height: number): void {
    const radius = height / 2
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2)
  }

  /**
   * 创建四叶草路径
   */
  private createCloverPath(centerX: number, centerY: number, radius: number): void {
    const leafRadius = radius * 0.4
    
    // 四个叶子
    this.ctx.arc(centerX, centerY - radius * 0.3, leafRadius, 0, 2 * Math.PI)
    this.ctx.arc(centerX + radius * 0.3, centerY, leafRadius, 0, 2 * Math.PI)
    this.ctx.arc(centerX, centerY + radius * 0.3, leafRadius, 0, 2 * Math.PI)
    this.ctx.arc(centerX - radius * 0.3, centerY, leafRadius, 0, 2 * Math.PI)
    
    // 中心
    this.ctx.arc(centerX, centerY, radius * 0.2, 0, 2 * Math.PI)
  }

  /**
   * 创建波浪路径
   */
  private createWavePath(x: number, y: number, width: number, height: number): void {
    const waveHeight = height * 0.3
    const waveLength = width / 4
    
    this.ctx.moveTo(x, y + height / 2)
    
    for (let i = 0; i <= 4; i++) {
      const waveX = x + i * waveLength
      const waveY = y + height / 2 + Math.sin(i * Math.PI) * waveHeight
      this.ctx.quadraticCurveTo(waveX - waveLength / 2, waveY, waveX, waveY)
    }
    
    this.ctx.lineTo(x + width, y + height)
    this.ctx.lineTo(x, y + height)
  }

  /**
   * 创建水滴路径
   */
  private createBlobPath(centerX: number, centerY: number, radius: number): void {
    this.ctx.ellipse(centerX, centerY, radius, radius * 1.2, 0, 0, 2 * Math.PI)
  }

  /**
   * 渲染图片占位符
   */
  private renderImagePlaceholder(element: ImageElement): void {
    const { size } = element
    const { scale } = this.viewport

    const canvasWidth = size.x * scale
    const canvasHeight = size.y * scale

    // 保存状态
    this.ctx.save()

    // 应用变换
    this.applyTransforms(element)

    // 绘制占位符背景
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制边框
    this.ctx.strokeStyle = '#ccc'
    this.ctx.lineWidth = 1 * this.viewport.scale
    this.ctx.strokeRect(0, 0, canvasWidth, canvasHeight)

    // 绘制图片图标
    this.drawImageIcon(canvasWidth, canvasHeight)

    // 绘制错误文本
    this.drawErrorText(canvasWidth, canvasHeight)

    // 恢复状态
    this.ctx.restore()
  }

  /**
   * 绘制图片图标
   */
  private drawImageIcon(width: number, height: number): void {
    const iconSize = Math.min(width, height) * 0.3
    const x = (width - iconSize) / 2
    const y = (height - iconSize) / 2 - 10

    this.ctx.fillStyle = '#999'
    this.ctx.font = `${iconSize}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('🖼️', x + iconSize / 2, y + iconSize / 2)
  }

  /**
   * 绘制错误文本
   */
  private drawErrorText(width: number, height: number): void {
    const fontSize = Math.min(width, height) * 0.1
    const x = width / 2
    const y = height / 2 + 20

    this.ctx.fillStyle = '#666'
    this.ctx.font = `${fontSize}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('图片加载失败', x, y)
  }

  /**
   * 渲染图片缩略图
   */
  async renderThumbnail(element: ImageElement, size: number): Promise<string> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      return ''
    }

    canvas.width = size
    canvas.height = size

    // 如果有缩略图，直接使用
    if (element.getThumbnail()) {
      const img = new Image()
      img.src = element.getThumbnail()!
      
      return new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = () => resolve('')
      })
    }

    // 否则生成缩略图
    try {
      const img = await element.loadImage()
      const originalSize = element.getOriginalSize()
      
      // 计算缩放比例
      const scale = Math.min(size / originalSize.x, size / originalSize.y)
      const newWidth = originalSize.x * scale
      const newHeight = originalSize.y * scale
      
      // 居中绘制
      const x = (size - newWidth) / 2
      const y = (size - newHeight) / 2
      
      ctx.drawImage(img, x, y, newWidth, newHeight)
      
      return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
      return ''
    }
  }

  /**
   * 检查图片是否在视口内
   */
  isImageInViewport(element: ImageElement): boolean {
    const { position, size } = element
    const { scale, offset } = this.viewport

    const canvasX = (position.x + offset.x) * scale
    const canvasY = (position.y + offset.y) * scale
    const canvasWidth = size.x * scale
    const canvasHeight = size.y * scale

    // 简单的边界检查
    return !(
      canvasX + canvasWidth < 0 ||
      canvasY + canvasHeight < 0 ||
      canvasX > this.ctx.canvas.width ||
      canvasY > this.ctx.canvas.height
    )
  }

  /**
   * 渲染文字叠加
   */
  private renderTextOverlay(element: ImageElement): void {
    const overlayText = element.data.overlayText
    
    if (!overlayText || !overlayText.visible || !overlayText.text) {
      return
    }

    const { size } = element
    const { scale } = this.viewport

    // 计算文字位置（相对于图片）
    const textX = size.x * overlayText.position.x
    const textY = size.y * overlayText.position.y

    // 设置文字样式
    const fontSize = overlayText.fontSize * scale
    this.ctx.font = `${overlayText.fontStyle} ${overlayText.fontWeight} ${fontSize}px ${overlayText.fontFamily}`
    this.ctx.fillStyle = overlayText.color
    this.ctx.textAlign = overlayText.textAlign
    this.ctx.textBaseline = 'middle'

    // 添加文字阴影效果
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    this.ctx.shadowBlur = 4 * scale
    this.ctx.shadowOffsetX = 2 * scale
    this.ctx.shadowOffsetY = 2 * scale

    // 绘制文字
    this.ctx.fillText(overlayText.text, textX, textY)

    // 清除阴影
    this.ctx.shadowColor = 'transparent'
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 清理上下文引用
    this.ctx = null as any
  }
}
