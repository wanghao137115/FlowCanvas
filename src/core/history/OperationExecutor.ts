import type { CanvasElement, Vector2 } from '@/types/canvas.types'
import { OperationType, type OperationCommand } from './HistoryManager'
import { generateId } from '@/utils/common'

/**
 * 操作执行器接口
 */
export interface OperationExecutor {
  executeCommand(command: OperationCommand): void
  canExecuteCommand(command: OperationCommand): boolean
}

/**
 * 操作执行器
 * 负责执行和撤销各种操作
 */
export class CanvasOperationExecutor implements OperationExecutor {
  private elements: CanvasElement[] = []
  private selectedElementIds: string[] = []
  private layers: any[] = []
  private currentLayerId: string | null = null
  
  // 回调函数
  private onElementsChange?: (elements: CanvasElement[]) => void
  private onSelectionChange?: (selectedElementIds: string[]) => void
  private onElementUpdate?: (element: CanvasElement) => void
  private onElementDelete?: (elementId: string) => void
  private onElementCreate?: (element: CanvasElement) => void
  private onLayersChange?: (layers: any[]) => void
  private onCurrentLayerChange?: (layerId: string | null) => void
  private onLayerHighlight?: (layerId: string | null) => void
  private onLayerDelete?: (layerId: string) => void
  private onLayerCreate?: (layer: any) => void
  private onLayerStateSync?: (layers: any[]) => void
  private onThumbnailUpdate?: (layerId: string) => void

  constructor() {}

  /**
   * 设置元素列表
   */
  setElements(elements: CanvasElement[]): void {
    this.elements = elements
  }

  /**
   * 设置选中元素
   */
  setSelectedElements(selectedElementIds: string[]): void {
    this.selectedElementIds = selectedElementIds
  }

  /**
   * 设置图层列表
   */
  setLayers(layers: any[]): void {
    this.layers = [...layers]
  }

  /**
   * 设置当前图层ID
   */
  setCurrentLayerId(layerId: string | null): void {
    this.currentLayerId = layerId
  }

  /**
   * 执行操作命令
   */
  executeCommand(command: OperationCommand): void {
    console.log('🔄 OperationExecutor.executeCommand 被调用', { commandType: command.type, command })
    
    switch (command.type) {
      case OperationType.CREATE_ELEMENT:
        this.executeCreateElement(command)
        break
      case OperationType.DELETE_ELEMENT:
        this.executeDeleteElement(command)
        break
      case OperationType.MOVE_ELEMENT:
        this.executeMoveElement(command)
        break
      case OperationType.TRANSFORM_ELEMENT:
        this.executeTransformElement(command)
        break
      case OperationType.UPDATE_STYLE:
        this.executeUpdateStyle(command)
        break
      case OperationType.BATCH_OPERATION:
        this.executeBatchOperation(command)
        break
      // 图层操作
      case OperationType.CREATE_LAYER:
        this.executeCreateLayer(command)
        break
      case OperationType.DELETE_LAYER:
        this.executeDeleteLayer(command)
        break
      case OperationType.RENAME_LAYER:
        this.executeRenameLayer(command)
        break
      case OperationType.TOGGLE_LAYER_VISIBILITY:
        this.executeToggleLayerVisibility(command)
        break
      case OperationType.TOGGLE_LAYER_LOCK:
        this.executeToggleLayerLock(command)
        break
      case OperationType.MOVE_LAYER:
        this.executeMoveLayer(command)
        break
      case OperationType.DRAG_LAYER:
        this.executeDragLayer(command)
        break
      case OperationType.SET_LAYER_COLOR:
        this.executeSetLayerColor(command)
        break
      case OperationType.DUPLICATE_LAYER:
        this.executeDuplicateLayer(command)
        break
      default:
        console.log('🔄 未知的命令类型', { type: command.type })
    }
  }

  /**
   * 撤销命令
   */
  undoCommand(command: OperationCommand): void {
    console.log('🔄 OperationExecutor.undoCommand 被调用', { commandType: command.type, command })
    
    // 如果有beforeState，直接恢复状态
    if (command.beforeState) {
      console.log('🔄 恢复操作前状态', { beforeState: command.beforeState })
      this.restoreState(command.beforeState)
      return
    }
    
    // 否则使用原来的命令执行逻辑
    switch (command.type) {
      case OperationType.CREATE_ELEMENT:
        this.executeDeleteElement(command)
        break
      case OperationType.DELETE_ELEMENT:
        this.executeCreateElement(command)
        break
      case OperationType.MOVE_ELEMENT:
        this.executeMoveElement(command)
        break
      case OperationType.TRANSFORM_ELEMENT:
        this.executeTransformElement(command)
        break
      case OperationType.UPDATE_STYLE:
        this.executeUpdateStyle(command)
        break
      case OperationType.BATCH_OPERATION:
        this.executeBatchOperation(command)
        break
      // 图层操作
      case OperationType.CREATE_LAYER:
        this.undoCreateLayer(command)
        break
      case OperationType.DELETE_LAYER:
        this.executeCreateLayer(command)
        break
      case OperationType.RENAME_LAYER:
        this.executeRenameLayer(command)
        break
      case OperationType.TOGGLE_LAYER_VISIBILITY:
        this.executeToggleLayerVisibility(command)
        break
      case OperationType.TOGGLE_LAYER_LOCK:
        this.executeToggleLayerLock(command)
        break
      case OperationType.MOVE_LAYER:
        this.executeMoveLayer(command)
        break
      case OperationType.DRAG_LAYER:
        this.executeDragLayer(command)
        break
      case OperationType.SET_LAYER_COLOR:
        this.executeSetLayerColor(command)
        break
      default:
        console.log('🔄 未知的撤销命令类型', { type: command.type })
    }
  }

  /**
   * 重做命令
   */
  redoCommand(command: OperationCommand): void {
    console.log('🔄 OperationExecutor.redoCommand 被调用', { commandType: command.type, command })
    
    // 如果有afterState，直接恢复状态
    if (command.afterState) {
      console.log('🔄 恢复操作后状态', { afterState: command.afterState })
      this.restoreState(command.afterState)
      return
    }
    
    // 否则使用原来的命令执行逻辑
    this.executeCommand(command)
  }

  /**
   * 恢复状态
   */
  private restoreState(state: any): void {
    console.log('🔄 恢复状态', { 
      elementsCount: state.elements?.length || 0,
      layersCount: state.layers?.length || 0,
      selectedCount: state.selectedElementIds?.length || 0
    })
    
    // 恢复元素
    if (state.elements) {
      this.elements = [...state.elements]
      if (this.onElementsChange) {
        this.onElementsChange(this.elements)
      }
    }
    
    // 恢复图层
    if (state.layers) {
      this.layers = [...state.layers]
      if (this.onLayersChange) {
        this.onLayersChange(this.layers)
      }
      // 同步图层状态到LayerManager
      if (this.onLayerStateSync) {
          this.onLayerStateSync(this.layers)
      }
    }
    
    // 恢复选择状态
    if (state.selectedElementIds) {
      this.selectedElementIds = [...state.selectedElementIds]
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedElementIds)
      }
    }
  }

  /**
   * 检查是否可以执行命令
   */
  canExecuteCommand(command: OperationCommand): boolean {
    switch (command.type) {
      case OperationType.CREATE_ELEMENT:
        return command.data?.element != null
      case OperationType.DELETE_ELEMENT:
        return this.findElement(command.elementId!) != null
      case OperationType.MOVE_ELEMENT:
        return this.findElement(command.elementId!) != null
      case OperationType.TRANSFORM_ELEMENT:
        return this.findElement(command.elementId!) != null
      case OperationType.UPDATE_STYLE:
        return this.findElement(command.elementId!) != null
      case OperationType.BATCH_OPERATION:
        return command.data?.operations?.length > 0
      default:
        return false
    }
  }

  /**
   * 撤销命令
   */
  undo(command: OperationCommand): void {
    switch (command.type) {
      case OperationType.CREATE_ELEMENT:
        this.undoCreateElement(command)
        break
      case OperationType.DELETE_ELEMENT:
        this.undoDeleteElement(command)
        break
      case OperationType.MOVE_ELEMENT:
        this.undoMoveElement(command)
        break
      case OperationType.TRANSFORM_ELEMENT:
        this.undoTransformElement(command)
        break
      case OperationType.UPDATE_STYLE:
        this.undoUpdateStyle(command)
        break
      case OperationType.BATCH_OPERATION:
        this.undoBatchOperation(command)
        break
      case OperationType.COPY_ELEMENTS:
        // 复制操作不需要撤销
        break
      case OperationType.PASTE_ELEMENTS:
        this.undoPasteElements(command)
        break
    }
  }

  /**
   * 重做命令
   */
  redo(command: OperationCommand): void {
    switch (command.type) {
      case OperationType.CREATE_ELEMENT:
        this.redoCreateElement(command)
        break
      case OperationType.DELETE_ELEMENT:
        this.redoDeleteElement(command)
        break
      case OperationType.MOVE_ELEMENT:
        this.redoMoveElement(command)
        break
      case OperationType.TRANSFORM_ELEMENT:
        this.redoTransformElement(command)
        break
      case OperationType.UPDATE_STYLE:
        this.redoUpdateStyle(command)
        break
      case OperationType.BATCH_OPERATION:
        this.redoBatchOperation(command)
        break
      case OperationType.COPY_ELEMENTS:
        // 复制操作不需要重做
        break
      case OperationType.PASTE_ELEMENTS:
        this.redoPasteElements(command)
        break
    }
  }

  /**
   * 执行创建元素操作
   */
  private executeCreateElement(command: OperationCommand): void {
    const element = command.data.element as CanvasElement
    this.elements.push(element)
    
    if (this.onElementCreate) {
      this.onElementCreate(element)
    }
    
    if (this.onElementsChange) {
      this.onElementsChange([...this.elements])
    }
    
    // 通知缩略图更新
    if (this.onThumbnailUpdate) {
      this.onThumbnailUpdate(element.layer)
    }
  }

  /**
   * 执行删除元素操作
   */
  private executeDeleteElement(command: OperationCommand): void {
    const elementId = command.elementId!
    const element = this.findElement(elementId)
    
    if (element) {
      const layerId = element.layer
      this.elements = this.elements.filter(el => el.id !== elementId)
      
      // 从选中列表中移除
      this.selectedElementIds = this.selectedElementIds.filter(id => id !== elementId)
      
      if (this.onElementDelete) {
        this.onElementDelete(elementId)
      }
      
      if (this.onElementsChange) {
        this.onElementsChange([...this.elements])
      }
      
      if (this.onSelectionChange) {
        this.onSelectionChange([...this.selectedElementIds])
      }
      
      // 通知缩略图更新
      if (this.onThumbnailUpdate) {
        this.onThumbnailUpdate(layerId)
      }
    }
  }

  /**
   * 执行移动元素操作
   */
  private executeMoveElement(command: OperationCommand): void {
    const elementId = command.elementId!
    const element = this.findElement(elementId)
    
    if (element) {
      element.position = { ...command.data.newPosition }
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
      
      if (this.onElementsChange) {
        this.onElementsChange([...this.elements])
      }
      
      // 通知缩略图更新
      if (this.onThumbnailUpdate) {
        this.onThumbnailUpdate(element.layer)
      }
    }
  }

  /**
   * 执行变换元素操作
   */
  private executeTransformElement(command: OperationCommand): void {
    const elementId = command.elementId!
    const element = this.findElement(elementId)
    
    if (element) {
      const newTransform = command.data.newTransform
      element.position = { ...newTransform.position }
      element.size = { ...newTransform.size }
      element.rotation = newTransform.rotation
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
      
      if (this.onElementsChange) {
        this.onElementsChange([...this.elements])
      }
      
      // 通知缩略图更新
      if (this.onThumbnailUpdate) {
        this.onThumbnailUpdate(element.layer)
      }
    }
  }

  /**
   * 执行样式更新操作
   */
  private executeUpdateStyle(command: OperationCommand): void {
    const elementId = command.elementId!
    const element = this.findElement(elementId)
    
    if (element) {
      element.style = { ...command.data.newStyle }
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
      
      if (this.onElementsChange) {
        this.onElementsChange([...this.elements])
      }
      
      // 通知缩略图更新
      if (this.onThumbnailUpdate) {
        this.onThumbnailUpdate(element.layer)
      }
    }
  }

  /**
   * 执行批量操作
   */
  private executeBatchOperation(command: OperationCommand): void {
    const operations = command.data.operations as OperationCommand[]
    
    for (const operation of operations) {
      this.executeCommand(operation)
    }
  }

  /**
   * 查找元素
   */
  private findElement(elementId: string): CanvasElement | null {
    return this.elements.find(el => el.id === elementId) || null
  }

  /**
   * 设置回调函数
   */
  setOnElementsChange(callback: (elements: CanvasElement[]) => void): void {
    this.onElementsChange = callback
  }

  setOnSelectionChange(callback: (selectedElementIds: string[]) => void): void {
    this.onSelectionChange = callback
  }

  setOnElementUpdate(callback: (element: CanvasElement) => void): void {
    this.onElementUpdate = callback
  }

  setOnElementDelete(callback: (elementId: string) => void): void {
    this.onElementDelete = callback
  }

  setOnElementCreate(callback: (element: CanvasElement) => void): void {
    this.onElementCreate = callback
  }

  setOnThumbnailUpdate(callback: (layerId: string) => void): void {
    this.onThumbnailUpdate = callback
  }

  /**
   * 获取当前元素列表
   */
  getElements(): CanvasElement[] {
    return [...this.elements]
  }

  /**
   * 获取当前选中元素
   */
  getSelectedElements(): string[] {
    return [...this.selectedElementIds]
  }

  /**
   * 撤销创建元素操作
   */
  private undoCreateElement(command: OperationCommand): void {
    const elementId = command.data.element.id

    this.elements = this.elements.filter(el => el.id !== elementId)

    // 如果被撤销的元素当前被选中，清除选择状态
    if (this.selectedElementIds.includes(elementId)) {
      this.selectedElementIds = this.selectedElementIds.filter(id => id !== elementId)
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedElementIds)
      }
    }

    if (this.onElementDelete) {
      this.onElementDelete(elementId)
    }

    if (this.onElementsChange) {
      this.onElementsChange(this.elements)
    }
  }

  /**
   * 撤销删除元素操作
   */
  private undoDeleteElement(command: OperationCommand): void {
    const element = command.data.element as CanvasElement
    this.elements.push(element)
    
    if (this.onElementCreate) {
      this.onElementCreate(element)
    }
    
    if (this.onElementsChange) {
      this.onElementsChange(this.elements)
    }
  }

  /**
   * 撤销移动元素操作
   */
  private undoMoveElement(command: OperationCommand): void {
    const elementId = command.elementId!
    const oldPosition = command.data.oldPosition as Vector2
    
    const element = this.findElement(elementId)
    if (element) {
      element.position = oldPosition
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
    }
  }

  /**
   * 撤销变换元素操作
   */
  private undoTransformElement(command: OperationCommand): void {
    const elementId = command.elementId!
    const oldTransform = command.data.oldTransform as any
    
    const element = this.findElement(elementId)
    if (element) {
      if (oldTransform.position) element.position = oldTransform.position
      if (oldTransform.size) element.size = oldTransform.size
      if (oldTransform.rotation !== undefined) element.rotation = oldTransform.rotation
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
    }
  }

  /**
   * 撤销更新样式操作
   */
  private undoUpdateStyle(command: OperationCommand): void {
    const elementId = command.elementId!
    const oldStyle = command.data.oldStyle as any
    
    const element = this.findElement(elementId)
    if (element) {
      element.style = oldStyle
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
    }
  }

  /**
   * 撤销批量操作
   */
  private undoBatchOperation(command: OperationCommand): void {
    const operations = command.data.operations as OperationCommand[]
    
    // 反向执行操作
    for (let i = operations.length - 1; i >= 0; i--) {
      this.undo(operations[i])
    }
  }

  /**
   * 重做创建元素操作
   */
  private redoCreateElement(command: OperationCommand): void {
    const element = command.data.element as CanvasElement
    this.elements.push(element)
    
    if (this.onElementCreate) {
      this.onElementCreate(element)
    }
    
    if (this.onElementsChange) {
      this.onElementsChange(this.elements)
    }
  }

  /**
   * 重做删除元素操作
   */
  private redoDeleteElement(command: OperationCommand): void {
    const elementId = command.data.element.id
    this.elements = this.elements.filter(el => el.id !== elementId)
    
    if (this.onElementDelete) {
      this.onElementDelete(elementId)
    }
    
    if (this.onElementsChange) {
      this.onElementsChange(this.elements)
    }
  }

  /**
   * 重做移动元素操作
   */
  private redoMoveElement(command: OperationCommand): void {
    const elementId = command.elementId!
    const newPosition = command.data.newPosition as Vector2
    
    const element = this.findElement(elementId)
    if (element) {
      element.position = newPosition
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
    }
  }

  /**
   * 重做变换元素操作
   */
  private redoTransformElement(command: OperationCommand): void {
    const elementId = command.elementId!
    const newTransform = command.data.newTransform as any
    
    const element = this.findElement(elementId)
    if (element) {
      if (newTransform.position) element.position = newTransform.position
      if (newTransform.size) element.size = newTransform.size
      if (newTransform.rotation !== undefined) element.rotation = newTransform.rotation
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
    }
  }

  /**
   * 重做更新样式操作
   */
  private redoUpdateStyle(command: OperationCommand): void {
    const elementId = command.elementId!
    const newStyle = command.data.newStyle as any
    
    const element = this.findElement(elementId)
    if (element) {
      element.style = newStyle
      
      if (this.onElementUpdate) {
        this.onElementUpdate(element)
      }
    }
  }

  /**
   * 重做批量操作
   */
  private redoBatchOperation(command: OperationCommand): void {
    const operations = command.data.operations as OperationCommand[]
    
    // 正向执行操作
    for (let i = 0; i < operations.length; i++) {
      this.redo(operations[i])
    }
  }

  /**
   * 撤销粘贴元素操作
   */
  private undoPasteElements(command: OperationCommand): void {
    const elementIds = command.elementIds || []
    
    // 删除粘贴的元素
    this.elements = this.elements.filter(el => !elementIds.includes(el.id))
    
    // 清除选择状态
    this.selectedElementIds = this.selectedElementIds.filter(id => !elementIds.includes(id))
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedElementIds)
    }
    
    if (this.onElementsChange) {
      this.onElementsChange(this.elements)
    }
  }

  /**
   * 重做粘贴元素操作
   */
  private redoPasteElements(command: OperationCommand): void {
    const elements = command.data.elements as CanvasElement[]
    
    // 添加元素
    this.elements.push(...elements)
    
    // 选择粘贴的元素
    const elementIds = elements.map(el => el.id)
    this.selectedElementIds = [...this.selectedElementIds, ...elementIds]
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedElementIds)
    }
    
    if (this.onElementsChange) {
      this.onElementsChange(this.elements)
    }
  }

  // ==================== 图层操作回调设置 ====================

  setOnLayersChange(callback: (layers: any[]) => void): void {
    this.onLayersChange = callback
  }

  setOnCurrentLayerChange(callback: (layerId: string | null) => void): void {
    this.onCurrentLayerChange = callback
  }

  setOnLayerHighlight(callback: (layerId: string | null) => void): void {
    this.onLayerHighlight = callback
  }

  setOnLayerDelete(callback: (layerId: string) => void): void {
    this.onLayerDelete = callback
  }

  setOnLayerCreate(callback: (layer: any) => void): void {
    this.onLayerCreate = callback
  }

  setOnLayerStateSync(callback: (layers: any[]) => void): void {
    this.onLayerStateSync = callback
  }

  // ==================== 图层操作执行方法 ====================

  /**
   * 执行创建图层操作
   */
  private executeCreateLayer(command: OperationCommand): void {
    console.log('🔄 执行创建图层操作', { command })
    const layer = command.data.layer
    
    // 通知CanvasEngine创建图层
    if (this.onLayerCreate) {
      console.log('🔄 通知CanvasEngine创建图层', { layer })
      this.onLayerCreate(layer)
    } else {
      console.log('🔄 没有设置onLayerCreate回调，直接添加到OperationExecutor中')
      // 如果没有设置回调，直接添加到OperationExecutor中
      this.layers.push(layer)
      
      console.log('🔄 图层列表更新', { layersCount: this.layers.length })
      
      if (this.onLayersChange) {
        this.onLayersChange([...this.layers])
      }
      
      // 高亮新创建的图层
      if (this.onLayerHighlight) {
        this.onLayerHighlight(layer.id)
      }
    }
  }

  /**
   * 撤销创建图层操作（删除图层）
   */
  private undoCreateLayer(command: OperationCommand): void {
    console.log('🔄 撤销创建图层操作（删除图层）', { command })
    const layerId = command.elementId!
    
    console.log('🔄 撤销前图层状态', { 
      layerId, 
      layersCount: this.layers.length, 
      layers: this.layers.map(l => ({ id: l.id, name: l.name }))
    })
    
    // 通知CanvasEngine删除图层
    if (this.onLayerDelete) {
      console.log('🔄 通知CanvasEngine删除图层', { layerId })
      this.onLayerDelete(layerId)
    } else {
      console.log('🔄 没有设置onLayerDelete回调，直接删除OperationExecutor中的图层')
      // 如果没有设置回调，直接删除OperationExecutor中的图层
      this.layers = this.layers.filter(layer => layer.id !== layerId)
      
      console.log('🔄 撤销后图层状态', { 
        layersCount: this.layers.length, 
        layers: this.layers.map(l => ({ id: l.id, name: l.name }))
      })
      
      if (this.onLayersChange) {
        this.onLayersChange([...this.layers])
      }
    }
  }

  /**
   * 执行删除图层操作
   */
  private executeDeleteLayer(command: OperationCommand): void {
    const layerId = command.elementId!
    const elements = command.data.elements as CanvasElement[]
    
    // 删除图层
    this.layers = this.layers.filter(l => l.id !== layerId)
    
    // 删除图层中的元素
    this.elements = this.elements.filter(el => !elements.some(deletedEl => deletedEl.id === el.id))
    
    if (this.onLayersChange) {
      this.onLayersChange([...this.layers])
    }
    
    if (this.onElementsChange) {
      this.onElementsChange([...this.elements])
    }
  }

  /**
   * 执行重命名图层操作
   */
  private executeRenameLayer(command: OperationCommand): void {
    const layerId = command.elementId!
    const newName = command.data.newName
    
    const layer = this.layers.find(l => l.id === layerId)
    if (layer) {
      layer.name = newName
      
      if (this.onLayersChange) {
        this.onLayersChange([...this.layers])
      }
      
      // 高亮重命名的图层
      if (this.onLayerHighlight) {
        this.onLayerHighlight(layerId)
      }
    }
  }

  /**
   * 执行设置图层颜色操作
   */
  private executeSetLayerColor(command: OperationCommand): void {
    const layerId = command.elementId!
    const newColor = command.data.newColor
    
    const layer = this.layers.find(l => l.id === layerId)
    if (layer) {
      layer.color = newColor
      
      if (this.onLayersChange) {
        this.onLayersChange([...this.layers])
      }
      
      // 高亮颜色变化的图层
      if (this.onLayerHighlight) {
        this.onLayerHighlight(layerId)
      }
    }
  }

  /**
   * 执行切换图层可见性操作
   */
  private executeToggleLayerVisibility(command: OperationCommand): void {
    const layerId = command.elementId!
    const visible = command.data.visible
    
    const layer = this.layers.find(l => l.id === layerId)
    if (layer) {
      layer.visible = visible
      
      if (this.onLayersChange) {
        this.onLayersChange([...this.layers])
      }
      
      // 高亮操作的图层
      if (this.onLayerHighlight) {
        this.onLayerHighlight(layerId)
      }
    }
  }

  /**
   * 执行切换图层锁定操作
   */
  private executeToggleLayerLock(command: OperationCommand): void {
    const layerId = command.elementId!
    const locked = command.data.locked
    
    const layer = this.layers.find(l => l.id === layerId)
    if (layer) {
      layer.locked = locked
      
      if (this.onLayersChange) {
        this.onLayersChange([...this.layers])
      }
      
      // 高亮操作的图层
      if (this.onLayerHighlight) {
        this.onLayerHighlight(layerId)
      }
    }
  }

  /**
   * 执行移动图层操作
   */
  private executeMoveLayer(command: OperationCommand): void {
    const layerId = command.elementId!
    const newOrder = command.data.newOrder
    const newParentId = command.data.newParentId
    
    const layer = this.layers.find(l => l.id === layerId)
    if (layer) {
      layer.order = newOrder
      layer.parentId = newParentId
      
      // 重新排序图层
      this.layers.sort((a, b) => (a.order || 0) - (b.order || 0))
      
      if (this.onLayersChange) {
        this.onLayersChange([...this.layers])
      }
      
      // 高亮移动的图层
      if (this.onLayerHighlight) {
        this.onLayerHighlight(layerId)
      }
    }
  }

  /**
   * 执行拖拽图层操作
   */
  private executeDragLayer(command: OperationCommand): void {
    // 拖拽操作与移动操作相同
    this.executeMoveLayer(command)
  }

  /**
   * 执行复制图层操作
   */
  private executeDuplicateLayer(command: OperationCommand): void {
    const sourceLayerId = command.data.sourceLayerId
    const duplicatedLayerId = command.data.duplicatedLayerId
    
    // 查找源图层
    const sourceLayer = this.layers.find(l => l.id === sourceLayerId)
    if (!sourceLayer) {
      console.warn('🎨 源图层不存在，无法执行复制图层操作', { sourceLayerId })
      return
    }

    // 查找复制的图层
    const duplicatedLayer = this.layers.find(l => l.id === duplicatedLayerId)
    if (!duplicatedLayer) {
      console.warn('🎨 复制的图层不存在，无法执行复制图层操作', { duplicatedLayerId })
      return
    }

    // 查找源图层的元素
    const sourceElements = this.elements.filter(el => el.layer === sourceLayerId)
    
    // 复制元素到新图层
    const duplicatedElements: CanvasElement[] = []
    sourceElements.forEach(element => {
      const duplicatedElement = this.cloneElement(element)
      duplicatedElement.id = generateId()
      duplicatedElement.layer = duplicatedLayerId
      duplicatedElement.createdAt = Date.now()
      duplicatedElement.updatedAt = Date.now()
      duplicatedElements.push(duplicatedElement)
    })

    // 添加复制的元素到元素列表
    this.elements.push(...duplicatedElements)

    // 更新图层元素列表
    duplicatedLayer.elements = duplicatedElements.map(el => el.id)

    console.log('🎨 执行复制图层操作完成', {
      sourceLayerId,
      duplicatedLayerId,
      sourceElementsCount: sourceElements.length,
      duplicatedElementsCount: duplicatedElements.length
    })

    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange([...this.layers])
    }

    // 高亮复制的图层
    if (this.onLayerHighlight) {
      this.onLayerHighlight(duplicatedLayerId)
    }
  }

  /**
   * 克隆元素
   */
  private cloneElement(element: CanvasElement): CanvasElement {
    return {
      ...element,
      position: { ...element.position },
      size: { ...element.size },
      style: { ...element.style },
      data: element.data ? JSON.parse(JSON.stringify(element.data)) : undefined
    }
  }
}
