# 状态管理

## 概述
使用 Pinia 进行全局状态管理，使用 Vue 3 Composition API 编写。

## Store 文件

| 文件 | 职责 |
|------|------|
| `canvasStore.ts` | 画布状态、元素、视口 |

## Canvas Store

```typescript
// src/stores/canvasStore.ts
export const useCanvasStore = defineStore('canvas', () => {
  // ============ 状态 ============
  
  // 视口
  const viewport = reactive<Viewport>({
    scale: 1,
    offset: { x: 0, y: 0 },
    width: 0,
    height: 0
  })

  // 元素列表
  const elements = ref<CanvasElement[]>([])

  // 选中元素 ID
  const selectedElementIds = ref<string[]>([])

  // 当前工具
  const currentTool = ref<ToolType>(ToolType.SELECT)

  // 画布设置
  const settings = reactive<CanvasSettings>({
    gridSize: 20,
    gridVisible: true,
    rulersVisible: true,
    snapToGrid: false,
    backgroundColor: '#ffffff'
  })

  // ============ 计算属性 ============
  
  // 选中元素
  const selectedElements = computed(() => {
    return elements.value.filter(el => 
      selectedElementIds.value.includes(el.id)
    )
  })

  // 是否有选中
  const hasSelection = computed(() => {
    return selectedElementIds.value.length > 0
  })

  // 撤销/重做状态
  const canUndo = ref(false)
  const canRedo = ref(false)

  // ============ 视口操作 ============
  
  function updateViewport(newViewport: Partial<Viewport>) {
    Object.assign(viewport, newViewport)
  }

  function zoomTo(scale: number, center?: Vector2) {
    // 缩放实现
  }

  function panTo(offset: Vector2) {
    viewport.offset = { ...offset }
  }

  function resetViewport() {
    viewport.scale = 1
    viewport.offset = { x: 0, y: 0 }
  }

  // ============ 元素操作 ============
  
  function addElement(element: CanvasElement) {
    elements.value.push(element)
  }

  function removeElement(elementId: string) {
    const index = elements.value.findIndex(el => el.id === elementId)
    if (index !== -1) {
      elements.value.splice(index, 1)
    }
  }

  function updateElement(element: CanvasElement) {
    const index = elements.value.findIndex(el => el.id === element.id)
    if (index !== -1) {
      elements.value[index] = element
    }
  }

  function getElement(elementId: string): CanvasElement | undefined {
    return elements.value.find(el => el.id === elementId)
  }

  function clearElements() {
    elements.value = []
  }

  // ============ 选择操作 ============
  
  function selectElement(elementId: string) {
    if (!selectedElementIds.value.includes(elementId)) {
      selectedElementIds.value.push(elementId)
    }
  }

  function deselectElement(elementId: string) {
    const index = selectedElementIds.value.indexOf(elementId)
    if (index > -1) {
      selectedElementIds.value.splice(index, 1)
    }
  }

  function selectAll() {
    selectedElementIds.value = elements.value.map(el => el.id)
  }

  function clearSelection() {
    selectedElementIds.value = []
  }

  function toggleSelection(elementId: string) {
    if (selectedElementIds.value.includes(elementId)) {
      deselectElement(elementId)
    } else {
      selectElement(elementId)
    }
  }

  // ============ 历史操作 ============
  
  function undo() {
    return historyManager.undo()
  }

  function redo() {
    return historyManager.redo()
  }

  // ============ 返回 ============
  return {
    // 状态
    viewport,
    elements,
    selectedElementIds,
    currentTool,
    settings,

    // 计算属性
    selectedElements,
    hasSelection,
    canUndo,
    canRedo,

    // 方法
    updateViewport,
    zoomTo,
    panTo,
    resetViewport,
    addElement,
    removeElement,
    updateElement,
    getElement,
    clearElements,
    selectElement,
    deselectElement,
    selectAll,
    clearSelection,
    toggleSelection,
    setCurrentTool,
    updateSettings,
    undo,
    redo
  }
})
```

## 使用 Store

```typescript
// 在组件中使用
<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvasStore'

const canvasStore = useCanvasStore()

// 访问状态
const { viewport, elements, selectedElements } = storeToRefs(canvasStore)

// 调用方法
canvasStore.addElement(newElement)
canvasStore.selectElement('element_1')
canvasStore.zoomTo(2)
</script>
```

## 历史管理器

```typescript
// src/core/history/HistoryManager.ts
class HistoryManager {
  private undoStack: CanvasState[] = []
  private redoStack: CanvasState[] = []
  private maxHistorySize: number = 50

  // 记录状态
  pushState(state: CanvasState): void

  // 撤销
  undo(): CanvasState | null

  // 重做
  redo(): CanvasState | null

  // 检查状态
  canUndo(): boolean
  canRedo(): boolean

  // 清除历史
  clear(): void
}
```

## 状态持久化

```typescript
// 本地存储
function saveToLocalStorage(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}

function loadFromLocalStorage(key: string): any {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

// 使用
saveToLocalStorage('canvas-state', {
  elements: canvasStore.elements,
  viewport: canvasStore.viewport
})
```

## 关键文件
- `src/stores/canvasStore.ts` - 画布状态
- `src/core/history/HistoryManager.ts` - 历史管理
