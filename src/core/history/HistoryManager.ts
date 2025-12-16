import type { CanvasElement } from '@/types/canvas.types'

/**
 * 操作类型枚举
 */
export enum OperationType {
  CREATE_ELEMENT = 'create_element',
  DELETE_ELEMENT = 'delete_element',
  MOVE_ELEMENT = 'move_element',
  TRANSFORM_ELEMENT = 'transform_element',
  UPDATE_STYLE = 'update_style',
  BATCH_OPERATION = 'batch_operation',
  COPY_ELEMENTS = 'copy_elements',
  PASTE_ELEMENTS = 'paste_elements',
  // 图层操作
  CREATE_LAYER = 'create_layer',
  DELETE_LAYER = 'delete_layer',
  RENAME_LAYER = 'rename_layer',
  TOGGLE_LAYER_VISIBILITY = 'toggle_layer_visibility',
  TOGGLE_LAYER_LOCK = 'toggle_layer_lock',
  MOVE_LAYER = 'move_layer',
  DRAG_LAYER = 'drag_layer',
  SET_LAYER_COLOR = 'set_layer_color',
  DUPLICATE_LAYER = 'duplicate_layer'
}

/**
 * 操作指令接口
 */
export interface OperationCommand {
  type: OperationType
  elementId?: string
  elementIds?: string[]
  data: any
  timestamp: number
  // 添加前后状态记录
  beforeState?: {
    elements: CanvasElement[]
    layers: any[]
    selectedElementIds: string[]
  }
  afterState?: {
    elements: CanvasElement[]
    layers: any[]
    selectedElementIds: string[]
  }
}

/**
 * 快照接口
 */
export interface HistorySnapshot {
  elements: CanvasElement[]
  selectedElementIds: string[]
  timestamp: number
}

/**
 * 历史记录项
 */
export interface HistoryItem {
  id: string
  type: 'command' | 'snapshot'
  command?: OperationCommand
  snapshot?: HistorySnapshot
  description: string
  timestamp: number
}

/**
 * 历史管理器
 * 负责管理操作历史和撤销重做功能
 */
export class HistoryManager {
  private history: HistoryItem[] = []
  private currentIndex: number = -1
  private maxHistorySize: number = 100
  private isUndoRedoInProgress: boolean = false

  // 回调函数
  private onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void
  private onStateRestore?: (elements: CanvasElement[], selectedElementIds: string[]) => void
  private onCommandUndo?: (command: OperationCommand) => void
  private onCommandRedo?: (command: OperationCommand) => void

  constructor() {
    // 初始化空历史记录
    this.addInitialSnapshot()
  }

  /**
   * 添加初始快照
   */
  private addInitialSnapshot(): void {
    const snapshot: HistorySnapshot = {
      elements: [],
      selectedElementIds: [],
      timestamp: Date.now()
    }

    const item: HistoryItem = {
      id: this.generateId(),
      type: 'snapshot',
      snapshot,
      description: '初始状态',
      timestamp: Date.now()
    }

    this.history.push(item)
    this.currentIndex = 0
  }

  /**
   * 记录操作指令
   */
  recordCommand(command: OperationCommand, description: string): void {
    if (this.isUndoRedoInProgress) {
      console.log('⏸️ [HistoryManager] 记录命令跳过（撤销/重进行中）:', description)
      return
    }


    // 清除当前位置之后的所有历史记录
    this.history = this.history.slice(0, this.currentIndex + 1)

    const item: HistoryItem = {
      id: this.generateId(),
      type: 'command',
      command,
      description,
      timestamp: Date.now()
    }

    this.history.push(item)
    this.currentIndex = this.history.length - 1


    // 限制历史记录大小
    this.limitHistorySize()

    this.notifyHistoryChange()
  }

  /**
   * 记录快照
   */
  recordSnapshot(elements: CanvasElement[], selectedElementIds: string[], description: string): void {
    if (this.isUndoRedoInProgress) return

    // 清除当前位置之后的所有历史记录
    this.history = this.history.slice(0, this.currentIndex + 1)

    const snapshot: HistorySnapshot = {
      elements: this.deepCloneElements(elements),
      selectedElementIds: [...selectedElementIds],
      timestamp: Date.now()
    }

    const item: HistoryItem = {
      id: this.generateId(),
      type: 'snapshot',
      snapshot,
      description,
      timestamp: Date.now()
    }

    this.history.push(item)
    this.currentIndex = this.history.length - 1

    // 限制历史记录大小
    this.limitHistorySize()

    this.notifyHistoryChange()
  }

  /**
   * 撤销操作
   */
  undo(): boolean {
    if (!this.canUndo()) {
      console.log('🔄 HistoryManager.undo 无法撤销', { currentIndex: this.currentIndex, total: this.history.length })
      return false
    }



    this.isUndoRedoInProgress = true

    // 撤销当前位置的命令
    const currentItem = this.history[this.currentIndex]

    
    if (currentItem && currentItem.type === 'command') {
      if (this.onCommandUndo) {

        this.onCommandUndo(currentItem.command!)
      }
      // 移动到上一个位置
      this.currentIndex--
    }

    this.isUndoRedoInProgress = false
    this.notifyHistoryChange()

    return true
  }

  /**
   * 重做操作
   */
  redo(): boolean {
    if (!this.canRedo()) return false

    this.isUndoRedoInProgress = true

    // 重做下一个位置的命令
    const nextItem = this.history[this.currentIndex + 1]
    if (nextItem && nextItem.type === 'command') {
      if (this.onCommandRedo) {
        this.onCommandRedo(nextItem.command!)
      }
      // 移动到下一个位置
      this.currentIndex++
    } else if (nextItem && nextItem.type === 'snapshot') {
      // 如果下一个是快照，恢复状态
      this.currentIndex++
      this.restoreFromSnapshot(nextItem.snapshot!)
    }

    this.isUndoRedoInProgress = false
    this.notifyHistoryChange()
    return true
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex > 0
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * 获取当前历史记录
   */
  getCurrentHistory(): HistoryItem | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex]
    }
    return null
  }

  /**
   * 获取历史记录列表
   */
  getHistoryList(): HistoryItem[] {
    return [...this.history]
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
    this.addInitialSnapshot()
    this.notifyHistoryChange()
  }

  /**
   * 从快照恢复状态
   */
  private restoreFromSnapshot(snapshot: HistorySnapshot): void {
    if (this.onStateRestore) {
      this.onStateRestore(snapshot.elements, snapshot.selectedElementIds)
    }
  }

  /**
   * 限制历史记录大小
   */
  private limitHistorySize(): void {
    if (this.history.length > this.maxHistorySize) {
      // 保留最新的记录，删除最旧的
      const removeCount = this.history.length - this.maxHistorySize
      this.history = this.history.slice(removeCount)
      this.currentIndex = Math.max(0, this.currentIndex - removeCount)
    }
  }

  /**
   * 深度克隆元素数组
   */
  private deepCloneElements(elements: CanvasElement[]): CanvasElement[] {
    return elements.map(element => ({
      ...element,
      position: { ...element.position },
      size: { ...element.size },
      style: { ...element.style }
    }))
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 通知历史状态变化
   */
  private notifyHistoryChange(): void {
    const canUndo = this.canUndo()
    const canRedo = this.canRedo()

    if (this.onHistoryChange) {
      this.onHistoryChange(canUndo, canRedo)
    } else {
      console.warn('⚠️ [HistoryManager] onHistoryChange 回调未设置！')
    }
  }

  /**
   * 设置历史变化回调
   */
  setOnHistoryChange(callback: (canUndo: boolean, canRedo: boolean) => void): void {
    this.onHistoryChange = callback
  }

  /**
   * 设置状态恢复回调
   */
  setOnStateRestore(callback: (elements: CanvasElement[], selectedElementIds: string[]) => void): void {
    this.onStateRestore = callback
  }

  setOnCommandUndo(callback: (command: OperationCommand) => void): void {
    this.onCommandUndo = callback
  }

  setOnCommandRedo(callback: (command: OperationCommand) => void): void {
    this.onCommandRedo = callback
  }

  /**
   * 获取历史统计信息
   */
  getHistoryStats(): { totalItems: number; currentIndex: number; canUndo: boolean; canRedo: boolean } {
    return {
      totalItems: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }
  }
}
