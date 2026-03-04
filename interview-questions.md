# BoardWhite 智能协作白板平台 - 面试题汇总

## 一、项目基础与架构

### 1. 请介绍一下这个项目的整体架构

**答：**
BoardWhite 是一个基于 Vue3 + TypeScript 的在线协作白板平台，支持无限画布、实时协作、思维导图等功能。

**技术栈：**
- 前端框架：Vue 3 + TypeScript
- 构建工具：Vite
- 状态管理：Pinia
- 核心渲染：Canvas 2D

**架构设计：**
- **模块化编辑器架构**：将画布功能拆分为独立的模块
- **工具模式**：实现了 8 种绘图工具（画笔、矩形、椭圆、直线、箭头等）
- **命令模式**：构建撤销/重做栈，管理操作历史
- **观察者模式**：驱动事件与状态同步系统

**渲染架构：**
- Canvas 2D 渲染引擎
- 基于变换矩阵的视口管理
- 分层渲染：静态层、动态层、主画布层、UI层

---

### 2. 为什么选择 Vue3 + TypeScript + Vite 这个技术栈？

**答：**
1. **Vue 3**：Composition API 更好地支持逻辑复用，响应式系统性能更好
2. **TypeScript**：提供类型安全，减少运行时错误，便于团队协作和维护
3. **Vite**：开发体验好，热更新时间在 50ms 以内，启动速度快

---

### 3. 项目的目录结构是怎样的？

**答：**
```
src/
├── core/          # 核心引擎
│   ├── canvas/   # Canvas 渲染引擎
│   ├── tools/    # 绘图工具
│   ├── viewport/ # 视口管理
│   └── commands/ # 命令模式实现
├── components/   # Vue 组件
├── types/        # TypeScript 类型定义
├── stores/       # Pinia 状态管理
└── utils/        # 工具函数
```

---

## 二、Canvas 渲染与性能优化

### 4. 怎么保障无限画布下 200 层元素 60fps 流畅渲染？

**答：**
从以下几个方面进行性能优化：

1. **视口裁剪 (Viewport Culling)** - 最重要
   - 只渲染当前视口可见的元素，跳过视口外的元素
   - 减少 90% 的渲染工作量

2. **分层渲染 (Layer Separation)**
   - 静态层：背景、参考线等，渲染一次后缓存
   - 动态层：用户正在操作的元素、选中的高亮等
   - UI层：浮动工具栏、光标等

3. **脏矩形渲染 (Dirty Rectangle)**
   - 只重绘发生变化的区域，而不是整个画布

4. **细节层次 (LOD - Level of Detail)**
   - 缩放 < 50%：不渲染文本、边框细化、简化图形
   - 缩放 > 200%：增加抗锯齿、显示更多细节

5. **空间索引 (Spatial Indexing)**
   - 使用四叉树 (Quadtree) 或空间哈希快速查找元素

6. **requestAnimationFrame + 帧预算**
   - 每帧预算 16ms，在预算时间内渲染

7. **离屏 Canvas 优化**
   - 复杂元素先在离屏 Canvas 绘制，再复制到主画布

8. **使用PerformanceObserver收集用户信息**
   - const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
        console.log(entry.name,entry.startTime,entry.duration)
    });
});

observer.observe({ entryTypes: ['xxx'] });

---

### 5. 基于变换矩阵如何实现视口管理？

**答：**
视口管理的核心是维护一个变换矩阵，包含 offset（偏移量）和 scale（缩放比例）两个参数。

**实现思路：**
1. 虚拟坐标（元素实际存储的坐标）→ 屏幕坐标（用户看到的）
2. 通过 scale 控制缩放，通过 offset 控制平移
3. 鼠标滚轮缩放时，以鼠标为中心点计算新的 offset
4. 拖拽画布时更新 offset 值

```typescript
interface Viewport {
  offset: { x: number, y: number }
  scale: number
}
```

使用 `CanvasRenderingContext2D.setTransform()` 或手动计算坐标转换，确保所有元素都能正确渲染在视口内。

---

### 6. 屏幕坐标和虚拟坐标如何转换？

**答：**
项目中封装了 `CoordinateTransformer` 类统一管理所有坐标转换：

```typescript
// 虚拟坐标 → 屏幕坐标 (渲染用)
function virtualToScreen(virtual: Vector2, viewport: Viewport): Vector2 {
  return {
    x: (virtual.x - viewport.offset.x) * viewport.scale,
    y: (virtual.y - viewport.offset.y) * viewport.scale
  }
}

// 屏幕坐标 → 虚拟坐标 (交互用)
function screenToVirtual(screen: Vector2, viewport: Viewport): Vector2 {
  return {
    x: screen.x / viewport.scale + viewport.offset.x,
    y: screen.y / viewport.scale + viewport.offset.y
  }
}
```

1. **屏幕 → 虚拟坐标（鼠标事件）**：用户在屏幕上点击的位置，需要转换为画布内部的虚拟坐标
2. **虚拟 → 屏幕坐标（渲染）**：元素存储的虚拟坐标，需要转换为屏幕上的绘制位置

---

### 7. 不同分辨率下怎么计算元素位置？

**答：**
关键在于统一使用虚拟坐标系统：

1. **使用物理像素 vs CSS 像素**
```typescript
const dpr = window.devicePixelRatio  // 设备像素比
```

2. **Canvas 适配高分辨率屏**
```typescript
canvas.width = rect.width * dpr
canvas.height = rect.height * dpr
ctx.scale(dpr, dpr)
```

3. **元素位置始终使用虚拟坐标，不依赖分辨率**
```typescript
const element = {
  position: { x: 100, y: 100 }  // 虚拟坐标，任何分辨率下一致
}
```

---

### 8. 虚拟化渲染和分层渲染具体是如何实现的？

**答：**

**分层渲染架构：**
```
┌─────────────────────────────────┐
│  UI 层 (FloatingToolbar)        │  ← 每次重绘
├─────────────────────────────────┤
│  动态层 (选中元素、高亮)         │  ← 需要时重绘
├─────────────────────────────────┤
│  主画布层 (所有元素)             │  ← 视口裁剪 + LOD
├─────────────────────────────────┤
│  静态层 (背景、参考线)           │  ← 缓存，不重绘
└─────────────────────────────────┘
```

**虚拟化渲染：**
```typescript
// 只渲染视口内的元素
function getVisibleElements(elements: Element[], viewport: Viewport): Element[] {
  return elements.filter(el => {
    const screenPos = virtualToScreen(el.position, viewport)
    const screenSize = {
      width: el.size.width * viewport.scale,
      height: el.size.height * viewport.scale
    }
    // 视口裁剪判断
    return !(screenPos.x + screenSize.width < 0 ||
             screenPos.x > viewport.width ||
             screenPos.y + screenSize.height < 0 ||
             screenPos.y > viewport.height)
  })
}
```

---

## 三、核心功能实现

### 9. 画布系统支持哪些功能？你是如何实现的？

**答：**
实现了以下核心画布功能：

1. **缩放平移**
   - 鼠标滚轮缩放（以鼠标为中心）
   - 拖拽平移画布
   - 支持键盘快捷键（Ctrl + 滚轮）

2. **坐标转换**
   - 屏幕坐标与虚拟坐标双向转换
   - 支持多种对齐辅助线

3. **20+ 种绘图工具**
   - 基础图形：矩形、椭圆、直线、箭头
   - 画笔工具：自由绘制
   - 文本工具：添加文字
   - 图片工具：插入图片
   - 思维导图专用工具

---

### 10. 工具模式是如何设计的？

**答：**
使用工具模式（Tool Pattern）实现 8 种绘图工具：

```typescript
interface Tool {
  onMouseDown(e: MouseEvent): void
  onMouseMove(e: MouseEvent): void
  onMouseUp(e: MouseEvent): void
}

// 具体工具实现
class RectangleTool implements Tool { ... }
class EllipseTool implements Tool { ... }
class PenTool implements Tool { ... }
// ... 共8种工具
```

**优点：**
- 每个工具独立封装，职责单一
- 便于扩展新工具
- 工具之间切换灵活

---

### 11. 命令模式如何实现撤销/重做？

**答：**
使用命令模式构建撤销/重做栈：

```typescript
interface Command {
  execute(): void
  undo(): void
}

// 示例：添加元素命令
class AddElementCommand implements Command {
  constructor(private element: Element) {}
  
  execute() {
    this.elementStore.add(this.element)
  }
  
  undo() {
    this.elementStore.remove(this.element.id)
  }
}

// 命令管理器
class CommandManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  
  execute(command: Command) {
    command.execute()
    this.undoStack.push(command)
    this.redoStack = [] // 新命令清除重做栈
  }
  
  undo() {
    const cmd = this.undoStack.pop()
    cmd?.undo()
    this.redoStack.push(cmd)
  }
}
```

---

### 12. 观察者模式如何驱动事件与状态同步？

**答：**
使用观察者模式实现事件系统和状态同步：

```typescript
// 事件总线
class EventBus {
  private listeners: Map<string, Function[]> = new Map()
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }
  
  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data))
  }
}

// 应用场景
- 元素选中/取消选中事件
- 画布缩放/平移事件
- 工具切换事件
- 协作状态同步
```

---

### 13. 连接点系统如何实现元素智能吸附？

**答：**
连接点系统用于实现元素之间的智能对齐和连接：

1. **连接点定义**
   - 每个元素有 4 个连接点（上、下、左、右）
   - 支持自定义连接点位置

2. **吸附检测**
   - 当元素拖拽时，检测与其他元素的连接点距离
   - 距离小于阈值时，自动吸附对齐

3. **视觉反馈**
   - 吸附时显示对齐辅助线
   - 高亮显示吸附点

---

### 14. 浮动工具栏和快捷键系统是如何实现的？

**答：**

**浮动工具栏：**
- 跟随选中元素显示
- 提供常用操作：复制、粘贴、删除、对齐等
- 使用 Vue 组件实现，定位使用 Canvas 坐标转换

**快捷键系统：**
```typescript
const shortcuts = {
  'ctrl+z': undo,
  'ctrl+y': redo,
  'ctrl+c': copy,
  'ctrl+v': paste,
  'ctrl+a': selectAll,
  'delete': deleteSelected,
  'ctrl+s': save,
  // ...
}

window.addEventListener('keydown', (e) => {
  const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.key}`
  shortcuts[key]?.()
})
```

---

### 15. 缩略图生成与图片合成导出是如何实现的？

**答：**

**缩略图生成：**
```typescript
function generateThumbnail(canvas: HTMLCanvasElement, scale: number = 0.1): string {
  const thumbnail = document.createElement('canvas')
  thumbnail.width = canvas.width * scale
  thumbnail.height = canvas.height * scale
  const ctx = thumbnail.getContext('2d')
  ctx.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height)
  return thumbnail.toDataURL()
}
```

**图片导出：**
```typescript
function exportCanvas(format: 'png' | 'jpg' = 'png') {
  // 1. 创建导出用的临时 Canvas
  // 2. 渲染所有可见元素（忽略视口裁剪）
  // 3. 导出为图片
  const dataURL = canvas.toDataURL(`image/${format}`)
  // 4. 下载
  download(dataURL, `boardwhite-export.${format}`)
}
```

---

## 四、实时协作

### 16. 实时协作系统是如何设计的？

**答：**
使用 BroadcastChannel API 模拟 WebSocket 实现实时协作：

1. **用户管理**
   - 每个人有唯一的 userId、随机颜色、用户名
   - 通过心跳机制检测2. **实时光标**
  用户在线状态

 - 监听 mousemove 事件，节流后广播位置
   - 远程用户的光标用 DOM 元素渲染，避免 Canvas 冲突

3. **操作同步**
   - 元素的增删改通过消息广播
   - 接收方执行相同操作，保持画布一致

4. **冲突处理**
   - 使用时间戳作为版本号
   - 简单的 Last-Write-Wins 策略

```typescript
// 消息广播
const channel = new BroadcastChannel('boardwhite')
channel.postMessage({
  type: 'element-update',
  payload: { id: 'xxx', changes: {...} }
})

// 消息接收
channel.onmessage = (event) => {
  handleMessage(event.data)
}
```

---

### 17. 多人操作时，怎么协调不同用户的操作？

**答：**
1. **消息广播**：每个用户的操作通过 BroadcastChannel 广播给其他用户
2. **操作转换 (OT)**：复杂场景下使用操作转换算法解决冲突
3. **版本控制**：使用时间戳作为版本号
4. **本地优先**：本地操作立即执行，远程操作异步同步

---

### 18. 协作时的撤销重做历史如何管理？

**答：**
1. **本地操作**：本地用户的撤销/重做操作只在本地栈中执行
2. **远程同步**：操作结果通过消息同步给其他用户
3. **版本管理**：每个操作带有时间戳和用户ID，便于追溯

---

## 五、其他技术问题

### 19. 项目中如何收集和监控问题？

**答：**
1. **全局错误监控**：`window.onerror`
2. **Promise 异常捕获**：`unhandledrejection`
3. **PerformanceObserver 性能监控**
4. **资源加载错误监控**
5. **接口成功率监控**

---

### 19.1 PerformanceObserver 在项目中如何收集用户性能信息？

**答：**
使用 `PerformanceObserver` API 收集页面性能数据，这是现代浏览器提供的性能监控接口。

**项目中实际使用方式：**

```typescript
// 性能监控
import { 
  performanceMonitor, 
  webVitalsCollector, 
  whiteboardPerfMonitor 
} from './core/utils/PerformanceMonitor'

// 初始化 Web Vitals 收集器
webVitalsCollector.init((metrics) => {
  console.log('[WebVitals] 上报性能指标:', metrics)
  // 可以在这里将指标发送到后端
})

// 初始化白板性能监控（FPS 等）
whiteboardPerfMonitor.startFPSMonitor()

// 页面卸载时生成性能报告
window.addEventListener('beforeunload', () => {
  console.log('[Performance] 页面卸载 - 性能报告:')
  console.log(whiteboardPerfMonitor.generateReport())
  whiteboardPerfMonitor.stopFPSMonitor()
  webVitalsCollector.destroy()
})
```

**WebVitals 性能指标收集：**

```typescript
// 1. 初始化性能监控
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // 上报性能数据
    reportPerformance({
      name: entry.name,
      entryType: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
    })
  }
})

// 2. 观察不同类型的性能指标
performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint', 'longtask'] })

// 3. 常用性能指标收集
// FP (First Paint) - 首次绘制
// FCP (First Contentful Paint) - 首次内容绘制
// LCP (Largest Contentful Paint) - 最大内容绘制
// CLS (Cumulative Layout Shift) - 累计布局偏移
// FID (First Input Delay) - 首次输入延迟
// TBT (Total Blocking Time) - 总阻塞时间
```

**在白板项目中的具体应用：**

```typescript
// 白板性能监控模块
class WhiteboardPerformanceMonitor {
  private metrics = {
    fps: 0,
    renderTime: 0,
    interactionDelay: 0,
    memoryUsage: 0
  }

  init() {
    // 1. 监控 FPS
    this.monitorFPS()
    
    // 2. 监控渲染性能
    this.monitorRenderPerformance()
    
    // 3. 监控用户交互延迟
    this.monitorInteractionDelay()
    
    // 4. 监控内存使用
    this.monitorMemory()
  }

  private monitorFPS() {
    let lastTime = performance.now()
    let frames = 0
    
    const loop = () => {
      frames++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime))
        
        // FPS 过低时告警
        if (this.metrics.fps < 30) {
          console.warn(`FPS过低: ${this.metrics.fps}`)
        }
        
        frames = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(loop)
    }
    
    requestAnimationFrame(loop)
  }

  private monitorRenderPerformance() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.metrics.renderTime = entry.duration
          
          // 渲染时间过长时告警
          if (entry.duration > 16) {
            console.warn(`渲染耗时过长: ${entry.duration}ms`)
          }
        }
      }
    })
    
    observer.observe({ entryTypes: ['measure'] })
  }

  private monitorInteractionDelay() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // 记录首次输入延迟
        if (entry.entryType === 'first-input') {
          this.metrics.interactionDelay = entry.processingStart - entry.startTime
        }
      }
    })
    
    observer.observe({ entryTypes: ['first-input'] })
  }

  private monitorMemory() {
    // 需要浏览器支持 memory API
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      }, 5000)
    }
  }

  getMetrics() {
    return this.metrics
  }
}
```

**使用示例：**

```typescript
// 在项目入口初始化
const monitor = new WhiteboardPerformanceMonitor()
monitor.init()

// 渲染性能测量
function measureRender(name: string, fn: () => void) {
  performance.mark(`${name}-start`)
  fn()
  performance.mark(`${name}-end`)
  performance.measure(name, `${name}-start`, `${name}-end`)
}
```

**优势：**
- 无侵入性：不影响页面性能
- 实时性：可实时监控性能变化
- 准确性：基于浏览器原生 API，数据准确
- 可定制：可根据业务需求监控特定指标

---

### 20. 如何进行性能测试和压力测试？

**答：**
在项目中实现了一个压力测试工具：

1. **批量添加元素**：支持 100-2000 个元素
2. **实时监控指标**：
   - FPS 是否稳定在 30 以上
   - p95 渲染耗时是否低于 16ms
   - 内存使用情况

3. **测试场景**：
   - 大量元素下的渲染性能
   - 缩放平移操作流畅度
   - 撤销重做操作响应时间


## 七、自测与反问

### 24. 项目中遇到的最大挑战是什么？你是如何解决的？

**答：**
最大的挑战是**无限画布在 200 层元素下的 60fps 渲染性能**。

解决思路：
1. 先实现基础功能，确保功能可用
2. 通过性能分析工具定位瓶颈
3. 逐一实施优化方案（视口裁剪、分层渲染、LOD 等）
4. 通过压力测试验证优化效果

---

### 25. 如果让你重新做这个项目，你会做什么改进？

**答：**
1. **架构层面**：更早地引入微前端架构，将画布引擎独立成单独的包
2. **渲染层面**：考虑使用 WebGL 渲染复杂图形
3. **协作层面**：引入 CRDT 算法解决协作冲突
4. **测试层面**：增加更多的单元测试和 E2E 测试

---

### 26. 你对这个项目未来的规划是什么？

**答：**
1. **性能优化**：继续优化大规模元素下的渲染性能
2. **功能完善**：增加更多模板、插件系统
3. **协作增强**：支持更多用户同时编辑
4. **移动端适配**：优化触摸操作体验

---

### 4.1 详细面试话术：无限画布 60fps 渲染优化

**面试官：项目中遇到的最大挑战是什么？你是如何解决的？**

**答：**
难点1.最大的挑战是**无限画布在 200 层元素下的 60fps 渲染性能**。

**问题分析：**
之所以说是挑战，是因为 Canvas 2D 本身是单线程的，当元素多了之后，每次重绘都要遍历所有元素，渲染压力非常大。用户操作（缩放、平移、选中）又非常频繁，如果优化不到位，就会出现明显的卡顿。

**解决方案：**
我从**五个层面**进行了优化：

**第一，视口裁剪（最重要）**
> 我实现了只渲染当前视口可见的元素。在渲染前先做一次 Bounds 判断，跳过视口外的元素。这一个优化就减少了 **90% 的渲染工作量**。

**第二，LOD 细节层次**
> 缩放比例不同，渲染策略也不同。缩小到 50% 以下时，不渲染文本、简化图形；放大到 200% 以上时，增加抗锯齿细节。这样避免了对不可见内容的过度渲染。

**第三，空间索引**
> 使用**空间哈希网格**替代原来的遍历查找。这样鼠标选元素、碰撞检测时，不用遍历 200 个元素，直接通过网格快速定位，复杂度从 O(n) 降到 O(1)。

**第四，离屏缓存**
> 复杂的图形（比如带渐变的矩形、组合图形），我先用离屏 Canvas 画好，渲染时直接 `drawImage` 复制，避免重复执行绘制指令。

**第五，分层渲染**
> 把静态层（背景、网格）和动态层（用户操作的元素）分开。静态层只渲染一次，有变化时才更新。UI层（手柄、标尺）单独渲染，互不干扰。

**效果：**
> 最终在 200 个元素下，缩放、平移、选中这些操作都能稳定在 **60fps**，用户几乎感知不到卡顿。

**个人思考：**
> 这个过程让我深刻体会到，**性能优化一定要先定位瓶颈**，不要凭感觉优化。我是用 Chrome DevTools 的 Performance 面板逐步分析，找到渲染链路中的瓶颈点，再针对性解决的。

**面试追问应对：**

| 面试官可能追问 | 回答要点 |
|---------------|---------|
| 怎么测量 60fps？ | 用 `requestAnimationFrame` 统计帧率，加上 PerformanceObserver 监控 |
| 空间哈希和四叉树区别？ | 空间哈希实现更简单，适合均匀分布的元素；四叉树适合稀疏场景 |
| 200 个元素够吗？ | 足够演示性能优化，真实场景可以扩展到 1000+ |
| Web Worker 呢？ | Canvas 渲染必须在主线程，Worker 只能做计算辅助 |

难点2.对齐吸附功能是一个核心交互难点
1. 难点描述
“在我负责的白板项目中，对齐吸附功能是一个核心交互难点。它需要在用户拖拽元素时，实时计算与其他元素的位置关系，并提供智能参考线和吸附效果。难点在于：既要保证计算的实时性（60fps），又要支持大规模元素（可能上千个）的复杂几何计算，同时还要让吸附的视觉反馈自然流畅。”

2. 性能优化方案
“为了解决性能瓶颈，我主要做了三方面优化：

空间分割：引入四叉树（或网格索引）管理元素位置，拖拽时只检索邻近区域，将计算复杂度从 O(n) 降到 O(log n)。

Web Worker 离屏计算：将吸附几何运算移到 Worker 线程，避免阻塞主线程渲染。主线程只负责接收 Worker 返回的吸附坐标，确保拖拽过程不卡顿。

事件节流：结合 requestAnimationFrame 对 mousemove 事件进行节流，保证计算频率与屏幕刷新率同步，避免无效计算。”

3. 体验优化方案
“除了性能，我还重点优化了用户的感知流畅度：

预测绘制（双缓冲）：拖拽时主线程立即更新元素视觉位置（预测），同时 Worker 在后台计算精确吸附点，然后通过动画平滑过渡到目标位置。这样即使 Worker 有毫秒级延迟，用户也感觉不到卡顿。

吸附阈值与平滑过渡：设置吸附半径（如 8px），当元素接近参考线时直接吸附，配合线性插值让移动更自然。同时绘制半透明的智能参考线，提前给用户视觉反馈。

增量计算与关键点预存：提前缓存每个元素的关键点（中心、四边），避免重复获取宽高，减少计算量。”

4. 成果与总结
“最终，该功能在千级元素的白板上依然能保持流畅的拖拽和吸附体验，用户反馈‘跟手’且‘精准’。这个难点也让我深刻体会到：高性能交互不能只靠算法优化，还要结合架构设计（如 Worker）和人性化的交互反馈，才能达到真正的流畅。”

---

### 26.1 面试话术：模板一键添加到画布功能

**面试官：你在项目中还实现了哪些亮点功能？**

**答：**
我实现了**模板一键添加到画布**的功能，这是提升用户体验的核心功能。

**功能背景：**
> 用户从零开始画图成本很高，我们提供了丰富的模板库（思维导图、流程图、UML图等），用户选中模板后可以一键生成完整的图表结构。

**实现思路：**
```typescript
// 模板数据结构
interface Template {
  id: string
  name: string
  thumbnail: string      // 缩略图
  elements: Element[]   // 模板包含的元素
  viewport: Viewport    // 推荐视口位置
}

// 一键添加核心逻辑
function applyTemplate(template: Template) {
  // 1. 清空当前画布（或追加模式）
  elementStore.clear()
  
  // 2. 批量添加元素（使用命令模式，支持撤销）
  const command = new BatchAddElementsCommand(template.elements)
  commandManager.execute(command)
  
  // 3. 自动调整视口，让模板居中显示
  viewportManager.setViewport(template.viewport)
  
  // 4. 选中第一个关键元素，引导用户操作
  selectionManager.select(template.elements[0].id)
}
```

**技术亮点：**
1. **批量操作优化**：200+ 元素批量添加时，使用事务性操作，一次重绘完成
2. **智能视口计算**：自动计算元素包围盒，将模板调整到画布中心
3. **模板分类管理**：支持分类、搜索、收藏功能
4. **用户行为分析**：记录用户常用的模板，智能排序

**效果：**
> 用户从选择模板到开始编辑，只需 **1 秒**，大幅降低了使用门槛。

---

### 26.2 面试话术：模拟协作创作功能

**面试官：这个项目的实时协作是怎么实现的？**

**答：**
我实现了**模拟协作创作**功能，虽然没有后端服务器，但通过 **BroadcastChannel API** 实现了多标签页之间的实时同步。

**实现原理：**
```typescript
// 创建广播通道
const channel = new BroadcastChannel('boardwhite_collab')

// 1. 用户状态管理
interface User {
  id: string
  name: string
  color: string    // 光标颜色
  cursor: Vector2 // 实时位置
}

// 2. 广播自己的光标移动
canvas.addEventListener('mousemove', throttle((e) => {
  channel.postMessage({
    type: 'cursor-move',
    payload: {
      userId: myId,
      position: screenToVirtual(e.position)
    }
  })
}, 50))

// 3. 接收他人光标并渲染
channel.onmessage = (event) => {
  const { type, payload } = event.data
  if (type === 'cursor-move') {
    cursorManager.updateUserCursor(payload.userId, payload.position)
  } else if (type === 'element-update') {
    elementStore.update(payload)
  }
}
```

**技术亮点：**
1. **跨标签页同步**：同一浏览器打开多个标签页，可以看到彼此的光标和操作
2. **本地模拟协作**：无需服务器，用最简单的方式演示协作效果
3. **冲突处理**：使用时间戳 + Last-Write-Wins 策略解决
4. **性能优化**：光标移动使用 **节流（throttle）**，减少消息频率

**协作场景：**
- ✅ 多标签页同步编辑
- ✅ 实时看到他人的光标位置
- ✅ 元素增删改的实时同步
- ✅ 模拟"你在看、我在改"的协作体验

**后续扩展：**
> 如果需要真正的多端协作，只需要把 `BroadcastChannel` 替换成 `WebSocket`，后端逻辑完全不需要改动。

---

### 27. 面试话术：项目总体架构设计

**面试官：请介绍一下这个项目的整体架构？**

**答：**
这是一个基于 **Vue3 + TypeScript + Canvas 2D** 的智能协作白板平台，采用**模块化分层架构**设计。

---

#### 一、整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vue 3 视图层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │ ToolbarBar  │  │  Properties │  │     Canvas 画布          ││
│  │  工具栏     │  │   侧边栏    │  │  ┌───────────────────┐  ││
│  └─────────────┘  └─────────────┘  │  │   CanvasEngine    │  ││
│                                     │  │   渲染引擎         │  ││
│  ┌─────────────────────────────┐   │  └───────────────────┘  ││
│  │    CollaborationPanel       │   └─────────────────────────┘│
│  │       协作面板              │                                │
│  └─────────────────────────────┘                                │
├─────────────────────────────────────────────────────────────────┤
│                         Pinia 状态管理层                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ElementStore│  │ToolStore   │  │ViewportStore│ │UIStore   │ │
│  │ 元素管理   │  │ 工具状态   │  │ 视口状态   │  │ UI状态   │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         Core 核心引擎层                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │CanvasEngine │  │ToolManager  │  │  ViewportManager        ││
│  │ 渲染引擎    │  │  工具管理器  │  │    视口管理             ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │Renderer     │  │Tool: Shape  │  │  CommandManager         ││
│  │ 渲染器      │  │ Pen/Text... │  │    命令管理器           ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                         工具函数层                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │Coordinate  │  │SpatialIndex│  │Performance │  │Error      │ │
│  │Transformer │  │  空间索引  │  │ Monitor    │  │Monitor    │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 二、分层设计思路

**1. 视图层（Vue Components）**
- 负责 UI 渲染和用户交互
- 不直接操作 Canvas，通过事件与核心层通信
- 组件：工具栏、属性栏、画布容器、协作面板

**2. 状态管理层（Pinia Stores）**
- 统一管理应用状态
- ElementStore：所有元素数据
- ToolStore：当前工具、选中状态
- ViewportStore：缩放、平移、视口位置
- UIStore：浮动工具栏、快捷键状态

**3. 核心引擎层（Core）**
- **CanvasEngine**：渲染主循环，请求帧率优化
- **ToolManager**：工具模式，8 种绘图工具
- **ViewportManager**：视口变换矩阵，管理缩放平移
- **Renderer**：分层渲染（静态/动态/UI层）
- **CommandManager**：撤销/重做栈

**4. 工具函数层**
- **CoordinateTransformer**：坐标转换（虚拟↔屏幕）
- **SpatialIndex**：空间哈希，O(1) 元素查找
- **PerformanceMonitor**：FPS 监控
- **ErrorMonitor**：错误上报

---

#### 三、核心功能模块

| 模块 | 功能 | 关键技术 |
|-----|------|---------|
| 画布渲染 | 无限画布、60fps 渲染 | 视口裁剪、LOD、分层渲染 |
| 绘图工具 | 矩形/椭圆/画笔/文本/箭头 | 工具模式、状态机 |
| 坐标系统 | 虚拟坐标、屏幕坐标转换 | 变换矩阵 |
| 对齐吸附 | 智能参考线、元素吸附 | 空间哈希、几何计算 |
| 视口管理 | 缩放、平移、滚轮缩放 | 变换矩阵、中心缩放算法 |
| 撤销重做 | 操作历史管理 | 命令模式、栈结构 |
| 实时协作 | 多端同步、光标显示 | BroadcastChannel |
| 模板系统 | 一键生成图表 | 批量操作、包围盒计算 |

---

#### 四、功能关联与数据流

```
用户操作 → 工具响应 → 元素变更 → 命令执行 → 状态更新 → 渲染触发 → 视图更新

具体流程：

1. 用户点击工具栏选择"矩形工具"
   → ToolStore.currentTool = 'rectangle'

2. 用户在画布上拖拽
   → ShapeTool.onMouseDown → onMouseMove → onMouseUp
   → 创建新元素数据

3. 元素添加到画布
   → CommandManager.execute(new AddElementCommand)
   → ElementStore 添加元素
   → 触发 'element:add' 事件

4. 渲染引擎响应
   → CanvasEngine 监听状态变化
   → 调用 Renderer.render()
   → 视口裁剪 → LOD 判断 → 分层绘制

5. 协作同步（可选）
   → BroadcastChannel 广播操作
   → 其他标签页接收并执行相同命令
```

---

#### 五、设计模式应用

| 模式 | 应用场景 |
|-----|---------|
| 工具模式 | 8 种绘图工具切换 |
| 命令模式 | 撤销/重做 |
| 观察者模式 | 事件总线、状态同步 |
| 单例模式 | CanvasEngine、CommandManager |
| 策略模式 | 不同元素的渲染策略 |

---

#### 六、面试话术总结

> 我的项目采用了**分层架构 + 模块化设计**。
> 
> **视图层**用 Vue3 管理 UI，**状态层**用 Pinia 统一管理数据，**核心引擎层**封装了 Canvas 渲染、工具管理、视口管理等核心逻辑，**工具函数层**提供坐标转换、空间索引等基础设施。
> 
> 这种架构的好处是**职责清晰、便于扩展**。比如要加新工具，只需要实现 Tool 接口并注册到 ToolManager；要加新渲染效果，只需要在 Renderer 层添加方法。

---

*此面试题文档基于 BoardWhite 项目整理，涵盖项目架构、Canvas 渲染、性能优化、实时协作等核心技术点。*
