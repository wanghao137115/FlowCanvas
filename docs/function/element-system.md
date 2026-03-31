# 元素系统

## 概述
元素是画布上可绘制和操作的基本单位。

## 元素类型

```typescript
// src/types/canvas.types.ts
export enum ElementType {
  SHAPE = 'shape',
  TEXT = 'text',
  PATH = 'path',
  IMAGE = 'image',
  ARROW = 'arrow',
  LINE = 'line'
}
```

## 元素结构

```typescript
interface CanvasElement {
  id: string                    // 唯一标识
  type: ElementType             // 元素类型
  position: Vector2             // 位置 (x, y)
  size: Vector2                 // 尺寸 (width, height)
  rotation: number              // 旋转角度 (度)
  style: ElementStyle           // 样式
  layer: string                 // 图层 ID
  locked: boolean               // 是否锁定
  visible: boolean              // 是否可见
  createdAt: number             // 创建时间
  updatedAt: number             // 更新时间
  data?: {                     // 类型特定数据
    shapeType?: string          // 形状类型
    points?: Vector2[]          // 路径点
    text?: string               // 文本内容
    image?: HTMLImageElement     // 图片元素
  }
}
```

## 样式结构

```typescript
interface ElementStyle {
  fill?: string                 // 填充色
  fillEnabled?: boolean
  fillType?: string
  stroke?: string               // 描边色
  strokeWidth?: number          // 描边宽度
  lineStyle?: string            // 线条样式 (solid/dashed/dotted)
  lineDash?: number[]
  lineCap?: string
  opacity?: number              // 透明度 (0-1)
  fontSize?: number             // 字体大小
  fontFamily?: string           // 字体
  fontWeight?: string           // 字重
  fontStyle?: string
  textAlign?: string            // 文本对齐
  textDecoration?: string       // 文本装饰
}
```

## 元素类型详解

### 1. 形状元素 (Shape)
```typescript
{
  type: 'shape',
  data: {
    shapeType: 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'ellipse'
  }
}
```

### 2. 文本元素 (Text)
```typescript
{
  type: 'text',
  data: {
    text: 'Hello World'
  }
}
```

### 3. 路径元素 (Path)
```typescript
{
  type: 'path',
  data: {
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 200, y: 100 }
    ]
  }
}
```

### 4. 图片元素 (Image)
```typescript
{
  type: 'image',
  data: {
    image: HTMLImageElement,
    src: 'https://...',
    filters?: ImageFilters
  }
}
```

### 5. 箭头元素 (Arrow)
```typescript
{
  type: 'arrow',
  data: {
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    arrowType: 'line' | 'bidirectional',
    arrowStyle: {
      shape: 'triangle' | 'circle' | 'square',
      size: 10,
      color: '#000'
    }
  }
}
```

### 6. 线条元素 (Line)
```typescript
{
  type: 'line',
  data: {
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
  }
}
```

## 元素创建

```typescript
// 工厂函数
function createElement(type: ElementType, position: Vector2): CanvasElement {
  return {
    id: generateId(),
    type,
    position,
    size: { x: 100, y: 100 },
    rotation: 0,
    style: getDefaultStyle(type),
    layer: 'default',
    locked: false,
    visible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: {}
  }
}
```

## 元素操作

```typescript
// 移动
function moveElement(element: CanvasElement, delta: Vector2): CanvasElement {
  return {
    ...element,
    position: {
      x: element.position.x + delta.x,
      y: element.position.y + delta.y
    },
    updatedAt: Date.now()
  }
}

// 缩放
function resizeElement(element: CanvasElement, newSize: Vector2): CanvasElement {
  return {
    ...element,
    size: newSize,
    updatedAt: Date.now()
  }
}

// 旋转
function rotateElement(element: CanvasElement, rotation: number): CanvasElement {
  return {
    ...element,
    rotation: element.rotation + rotation,
    updatedAt: Date.now()
  }
}
```

## 元素查询

```typescript
// 获取元素
function getElementById(id: string): CanvasElement | undefined

// 按类型查询
function getElementsByType(type: ElementType): CanvasElement[]

// 按图层查询
function getElementsByLayer(layerId: string): CanvasElement[]

// 碰撞检测
function hitTest(element: CanvasElement, point: Vector2): boolean
```

## 关键文件
- `src/types/canvas.types.ts` - 类型定义
- `src/core/elements/ImageElement.ts` - 图片元素实现
- `src/core/tools/ShapeTool.ts` - 形状创建
- `src/core/tools/PenTool.ts` - 路径创建
