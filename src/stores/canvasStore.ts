import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { CanvasElement, CanvasSettings, Viewport } from '@/types/canvas.types'
import { ElementType, ToolType } from '@/types/canvas.types'
import { HistoryManager } from '@/core/history/HistoryManager'

/**
 * 画布状态管理
 */
export const useCanvasStore = defineStore('canvas', () => {
  // 画布状态
  const viewport = reactive<Viewport>({
    scale: 1,
    offset: { x: 0, y: 0 },
    width: 0,
    height: 0
  })

  // 画布设置
  const settings = reactive<CanvasSettings>({
    gridSize: 20,
    gridVisible: true,
    rulersVisible: true,
    snapToGrid: false,
    backgroundColor: '#ffffff'
  })

  // 元素列表
  const elements = ref<CanvasElement[]>([])

  // 选中的元素ID列表
  const selectedElementIds = ref<string[]>([])

  // 当前工具
  const currentTool = ref<ToolType>(ToolType.SELECT)

  // 历史管理器
  const historyManager = new HistoryManager()

  // 计算属性
  const selectedElements = computed(() => {
    return elements.value.filter(el => selectedElementIds.value.includes(el.id))
  })

  const hasSelection = computed(() => {
    return selectedElementIds.value.length > 0
  })

  // 撤销重做状态（响应式）
  const canUndo = ref(false)
  const canRedo = ref(false)

  // 设置历史管理器回调，更新响应式状态
  historyManager.setOnHistoryChange((undo: boolean, redo: boolean) => {
    canUndo.value = undo
    canRedo.value = redo
    console.log('🔄 [Store] 历史状态更新:', { undo, redo })
  })

  // 初始化状态
  canUndo.value = historyManager.canUndo()
  canRedo.value = historyManager.canRedo()

  // 视口操作
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

  const zoomTo = (scale: number, center?: { x: number; y: number }) => {
    const newScale = Math.max(0.1, Math.min(5, scale))
    if (center) {
      const scaleRatio = newScale / viewport.scale
      viewport.offset.x = center.x - (center.x - viewport.offset.x) * scaleRatio
      viewport.offset.y = center.y - (center.y - viewport.offset.y) * scaleRatio
    }
    viewport.scale = newScale
  }

  const panTo = (offset: { x: number; y: number }) => {
    viewport.offset = { ...offset }
  }

  const resetViewport = () => {
    viewport.scale = 1
    viewport.offset = { x: 0, y: 0 }
  }

  // 元素操作
  const addElement = (element: CanvasElement) => {
    elements.value.push(element)
  }

  const removeElement = (elementId: string) => {
    const index = elements.value.findIndex(el => el.id === elementId)
    if (index !== -1) {
      elements.value.splice(index, 1)
    }
  }

  const updateElement = (element: CanvasElement) => {
    const index = elements.value.findIndex(el => el.id === element.id)
    if (index !== -1) {
      elements.value[index] = element
    }
  }

  const getElement = (elementId: string): CanvasElement | undefined => {
    return elements.value.find(el => el.id === elementId)
  }

  const clearElements = () => {
    elements.value = []
  }

  // 选择操作
  const selectElement = (elementId: string) => {
    if (!selectedElementIds.value.includes(elementId)) {
      selectedElementIds.value.push(elementId)
    }
  }

  const deselectElement = (elementId: string) => {
    const index = selectedElementIds.value.indexOf(elementId)
    if (index > -1) {
      selectedElementIds.value.splice(index, 1)
    }
  }

  const selectAll = () => {
    selectedElementIds.value = elements.value.map(el => el.id)
  }

  const clearSelection = () => {
    selectedElementIds.value = []
  }

  const toggleSelection = (elementId: string) => {
    if (selectedElementIds.value.includes(elementId)) {
      deselectElement(elementId)
    } else {
      selectElement(elementId)
    }
  }

  // 工具操作
  const setCurrentTool = (tool: ToolType) => {
    currentTool.value = tool
  }

  // 设置操作
  const updateSettings = (newSettings: Partial<CanvasSettings>) => {
    Object.assign(settings, newSettings)
  }

  const undo = () => {
    return historyManager.undo()
  }

  const redo = () => {
    return historyManager.redo()
  }

  // 创建测试元素
  const createTestElement = (type: ElementType, position: { x: number; y: number }) => {
    const element: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      position,
      size: { x: 100, y: 100 },
      rotation: 0,
      style: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        opacity: 1
      },
      layer: 'default', // 这里需要从LayerManager获取当前图层ID
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    addElement(element)
    return element
  }

  // 设置历史管理器状态恢复回调
  historyManager.setOnStateRestore((restoredElements: CanvasElement[], restoredSelectedIds: string[]) => {
    elements.value = restoredElements
    selectedElementIds.value = restoredSelectedIds
    console.log('🔄 历史状态恢复:', { elements: restoredElements.length, selectedIds: restoredSelectedIds.length })
  })

  return {
    // 状态
    viewport,
    settings,
    elements,
    selectedElementIds,
    currentTool,

    // 计算属性
    selectedElements,
    hasSelection,
    canUndo,
    canRedo,

    // 视口操作
    updateViewport,
    zoomTo,
    panTo,
    resetViewport,

    // 元素操作
    addElement,
    removeElement,
    updateElement,
    getElement,
    clearElements,

    // 选择操作
    selectElement,
    deselectElement,
    selectAll,
    clearSelection,
    toggleSelection,

    // 工具操作
    setCurrentTool,

    // 设置操作
    updateSettings,

    // 历史操作
    undo,
    redo,

    // 测试方法
    createTestElement,

    // 历史管理器
    historyManager
  }
})
