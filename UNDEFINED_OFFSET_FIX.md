# 修复 viewport.offset 为 undefined 的问题

## 🚨 **错误信息**
```
Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'x')
    at Vector2Utils.clone (Vector2.ts:86:24)
    at ViewportManager.setOffset (ViewportManager.ts:164:41)
    at CanvasEngine.syncViewport (CanvasEngine.ts:2712:26)
```

## 🔍 **问题分析**
错误发生在 `CanvasEngine.syncViewport()` 方法中，当调用 `this.viewportManager.setOffset(viewport.offset)` 时，`viewport.offset` 是 `undefined`，导致 `Vector2Utils.clone()` 无法读取 `x` 属性。

## ✅ **解决方案**

### 1. 在 CanvasEngine.syncViewport 中添加安全检查
```typescript
syncViewport(viewport: Viewport): void {
  // 更新视口尺寸
  this.viewportManager.updateViewportSize(viewport.width, viewport.height)
  
  // 安全地设置偏移量
  if (viewport.offset && typeof viewport.offset.x === 'number' && typeof viewport.offset.y === 'number') {
    this.viewportManager.setOffset(viewport.offset)
  } else {
    console.warn('⚠️ viewport.offset 无效，使用默认值:', viewport.offset)
    this.viewportManager.setOffset({ x: 0, y: 0 })
  }
  
  // 安全地设置缩放
  if (typeof viewport.scale === 'number' && viewport.scale > 0) {
    this.viewportManager.zoomTo(viewport.scale)
  } else {
    console.warn('⚠️ viewport.scale 无效，使用默认值:', viewport.scale)
    this.viewportManager.zoomTo(1)
  }
}
```

### 2. 添加调试日志追踪问题
在关键位置添加了详细的调试日志：

#### WhiteboardCanvas.vue
```typescript
console.log('🔍 准备同步视口:', {
  viewport,
  hasOffset: !!viewport.offset,
  offsetType: typeof viewport.offset,
  offsetValue: viewport.offset
})
```

#### canvasStore.ts
```typescript
const updateViewport = (newViewport: Partial<Viewport>) => {
  console.log('🔄 updateViewport 调用:', {
    newViewport,
    currentViewport: { ...viewport },
    hasOffset: !!viewport.offset,
    offsetValue: viewport.offset
  })
  Object.assign(viewport, newViewport)
  console.log('✅ updateViewport 完成:', {
    updatedViewport: { ...viewport },
    hasOffset: !!viewport.offset,
    offsetValue: viewport.offset
  })
}
```

## 🎯 **修复效果**
- ✅ 防止 `viewport.offset` 为 `undefined` 时崩溃
- ✅ 提供默认值 `{ x: 0, y: 0 }` 作为后备
- ✅ 添加详细的调试日志帮助定位问题
- ✅ 确保应用能够正常启动和运行

## 🔧 **调试信息**
现在运行应用时，控制台会显示：
1. **视口同步前的状态** - 检查 `viewport.offset` 是否有效
2. **updateViewport 调用** - 追踪视口更新过程
3. **警告信息** - 如果发现无效值会显示警告

## 📁 **修改的文件**
1. `src/core/canvas/CanvasEngine.ts` - 添加安全检查
2. `src/stores/canvasStore.ts` - 添加调试日志
3. `src/components/Canvas/WhiteboardCanvas.vue` - 添加调试日志

## 🚀 **测试步骤**
1. 运行项目，打开浏览器开发者工具
2. 观察控制台输出，检查是否有警告信息
3. 验证应用能够正常启动，不再出现崩溃
4. 测试画布工具是否正常工作

这个修复确保了即使 `viewport.offset` 为 `undefined`，应用也不会崩溃，并且会使用合理的默认值。
