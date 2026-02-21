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
3. **性能监控**：FP、FCP、LCP
4. **资源加载错误监控**
5. **接口成功率监控**

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

---

## 六、Vue3 与 TypeScript 相关

### 21. Vue3 的 Composition API 和 Options API 有什么区别？为什么选择 Composition API？

**答：**
1. **Composition API**：
   - 逻辑复用更方便（Composable functions）
   - 代码组织更灵活（按功能而非选项类型分组）
   - 更好的 TypeScript 支持
   -  tree-shaking 优化

2. **选择原因**：
   - 项目是复杂的大型应用，Composition API 更好组织代码
   - Canvas 相关的逻辑较多，需要更好的逻辑复用
   - TypeScript 类型推导更准确

---

### 22. TypeScript 在项目中起到了什么作用？

**答：**
1. **类型安全**：减少运行时错误
2. **类型推导**：IDE 智能提示更准确
3. **接口定义**：Canvas 元素、工具、命令等都有完整的类型定义
4. **重构支持**：大型重构时类型检查提供安全保障

---

### 23. Pinia 状态管理是如何使用的？

**答：**
```typescript
// 定义 Store
export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    elements: [] as Element[],
    selectedIds: [] as string[],
    viewport: { offset: { x: 0, y: 0 }, scale: 1 }
  }),
  
  getters: {
    selectedElements: (state) => 
      state.elements.filter(el => state.selectedIds.includes(el.id))
  },
  
  actions: {
    addElement(element: Element) {
      this.elements.push(element)
    },
    // ...
  }
})
```

---

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

*此面试题文档基于 BoardWhite 项目整理，涵盖项目架构、Canvas 渲染、性能优化、实时协作等核心技术点。*
