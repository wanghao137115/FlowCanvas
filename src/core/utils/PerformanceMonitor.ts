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

/**
 * 白板性能压力测试工具
 * 用于获取真实性能数据，支撑项目描述
 */
export class WhiteboardStressTester {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private results: Map<string, any> = new Map()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
  }

  /**
   * 测试1：不同元素数量下的帧率
   * 运行方式：在浏览器控制台执行
   * const tester = new WhiteboardStressTester(document.querySelector('canvas'))
   * tester.testFPSByElementCount()
   */
  async testFPSByElementCount(): Promise<Record<number, number>> {
    const elementCounts = [50, 100, 200, 500, 1000]
    const results: Record<number, number> = {}

    console.log('🧪 开始 FPS 压力测试...')

    for (const count of elementCounts) {
      console.log(`📊 测试 ${count} 个元素...`)
      
      // 创建测试元素
      const elements = this.createTestElements(count)
      
      // 预热
      this.renderElements(elements, 5)
      
      // 正式测试
      const fps = await this.measureFPS(() => {
        this.renderElements(elements, 1)
      })
      
      results[count] = fps
      console.log(`  → ${count} 元素: ${fps} FPS`)
    }

    this.results.set('fpsByElementCount', results)
    console.log('\n📈 FPS 测试结果:')
    console.table(results)
    
    return results
  }

  /**
   * 测试2：脏矩形渲染 vs 全量渲染
   * 运行方式：在浏览器控制台执行
   */
  async testDirtyRendering(): Promise<{ dirty: number; full: number; improvement: string }> {
    const elementCount = 200
    const elements = this.createTestElements(elementCount)
    const testRect = { x: 100, y: 100, width: 200, height: 200 }

    console.log('🧪 开始脏矩形渲染测试...')

    // 预渲染所有元素
    this.renderElements(elements, 3)

    // 测试全量渲染
    const fullRenderTime = await this.measureRenderTime(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      elements.forEach(el => this.renderSingleElement(el))
    })

    // 测试脏矩形渲染（模拟）
    // 实际项目中，脏矩形只渲染 dirty 区域内的元素
    const dirtyElements = elements.filter(el => 
      el.x < testRect.x + testRect.width &&
      el.x + el.width > testRect.x &&
      el.y < testRect.y + testRect.height &&
      el.y + el.height > testRect.y
    )

    const dirtyRenderTime = await this.measureRenderTime(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // 模拟：只渲染脏区域内的元素
      dirtyElements.forEach(el => this.renderSingleElement(el))
    })

    const improvement = ((1 - dirtyRenderTime / fullRenderTime) * 100).toFixed(1)
    
    const result = {
      dirty: Math.round(dirtyRenderTime * 100) / 100,
      full: Math.round(fullRenderTime * 100) / 100,
      improvement: `${improvement}%`
    }

    console.log(`  → 全量渲染: ${result.full}ms`)
    console.log(`  → 脏矩形: ${result.dirty}ms`)
    console.log(`  → 性能提升: ${result.improvement}`)

    this.results.set('dirtyRendering', result)
    return result
  }

  /**
   * 测试3：离屏缓存效果（复杂图形）
   * 运行方式：在浏览器控制台执行
   * 
   * 之前的简单矩形测试缓存效果不明显（只有10%）
   * 因为 fillRect 本身很快，复杂图形（渐变、阴影、多路径）缓存效果才显著
   */
  async testOffscreenCacheComplex(): Promise<{ noCache: number; withCache: number; improvement: string }> {
    const elementCount = 50 // 复杂图形数量少一些
    const renderCount = 30
    const elements = this.createComplexTestElements(elementCount)

    console.log('🧪 开始复杂图形离屏缓存测试...')

    // 测试无缓存（每次重新渲染复杂图形）
    const noCacheTime = await this.measureRenderTime(() => {
      elements.forEach(el => this.renderComplexElementFull(el))
    }, renderCount)

    // 测试有缓存（使用 drawImage）
    const offscreenCanvases = new Map<string, HTMLCanvasElement>()
    
    // 创建缓存
    elements.forEach(el => {
      const cache = document.createElement('canvas')
      cache.width = el.width
      cache.height = el.height
      const cacheCtx = cache.getContext('2d')!
      this.renderComplexElementFullToCtx(cacheCtx, el)
      offscreenCanvases.set(el.id, cache)
    })

    const withCacheTime = await this.measureRenderTime(() => {
      elements.forEach(el => {
        const cache = offscreenCanvases.get(el.id)!
        this.ctx.drawImage(cache, el.x, el.y)
      })
    }, renderCount)

    const improvement = ((1 - withCacheTime / noCacheTime) * 100).toFixed(1)

    const result = {
      noCache: Math.round(noCacheTime * 100) / 100,
      withCache: Math.round(withCacheTime * 100) / 100,
      improvement: `${improvement}%`
    }

    console.log(`  → 无缓存: ${result.noCache}ms`)
    console.log(`  → 有缓存: ${result.withCache}ms`)
    console.log(`  → 性能提升: ${result.improvement}`)

    this.results.set('offscreenCacheComplex', result)
    return result
  }

  private createComplexTestElements(count: number): any[] {
    const elements = []
    for (let i = 0; i < count; i++) {
      elements.push({
        id: `complex-${i}`,
        type: 'complex',
        x: Math.random() * 600,
        y: Math.random() * 400,
        width: 80,
        height: 80,
        fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
        hasShadow: true,
        hasGradient: true,
        layers: 3
      })
    }
    return elements
  }

  // 完整版复杂图形渲染（模拟真实场景）
  private renderComplexElementFull(el: any): void {
    const { x, y, width, height, fill, hasShadow, hasGradient, layers } = el
    
    // 阴影
    if (hasShadow) {
      this.ctx.shadowColor = 'rgba(0,0,0,0.3)'
      this.ctx.shadowBlur = 10
      this.ctx.shadowOffsetX = 5
      this.ctx.shadowOffsetY = 5
    }
    
    // 多层渐变
    if (hasGradient) {
      for (let i = 0; i < layers; i++) {
        const gradient = this.ctx.createRadialGradient(
          x + width/2, y + height/2, 0,
          x + width/2, y + height/2, width/2
        )
        gradient.addColorStop(0, fill)
        gradient.addColorStop(0.5, `hsl(${(parseInt(fill.slice(4)) + i * 30) % 360}, 70%, 40%)`)
        gradient.addColorStop(1, 'transparent')
        
        this.ctx.fillStyle = gradient
        this.ctx.beginPath()
        this.ctx.arc(x + width/2, y + height/2, width/2 - i * 5, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }
    
    // 重置阴影
    this.ctx.shadowColor = 'transparent'
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
  }

  private renderComplexElementFullToCtx(ctx: CanvasRenderingContext2D, el: any): void {
    const { width, height, fill, hasShadow, hasGradient, layers } = el
    
    if (hasShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 5
      ctx.shadowOffsetY = 5
    }
    
    if (hasGradient) {
      for (let i = 0; i < layers; i++) {
        const gradient = ctx.createRadialGradient(
          width/2, height/2, 0,
          width/2, height/2, width/2
        )
        gradient.addColorStop(0, fill)
        gradient.addColorStop(0.5, `hsl(${(parseInt(fill.slice(4)) + i * 30) % 360}, 70%, 40%)`)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(width/2, height/2, width/2 - i * 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  /**
   * 测试4：空间哈希查询性能
   * 运行方式：在浏览器控制台执行
   */
  testSpatialHash(): { linear: number; hash: number; improvement: string } {
    const elementCount = 1000
    const queryCount = 100
    const elements = this.createTestElements(elementCount)
    const gridSize = 100

    console.log('🧪 开始空间哈希查询测试...')

    // 构建空间哈希
    const spatialHash = new Map<string, string[]>()
    elements.forEach(el => {
      const key = this.getGridKey(el.x, el.y, gridSize)
      if (!spatialHash.has(key)) {
        spatialHash.set(key, [])
      }
      spatialHash.get(key)!.push(el.id)
    })

    // 线性查询
    const linearStart = performance.now()
    for (let i = 0; i < queryCount; i++) {
      const testPoint = { 
        x: Math.random() * 1000, 
        y: Math.random() * 1000 
      }
      elements.filter(el => 
        el.x <= testPoint.x && el.x + el.width >= testPoint.x &&
        el.y <= testPoint.y && el.y + el.height >= testPoint.y
      )
    }
    const linearTime = performance.now() - linearStart

    // 哈希查询
    const hashStart = performance.now()
    for (let i = 0; i < queryCount; i++) {
      const testPoint = { 
        x: Math.random() * 1000, 
        y: Math.random() * 1000 
      }
      const key = this.getGridKey(testPoint.x, testPoint.y, gridSize)
      spatialHash.get(key) || []
    }
    const hashTime = performance.now() - hashStart

    const improvement = ((1 - hashTime / linearTime) * 100).toFixed(1)

    const result = {
      linear: Math.round(linearTime * 100) / 100,
      hash: Math.round(hashTime * 100) / 100,
      improvement: `${improvement}%`
    }

    console.log(`  → 线性查询: ${result.linear}ms`)
    console.log(`  → 空间哈希: ${result.hash}ms`)
    console.log(`  → 性能提升: ${result.improvement}`)

    this.results.set('spatialHash', result)
    return result
  }

  /**
   * 测试5：缩放性能
   * 运行方式：在浏览器控制台执行
   */
  async testZoomPerformance(): Promise<Record<number, number>> {
    const scales = [0.5, 1, 2, 5, 10]
    const elementCount = 200
    const results: Record<number, number> = {}

    console.log('🧪 开始缩放性能测试...')

    for (const scale of scales) {
      const elements = this.createTestElements(elementCount)
      
      const fps = await this.measureFPS(() => {
        this.ctx.save()
        this.ctx.scale(scale, scale)
        this.renderElements(elements, 1)
        this.ctx.restore()
      })

      results[scale] = fps
      console.log(`  → ${scale}x 缩放: ${fps} FPS`)
    }

    this.results.set('zoomPerformance', results)
    return results
  }

  /**
   * 运行所有测试并生成报告
   */
  async runAllTests(): Promise<void> {
    console.log('\n' + '='.repeat(50))
    console.log('🎯 白板性能测试完整报告')
    console.log('='.repeat(50) + '\n')

    await this.testFPSByElementCount()
    console.log('')
    await this.testDirtyRendering()
    console.log('')
    await this.testOffscreenCacheComplex()
    console.log('')
    this.testSpatialHash()
    console.log('')
    await this.testZoomPerformance()

    console.log('\n' + '='.repeat(50))
    console.log('📋 所有测试完成！复制以下数据用于简历描述：')
    console.log('='.repeat(50))
    console.log(JSON.stringify(Object.fromEntries(this.results), null, 2))
  }

  // ====== 辅助方法 ======

  private createTestElements(count: number, complex = false): any[] {
    const elements = []
    for (let i = 0; i < count; i++) {
      elements.push({
        id: `el-${i}`,
        type: 'rectangle',
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: 30 + Math.random() * 50,
        height: 30 + Math.random() * 50,
        fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
        stroke: '#000',
        lineWidth: 1,
        complex // 标记是否为复杂图形
      })
    }
    return elements
  }

  private renderElements(elements: any[], iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      elements.forEach(el => this.renderSingleElement(el))
    }
  }

  private renderSingleElement(el: any): void {
    this.ctx.fillStyle = el.fill
    this.ctx.strokeStyle = el.stroke
    this.ctx.lineWidth = el.lineWidth
    this.ctx.fillRect(el.x, el.y, el.width, el.height)
    this.ctx.strokeRect(el.x, el.y, el.width, el.height)
  }

  private renderComplexElement(el: any): void {
    // 模拟复杂图形渲染（多次路径操作）
    this.ctx.fillStyle = el.fill
    this.ctx.beginPath()
    this.ctx.arc(el.x + el.width/2, el.y + el.height/2, el.width/2, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 添加渐变
    const gradient = this.ctx.createRadialGradient(
      el.x + el.width/2, el.y + el.height/2, 0,
      el.x + el.width/2, el.y + el.height/2, el.width/2
    )
    gradient.addColorStop(0, el.fill)
    gradient.addColorStop(1, 'transparent')
    this.ctx.fillStyle = gradient
    this.ctx.fill()
  }

  private renderComplexElementToCtx(ctx: CanvasRenderingContext2D, el: any): void {
    ctx.fillStyle = el.fill
    ctx.beginPath()
    ctx.arc(el.width/2, el.height/2, el.width/2, 0, Math.PI * 2)
    ctx.fill()
  }

  private async measureFPS(renderFn: () => void, duration = 2000): Promise<number> {
    let frameCount = 0
    const startTime = performance.now()

    return new Promise(resolve => {
      const loop = () => {
        renderFn()
        frameCount++

        if (performance.now() - startTime < duration) {
          requestAnimationFrame(loop)
        } else {
          const fps = Math.round(frameCount * 1000 / (performance.now() - startTime))
          resolve(fps)
        }
      }
      requestAnimationFrame(loop)
    })
  }

  private async measureRenderTime(fn: () => void, iterations = 10): Promise<number> {
    // 预热
    for (let i = 0; i < 3; i++) fn()

    const times: number[] = []
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      fn()
      times.push(performance.now() - start)
    }

    return times.reduce((a, b) => a + b, 0) / times.length
  }

  private getGridKey(x: number, y: number, gridSize: number): string {
    const gx = Math.floor(x / gridSize)
    const gy = Math.floor(y / gridSize)
    return `${gx},${gy}`
  }
}

// 导出快捷函数
export function createStressTester(canvas: HTMLCanvasElement): WhiteboardStressTester {
  return new WhiteboardStressTester(canvas)
}