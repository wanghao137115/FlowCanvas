# 画布工具坐标问题调试分析

## 问题描述
除了文本和形状工具外，其他功能（画笔、线条等）绘制完位置和预览不在一个地方，点击还有类似选择功能的选中。

## 可能的原因分析

### 1. 坐标系统不一致
- **绘制时使用屏幕坐标**：工具在绘制预览时直接使用 `event.position`（屏幕坐标）
- **最终元素存储虚拟坐标**：元素创建时可能进行了坐标转换
- **渲染时再次转换**：Renderer 在渲染时会将虚拟坐标转换为屏幕坐标

### 2. 坐标转换问题
```typescript
// 在工具中
this.startPoint = { ...event.position }  // 屏幕坐标
this.currentPoint = { ...event.position }  // 屏幕坐标

// 在 createShapeElement 中
const element: CanvasElement = {
  position: { x, y },  // 这里应该是什么坐标？
  size: { x: width, y: height }
}

// 在 Renderer 中
const screenPos = this.coordinateTransformer.virtualToScreen(element.position)
this.ctx.translate(screenPos.x, screenPos.y)  // 转换为屏幕坐标渲染
```

### 3. 预览和最终绘制使用不同坐标系统
- **预览**：直接使用屏幕坐标绘制
- **最终元素**：可能存储为虚拟坐标，然后转换回屏幕坐标渲染

## 调试工具添加

### 1. 创建了 DebugTool.ts
- 实时显示鼠标位置、屏幕坐标、虚拟坐标
- 显示视口信息（缩放、偏移）
- 显示元素信息和最近元素

### 2. 在关键位置添加调试打印
- **ShapeTool**: MouseDown, MouseUp, createShapeElement
- **PenTool**: MouseDown
- **LineTool**: MouseDown
- **CanvasEngine**: addElement
- **Renderer**: renderElement

### 3. 调试信息包括
```typescript
console.log('🔷 ShapeTool MouseDown:', {
  screenPosition: event.position,
  virtualPosition: this.screenToVirtual(event.position),
  viewport: this.canvasEngine?.viewportManager?.getViewport(),
  scale: this.canvasEngine?.viewportManager?.getViewport()?.scale
})
```

## 建议的解决方案

### 1. 统一坐标系统
确保所有工具在绘制预览和创建元素时使用相同的坐标系统：

```typescript
// 方案A：全部使用屏幕坐标
// 预览和最终元素都使用屏幕坐标，不进行转换

// 方案B：全部使用虚拟坐标
// 预览时转换为虚拟坐标，最终元素也使用虚拟坐标
```

### 2. 修复坐标转换
检查 `screenToVirtual` 和 `virtualToScreen` 方法是否正确：

```typescript
// 确保坐标转换的一致性
const virtualPos = this.screenToVirtual(screenPos)
const backToScreen = this.virtualToScreen(virtualPos)
// backToScreen 应该等于 screenPos
```

### 3. 预览和最终绘制保持一致
```typescript
// 预览时
this.renderPreview(ctx, this.screenToVirtual(startPos), this.screenToVirtual(currentPos))

// 创建元素时
const element = this.createElement(
  this.screenToVirtual(startPos), 
  this.screenToVirtual(currentPos)
)
```

## 测试方法

### 1. 使用调试工具
1. 打开浏览器开发者工具
2. 切换到调试工具
3. 绘制形状，观察控制台输出
4. 对比屏幕坐标和虚拟坐标的差异

### 2. 使用测试页面
打开 `debug-test.html` 进行简单的坐标测试

### 3. 检查关键日志
关注以下调试信息：
- 🔷 ShapeTool MouseDown/MouseUp
- 🎨 CanvasEngine addElement
- 🎨 Renderer renderElement

## 下一步行动

1. **运行调试**：使用调试工具观察坐标转换过程
2. **分析日志**：对比屏幕坐标和虚拟坐标的差异
3. **修复坐标系统**：统一预览和最终绘制的坐标系统
4. **测试验证**：确保修复后位置一致

## 相关文件

- `src/core/tools/DebugTool.ts` - 调试工具
- `src/core/tools/ShapeTool.ts` - 形状工具（已添加调试）
- `src/core/tools/PenTool.ts` - 画笔工具（已添加调试）
- `src/core/tools/LineTool.ts` - 线条工具（已添加调试）
- `src/core/canvas/CanvasEngine.ts` - 画布引擎（已添加调试）
- `src/core/canvas/Renderer.ts` - 渲染器（已添加调试）
- `debug-test.html` - 简单测试页面
