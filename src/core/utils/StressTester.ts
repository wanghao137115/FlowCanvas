/**
 * 压力测试工具
 * 用于测试大量元素下的性能表现
 */

import { CanvasEngine } from '../canvas/CanvasEngine'
import { ElementType, CanvasElement } from '../../types/canvas.types'
import { Vector2 } from '../../types/common.types'

interface StressTestConfig {
  elementCount: number      // 元素数量
  batchSize: number         // 每批添加的数量
  interval: number          // 批次间隔(ms)
}

interface StressTestResult {
  totalElements: number
  addDuration: number       // 添加耗时
  renderDuration: number    // 渲染耗时
  avgRenderTime: number     // 平均渲染时间
  fps: number               // 实时FPS
  memory: {
    used: number
    total: number
  }
}

class StressTester {
  private engine: CanvasEngine | null = null
  private isRunning: boolean = false
  private frameCount: number = 0
  private lastFpsTime: number = 0
  private currentFps: number = 0
  private rafId: number | null = null

  /**
   * 初始化压力测试
   */
  init(engine: CanvasEngine): void {
    this.engine = engine
  }

  /**
   * 运行压力测试 - 批量添加元素
   */
  async runStressTest(config: StressTestConfig): Promise<StressTestResult> {
    if (!this.engine) {
      throw new Error('请先调用 init() 初始化')
    }

    if (this.isRunning) {
      throw new Error('压力测试正在运行中')
    }

    this.isRunning = true
    const startTime = performance.now()
    
    // 开始FPS监控
    this.startFpsMonitor()
    
    // 批量添加元素
    const batchCount = Math.ceil(config.elementCount / config.batchSize)
    
    for (let i = 0; i < batchCount; i++) {
      const batchElements = Math.min(config.batchSize, config.elementCount - i * config.batchSize)
      this.addBatchElements(batchElements, i * config.batchSize)
      
      // 等待批次间隔
      if (i < batchCount - 1 && config.interval > 0) {
        await this.sleep(config.interval)
      }
    }

    const addDuration = performance.now() - startTime
    
    // 强制渲染一次，记录渲染时间
    const renderStart = performance.now()
    this.engine.requestRender()
    await this.sleep(100) // 等待渲染完成
    const renderDuration = performance.now() - renderStart
    
    // 停止FPS监控
    this.stopFpsMonitor()
    
    // 获取最终统计数据
    const result = this.getStressTestResult(config.elementCount, addDuration, renderDuration)
    
    this.isRunning = false
    return result
  }

  /**
   * 快速添加大量元素（同步版本）
   */
  addMassiveElements(count: number): number {
    if (!this.engine) {
      throw new Error('请先调用 init() 初始化')
    }

    const startTime = performance.now()
    this.startFpsMonitor()

    for (let i = 0; i < count; i++) {
      this.createRandomElement(i)
    }

    this.engine.requestRender()
    
    const duration = performance.now() - startTime
    this.stopFpsMonitor()
    
    return duration
  }

  /**
   * 批量添加元素
   */
  private addBatchElements(count: number, startIndex: number): void {
    if (!this.engine) return

    for (let i = 0; i < count; i++) {
      this.createRandomElement(startIndex + i)
    }
    
    this.engine.requestRender()
  }

  /**
   * 创建随机元素
   */
  private createRandomElement(index: number): CanvasElement {
    if (!this.engine) throw new Error('Engine not initialized')

    const types = [
      ElementType.SHAPE,
      ElementType.TEXT,
      ElementType.LINE,
      ElementType.ARROW,
      ElementType.IMAGE
    ]
    
    const type = types[index % types.length]
    const x = Math.random() * 2000 - 1000
    const y = Math.random() * 2000 - 1000
    
    const element = this.createElementByType(type, index, x, y)
    this.engine.addElement(element)
    
    return element
  }

  /**
   * 根据类型创建元素
   */
  private createElementByType(type: ElementType, index: number, x: number, y: number): CanvasElement {
    const baseElement = {
      id: `stress_test_${index}_${Date.now()}`,
      layerId: 'default',
      position: { x, y } as Vector2,
      rotation: 0,
      scale: { x: 1, y: 1 } as Vector2,
      style: {
        strokeColor: this.randomColor(),
        fillColor: this.randomColor(),
        strokeWidth: 2,
        opacity: 1
      },
      locked: false,
      visible: true,
      name: `元素_${index}`
    }

    switch (type) {
      case ElementType.SHAPE:
        return {
          ...baseElement,
          type: ElementType.SHAPE,
          shapeType: ['rectangle', 'circle', 'triangle', 'star'][index % 4] as any,
          size: {
            width: 50 + Math.random() * 100,
            height: 50 + Math.random() * 100
          }
        }

      case ElementType.TEXT:
        return {
          ...baseElement,
          type: ElementType.TEXT,
          content: `测试文本 ${index}`,
          fontSize: 16 + Math.floor(Math.random() * 20),
          fontFamily: 'Arial'
        }

      case ElementType.LINE:
        return {
          ...baseElement,
          type: ElementType.LINE,
          points: [
            { x: 0, y: 0 },
            { x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 }
          ]
        }

      case ElementType.ARROW:
        return {
          ...baseElement,
          type: ElementType.ARROW,
          points: [
            { x: 0, y: 0 },
            { x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 }
          ]
        }

      // 跳过 IMAGE 类型，因为它需要真实图片数据
      case ElementType.IMAGE:
      default:
        return baseElement as CanvasElement
    }
  }

  /**
   * 随机颜色
   */
  private randomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * 睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 开始FPS监控
   */
  private startFpsMonitor(): void {
    this.frameCount = 0
    this.lastFpsTime = performance.now()
    
    const measureFps = () => {
      this.frameCount++
      const now = performance.now()
      const elapsed = now - this.lastFpsTime
      
      if (elapsed >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / elapsed)
        this.frameCount = 0
        this.lastFpsTime = now
      }
      
      if (this.isRunning) {
        this.rafId = requestAnimationFrame(measureFps)
      }
    }
    
    this.rafId = requestAnimationFrame(measureFps)
  }

  /**
   * 停止FPS监控
   */
  private stopFpsMonitor(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * 获取压力测试结果
   */
  private getStressTestResult(
    totalElements: number, 
    addDuration: number, 
    renderDuration: number
  ): StressTestResult {
    const memory = this.getMemoryUsage()
    
    return {
      totalElements,
      addDuration,
      renderDuration,
      avgRenderTime: renderDuration / totalElements,
      fps: this.currentFps,
      memory: {
        used: memory?.used || 0,
        total: memory?.total || 0
      }
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): { used: number; total: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      }
    }
    return null
  }

  /**
   * 清除所有测试元素
   */
  clearTestElements(): void {
    if (!this.engine) return
    
    const elements = this.engine.getElements()
    const testElements = elements.filter(el => el.id.startsWith('stress_test_'))
    
    testElements.forEach(el => {
      this.engine!.removeElement(el.id)
    })
    
    this.engine.requestRender()
  }

  /**
   * 获取当前FPS
   */
  getCurrentFps(): number {
    return this.currentFps
  }

  /**
   * 检查是否正在运行
   */
  isTestRunning(): boolean {
    return this.isRunning
  }
}

// 导出单例
export const stressTester = new StressTester()

/**
 * 快速压力测试 - 在控制台运行
 * 
 * 使用方式:
 * import { stressTester } from '@/core/utils/StressTester'
 * 
 * // 初始化
 * stressTester.init(canvasEngine)
 * 
 * // 运行测试 (添加1000个元素)
 * const result = await stressTester.runStressTest({
 *   elementCount: 1000,
 *   batchSize: 100,
 *   interval: 100
 * })
 * 
 * // 或者快速添加
 * const duration = stressTester.addMassiveElements(500)
 * 
 * // 清除测试元素
 * stressTester.clearTestElements()
 */
export default stressTester
