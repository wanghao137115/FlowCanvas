/**
 * 性能监控工具
 * 用于监控白板应用的性能指标
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private isEnabled: boolean = true
  private maxSamples: number = 100

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 开始性能测量
   */
  startMeasure(name: string): () => void {
    if (!this.isEnabled) return () => {}

    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.recordMetric(name, duration)
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number): void {
    if (!this.isEnabled) return

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const samples = this.metrics.get(name)!
    samples.push(value)

    // 保持样本数量在限制内
    if (samples.length > this.maxSamples) {
      samples.shift()
    }
  }

  /**
   * 获取性能统计
   */
  getStats(name: string): {
    count: number
    average: number
    min: number
    max: number
    p95: number
  } | null {
    const samples = this.metrics.get(name)
    if (!samples || samples.length === 0) return null

    const sorted = [...samples].sort((a, b) => a - b)
    const count = samples.length
    const average = samples.reduce((sum, val) => sum + val, 0) / count
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p95Index = Math.floor(sorted.length * 0.95)
    const p95 = sorted[p95Index]

    return { count, average, min, max, p95 }
  }

  /**
   * 获取所有性能统计
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name)
    }
    return stats
  }

  /**
   * 清空所有指标
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * 设置最大样本数
   */
  setMaxSamples(maxSamples: number): void {
    this.maxSamples = maxSamples
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): {
    used: number
    total: number
    limit: number
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    return null
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const stats = this.getAllStats()
    const memory = this.getMemoryUsage()
    
    let report = '=== 性能监控报告 ===\n\n'
    
    // 渲染性能
    if (stats.render) {
      report += `渲染性能:\n`
      report += `  平均耗时: ${stats.render.average.toFixed(2)}ms\n`
      report += `  最大耗时: ${stats.render.max.toFixed(2)}ms\n`
      report += `  95%分位: ${stats.render.p95.toFixed(2)}ms\n`
      report += `  调用次数: ${stats.render.count}\n\n`
    }

    // 事件处理性能
    if (stats.event) {
      report += `事件处理性能:\n`
      report += `  平均耗时: ${stats.event.average.toFixed(2)}ms\n`
      report += `  最大耗时: ${stats.event.max.toFixed(2)}ms\n`
      report += `  95%分位: ${stats.event.p95.toFixed(2)}ms\n`
      report += `  调用次数: ${stats.event.count}\n\n`
    }

    // 内存使用
    if (memory) {
      report += `内存使用:\n`
      report += `  已使用: ${(memory.used / 1024 / 1024).toFixed(2)}MB\n`
      report += `  总分配: ${(memory.total / 1024 / 1024).toFixed(2)}MB\n`
      report += `  限制: ${(memory.limit / 1024 / 1024).toFixed(2)}MB\n\n`
    }

    return report
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()

/**
 * Web Vitals 性能指标收集器
 * 使用 PerformanceObserver 收集用户性能信息
 */
export class WebVitalsCollector {
  private static instance: WebVitalsCollector
  private observers: PerformanceObserver[] = []
  private metrics: Record<string, number> = {}
  private reportCallback?: (metrics: Record<string, number>) => void

  private constructor() {}

  static getInstance(): WebVitalsCollector {
    if (!WebVitalsCollector.instance) {
      WebVitalsCollector.instance = new WebVitalsCollector()
    }
    return WebVitalsCollector.instance
  }

  /**
   * 初始化 Web Vitals 收集
   */
  init(reportCallback?: (metrics: Record<string, number>) => void): void {
    this.reportCallback = reportCallback
    this.collectPaintMetrics()
    this.collectLCP()
    this.collectCLS()
    this.collectFID()
    this.collectLongTasks()
  }

  /**
   * 收集绘制指标 (FP, FCP)
   */
  private collectPaintMetrics(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntriesByType('paint')) {
          this.metrics[entry.name] = entry.startTime
          console.log(`[WebVitals] ${entry.name}: ${entry.startTime.toFixed(2)}ms`)
        }
      })
      observer.observe({ type: 'paint', buffered: true })
      this.observers.push(observer)
    } catch (e) {
      console.warn('[WebVitals] Paint metrics not supported')
    }
  }

  /**
   * 收集 LCP (Largest Contentful Paint)
   */
  private collectLCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      let lcpValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
        lcpValue = lastEntry.renderTime || lastEntry.loadTime || 0
        this.metrics['LCP'] = lcpValue
        console.log(`[WebVitals] LCP: ${lcpValue.toFixed(2)}ms`)
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.push(observer)
    } catch (e) {
      console.warn('[WebVitals] LCP not supported')
    }
  }

  /**
   * 收集 CLS (Cumulative Layout Shift)
   */
  private collectCLS(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value
          }
        }
        this.metrics['CLS'] = Math.round(clsValue * 1000) / 1000
        console.log(`[WebVitals] CLS: ${this.metrics['CLS']}`)
      })
      observer.observe({ type: 'layout-shift', buffered: true })
      this.observers.push(observer)
    } catch (e) {
      console.warn('[WebVitals] CLS not supported')
    }
  }

  /**
   * 收集 FID (First Input Delay)
   */
  private collectFID(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0] as PerformanceEntry & { processingStart: number; startTime: number }
        const fid = entry.processingStart - entry.startTime
        this.metrics['FID'] = Math.round(fid)
        console.log(`[WebVitals] FID: ${fid}ms`)
      })
      observer.observe({ type: 'first-input', buffered: true })
      this.observers.push(observer)
    } catch (e) {
      console.warn('[WebVitals] FID not supported')
    }
  }

  /**
   * 收集长任务 (Long Tasks)
   */
  private collectLongTasks(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      let longTaskCount = 0
      const observer = new PerformanceObserver((list) => {
        longTaskCount += list.getEntries().length
        this.metrics['longTasks'] = longTaskCount
        console.log(`[WebVitals] Long Tasks: ${longTaskCount}`)
      })
      observer.observe({ type: 'longtask', buffered: true })
      this.observers.push(observer)
    } catch (e) {
      console.warn('[WebVitals] Long Tasks not supported')
    }
  }

  /**
   * 收集资源加载性能
   */
  collectResourceTiming(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    let totalTime = 0
    let resourceCount = 0

    resources.forEach((resource) => {
      const duration = resource.responseEnd - resource.startTime
      totalTime += duration
      resourceCount++
    })

    if (resourceCount > 0) {
      this.metrics['avgResourceTime'] = Math.round(totalTime / resourceCount)
      this.metrics['resourceCount'] = resourceCount
    }
  }

  /**
   * 获取所有收集的指标
   */
  getMetrics(): Record<string, number> {
    return { ...this.metrics }
  }

  /**
   * 上报指标
   */
  report(): void {
    if (this.reportCallback) {
      this.reportCallback(this.metrics)
    }

    // 打印汇总
    console.log('[WebVitals] 性能指标汇总:', this.metrics)
  }

  /**
   * 销毁所有 Observer
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

// 导出单例
export const webVitalsCollector = WebVitalsCollector.getInstance()

/**
 * 白板专用性能监控
 * 整合 FPS、渲染性能、用户交互等指标
 */
export class WhiteboardPerformanceMonitor {
  private static instance: WhiteboardPerformanceMonitor
  private fps: number = 60
  private frameCount: number = 0
  private lastFpsUpdate: number = 0
  private animationFrameId?: number
  private renderTimes: number[] = []
  private maxRenderSamples: number = 60

  // 白板特有指标
  public metrics = {
    fps: 60,
    avgRenderTime: 0,
    maxRenderTime: 0,
    p95RenderTime: 0,
    elementCount: 0,
    visibleElementCount: 0,
    interactionDelay: 0,
  }

  private constructor() {}

  static getInstance(): WhiteboardPerformanceMonitor {
    if (!WhiteboardPerformanceMonitor.instance) {
      WhiteboardPerformanceMonitor.instance = new WhiteboardPerformanceMonitor()
    }
    return WhiteboardPerformanceMonitor.instance
  }

  /**
   * 开始 FPS 监控
   */
  startFPSMonitor(): void {
    let lastTime = performance.now()

    const loop = () => {
      this.frameCount++
      const currentTime = performance.now()

      if (currentTime - this.lastFpsUpdate >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate))
        this.metrics.fps = this.fps

        // FPS 低于阈值时告警
        if (this.fps < 30) {
          console.warn(`[Performance] FPS过低: ${this.fps}`)
        }

        this.frameCount = 0
        this.lastFpsUpdate = currentTime
      }

      this.animationFrameId = requestAnimationFrame(loop)
    }

    this.lastFpsUpdate = performance.now()
    this.animationFrameId = requestAnimationFrame(loop)
  }

  /**
   * 停止 FPS 监控
   */
  stopFPSMonitor(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = undefined
    }
  }

  /**
   * 记录渲染时间
   */
  recordRenderTime(duration: number): void {
    this.renderTimes.push(duration)

    if (this.renderTimes.length > this.maxRenderSamples) {
      this.renderTimes.shift()
    }

    // 更新统计
    const sorted = [...this.renderTimes].sort((a, b) => a - b)
    this.metrics.avgRenderTime = Math.round(
      this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
    )
    this.metrics.maxRenderTime = Math.round(Math.max(...this.renderTimes))
    this.metrics.p95RenderTime = Math.round(sorted[Math.floor(sorted.length * 0.95)] || 0)

    // 渲染时间过长告警
    if (duration > 16) {
      console.warn(`[Performance] 渲染耗时过长: ${duration.toFixed(2)}ms`)
    }
  }

  /**
   * 更新元素数量
   */
  updateElementCount(total: number, visible: number): void {
    this.metrics.elementCount = total
    this.metrics.visibleElementCount = visible
  }

  /**
   * 测量交互延迟
   */
  measureInteractionDelay(): () => void {
    const startTime = performance.now()
    return () => {
      const delay = performance.now() - startTime
      this.metrics.interactionDelay = Math.round(delay)

      if (delay > 100) {
        console.warn(`[Performance] 交互延迟过高: ${delay.toFixed(2)}ms`)
      }
    }
  }

  /**
   * 获取当前指标
   */
  getMetrics() {
    return { ...this.metrics }
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const memInfo = performanceMonitor.getMemoryUsage()

    let report = '=== 白板性能监控报告 ===\n\n'
    report += `FPS: ${this.metrics.fps}\n`
    report += `平均渲染时间: ${this.metrics.avgRenderTime.toFixed(2)}ms\n`
    report += `最大渲染时间: ${this.metrics.maxRenderTime.toFixed(2)}ms\n`
    report += `P95渲染时间: ${this.metrics.p95RenderTime.toFixed(2)}ms\n`
    report += `元素总数: ${this.metrics.elementCount}\n`
    report += `可见元素: ${this.metrics.visibleElementCount}\n`
    report += `交互延迟: ${this.metrics.interactionDelay}ms\n`

    if (memInfo) {
      report += `\n内存使用:\n`
      report += `  已使用: ${(memInfo.used / 1024 / 1024).toFixed(2)}MB\n`
      report += `  总分配: ${(memInfo.total / 1024 / 1024).toFixed(2)}MB\n`
    }

    return report
  }

  /**
   * 导出性能数据（用于上报）
   */
  exportData(): Record<string, any> {
    return {
      fps: this.metrics.fps,
      avgRenderTime: this.metrics.avgRenderTime,
      maxRenderTime: this.metrics.maxRenderTime,
      p95RenderTime: this.metrics.p95RenderTime,
      elementCount: this.metrics.elementCount,
      visibleElementCount: this.metrics.visibleElementCount,
      interactionDelay: this.metrics.interactionDelay,
      memory: performanceMonitor.getMemoryUsage(),
      timestamp: Date.now(),
    }
  }
}

export const whiteboardPerfMonitor = WhiteboardPerformanceMonitor.getInstance()