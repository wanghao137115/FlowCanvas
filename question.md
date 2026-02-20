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


3.屏幕/虚拟坐标转换


5.项目搭建

7.性能提升：运用虚拟化渲染、分层渲染技术优化性能


8.不同分辨率下怎么计算元素位置


9.多人操作时，怎么协调


10.出问题了，怎么收集问题


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

