import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

// ============ 错误监控收集 ============
// 收集未捕获的错误
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[错误监控]', { message, source, lineno, colno, error })
  // 这里可以发送到你的后端服务器
  return false
}

// 收集未处理的 Promise 拒绝
window.onunhandledrejection = (event) => {
  console.error('[Promise错误监控]', event.reason)
}

// 性能监控 - 记录页面加载时间
window.addEventListener('load', () => {
  const perfData = performance.timing
  const loadTime = perfData.loadEventEnd - perfData.navigationStart
  console.log('[性能监控] 页面加载时间:', loadTime + 'ms')
  
  // 记录关键性能指标
  const paintEntries = performance.getEntriesByType('paint')
  paintEntries.forEach(entry => {
    console.log(`[性能监控] ${entry.name}: ${entry.startTime}ms`)
  })
})

// ============ 测试：手动触发错误来验证监控 ============
setTimeout(() => {
  console.log('[监控测试] 准备触发测试错误...')
  throw new Error('【测试错误】这是手动触发的错误，用于验证监控是否正常工作')
}, 3000)
// =======================================================

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(ElementPlus)

app.mount('#app')