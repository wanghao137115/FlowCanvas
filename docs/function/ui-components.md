# UI 组件

## 概述
Vue 3 组件结构，使用 Composition API 和 Element Plus 组件库。

## 组件结构

```
src/components/
├── Canvas/
│   ├── WhiteboardCanvas.vue    # 白板主组件
│   ├── StylePanel.vue          # 样式面板
│   ├── FloatingStyleToolbar.vue # 浮动样式工具栏
│   ├── ColorPicker.vue          # 颜色选择器
│   └── MiniMap.vue              # 小地图
├── Collaboration/
│   └── CollaborationPanel.vue  # 协作面板
├── LayerPanel/
│   ├── LayerPanel.vue          # 图层面板
│   └── ThumbnailPreview.vue    # 缩略图预览
└── Image/
    ├── ImageSelectorModal.vue   # 图片选择弹窗
    └── ImageFloatingToolbar.tsx # 图片浮动工具栏
```

## 白板组件

```vue
<!-- src/components/Canvas/WhiteboardCanvas.vue -->
<template>
  <div class="whiteboard-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <ToolbarButton v-for="tool in tools" :key="tool.name" />
    </div>

    <!-- 画布 -->
    <canvas ref="canvasRef" @mousedown="handleMouseDown" />

    <!-- 浮动工具栏 -->
    <FloatingStyleToolbar v-if="hasSelection" />

    <!-- 图层面板 -->
    <LayerPanel />

    <!-- 小地图 -->
    <MiniMap />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'

const canvasStore = useCanvasStore()
const canvasRef = ref<HTMLCanvasElement>()

// 初始化画布引擎
onMounted(() => {
  initCanvasEngine()
})

// 事件处理
function handleMouseDown(e: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const position = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  canvasEngine.handleMouseDown(position)
}
</script>
```

## 组件通信

### 1. Props + Events
```vue
<!-- 父组件 -->
<ChildComponent :value="count" @update="handleUpdate" />

<!-- 子组件 -->
<script setup>
defineProps<{ value: number }>()
const emit = defineEmits<{ (e: 'update', value: number): void }>()
emit('update', newValue)
</script>
```

### 2. Provide/Inject
```typescript
// 父组件
import { provide } from 'vue'
provide('canvasEngine', canvasEngine)

// 子组件
import { inject } from 'vue'
const canvasEngine = inject('canvasEngine')
```

### 3. Pinia Store
```typescript
// 任何组件都可以直接访问
const store = useCanvasStore()
store.addElement(element)
```

## 组件类型

```typescript
// src/types/toolbar.types.ts
interface ToolbarConfig {
  tools: ToolConfig[]
  groups: ToolGroup[]
}

interface ToolConfig {
  id: string
  name: string
  icon: string
  shortcut?: string
  tooltip?: string
}

interface ToolGroup {
  id: string
  name: string
  tools: string[]
}
```

## 样式规范

```vue
<style scoped>
/* 使用 BEM 命名 */
.whiteboard-container {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
}

.whiteboard-container__toolbar {
  /* 工具栏样式 */
}

.whiteboard-container--dark {
  /* 变体样式 */
}

/* 使用 CSS 变量 */
.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
}
</style>
```

## Element Plus 集成

```typescript
// src/main.ts
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

app.use(ElementPlus)

// 使用 Element Plus 组件
// <el-button>、<el-dialog>、<el-slider> 等
```

## 响应式设计

```vue
<style scoped>
/* 移动端适配 */
@media (max-width: 768px) {
  .toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    flex-direction: row;
  }
}

/* 桌面端 */
@media (min-width: 769px) {
  .toolbar {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
  }
}
</style>
```

## 关键文件
- `src/components/Canvas/WhiteboardCanvas.vue`
- `src/components/LayerPanel/LayerPanel.vue`
- `src/components/Canvas/StylePanel.vue`
- `src/App.vue` - 根组件
