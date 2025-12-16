# 白板应用

基于Vue 3和TypeScript的在线协作白板应用，模仿Boardmix博思白板的核心功能。

## 项目概述

这是一个功能丰富的零代码绘图平台，提供：
- 无限画布系统
- 丰富的绘图工具
- 实时协作能力
- 多媒体集成

## 技术栈

- **前端框架**: Vue 3 + Composition API + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **图形渲染**: Canvas 2D API
- **存储方案**: IndexedDB + 本地存储

## 项目结构

```
src/
  core/
    canvas/
      CanvasEngine.ts        # 画布核心引擎
      ViewportManager.ts     # 视口管理
      Renderer.ts           # 渲染器
      CoordinateTransformer.ts # 坐标转换
      EventManager.ts       # 事件管理
  components/
    Canvas/
      WhiteboardCanvas.vue  # 主画布组件
  stores/
    canvasStore.ts         # 画布状态管理
  types/
    canvas.types.ts        # 类型定义
  utils/
    math/
      Vector2.ts           # 2D向量工具
      Matrix2D.ts          # 2D变换矩阵
      Geometry.ts          # 几何计算工具
```

## 开发阶段

### 第一阶段：画布系统 ✅
- [x] 无限画布实现
- [x] 缩放和视图控制
- [x] 基础渲染引擎
- [x] 坐标转换系统
- [x] 事件处理系统

### 第二阶段：基础工具（计划中）
- [ ] 选择工具
- [ ] 画笔工具
- [ ] 形状工具
- [ ] 文本工具
- [ ] 元素变换

### 第三阶段：高级功能（计划中）
- [ ] 思维导图
- [ ] 流程图
- [ ] 模板系统
- [ ] 导入导出

### 第四阶段：协作系统（计划中）
- [ ] 实时光标显示
- [ ] 操作同步
- [ ] 评论系统

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 核心功能

### 画布系统
- **无限画布**: 支持无限扩展的绘图区域
- **缩放控制**: 支持0.1x到5x的平滑缩放
- **视图管理**: 多视图保存、快速定位
- **网格背景**: 可切换网格样式和间距
- **标尺参考线**: 智能参考线和对齐辅助

### 坐标系统
- **虚拟坐标**: 逻辑坐标与屏幕坐标的转换
- **视口管理**: 视口变换和边界检测
- **变换矩阵**: 2D变换矩阵支持

### 渲染引擎
- **高性能渲染**: 基于Canvas 2D API
- **脏区域重绘**: 只重绘变化的区域
- **视口裁剪**: 只渲染可见元素
- **高DPI支持**: 支持高分辨率显示器

## 使用说明

### 基本操作
- **平移**: 中键拖拽或Ctrl+左键拖拽
- **缩放**: 鼠标滚轮
- **选择**: 点击工具栏中的选择工具
- **绘制**: 选择相应工具后点击画布

### 快捷键
- `Ctrl + 0`: 缩放到100%
- `Ctrl + +`: 放大
- `Ctrl + -`: 缩小
- `Ctrl + Z`: 撤销
- `Ctrl + Y`: 重做

## 开发指南

### 添加新工具
1. 在 `types/canvas.types.ts` 中定义工具类型
2. 在 `stores/canvasStore.ts` 中添加工具状态
3. 在 `WhiteboardCanvas.vue` 中添加工具按钮
4. 实现工具的具体逻辑

### 添加新元素类型
1. 在 `types/canvas.types.ts` 中定义元素类型
2. 在 `Renderer.ts` 中添加渲染逻辑
3. 在 `CanvasEngine.ts` 中添加处理逻辑

## 性能优化

- **渲染优化**: 使用脏区域重绘和视口裁剪
- **内存管理**: 及时清理不需要的资源
- **事件优化**: 使用事件委托和防抖
- **数据结构**: 使用高效的数据结构

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT License

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。
