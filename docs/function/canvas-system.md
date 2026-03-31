# 画布系统

## 概述
画布系统是 FlowCanvas 的核心，负责元素的渲染、视口管理、坐标转换和性能优化。

## 核心组件

| 文件 | 职责 |
|------|------|
| `CanvasEngine.ts` | 主引擎，协调各模块 |
| `Renderer.ts` | 元素渲染、性能优化 |
| `ViewportManager.ts` | 缩放、平移管理 |
| `CoordinateTransformer.ts` | 屏幕/虚拟坐标转换 |
| `EventManager.ts` | 事件处理分发 |

## 坐标系统

### 双坐标系
- **屏幕坐标**: Canvas 实际像素，与视口相关
- **虚拟坐标**: 画布元素位置，独立于视口

### 转换方法
```typescript
// 屏幕 → 虚拟
screenToVirtual(screenPoint: Vector2): Vector2

// 虚拟 → 屏幕
virtualToScreen(virtualPoint: Vector2): Vector2

// 屏幕 → 虚拟（带尺寸）
screenToVirtualSize(screenSize: Vector2): Vector2
```

## 渲染流程

```
1. requestAnimationFrame 触发
       ↓
2. 清空画布 (clearCanvas)
       ↓
3. 应用视口变换 (applyTransform)
       ↓
4. 可见性裁剪 (getVisibleElements)
       ↓
5. 渲染可见元素 (renderElement)
       ↓
6. 渲染网格 (renderGrid)
       ↓
7. 渲染标尺 (renderRulers)
       ↓
8. 渲染覆盖层 (renderOverlay)
```

## LOD 级别

根据缩放级别调整渲染细节：

| 级别 | 触发条件 | 渲染策略 |
|------|----------|----------|
| high | scale > 0.5 | 全细节、离屏缓存 |
| medium | 0.1 ≤ scale ≤ 0.5 | 离屏缓存 |
| low | scale < 0.1 | 简化矩形 |

## 性能优化

### 1. 脏区域渲染
```typescript
// 标记脏区域
markDirtyRegion(x, y, width, height)

// 仅重绘脏区域
renderDirtyRegions(elements)
```

### 2. 离屏缓存
```typescript
// 元素缓存
elementCache: Map<string, { canvas: HTMLCanvasElement; version: string }>

// 版本控制
getElementVersion(element): string

// 缓存失效
invalidateElementCache(elementId)
```

### 3. 节流渲染
```typescript
private renderThrottleMs: number = 16  // 60fps
```

## 视口管理

```typescript
interface Viewport {
  scale: number       // 缩放比例 (0.1 ~ 5)
  offset: Vector2     // 平移偏移
  width: number       // 视口宽度
  height: number      // 视口高度
}

// 操作
zoomTo(scale: number, center?: Vector2)
panTo(offset: Vector2)
resetViewport()
```

## 无限画布

- 网格范围: -3000 ~ 3000 虚拟坐标
- 动态计算网格间距
- 支持大坐标渲染

## 关键文件
- `src/core/canvas/CanvasEngine.ts`
- `src/core/canvas/Renderer.ts`
- `src/core/canvas/ViewportManager.ts`
- `src/core/canvas/CoordinateTransformer.ts`
