# 工具系统

## 概述
工具系统负责处理用户交互，每种工具对应一种绘图行为。

## 基类结构

```typescript
// src/core/tools/BaseTool.ts
export abstract class BaseTool {
  protected state: ToolState
  protected canvasEngine?: any

  // 抽象方法（子类必须实现）
  abstract getName(): string
  abstract getIcon(): string
  abstract getToolType(): string
  abstract onMouseDown(event: ToolEvent): void
  abstract onMouseMove(event: ToolEvent): void
  abstract onMouseUp(event: ToolEvent): void

  // 可选方法
  activate(): void {}
  deactivate(): void {}
}
```

## 工具事件

```typescript
interface ToolEvent {
  type: 'mousedown' | 'mousemove' | 'mouseup' | 'keydown'
  position: Vector2
  originalEvent: MouseEvent | KeyboardEvent | TouchEvent
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  button?: number
}
```

## 工具状态

```typescript
interface ToolState {
  isActive: boolean
  startPosition?: Vector2
  currentPosition?: Vector2
  selectedElements: CanvasElement[]
  isEditing?: boolean
  editingElementId?: string
  currentText?: string
}
```

## 现有工具

| 工具 | 文件 | 功能 |
|------|------|------|
| SelectTool | SelectTool.ts | 选择、移动、缩放元素 |
| ShapeTool | ShapeTool.ts | 绘制矩形、圆形等 |
| PenTool | PenTool.ts | 自由路径绘制 |
| TextTool | TextTool.ts | 文本输入 |
| ArrowTool | ArrowTool.ts | 箭头和线条 |
| LineTool | LineTool.ts | 直线绘制 |
| ImageTool | ImageTool.ts | 图片插入 |
| StyleBrushTool | StyleBrushTool.ts | 样式复制 |

## 工具管理器

```typescript
// src/core/tools/ToolManager.ts
export class ToolManager {
  private tools: Map<string, BaseTool>
  private currentTool?: BaseTool

  // 注册工具
  registerTool(tool: BaseTool): void

  // 切换工具
  setTool(toolName: string): void

  // 获取当前工具
  getCurrentTool(): BaseTool | undefined
}
```

## 工具切换流程

```
用户点击工具栏
       ↓
ToolManager.setTool('shape')
       ↓
currentTool.deactivate()  // 停用旧工具
       ↓
currentTool = tools.get('shape')
       ↓
currentTool.activate()     // 激活新工具
```

## 创建新工具

```typescript
// 1. 继承 BaseTool
export class MyCustomTool extends BaseTool {
  private isDrawing = false

  // 2. 实现抽象方法
  getName() { return '自定义工具' }
  getIcon() { return '🎯' }
  getToolType() { return 'myCustom' }

  // 3. 实现事件处理
  onMouseDown(event: ToolEvent) {
    this.isDrawing = true
    // 创建元素...
  }

  onMouseMove(event: ToolEvent) {
    if (this.isDrawing) {
      // 预览绘制...
    }
  }

  onMouseUp(event: ToolEvent) {
    this.isDrawing = false
    // 完成绘制...
  }
}

// 4. 注册工具
toolManager.registerTool(new MyCustomTool())
```

## 坐标转换

工具中常用坐标转换：

```typescript
// 在工具中
protected screenToVirtual(screenPoint: Vector2): Vector2 {
  return this.canvasEngine.viewportManager
    .getCoordinateTransformer()
    .screenToVirtual(screenPoint)
}
```

## 关键文件
- `src/core/tools/BaseTool.ts` - 工具基类
- `src/core/tools/ToolManager.ts` - 工具管理器
- `src/core/tools/SelectTool.ts` - 选择工具（参考实现）
