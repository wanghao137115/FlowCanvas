import { AlignmentGuide, GuideType } from './SmartGuideManager'

/**
 * 参考线渲染器
 * 负责在画布上渲染参考线和标签
 */
export class GuideRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
  }

  /**
   * 渲染所有参考线
   */
  renderGuides(guides: AlignmentGuide[]): void {
    if (guides.length === 0) return

    this.ctx.save()

    for (const guide of guides) {
      switch (guide.type) {
        case GuideType.HORIZONTAL:
          this.renderHorizontalGuide(guide)
          break
        case GuideType.VERTICAL:
          this.renderVerticalGuide(guide)
          break
        case GuideType.DISTANCE:
          this.renderDistanceGuide(guide)
          break
      }
    }

    this.ctx.restore()
  }

  /**
   * 渲染水平参考线
   */
  private renderHorizontalGuide(guide: AlignmentGuide): void {
    this.ctx.save()
    
    // 设置参考线样式
    this.ctx.strokeStyle = '#007AFF'
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 4])
    this.ctx.globalAlpha = 0.8

    // 绘制参考线
    this.ctx.beginPath()
    this.ctx.moveTo(0, guide.position)
    this.ctx.lineTo(this.canvas.width, guide.position)
    this.ctx.stroke()

    // 绘制标签
    if (guide.label) {
      this.renderLabel(guide.label, 10, guide.position - 5)
    }

    this.ctx.restore()
  }

  /**
   * 渲染垂直参考线
   */
  private renderVerticalGuide(guide: AlignmentGuide): void {
    this.ctx.save()
    
    // 设置参考线样式
    this.ctx.strokeStyle = '#007AFF'
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 4])
    this.ctx.globalAlpha = 0.8

    // 绘制参考线
    this.ctx.beginPath()
    this.ctx.moveTo(guide.position, 0)
    this.ctx.lineTo(guide.position, this.canvas.height)
    this.ctx.stroke()

    // 绘制标签
    if (guide.label) {
      this.renderLabel(guide.label, guide.position + 5, 20)
    }

    this.ctx.restore()
  }

  /**
   * 渲染距离参考线
   */
  private renderDistanceGuide(guide: AlignmentGuide): void {
    this.ctx.save()
    
    // 设置距离参考线样式
    this.ctx.strokeStyle = '#34C759'
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([2, 2])
    this.ctx.globalAlpha = 0.7

    // 绘制距离参考线（这里简化实现，实际需要根据具体距离计算）
    if (guide.distance !== undefined) {
      this.ctx.beginPath()
      this.ctx.moveTo(guide.position, 0)
      this.ctx.lineTo(guide.position, this.canvas.height)
      this.ctx.stroke()

      // 绘制距离标签
      if (guide.label) {
        this.renderLabel(guide.label, guide.position + 5, 40)
      }
    }

    this.ctx.restore()
  }

  /**
   * 渲染标签
   */
  private renderLabel(text: string, x: number, y: number): void {
    this.ctx.save()
    
    // 设置标签样式
    this.ctx.fillStyle = '#007AFF'
    this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    
    // 计算文本尺寸
    const textMetrics = this.ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = 16
    
    // 绘制标签背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    this.ctx.fillRect(x - 2, y - 2, textWidth + 4, textHeight + 4)
    
    // 绘制标签边框
    this.ctx.strokeStyle = '#007AFF'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x - 2, y - 2, textWidth + 4, textHeight + 4)
    
    // 绘制标签文字
    this.ctx.fillStyle = '#007AFF'
    this.ctx.fillText(text, x, y)
    
    this.ctx.restore()
  }

  /**
   * 清除所有参考线
   */
  clearGuides(): void {
    // 参考线会在下次重绘时自动清除，这里不需要特殊处理
  }

  /**
   * 更新画布尺寸
   */
  updateCanvasSize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
  }
}
