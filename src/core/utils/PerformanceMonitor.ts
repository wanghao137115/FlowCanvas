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
