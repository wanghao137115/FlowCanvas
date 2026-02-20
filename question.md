1.怎么保障无限画布下 200 层元素 60fps 流畅渲染
    1. 视口裁剪 (Viewport Culling) - 最重要
    只渲染当前视口可见的元素，跳过视口外的元素：
    // 伪代码示例function shouldRenderElement(element, viewport) {  return !(    element.x + element.width < viewport.x ||    element.x > viewport.x + viewport.width ||    element.y + element.height < viewport.y ||    element.y > viewport.y + viewport.height  )}
    2. 分层渲染 (Layer Separation)
    将静态元素和动态元素分开：
    静态层：背景、参考线等，渲染一次后缓存
    动态层：用户正在操作的元素、选中的高亮等
    UI层：浮动工具栏、光标等
    3. 脏矩形渲染 (Dirty Rectangle)
    只重绘发生变化的区域，而不是整个画布：
    // 记录上一次渲染的区域，下一次只重绘变化的部分let dirtyRect = nullfunction markDirty(x, y, width, height) {  dirtyRect = union(dirtyRect, {x, y, width, height})}
    4. 细节层次 (LOD - Level of Detail)
    根据缩放级别调整渲染细节：
    缩放 < 50%：不渲染文本、边框细化、简化图形
    缩放 > 200%：增加抗锯齿、显示更多细节
    5. 空间索引 (Spatial Indexing)
    使用四叉树 (Quadtree) 或空间哈希快速查找元素，避免遍历所有 200 层：
    // 四叉树结构class Quadtree {  insert(element) {    // 只插入到对应的象限  }  query(viewport) {    // O(log n) 时间复杂度查找  }}
    6. requestAnimationFrame + 帧预算
    let frameBudget = 16 // 60fps = 16ms/帧function render() {  const start = performance.now()    // 在预算时间内渲染尽可能多的元素  while (performance.now() - start < frameBudget) {    renderNextChunk()  }    requestAnimationFrame(render)}
    7. 元素池 + 对象复用
    避免频繁创建/销毁对象：
    // 预创建元素对象池const elementPool = new Pool(() => new CanvasElement(), 1000)
    8. WebGL / GPU 加速
    对于 200 层复杂元素，考虑使用：
    Pixi.js / Fabric.js (WebGL 渲染)
    或者将 Canvas 2D 与 WebGL 结合


2.基于变换矩阵实现视口管理

> "视口管理的核心是维护一个变换矩阵，包含 offset（偏移量）和 scale（缩放比例）两个参数。
>
> 实现思路：
> 1. 虚拟坐标（元素实际存储的坐标）→ 屏幕坐标（用户看到的）
> 2. 通过 scale 控制缩放，通过 offset 控制平移
> 3. 鼠标滚轮缩放时，以鼠标为中心点计算新的 offset
> 4. 拖拽画布时更新 offset 值
>
> 项目中我使用了 CanvasRenderingContext2D.setTransform() 或手动计算坐标转换，确保所有元素都能正确渲染在视口内。"


3.屏幕/虚拟坐标转换

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

> 1. 屏幕 → 虚拟坐标（鼠标事件）
> 用户在屏幕上点击的位置，需要转换为画布内部的虚拟坐标：
> virtualX = screenX / scale + offsetX
>
> 2. 虚拟 → 屏幕坐标（渲染）
> 元素存储的虚拟坐标，需要转换为屏幕上的绘制位置：
> screenX = (virtualX - offsetX) * scale
>
> 项目中我封装了 CoordinateTransformer 类，统一管理所有坐标转换，确保缩放/拖拽时元素定位准确。"


5.项目搭建

> "项目采用 Vue 3 + TypeScript + Vite 搭建，这是目前 Vue 生态的主流方案。
>
> 搭建流程：
> 1. npm create vite@latest 创建项目
> 2. 安装核心依赖：pinia, element-plus, @vueuse/core
> 3. 搭建目录结构：core/（核心引擎）、components/（组件）、types/（类型定义）
> 4. 封装 Canvas 引擎、工具系统、渲染器
> 5. 集成协作、监控等高级功能
>
> 选择 Vite 是因为开发体验好，热更新时间在 50ms 以内。"

7.性能提升：运用虚拟化渲染、分层渲染技术优化性能

分层渲染架构
┌─────────────────────────────────┐│  UI 层 (FloatingToolbar)        │  ← 每次重绘├─────────────────────────────────┤│  动态层 (选中元素、高亮)         │  ← 需要时重绘├─────────────────────────────────┤│  主画布层 (所有元素)             │  ← 视口裁剪 + LOD├─────────────────────────────────┤│  静态层 (背景、参考线)           │  ← 缓存，不重绘└─────────────────────────────────┘


虚拟化渲染
// 只渲染视口内的元素function getVisibleElements(elements: Element[], viewport: Viewport): Element[] {  return elements.filter(el => {    const screenPos = virtualToScreen(el.position, viewport)    const screenSize = {      width: el.size.width * viewport.scale,      height: el.size.height * viewport.scale    }    // 视口裁剪判断    return !(screenPos.x + screenSize.width < 0 ||             screenPos.x > viewport.width ||             screenPos.y + screenSize.height < 0 ||             screenPos.y > viewport.height)  })}
面试回答
> "性能优化我主要从三个方面入手：
>
> 1. 视口裁剪（Viewport Culling） - 最重要
> 只渲染当前视口可见的元素，跳过视口外的元素，减少 90% 的渲染工作量。
>
> 2. 分层渲染（Layer Separation）
> - 静态层（背景、参考线）：渲染一次后缓存
> - 动态层（选中元素）：需要时重绘
> - UI 层（工具栏）：独立于 Canvas
>
> 3. LOD（细节层次）
> 缩放比例 < 50% 时简化渲染，不绘制文本、边框细化。
>
> 通过这些优化，项目在 500 个元素下仍能保持 60fps。"


8.不同分辨率下怎么计算元素位置

// 1. 使用物理像素 vs CSS 像素
const dpr = window.devicePixelRatio  // 设备像素比

// 2. Canvas 适配高分辨率屏
canvas.width = rect.width * dpr
canvas.height = rect.height * dpr
ctx.scale(dpr, dpr)

// 3. 元素位置始终使用虚拟坐标，不依赖分辨率
const element = {
  position: { x: 100, y: 100 }  // 虚拟坐标，任何分辨率下一致
}

> "不同分辨率下的位置计算，关键在于统一使用虚拟坐标系统：
>
> 1. 元素位置：始终存储虚拟坐标，不依赖屏幕分辨率
> 2. Canvas 适配：通过 devicePixelRatio 调整 Canvas 实际像素，防止模糊
> 3. 事件坐标：鼠标事件获取的屏幕坐标 → 转换为虚拟坐标 → 与元素比较
>
> 这样无论在 1x、2x、3x 屏幕上，元素位置都能保持一致。"

9.多人操作时，怎么协调

> "多人协作我使用 BroadcastChannel API 模拟 WebSocket 实现：
>
> 1. 用户管理
> - 每个人有唯一的 userId、随机颜色、用户名
> - 通过心跳机制检测用户在线状态
>
> 2. 实时光标
> - 监听 mousemove 事件，节流后广播位置
> - 远程用户的光标用 DOM 元素渲染，避免 Canvas 冲突
>
> 3. 操作同步
> - 元素的增删改通过消息广播
> - 接收方执行相同操作，保持画布一致
>
> 4. 冲突处理
> - 使用时间戳作为版本号
> - 简单的 Last-Write-Wins 策略
>
> 这种方案不需要后端，适合多标签页协作场景。"


10.出问题了，怎么收集问题

> - 全局错误监控 window.onerror
> - Promise 异常捕获 unhandledrejection
> - 性能监控（FP、FCP、LCP）
> - 资源加载错误监控
> - 接口成功率监控


11.怎么测试问题，做压力测试，测试性能

我在项目中实现了一个压力测试工具，支持批量添加 100-2000 个元素，实时监控 FPS、渲染耗时和内存使用。测试时我会关注两个核心指标：
> 1. FPS 是否稳定在 30以上
> 2. p95 渲染耗时 是否低于 16m


功能回归验证（冒烟测试）

上线完成后，立即在生产环境走一遍核心主流程（如登录、注册、下单、支付），确保基本功能可用。

性能监控

加载速度： 观察 FP（首次绘制）、FCP（首次内容绘制）、LCP（最大内容绘制）等核心 Web 指标是否有异常波动。

资源错误： 检查是否有 JS、CSS 文件加载 404。

错误监控

JS 报错： 通过 Sentry、FrontJS 或阿里云 ARMS 等平台，监控生产环境 JavaScript 执行报错。

Promise 异常： 确保有全局捕获未处理的 Promise 拒绝。

用户体验监控

白屏检测： 是否有部分用户出现白屏？（通常由于某段 JS 语法不兼容导致后续渲染中断）。

接口成功率： 观察前端请求后端的成功率是否在 99.9% 以上。


协作功能：设计实时协作系统

