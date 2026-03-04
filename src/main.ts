import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

// 性能监控
import { 
  performanceMonitor, 
  webVitalsCollector, 
  whiteboardPerfMonitor,
  WhiteboardStressTester
} from './core/utils/PerformanceMonitor'

// 挂载到全局，方便控制台测试
;(window as any).whiteboardPerfMonitor = whiteboardPerfMonitor
;(window as any).WhiteboardStressTester = WhiteboardStressTester

// ============ 错误监控系统 (基于 ARMS) ============
import { LogLevel } from './core/monitor'

// ARMS SDK 全局对象
interface ARMSGlobal {
  log?: (params: { name: string; props?: Record<string, any> }) => void;
  track?: (event: string, props?: Record<string, any>) => void;
  error?: (error: Error, props?: Record<string, any>) => void;
}

const arms = (window as any).__rum as ARMSGlobal;

// 统一监控接口
const monitor = {
  // 记录日志 (WARN 及以上才打印/上报)
  log: (level: LogLevel, message: string, data?: any) => {
    if (level < LogLevel.WARN) return;
    
    const tags: Record<number, string> = { [LogLevel.WARN]: 'warn', [LogLevel.ERROR]: 'error', [LogLevel.CRITICAL]: 'critical' };
    const tag = tags[level] || 'info';
    
    console.log(`[Monitor:${tag}]`, message, data);
    if (arms?.log) arms.log({ name: message, props: { ...data, level: tag } });
  },

  // 手动上报错误
  reportError: (error: Error | string, data?: any) => {
    const err = typeof error === 'string' ? new Error(error) : error;
    console.error('[Monitor:Error]', err, data);
    if (arms?.error) arms.error(err, data);
  },

  // 设置用户标签
  setUserTag: (key: string, value: string) => {
    if (arms?.track) arms.track('setTag', { key, value });
  },

  // 跟踪用户行为
  trackAction: (action: string, data?: any) => {
    if (arms?.track) arms.track(action, data);
  }
};

// 导出到全局
;(window as any).$monitor = monitor;

console.log('[Monitor] 错误监控系统已初始化 (基于 ARMS)');

// ============ PerformanceObserver 性能监控 ============
// 初始化 Web Vitals 收集器
webVitalsCollector.init((metrics) => {
  console.log('[WebVitals] 上报性能指标:', metrics)
})

// 初始化白板性能监控（FPS 等）
whiteboardPerfMonitor.startFPSMonitor()

// 页面卸载时生成性能报告
window.addEventListener('beforeunload', () => {
  console.log('[Performance] 页面卸载 - 性能报告:')
  console.log(whiteboardPerfMonitor.generateReport())
  
  const perfData = whiteboardPerfMonitor.exportData()
  console.log('[Performance] 导出性能数据:', perfData)
  
  whiteboardPerfMonitor.stopFPSMonitor()
  webVitalsCollector.destroy()
})

// 性能监控 - 记录页面加载时间
window.addEventListener('load', () => {
  const perfData = performance.timing
  const loadTime = perfData.loadEventEnd - perfData.navigationStart
  console.log('[性能监控] 页面加载时间:', loadTime + 'ms')
  
  const paintEntries = performance.getEntriesByType('paint')
  paintEntries.forEach(entry => {
    console.log(`[性能监控] ${entry.name}: ${entry.startTime}ms`)
  })
  
  webVitalsCollector.collectResourceTiming()
})

const app = createApp(App)

// ============ Vue 3 错误处理器 ============
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info)
  
  // 通过 ARMS 上报
  if (arms?.error) {
    arms.error(err as Error, { 
      type: 'vue', 
      info, 
      componentName: (instance as any)?.$options?.name 
    })
  }
  
  // 同时通过 monitor 上报
  if ((window as any).$monitor?.reportError) {
    (window as any).$monitor.reportError(err as Error, { 
      type: 'vue', 
      info,
      componentName: (instance as any)?.$options?.name
    })
  }
}

// 警告处理
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('[Vue Warning]', msg, trace)
  if (arms?.log) {
    arms.log({ name: '[Vue Warning]', props: { msg, trace } })
  }
}

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(ElementPlus)

app.mount('#app')
