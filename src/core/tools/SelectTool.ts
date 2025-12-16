import type { Vector2, CanvasElement } from '@/types/canvas.types'
import { ElementType } from '@/types/canvas.types'
import { BaseTool, type ToolEvent } from './BaseTool'
import { TransformManager } from '../transform/TransformManager'

/**
 * 选择工具
 * 负责元素的选择、移动和变换
 */
export class SelectTool extends BaseTool {
  private selectedElements: CanvasElement[] = []
  private isDragging: boolean = false
  private dragStartPosition: Vector2 | null = null
  private dragOffset: Vector2 = { x: 0, y: 0 }
  private isSelecting: boolean = false
  private selectionStart: Vector2 | null = null
  private selectionEnd: Vector2 | null = null
  private onSelectionChange?: (elements: CanvasElement[]) => void
  private onElementMove?: (element: CanvasElement, delta: Vector2) => void
  private onElementTransform?: (element: CanvasElement, transform: any) => void
  private onRerender?: () => void
  private onDragStart?: (elements: CanvasElement[]) => void
  private onDragEnd?: (elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => void
  private allElements: CanvasElement[] = []
  private styleBrushTool: any = null
  private isCtrlPressed = false // 跟踪Ctrl键的实际状态
  private selectionDisabled = false // 禁用选择功能
  
  // 拖动状态
  private dragStartPositions: Vector2[] = []
  private draggedElement: CanvasElement | null = null // 记录被拖动的元素
  private hasStartedDragging: boolean = false // 是否真正开始拖动
  
  // 变换管理器
  private transformManager: TransformManager
  private isTransforming: boolean = false
  
  // 连接点拖动状态
  private isDraggingConnectionEndpoint: boolean = false
  private draggedConnectionLine: CanvasElement | null = null
  private draggedEndpointIndex: number = -1 // 0 = 起点, 1 = 终点
  private connectionEndpointDragStart: Vector2 | null = null

  constructor() {
    super()
  
    this.transformManager = new TransformManager()
    this.setupTransformCallbacks()

  }

  /**
   * 设置画布引擎
   */
  setCanvasEngine(canvasEngine: any): void {
    super.setCanvasEngine(canvasEngine)
    this.transformManager.setCanvasEngine(canvasEngine)
  }

  /**
   * 获取工具名称
   */
  getName(): string {
    return 'select'
  }

  /**
   * 设置变换回调
   */
  private setupTransformCallbacks(): void {
    // 设置变换回调
    this.transformManager.setOnTransform((elements: CanvasElement[], delta: Vector2, handleType: string) => {
      // 调用外部变换回调
      if (this.onElementTransform) {
        elements.forEach(element => {
          this.onElementTransform!(element, { delta, handle: handleType })
        })
      }
      
      // 触发重新渲染
      if (this.onRerender) {
        this.onRerender()
      }
    })

    // 设置变换开始回调
    this.transformManager.setOnTransformStart((elements: CanvasElement[]) => {

      this.isTransforming = true
      
      // 隐藏浮动工具栏
      if (this.onDragStart) {

        this.onDragStart(elements)
      }
    })

    // 设置变换结束回调
    this.transformManager.setOnTransformEnd((elements: CanvasElement[]) => {

      this.isTransforming = false
      
      // 恢复浮动工具栏
      if (this.onDragEnd) {

        this.onDragEnd(elements, [], [])
      }
    })
  }

  /**
   * 获取工具图标
   */
  getIcon(): string {
    return 'cursor-pointer'
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return '选择、移动和变换元素'
  }

  /**
   * 设置选择变化回调
   */
  setOnSelectionChange(callback: (elements: CanvasElement[]) => void): void {
    this.onSelectionChange = callback
  }

  /**
   * 设置元素移动回调
   */
  setOnElementMove(callback: (element: CanvasElement, delta: Vector2) => void): void {
    this.onElementMove = callback
  }

  /**
   * 设置元素变换回调
   */
  setOnElementTransform(callback: (element: CanvasElement, transform: any) => void): void {
    this.onElementTransform = callback
  }

  /**
   * 设置重新渲染回调
   */
  setOnRerender(callback: () => void): void {
    this.onRerender = callback
  }

  /**
   * 设置所有元素
   */
  setAllElements(elements: CanvasElement[]): void {
    this.allElements = elements
  }

  /**
   * 设置格式刷工具引用
   */
  setStyleBrushTool(styleBrushTool: any): void {
    this.styleBrushTool = styleBrushTool
  }

  /**
   * 设置选中元素
   */
  setSelectedElements(elements: CanvasElement[]): void {

    
    this.selectedElements = [...elements]
    
    
    // 只有在选择功能启用时才触发选择变化回调
    if (!this.selectionDisabled && this.onSelectionChange) {
      this.onSelectionChange(this.selectedElements)
    }
  }

  /**
   * 重置Ctrl键状态
   */
  resetCtrlState(): void {
    this.isCtrlPressed = false

  }

  /**
   * 禁用选择功能
   */
  disableSelection(): void {
    this.selectionDisabled = true

  }

  /**
   * 启用选择功能
   */
  enableSelection(): void {
    this.selectionDisabled = false
  
  }

  /**
   * 强制启用选择功能（用于Ctrl+点击等明确的选择操作）
   */
  forceEnableSelection(): void {
    this.selectionDisabled = false
  }

  /**
   * 激活工具
   */
  activate(): void {
    super.activate()
    // 激活选择工具时，启用选择功能
    if (this.selectionDisabled) {
      this.enableSelection()
    }
    
    // 如果有选中的元素，触发选择变化回调以显示浮动工具栏
    if (this.selectedElements.length > 0 && this.onSelectionChange) {
      this.onSelectionChange(this.selectedElements)
    }
  }

  /**
   * 停用工具
   */
  deactivate(): void {
    super.deactivate()
    // 不自动清除选择状态，保持选择状态以便切换回选择工具时恢复
    // this.clearSelection()
  }

  /**
   * 获取工具配置
   */
  getConfig(): any {
    return {}
  }

  /**
   * 设置工具配置
   */
  setConfig(config: any): void {
    // 选择工具不需要特殊配置
  }

  /**
   * 获取选中元素
   */
  getSelectedElements(): CanvasElement[] {
    return [...this.selectedElements]
  }

  /**
   * 检查是否正在拖动
   */
  isCurrentlyDragging(): boolean {
    return this.isDragging
  }

  /**
   * 设置拖动开始回调
   */
  setOnDragStart(callback: (elements: CanvasElement[]) => void): void {
    this.onDragStart = callback
  }

  /**
   * 设置拖动结束回调
   */
  setOnDragEnd(callback: (elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => void): void {
    this.onDragEnd = callback
  }

  /**
   * 清除选择
   */
  clearSelection(): void {

    
    this.selectedElements = []
    
    // 只有在选择功能启用时才触发选择变化回调
    if (!this.selectionDisabled && this.onSelectionChange) {

      this.onSelectionChange(this.selectedElements)
    } 
    
    // 触发重新渲染以清除选中元素的边框
    this.triggerRerender()

  }

  /**
   * 处理鼠标按下事件
   */
  onMouseDown(event: ToolEvent): void {
    const { position, ctrlKey, shiftKey, originalEvent } = event
    
    

    
    // 检查是否是键盘快捷键操作（如Ctrl+V），如果是则跳过鼠标事件处理
    if (originalEvent && originalEvent.type === 'keydown') {

      return
    }
    
    // 检查是否禁用选择功能
    let shouldEnableSelection = false
    if (this.selectionDisabled) {
      // 如果是Ctrl+点击或双击，强制启用选择功能
      if (ctrlKey || this.isCtrlPressed || (originalEvent as MouseEvent)?.detail === 2) {
        this.forceEnableSelection()
        shouldEnableSelection = true
      } else {
        // 不返回，继续处理拖动逻辑
      }
    }
    
    // 检查是否点击在连接线的连接点上（优先检查连接点）
    const connectionEndpoint = this.getConnectionEndpointAtPosition(position)
    if (connectionEndpoint) {
      this.isDraggingConnectionEndpoint = true
      this.draggedConnectionLine = connectionEndpoint.element
      this.draggedEndpointIndex = connectionEndpoint.endpointIndex
      this.connectionEndpointDragStart = position
      return
    }

    // 检查是否点击在变换手柄上（无论选择功能是否被禁用，都要检查拖动手柄）
    if (this.selectedElements.length > 0) {
      this.transformManager.setSelectedElements(this.selectedElements)
      const handle = this.transformManager.getHandleAtPosition(position)
      
      if (handle) {
        this.isTransforming = true
        this.transformManager.startTransform(position, handle)
        return
      }
    }
    
    // 检查是否点击在元素上
    const clickedElement = this.getElementAtPosition(position)
    
    if (clickedElement) {
      // 检查格式刷状态：如果格式刷有源元素，则不允许拖动
      if (this.styleBrushTool) {
        const hasSource = this.styleBrushTool.hasSourceElement()
        if (hasSource) {
          return
        }
      }
      
      // 文本元素特殊处理：允许拖动但不添加到选择列表
      if (clickedElement.type === ElementType.TEXT) {
        // 文本元素可以拖动，但不显示选择边框
        this.isDragging = true
        this.draggedElement = clickedElement  // 设置被拖动的元素
        this.dragStartPosition = position
        this.dragStartPositions = [{ ...clickedElement.position }]
        
        console.log('📝 [SelectTool] 文本元素鼠标按下，准备拖动', {
          elementId: clickedElement.id,
          dragStartPosition: position,
          dragStartPositions: this.dragStartPositions
        })
        
        // 注意：不在这里触发拖动开始回调，只有在真正移动时才触发
        return
      }
      
      // 只有在选择功能启用时才执行选择操作
      if (!this.selectionDisabled || shouldEnableSelection) {
        if (this.isCtrlPressed) {
          // Ctrl+点击：切换选择状态（只有在Ctrl键实际按下时）
          this.toggleElementSelection(clickedElement)
        } else if (shiftKey) {
          // Shift+点击：添加到选择
          this.addElementToSelection(clickedElement)
        } else {
          // 普通点击：选择单个元素
          this.selectElement(clickedElement)
        }
      } else {
        // 选择功能被禁用，但允许拖动，临时设置选中元素用于拖动
        this.selectedElements = [clickedElement]
      }
      
      // 准备拖拽（但不立即触发回调）
      this.isDragging = true
      this.dragStartPosition = position
      this.dragOffset = {
        x: position.x - clickedElement.position.x,
        y: position.y - clickedElement.position.y
      }
      
      // 记录拖动开始时的位置
      this.dragStartPositions = this.selectedElements.map(el => ({ ...el.position }))
      // 记录被拖动的元素（用于单元素拖动）
      this.draggedElement = clickedElement
      
      console.log('🎬 [SelectTool] 鼠标按下，准备拖动', {
        elementId: clickedElement.id,
        elementType: clickedElement.type,
        selectedCount: this.selectedElements.length,
        dragStartPosition: position,
        dragStartPositions: this.dragStartPositions,
        selectionDisabled: this.selectionDisabled
      })
      
      // 注意：不在这里触发拖动开始回调，只有在真正移动时才触发
    } else {

      
      this.isSelecting = true
      this.selectionStart = position
      this.selectionEnd = position
      
      // 如果没有按Ctrl，清除选择
      if (!this.isCtrlPressed) {

        this.clearSelection()
      }
    }

    this.updateState({
      currentPosition: event.position
    })
  }

  /**
   * 处理鼠标移动事件
   */
  onMouseMove(event: ToolEvent): void {
    const { position } = event
    
    
    // 如果正在拖动且选择功能被禁用，自动启用
    if (this.isDragging && this.selectionDisabled) {
      this.enableSelection()
    }

    if (this.isDraggingConnectionEndpoint && this.draggedConnectionLine && this.connectionEndpointDragStart) {
      // 处理连接点拖动
      const virtualPosition = this.screenToVirtual(position)
      const virtualDragStart = this.screenToVirtual(this.connectionEndpointDragStart)
      
      const delta = {
        x: virtualPosition.x - virtualDragStart.x,
        y: virtualPosition.y - virtualDragStart.y
      }
      
      // 更新连接点的位置
      if (this.draggedConnectionLine.data?.points && this.draggedConnectionLine.data.points.length >= 2) {
        const points = this.draggedConnectionLine.data.points
        const endpointIndex = this.draggedEndpointIndex === 0 ? 0 : points.length - 1
        
        // 更新连接点位置（相对于连接线的位置）
        const oldPoint = points[endpointIndex]
        points[endpointIndex] = {
          x: oldPoint.x + delta.x,
          y: oldPoint.y + delta.y
        }
        
        // 更新连接线的位置和大小
        const startPoint = {
          x: this.draggedConnectionLine.position.x + points[0].x,
          y: this.draggedConnectionLine.position.y + points[0].y
        }
        const endPoint = {
          x: this.draggedConnectionLine.position.x + points[points.length - 1].x,
          y: this.draggedConnectionLine.position.y + points[points.length - 1].y
        }
        
        const x = Math.min(startPoint.x, endPoint.x)
        const y = Math.min(startPoint.y, endPoint.y)
        const width = Math.abs(endPoint.x - startPoint.x)
        const height = Math.abs(endPoint.y - startPoint.y)
        
        this.draggedConnectionLine.position = { x, y }
        this.draggedConnectionLine.size = { x: width, y: height }
        
        // 更新 points 为相对坐标
        points[0] = { x: startPoint.x - x, y: startPoint.y - y }
        points[points.length - 1] = { x: endPoint.x - x, y: endPoint.y - y }
        
        // 更新拖动起始位置
        this.connectionEndpointDragStart = position
        
        // 触发重新渲染
        if (this.onRerender) {
          this.onRerender()
        }
      }
    } else if (this.transformManager.isTransforming()) {
      // 处理变换操作
      this.transformManager.updateTransform(position)
      if (this.onRerender) {
        this.onRerender()
      }
    } else if (this.isDragging) {
      // ✅ 修复：将屏幕坐标转换为虚拟坐标进行计算
      const virtualPosition = this.screenToVirtual(position)
      const virtualDragStartPosition = this.screenToVirtual(this.dragStartPosition || { x: 0, y: 0 })
      
      const delta = {
        x: virtualPosition.x - virtualDragStartPosition.x,
        y: virtualPosition.y - virtualDragStartPosition.y
      }
      
      // 检查是否真正开始拖动（移动距离超过阈值）
      const dragThreshold = 5 // 5像素的移动阈值
      const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y)
      
      if (distance > dragThreshold && !this.hasStartedDragging) {
        // 真正开始拖动，触发拖动开始回调
        this.hasStartedDragging = true
        console.log('🚀 [SelectTool] 拖动开始（超过阈值）', {
          distance,
          selectedCount: this.selectedElements.length,
          draggedElement: this.draggedElement?.id
        })
        if (this.onDragStart) {
          this.onDragStart(this.selectedElements)
        } else {
          console.warn('⚠️ [SelectTool] onDragStart 回调未设置')
        }
      }
      
      // 记录拖动过程中的位置变化（仅当拖动刚开始时打印一次）
      if ((this.selectedElements.length > 0 || this.draggedElement) && !this.hasStartedDragging) {
        console.log('🔄 [SelectTool] 拖动中（未超过阈值）', {
          distance,
          threshold: dragThreshold,
          delta
        })
      }
      
      if (this.selectedElements.length > 0) {
        // 拖拽选中的元素
        this.selectedElements.forEach((element, index) => {
          const oldPos = { ...element.position }
          // 计算元素相对于拖动开始时的偏移量（使用虚拟坐标）
          const elementStartPos = this.dragStartPositions[index] || this.dragStartPositions[0]
          const newPosition = {
            x: elementStartPos.x + delta.x,
            y: elementStartPos.y + delta.y
          }
          
          // 使用 CanvasEngine 的 updateElementPosition 方法来更新位置和连接线
          if (this.canvasEngine) {
            this.canvasEngine.updateElementPosition(element.id, newPosition)
          }
          
          // 处理智能参考线（只对第一个选中的元素应用）
          if (index === 0 && this.canvasEngine) {
            // 调用CanvasEngine的智能参考线处理方法
            ;(this.canvasEngine as any).handleSmartGuides(element, newPosition)
          }
          
          // 触发元素移动回调
          if (this.onElementMove) {
            this.onElementMove(element, delta)
          }
        })
      } else if (this.draggedElement) {
        // 拖拽单个元素（使用记录的元素）
        const oldPos = { ...this.draggedElement.position }
        // 计算新位置
        const elementStartPos = this.dragStartPositions[0]
        const newPosition = {
          x: elementStartPos.x + delta.x,
          y: elementStartPos.y + delta.y
        }
        
        // 使用 CanvasEngine 的 updateElementPosition 方法来更新位置和连接线
        if (this.canvasEngine) {
          this.canvasEngine.updateElementPosition(this.draggedElement.id, newPosition)
        }
        
        // 触发元素移动回调
        if (this.onElementMove) {
          this.onElementMove(this.draggedElement, delta)
        }
      }
      
      // 拖动过程中只触发重新渲染，不记录历史
      if (this.onRerender) {
        this.onRerender()
      }
    } else if (this.isSelecting) {
      // 更新选择框
      this.selectionEnd = position
      // 触发重新渲染以显示选择框预览
      this.triggerRerender()
    }

    this.updateState({
      currentPosition: event.position
    })
  }

  /**
   * 处理鼠标抬起事件
   */
  onMouseUp(event: ToolEvent): void {
    const { position } = event
    
    console.log('🖱️ [SelectTool] 鼠标抬起事件', {
      isDragging: this.isDragging,
      isSelecting: this.isSelecting,
      selectionDisabled: this.selectionDisabled,
      selectedCount: this.selectedElements.length,
      draggedElement: this.draggedElement?.id,
      isDraggingConnectionEndpoint: this.isDraggingConnectionEndpoint
    })
  
    // 处理连接点拖动完成
    if (this.isDraggingConnectionEndpoint && this.draggedConnectionLine && this.canvasEngine) {
      const virtualPosition = this.screenToVirtual(position)
      
      // 检查是否可以连接到其他元素
      // 使用 SelectTool 的 getElementAtPosition 方法
      const targetElement = this.getElementAtPosition(virtualPosition)
      
      if (targetElement && targetElement.id !== this.draggedConnectionLine.id) {
        // 可以连接到其他元素
        const endpointIndex = this.draggedEndpointIndex === 0 ? 0 : (this.draggedConnectionLine.data?.points?.length || 2) - 1
        
        // 更新连接线的源或目标元素
        if (endpointIndex === 0) {
          // 更新起点
          this.draggedConnectionLine.data.sourceElementId = targetElement.id
          // 清除目标元素（如果之前有）
          if (this.draggedConnectionLine.data.targetElementId) {
            delete this.draggedConnectionLine.data.targetElementId
          }
        } else {
          // 更新终点
          this.draggedConnectionLine.data.targetElementId = targetElement.id
        }
        
        // 重新计算连接点
        const sourceElement = this.canvasEngine.findElement(this.draggedConnectionLine.data.sourceElementId)
        const targetElementForUpdate = this.draggedConnectionLine.data.targetElementId 
          ? this.canvasEngine.findElement(this.draggedConnectionLine.data.targetElementId)
          : undefined
        
        if (sourceElement) {
          this.canvasEngine.updateConnectionLinePoints(
            this.draggedConnectionLine,
            sourceElement,
            targetElementForUpdate
          )
        }
      }
      
      // 清理连接点拖动状态
      this.isDraggingConnectionEndpoint = false
      this.draggedConnectionLine = null
      this.draggedEndpointIndex = -1
      this.connectionEndpointDragStart = null
      
      // 触发重新渲染
      if (this.onRerender) {
        this.onRerender()
      }
      
      return
    }
  
    // 如果选择功能被禁用，但在拖动中，自动启用
    if (this.selectionDisabled) {
      if (this.isDragging) {
        console.log('✅ [SelectTool] 选择功能被禁用但在拖动中，自动启用')
        this.enableSelection()
      } else {
        console.log('⏭️ [SelectTool] 选择功能被禁用且不在拖动中，跳过')
        return
      }
    }
    
    if (this.transformManager.isTransforming()) {
      // 结束变换操作
      this.transformManager.endTransform()
      this.isTransforming = false
      if (this.onRerender) {
        this.onRerender()
      }
    }
    
    if (this.isSelecting && this.selectionStart && this.selectionEnd) {
      // 完成框选
      this.finishSelection()
    }
    
    // 如果正在拖动，记录拖动结束
    if (this.isDragging) {
      console.log('🖱️ [SelectTool] 鼠标抬起，检查拖动状态', {
        isDragging: this.isDragging,
        hasStartedDragging: this.hasStartedDragging,
        selectedElementsCount: this.selectedElements.length,
        draggedElement: this.draggedElement ? this.draggedElement.id : null
      })
      
      // 检查是否有实际的位置变化（即使拖动距离小于阈值，也可能有位置变化）
      let hasActualMovement = false
      if (this.selectedElements.length > 0 && this.dragStartPositions.length > 0) {
        hasActualMovement = this.selectedElements.some((el, index) => {
          const startPos = this.dragStartPositions[index]
          if (!startPos) return false
          return Math.abs(el.position.x - startPos.x) > 0.01 || 
                 Math.abs(el.position.y - startPos.y) > 0.01
        })
      } else if (this.draggedElement && this.dragStartPositions.length > 0) {
        const startPos = this.dragStartPositions[0]
        if (startPos) {
          hasActualMovement = Math.abs(this.draggedElement.position.x - startPos.x) > 0.01 ||
                              Math.abs(this.draggedElement.position.y - startPos.y) > 0.01
        }
      }
      
      // 只要有实际移动，就触发拖动结束回调（即使没有超过拖动阈值）
      if (this.hasStartedDragging || hasActualMovement) {
        if (this.selectedElements.length > 0) {
          const oldPositions = [...this.dragStartPositions]
          const newPositions = this.selectedElements.map(el => ({ ...el.position }))
          
          console.log('📝 [SelectTool] 触发拖动结束回调（选中元素）', {
            elementsCount: this.selectedElements.length,
            oldPositions,
            newPositions
          })
          
          // 触发拖动结束回调
          if (this.onDragEnd) {
            this.onDragEnd(this.selectedElements, oldPositions, newPositions)
          } else {
            console.warn('⚠️ [SelectTool] onDragEnd 回调未设置')
          }
          
          // 清除智能参考线
          if (this.canvasEngine) {
            ;(this.canvasEngine as any).clearSmartGuides()
          }
        } else if (this.draggedElement) {
          // 处理单个元素拖动结束（使用记录的元素）
          const oldPositions = [...this.dragStartPositions]
          const newPositions = [{ ...this.draggedElement.position }]
          
          console.log('📝 [SelectTool] 触发拖动结束回调（单个元素）', {
            elementId: this.draggedElement.id,
            oldPositions,
            newPositions
          })
          
          // 触发拖动结束回调
          if (this.onDragEnd) {
            this.onDragEnd([this.draggedElement], oldPositions, newPositions)
          } else {
            console.warn('⚠️ [SelectTool] onDragEnd 回调未设置')
          }
          
          // 清除智能参考线
          if (this.canvasEngine) {
            ;(this.canvasEngine as any).clearSmartGuides()
          }
        }
      } else {
        console.log('⏭️ [SelectTool] 没有实际移动，跳过拖动结束回调')
      }
    }
    
    this.isDragging = false
    this.isSelecting = false
    this.dragStartPosition = null
    this.dragStartPositions = []
    this.draggedElement = null // 清理被拖动的元素
    this.hasStartedDragging = false // 重置拖动开始标志
    this.selectionStart = null
    this.selectionEnd = null

    this.updateState({})
  }

  /**
   * 处理键盘事件
   */
  onKeyDown(event: ToolEvent): void {
    
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = true
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      // 删除选中的元素
          this.deleteSelectedElements()
    } else if (event.key === 'Escape') {
      // 取消选择
          this.clearSelection()
    } else if (event.key === 'a' && event.ctrlKey) {
      // Ctrl+A：全选
            this.selectAllElements()
    }
  }

  /**
   * 处理键盘抬起事件
   */
  onKeyUp(event: ToolEvent): void {
    
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlPressed = false
    }
  }

  /**
   * 渲染选择工具相关的UI
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 渲染选中元素的边框
    this.renderSelectedElements(ctx)
    
    // 渲染选择框
    if (this.isSelecting && this.selectionStart && this.selectionEnd) {
      this.renderSelectionBox(ctx)
    }
  }

  /**
   * 获取指定位置的元素
   */
  /**
   * 检查是否点击在连接线的连接点上
   */
  private getConnectionEndpointAtPosition(position: Vector2): { element: CanvasElement; endpointIndex: number } | null {
    // 检查选中的连接线
    if (this.selectedElements.length !== 1) {
      return null
    }

    const connectionLine = this.selectedElements[0]
    if (!connectionLine.data?.isConnectionLine || !connectionLine.data?.points || connectionLine.data.points.length < 2) {
      return null
    }

    const points = connectionLine.data.points
    const radius = 8 // 连接点的点击半径（屏幕坐标）

    // 检查起点
    const startPoint = {
      x: connectionLine.position.x + points[0].x,
      y: connectionLine.position.y + points[0].y
    }
    const startScreen = this.canvasEngine?.getViewportManager()?.getCoordinateTransformer()?.virtualToScreen(startPoint)
    if (startScreen) {
      const distance = Math.sqrt(
        Math.pow(position.x - startScreen.x, 2) + Math.pow(position.y - startScreen.y, 2)
      )
      if (distance <= radius) {
        return { element: connectionLine, endpointIndex: 0 }
      }
    }

    // 检查终点
    const endPoint = {
      x: connectionLine.position.x + points[points.length - 1].x,
      y: connectionLine.position.y + points[points.length - 1].y
    }
    const endScreen = this.canvasEngine?.getViewportManager()?.getCoordinateTransformer()?.virtualToScreen(endPoint)
    if (endScreen) {
      const distance = Math.sqrt(
        Math.pow(position.x - endScreen.x, 2) + Math.pow(position.y - endScreen.y, 2)
      )
      if (distance <= radius) {
        return { element: connectionLine, endpointIndex: 1 }
      }
    }

    return null
  }

  private getElementAtPosition(position: Vector2): CanvasElement | null {
    // ✅ 修复：将屏幕坐标转换为虚拟坐标
    const virtualPosition = this.screenToVirtual(position)
    
    // 从后往前遍历，优先选择上层的元素
    for (let i = this.allElements.length - 1; i >= 0; i--) {
      const element = this.allElements[i]
      const isInside = this.canvasEngine
        ? this.canvasEngine.isPointInElementPublic(virtualPosition, element)
        : this.isPointInElement(virtualPosition, element)
      
      if (isInside) {
        return element
      }
    }

    return null
  }

  /**
   * 检查点是否在元素内
   */
  private isPointInElement(point: Vector2, element: CanvasElement): boolean {
    const { position, size } = element
    const isInside = point.x >= position.x &&
           point.x <= position.x + size.x &&
           point.y >= position.y &&
           point.y <= position.y + size.y
    
    return isInside
  }

  /**
   * 选择单个元素
   */
  private selectElement(element: CanvasElement): void {
    this.selectedElements = [element]

    // 只有在选择功能启用时才触发选择变化回调
    if (!this.selectionDisabled && this.onSelectionChange) {
      this.onSelectionChange(this.selectedElements)
    }
    
    // 触发重新渲染以显示选中元素的边框
    this.triggerRerender()
  }

  /**
   * 切换元素选择状态
   */
  private toggleElementSelection(element: CanvasElement): void {
    const index = this.selectedElements.findIndex(el => el.id === element.id)
    const wasSelected = index >= 0
    
    
    if (index >= 0) {
      this.selectedElements.splice(index, 1)
    } else {
      this.selectedElements.push(element)
    }
    
    
    // 只有在选择功能启用时才触发选择变化回调
    if (!this.selectionDisabled && this.onSelectionChange) {
      this.onSelectionChange(this.selectedElements)
    }
    // 触发重新渲染以显示选中元素的边框
    this.triggerRerender()
  }

  /**
   * 添加元素到选择
   */
  private addElementToSelection(element: CanvasElement): void {
    if (!this.selectedElements.find(el => el.id === element.id)) {
      this.selectedElements.push(element)
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedElements)
      }
      // 触发重新渲染以显示选中元素的边框
      this.triggerRerender()
    }
  }

  /**
   * 完成选择
   */
  private finishSelection(): void {
    if (!this.selectionStart || !this.selectionEnd) return
    
    const selectedElements: CanvasElement[] = []
    
    // ✅ 修复：将屏幕坐标转换为虚拟坐标
    const virtualStart = this.screenToVirtual(this.selectionStart)
    const virtualEnd = this.screenToVirtual(this.selectionEnd)
    
    // 计算选择框边界（使用虚拟坐标）
    const minX = Math.min(virtualStart.x, virtualEnd.x)
    const minY = Math.min(virtualStart.y, virtualEnd.y)
    const maxX = Math.max(virtualStart.x, virtualEnd.x)
    const maxY = Math.max(virtualStart.y, virtualEnd.y)
    
    // 查找在选择框内的元素
    this.allElements.forEach(element => {
      const { position, size } = element
      const elementMinX = position.x
      const elementMinY = position.y
      const elementMaxX = position.x + size.x
      const elementMaxY = position.y + size.y
      
      // 检查元素是否在选择框内（全部在框内才选中）
      if (elementMinX >= minX && elementMaxX <= maxX &&
          elementMinY >= minY && elementMaxY <= maxY) {
        selectedElements.push(element)
      }
    })
    
    this.selectedElements = selectedElements
    // 只有在选择功能启用时才触发选择变化回调
    if (!this.selectionDisabled && this.onSelectionChange) {
      this.onSelectionChange(this.selectedElements)
    }
    // 触发重新渲染以显示选中元素的边框
    this.triggerRerender()
  }

  /**
   * 渲染选中元素
   */
  private renderSelectedElements(ctx: CanvasRenderingContext2D): void {
    if (this.selectedElements.length === 0) return
    
    // 如果选择功能被禁用，不渲染选中样式
    if (this.selectionDisabled) {
      return
    }
    
    ctx.save()
    
    // 设置变换管理器的选中元素
    this.transformManager.setSelectedElements(this.selectedElements)
    
    // 渲染变换手柄
    this.transformManager.render(ctx)
    
    // 渲染每个选中元素的边框
    this.selectedElements.forEach(element => {
      const { position, size, rotation = 0 } = element
      
      ctx.save()
      
      // 如果有旋转角度，应用旋转变换
      if (rotation !== 0) {
        const centerX = position.x + size.x / 2
        const centerY = position.y + size.y / 2
        ctx.translate(centerX, centerY)
        ctx.rotate((rotation * Math.PI) / 180) // 将角度转换为弧度，与图片渲染保持一致
        ctx.translate(-centerX, -centerY)
      }
      
      // 绘制半透明蓝色填充
      ctx.fillStyle = 'rgba(0, 122, 204, 0.1)'
      ctx.fillRect(position.x - 2, position.y - 2, size.x + 4, size.y + 4)
      
      // 绘制蓝色虚线边框
      ctx.strokeStyle = '#007ACC'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.strokeRect(position.x - 2, position.y - 2, size.x + 4, size.y + 4)
      
      ctx.restore()
    })
    
    // 如果有多个选中元素，绘制包围所有元素的大矩形框
    if (this.selectedElements.length > 1) {
      this.renderMultiSelectBox(ctx)
    }
    
    ctx.restore()
  }

  /**
   * 渲染多选包围框
   */
  private renderMultiSelectBox(ctx: CanvasRenderingContext2D): void {
    if (this.selectedElements.length < 2) return
    
    // 计算所有选中元素的边界
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    this.selectedElements.forEach(element => {
      const { position, size } = element
      minX = Math.min(minX, position.x - 50) // 50px内边距
      minY = Math.min(minY, position.y - 50)
      maxX = Math.max(maxX, position.x + size.x + 50)
      maxY = Math.max(maxY, position.y + size.y + 50)
    })
    
    const boxWidth = maxX - minX
    const boxHeight = maxY - minY
    
    // 绘制包围框的填充
    ctx.fillStyle = 'rgba(0, 122, 204, 0.05)'
    ctx.fillRect(minX, minY, boxWidth, boxHeight)
    
    // 绘制包围框的边框
    ctx.strokeStyle = '#007ACC'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.strokeRect(minX, minY, boxWidth, boxHeight)
    
    // 绘制角落和边缘的控制点
    this.renderMultiSelectHandles(ctx, minX, minY, boxWidth, boxHeight)
  }

  /**
   * 渲染多选框的控制点
   */
  private renderMultiSelectHandles(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const handleSize = 6
    const halfHandle = handleSize / 2
    
    // 重置线条样式
    ctx.setLineDash([])
    ctx.lineWidth = 1
    
    // 绘制8个控制点：4个角落 + 4个边缘中点
    const handles = [
      { x: x - halfHandle, y: y - halfHandle }, // 左上角
      { x: x + width / 2 - halfHandle, y: y - halfHandle }, // 上边中点
      { x: x + width - halfHandle, y: y - halfHandle }, // 右上角
      { x: x + width - halfHandle, y: y + height / 2 - halfHandle }, // 右边中点
      { x: x + width - halfHandle, y: y + height - halfHandle }, // 右下角
      { x: x + width / 2 - halfHandle, y: y + height - halfHandle }, // 下边中点
      { x: x - halfHandle, y: y + height - halfHandle }, // 左下角
      { x: x - halfHandle, y: y + height / 2 - halfHandle } // 左边中点
    ]
    
    handles.forEach(handle => {
      // 绘制控制点边框
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      
      // 绘制控制点
      ctx.strokeStyle = '#007ACC'
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })
  }

  /**
   * 渲染选择框
   */
  private renderSelectionBox(ctx: CanvasRenderingContext2D): void {
    if (!this.selectionStart || !this.selectionEnd) return
    
    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x)
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y)
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x)
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y)

    ctx.save()
    
    // 绘制半透明蓝色填充
    ctx.fillStyle = 'rgba(0, 122, 204, 0.1)'
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
    
    // 绘制蓝色虚线边框
    ctx.strokeStyle = '#007ACC'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
    
    ctx.restore()
  }

  /**
   * 删除选中的元素
   */
  private deleteSelectedElements(): void {
    if (this.selectedElements.length === 0) return
    
    // 这里需要通知画布引擎删除元素
    // 暂时只是清除选择
    this.clearSelection()
  }

  /**
   * 全选元素
   */
  private selectAllElements(): void {
    this.selectedElements = [...this.allElements]
    // 只有在选择功能启用时才触发选择变化回调
    if (!this.selectionDisabled && this.onSelectionChange) {
      this.onSelectionChange(this.selectedElements)
    }
  }

  /**
   * 触发重新渲染
   */
  private triggerRerender(): void {
    if (this.onRerender) {
      this.onRerender()
    }
  }

  /**
   * 获取工具类型
   */
  getToolType(): string {
    return 'select'
  }
}