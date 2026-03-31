# FlowCanvas 项目规范

## 项目概述
- **项目名称**: FlowCanvas - 在线协作白板
- **技术栈**: Vue 3 + TypeScript + Vite + Pinia + Element Plus
- **核心功能**: 实时协作绘图、多元素支持、无限画布

## 目录结构
```
src/
├── core/                    # 核心业务逻辑
│   ├── canvas/              # 画布引擎核心
│   ├── tools/              # 绘图工具
│   ├── elements/            # 元素实现
│   ├── collaboration/       # 协作系统
│   ├── export/             # 导出功能
│   ├── history/             # 历史记录
│   ├── layer/              # 图层管理
│   ├── style/              # 样式管理
│   └── ...
├── components/             # Vue 组件
│   ├── Canvas/             # 画布相关组件
│   ├── Collaboration/      # 协作组件
│   └── LayerPanel/         # 图层面板
├── stores/                 # Pinia 状态管理
├── types/                   # TypeScript 类型定义
├── utils/                   # 工具函数
└── data/                    # 静态数据

docs/                       # 文档目录
├── function/               # 按功能领域文档
└── navigator.md            # 文档导航索引
```

## 核心模块
| 模块 | 入口文件 | 职责 |
|------|----------|------|
| 画布引擎 | CanvasEngine.ts | 主入口，协调各模块 |
| 渲染器 | Renderer.ts | 元素渲染、性能优化 |
| 工具系统 | ToolManager.ts | 工具注册和切换 |
| 视口管理 | ViewportManager.ts | 缩放、平移 |
| 坐标转换 | CoordinateTransformer.ts | 屏幕/虚拟坐标转换 |
| 图层管理 | LayerManager.ts | 图层增删改查 |

## 代码规范

### 1. 组件规范 (Vue 3 Composition API)
```typescript
// ✅ 推荐：使用 <script setup>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
const count = ref(0)
</script>

// ❌ 避免：Options API（除非必要）
```

### 2. 核心逻辑规范 (Class)
```typescript
// ✅ 推荐：清晰的类结构
export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  public render(elements: CanvasElement[]): void { }
}

// ✅ 推荐：使用 private/public/protected
// ✅ 推荐：使用 TypeScript 类型注解
```

### 3. 类型定义规范
```typescript
// ✅ 推荐：Interface 用于数据结构
export interface CanvasElement {
  id: string
  type: ElementType
  position: Vector2
}

// ✅ 推荐：Type 用于联合类型
export type OperationType = 'add' | 'delete' | 'update'

// ✅ 推荐：Enum 用于固定集合
export enum ToolType {
  SELECT = 'select',
  PEN = 'pen'
}
```

### 4. 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | WhiteboardCanvas.vue |
| 类 | PascalCase | CanvasEngine |
| 函数/变量 | camelCase | handleMouseDown |
| 常量 | UPPER_SNAKE_CASE | MAX_LAYERS |
| 类型/接口 | PascalCase | CanvasElement |
| 文件 | kebab-case | canvas-engine.ts |

### 5. 工具函数规范
```typescript
// ✅ 推荐：纯函数，易于测试
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// ✅ 推荐：类型安全的工具函数
export function screenToVirtual(point: Vector2, viewport: Viewport): Vector2 {
  return {
    x: (point.x - viewport.offset.x) / viewport.scale,
    y: (point.y - viewport.offset.y) / viewport.scale
  }
}
```

## API 风格
- 组件间通信：Props + Events + Provide/Inject
- 状态管理：Pinia Store
- 外部 API：TypeScript Interface

## 文档导航
详见 `docs/navigator.md`
