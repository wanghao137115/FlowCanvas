import type { CanvasElement, CanvasSettings, Viewport, Vector2, Layer } from '@/types/canvas.types'
import { ToolType, ElementType } from '@/types/canvas.types'
import { ViewportManager } from './ViewportManager'
import { Renderer } from './Renderer'
import { EventManager } from './EventManager'
import { ToolManager } from '../tools/ToolManager'
import { StyleManager } from '../style/StyleManager'
import { type ToolEvent } from '../tools/BaseTool'
import { StyleBrushTool } from '../tools/StyleBrushTool'
import { OperationFactory } from '../history/OperationFactory'
import { CanvasOperationExecutor } from '../history/OperationExecutor'
import { ClipboardManager } from '../clipboard/ClipboardManager'
import { LayerManager } from '../layer/LayerManager'
import { ThumbnailManager } from '../thumbnail/ThumbnailManager'
import { TransformManager } from '../transform/TransformManager'
import { TransformHandleType } from '../transform/TransformHandle'
import { SmartGuideManager, AlignmentGuide, GuideSettings } from './SmartGuideManager'
import { GuideRenderer } from './GuideRenderer'
import { SnapManager } from './SnapManager'
import { TemplateManager } from '../template/TemplateManager'
import { Vector2Utils } from '../../utils/math/Vector2'
import { useCanvasStore } from '@/stores/canvasStore'
import { ExportManager } from '../export/ExportManager'

/**
 * 画布引擎
 * 画布系统的核心类，协调各个组件的工作
 */
export class CanvasEngine {
  private canvas: HTMLCanvasElement
  private viewportManager!: ViewportManager
  private renderer!: Renderer
  private eventManager!: EventManager
  private toolManager!: ToolManager
  private styleManager!: StyleManager
  private styleBrushTool!: StyleBrushTool
  private operationExecutor!: CanvasOperationExecutor
  private clipboardManager: ClipboardManager
  private layerManager: LayerManager
  private thumbnailManager: ThumbnailManager
  private transformManager: TransformManager
  private smartGuideManager: SmartGuideManager
  private guideRenderer: GuideRenderer
  private snapManager: SnapManager
  private templateManager: TemplateManager
  private exportManager: ExportManager
  private lastSnapTime: number = 0
  private snapCooldown: number = 50 // 吸附冷却时间（毫秒）
  private snapLockActive: boolean = false
  private snapLockPosition: Vector2 | null = null
  private snapLockPointerPosition: Vector2 | null = null
  private snapLockAxes: { x: boolean; y: boolean } = { x: false, y: false }
  private lastSnapPointerPosition: Vector2 | null = null
  private lastSnapAxes: { x: boolean; y: boolean } = { x: false, y: false }
  private snapSuppressionActive: boolean = false
  private snapSuppressionAxes: { x: boolean; y: boolean } = { x: false, y: false }
  private snapReleaseMultiplier: number = 1.5
  private snapCatchMultiplier: number = 3
  private snapReengageMultiplier: number = 1.2
  private snapDebugLogging: boolean = true
  private canvasStore: any
  private settings: CanvasSettings
  private elements: CanvasElement[] = []
  private selectedElementIds: string[] = []
  private isInitialized: boolean = false
  private isPanning: boolean = false
  public isInternalUpdate: boolean = false
  private animationFrameId: number | null = null
  private rotationStartAngle: number | null = null
  private rotationStartElementAngle: number = 0
  public _syncPending: boolean = false
  private onDrawingStateChange?: (isDrawing: boolean) => void
  private onElementCreated?: (element: CanvasElement) => void
  private onElementsAdded?: (elements: CanvasElement[]) => void
  private onStyleBrushReset?: () => void
  private onSelectionChange?: (elements: CanvasElement[]) => void
  private onFloatingToolbarVisibilityChange?: (visible: boolean) => void
  private onHideFloatingToolbar?: () => void
  private onShowFloatingToolbar?: (element: CanvasElement) => void
  private onLayersChange?: (layers: any[]) => void
  private onCurrentLayerChange?: (layerId: string | null) => void
  private onShapeTextEditStateChange?: (isEditing: boolean, element?: CanvasElement) => void
  
  // 复制模式状态
  private copyMode: 'continuous' | 'click' = 'continuous'
  private lastSelectedElements: CanvasElement[] = []
  
  // 连接线拖拽状态
  private isDraggingConnection: boolean = false
  private connectionStartPoint: Vector2 | null = null
  private connectionStartElement: CanvasElement | null = null
  private lastClickPosition: Vector2 | null = null
  
  // 形状文字编辑相关
  private isEditingShapeText: boolean = false
  private editingShapeElement: CanvasElement | null = null
  private shapeTextInput: HTMLInputElement | null = null
  private toolbarInteractionTimeout: number | null = null
  private currentTextStyle: any = null // 存储当前的文字样式
  private isMouseDown: boolean = false // 鼠标按下状态
  private toolBeforeShapeTextEdit: ToolType | null = null // 编辑前的工具，用于编辑完成后恢复
  
  // 双击检测
  private lastClickTime: number = 0
  private lastClickElement: CanvasElement | null = null
  private doubleClickThreshold: number = 300 // 300ms内算双击
  
  // 变换状态管理
  private transformStartStates: Map<string, any> = new Map()
  
  // 无限画布相关
  private canvasBounds: { minX: number; minY: number; maxX: number; maxY: number } = {
    minX: 0,    // 边界从0开始
    minY: 0,    // 边界从0开始
    maxX: 1000,
    maxY: 1000
  }
  private canvasExpansionThreshold: number = 200 // 距离边界多少像素时开始扩展
  private onCanvasExpansion?: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void

  constructor(canvas: HTMLCanvasElement, initialSettings?: Partial<CanvasSettings>) {
    this.canvas = canvas
    this.settings = {
      gridSize: 20,
      gridVisible: true,
      rulersVisible: true,
      snapToGrid: false, // 关闭网格吸附，只使用形状吸附
      backgroundColor: '#ffffff',
      ...initialSettings
    }
    this.canvasStore = useCanvasStore()
    this.clipboardManager = ClipboardManager.getInstance()
    this.layerManager = new LayerManager()
    this.thumbnailManager = ThumbnailManager.getInstance()
    this.transformManager = new TransformManager()
    
    // 初始化智能参考线组件
    this.smartGuideManager = new SmartGuideManager()
    this.guideRenderer = new GuideRenderer(canvas)
    this.snapManager = new SnapManager()
    
    // 初始化模板管理器
    this.templateManager = TemplateManager.getInstance()

    // 初始化导出管理器
    this.exportManager = new ExportManager()

    this.initialize()
  }

  /**
   * 初始化画布引擎
   */
  private initialize(): void {
    
    const initialViewport: Viewport = {
      scale: 1,
      offset: { x: 0, y: 0 },
      width: 0,
      height: 0
    }

    // 创建视口管理器
    this.viewportManager = new ViewportManager(initialViewport)

    // 创建渲染器
    this.renderer = new Renderer(this.canvas, this.viewportManager, this.viewportManager.getCoordinateTransformer())
    
    // 设置渲染器的初始画布边界
    this.renderer.setCanvasBounds(this.canvasBounds)

    // 创建事件管理器
    this.eventManager = new EventManager(this.canvas)

    // 创建工具管理器
    this.toolManager = new ToolManager()

    // 创建样式管理器
    this.styleManager = new StyleManager()

    // 创建样式刷工具
    this.styleBrushTool = new StyleBrushTool()
    
    // 创建操作执行器
    this.operationExecutor = new CanvasOperationExecutor()
    
    // 将格式刷工具注册到ToolManager
    this.toolManager.registerTool('styleBrush', this.styleBrushTool)

    // 设置事件监听
    this.setupEventListeners()

    // 设置手势支持
    this.setupGestureSupport()

    // 设置工具回调
    this.setupToolCallbacks()

    // 设置历史管理器回调
    this.setupHistoryCallbacks()

    // 设置变换管理器回调
    this.setupTransformCallbacks()
    
    // 设置变换管理器的画布引擎引用
    this.transformManager.setCanvasEngine(this)

    // 设置默认工具为选择工具（使用setCurrentTool确保canvasEngine被设置）
    this.setCurrentTool(ToolType.SELECT)

    this.isInitialized = true
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 鼠标事件
    this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))

    // 键盘事件 - 移除，由 WhiteboardCanvas.vue 统一处理
    // document.addEventListener('keydown', this.handleKeyDown.bind(this))
    // document.addEventListener('keyup', this.handleKeyUp.bind(this))

    // 触摸事件
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))

    // 窗口事件
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  /**
   * 设置手势支持
   */
  private setupGestureSupport(): void {
    // 这里可以添加手势识别逻辑
  }

  /**
   * 设置工具回调
   */
  private setupToolCallbacks(): void {
    // 确保所有工具都设置了 canvasEngine
    const allTools = [
      ToolType.PEN,
      ToolType.SHAPE,
      ToolType.TEXT,
      ToolType.ARROW,
      ToolType.LINE,
      ToolType.IMAGE,
      ToolType.SELECT
    ]
    allTools.forEach(toolType => {
      const tool = this.toolManager.getTool(toolType)
      if (tool) {
        tool.setCanvasEngine(this)
      }
    })
    
    // 设置画笔工具回调
    const penTool = this.toolManager.getTool(ToolType.PEN) as any
    if (penTool) {
      penTool.setOnDrawingStateChange((isDrawing: boolean) => {
        if (this.onDrawingStateChange) {
          this.onDrawingStateChange(isDrawing)
        }
      })
      penTool.setOnPathComplete((path: Vector2[], penSettings: any) => {
        // 创建路径元素
        const element = this.createPathElement(path, {
          fill: 'transparent',
          stroke: penSettings.strokeColor || '#000000',
          strokeWidth: penSettings.strokeWidth || 2,
          opacity: penSettings.opacity || 1,
          penSettings: penSettings
        })
        
        // 使用addElement方法统一处理元素添加
        this.addElement(element)
      })
    }

    // 设置形状工具回调
    const shapeTool = this.toolManager.getTool(ToolType.SHAPE) as any
    if (shapeTool) {
      shapeTool.setOnDrawingStateChange((isDrawing: boolean) => {
        if (this.onDrawingStateChange) {
          this.onDrawingStateChange(isDrawing)
        }
      })
      shapeTool.setOnElementCreated((element: CanvasElement) => {
        // 使用addElement方法统一处理元素添加
        this.addElement(element)
      })
      
      // 设置拖拽开始回调
      shapeTool.setOnDragStart((elements: CanvasElement[]) => {
        // 设置内部更新标志，防止拖动过程中显示浮动工具栏
        this.isInternalUpdate = true
        
        // 拖动开始，隐藏浮动工具栏
        if (this.onFloatingToolbarVisibilityChange) {
          this.onFloatingToolbarVisibilityChange(false)
        }
        this.render()
      })
      
      // 设置拖拽结束回调
      shapeTool.setOnDragEnd((elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => {
        // 拖动结束，记录完整的历史操作
        if (elements.length === 1) {
          // 单个元素移动
          const command = OperationFactory.moveElement(elements[0].id, oldPositions[0], newPositions[0])
          this.canvasStore.historyManager.recordCommand(command, `移动${elements[0].type}元素`)
        } else {
          // 多个元素移动 - 为每个元素创建移动命令
          elements.forEach((element, index) => {
            const command = OperationFactory.moveElement(element.id, oldPositions[index], newPositions[index])
            this.canvasStore.historyManager.recordCommand(command, `移动${element.type}元素`)
          })
        }
        
        // 拖动结束，重新显示浮动工具栏
        if (this.onFloatingToolbarVisibilityChange) {
          this.onFloatingToolbarVisibilityChange(true)
        }
        
        // 重置内部更新标志
        this.isInternalUpdate = false
        
        // 重新渲染
        this.render()
      })
    }

    // 设置文本工具回调
    const textTool = this.toolManager.getTool(ToolType.TEXT) as any
    if (textTool) {
      textTool.setOnDrawingStateChange((isDrawing: boolean) => {
        if (this.onDrawingStateChange) {
          this.onDrawingStateChange(isDrawing)
        }
      })
      textTool.setOnElementCreated((element: CanvasElement) => {
        // 使用addElement方法统一处理元素添加
        this.addElement(element)
      })

      textTool.setOnStateChange((state: any) => {
        // 只在文本内容或编辑状态真正变化时重新渲染
        if (state.currentText !== undefined || state.isEditing !== undefined) {
          this.render()
        }
        
        // 在文本编辑时禁用选择功能
        if (state.isEditing !== undefined) {
          const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
          if (selectTool) {
            if (state.isEditing) {
              // 开始编辑时禁用选择功能
              selectTool.disableSelection()
            } else {
              // 结束编辑时重新启用选择功能
              selectTool.enableSelection()
            }
          }
        }
      })
    }

    // 设置箭头工具回调
    const arrowTool = this.toolManager.getTool(ToolType.ARROW) as any
    if (arrowTool) {
      arrowTool.setOnDrawingStateChange((isDrawing: boolean) => {
        if (this.onDrawingStateChange) {
          this.onDrawingStateChange(isDrawing)
        }
      })
      arrowTool.setOnArrowComplete((arrowData: any) => {
        
        const element = this.createArrowElementFromPoints(arrowData.points, arrowData.style, arrowData.type)
        
        
        // 使用addElement方法统一处理元素添加
        this.addElement(element)
      })
    }

    // 设置直线工具回调
    const lineTool = this.toolManager.getTool(ToolType.LINE) as any
    if (lineTool) {
      lineTool.setOnDrawingStateChange((isDrawing: boolean) => {
        if (this.onDrawingStateChange) {
          this.onDrawingStateChange(isDrawing)
        }
      })
      lineTool.setOnLineComplete((lineData: any) => {
        const element = this.createLineElementFromPoints(lineData.points, lineData.style, lineData.type)
        
        // 使用addElement方法统一处理元素添加
        this.addElement(element)
      })
    }

    // 设置图片工具回调
    const imageTool = this.toolManager.getTool(ToolType.IMAGE) as any
    if (imageTool) {
      imageTool.setOnImageAdd((element: CanvasElement) => {
        // 使用addElement方法统一处理元素添加
        this.addElement(element)
      })
    }

    // 设置选择工具回调
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool) {
      selectTool.setOnSelectionChange((elements: CanvasElement[]) => {
        // 更新选中的元素ID列表
        this.selectedElementIds = elements.map(el => el.id)
        
        // 检查选择功能是否被禁用
        const isSelectionDisabled = selectTool.selectionDisabled || false
        
        if (!isSelectionDisabled) {
          // 同步到Renderer
          this.renderer.setSelectedElements(elements)
        } else {
          // 选择功能被禁用，清空Renderer的选中元素
          this.renderer.setSelectedElements([])
        }
        
        // 通知外部选择变化（拖动过程中不通知）
        if (this.onSelectionChange && !this.isInternalUpdate) {
          this.onSelectionChange(elements)
        }
        
        // 重新渲染以显示选择状态
        this.render()
      })
      
      selectTool.setOnRerender(() => {
        // 触发重新渲染以显示选择框预览
        this.render()
      })
      
      // 设置元素移动回调 - 实时更新缩略图和连接线
      selectTool.setOnElementMove((element: CanvasElement, delta: Vector2) => {
        // 在拖动过程中实时更新缩略图
        this.thumbnailManager.markForUpdate(element.layer)
        
        // 更新连接到该元素的所有连接线（只有源元素移动时才更新）
        this.updateConnectionLinesForElement(element.id)
      })
      
      // 设置变换回调
      selectTool.setOnElementTransform((element: CanvasElement, transform: any) => {
        this.handleElementTransform([element], transform.delta, transform.handle)
      })
      
      selectTool.setOnDragStart((elements: CanvasElement[]) => {
        
        // 设置内部更新标志，防止拖动过程中显示浮动工具栏
        this.isInternalUpdate = true
        
        // 拖动开始，隐藏浮动工具栏
        if (this.onFloatingToolbarVisibilityChange) {
          this.onFloatingToolbarVisibilityChange(false)
        }
        this.render()
      })
      
      selectTool.setOnDragEnd((elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => {
        // 拖动结束时立即同步到 store，确保 MiniMap 能立即更新
        if (this.canvasStore && this.canvasStore.elements) {
          // 立即触发响应式更新：替换整个数组引用
          this.canvasStore.elements.value = [...this.canvasStore.elements.value]
        }
        
        // 拖动结束，记录完整的历史操作
        if (elements.length === 1) {
          // 检查位置是否真的变化了
          const positionChanged = 
            Math.abs(oldPositions[0].x - newPositions[0].x) > 0.01 ||
            Math.abs(oldPositions[0].y - newPositions[0].y) > 0.01
          
          if (positionChanged) {
          // 单个元素移动
          const command = OperationFactory.moveElement(elements[0].id, oldPositions[0], newPositions[0])
          this.canvasStore.historyManager.recordCommand(command, `移动${elements[0].type}元素`)
          }
        } else {
          // 多个元素移动 - 为每个元素创建移动命令
          elements.forEach((element, index) => {
            const positionChanged = 
              Math.abs(oldPositions[index].x - newPositions[index].x) > 0.01 ||
              Math.abs(oldPositions[index].y - newPositions[index].y) > 0.01
            
            if (positionChanged) {
            const command = OperationFactory.moveElement(element.id, oldPositions[index], newPositions[index])
            this.canvasStore.historyManager.recordCommand(command, `移动${element.type}元素`)
            }
          })
        }
        
        // 拖动结束，重新显示浮动工具栏
        if (this.onFloatingToolbarVisibilityChange) {
          this.onFloatingToolbarVisibilityChange(true)
        }
        
        // 重置内部更新标志
        this.isInternalUpdate = false
        
        // 重新渲染
        this.render()
      })
      
      selectTool.setAllElements(this.elements)
      // 设置格式刷工具引用
      selectTool.setStyleBrushTool(this.styleBrushTool)
    }

    // 设置样式刷工具回调
    this.styleBrushTool.setOnStyleApplied((sourceElement: CanvasElement, targetElement: CanvasElement) => {
      // 样式已经在StyleBrushTool.applyStyle中应用了，这里只需要重新渲染
      this.render()
    })

    this.styleBrushTool.setOnSourceSelected((element: CanvasElement) => {
      // 源元素选择
    })

    this.styleBrushTool.setOnVisualFeedbackChange((sourceElement: CanvasElement | null, hoveredElement: CanvasElement | null) => {
      // 更新视觉反馈
      this.renderer.setStyleBrushVisualFeedback(sourceElement, hoveredElement)
      this.render()
    })

    // 设置格式刷工具的拖动回调
    this.styleBrushTool.setDragCallbacks(
      (element: CanvasElement, delta: Vector2) => {
        // 元素移动 - 实时更新缩略图和连接线（只有源元素移动时才更新）
        this.thumbnailManager.markForUpdate(element.layer)
        this.updateConnectionLinesForElement(element.id)
        this.render()
      },
      (elements: CanvasElement[]) => {
        // 拖动开始
        // 可以在这里添加拖动开始的处理逻辑
      },
      (elements: CanvasElement[], oldPositions: Vector2[], newPositions: Vector2[]) => {
        // 拖动结束
        this.render()
      }
    )

    // 设置格式刷工具的浮动工具栏回调
    this.styleBrushTool.setFloatingToolbarCallbacks(
      () => {
        // 隐藏浮动工具栏
        if (this.onHideFloatingToolbar) {
          this.onHideFloatingToolbar()
        }
      },
      (element: CanvasElement) => {
        // 显示浮动工具栏
        if (this.onShowFloatingToolbar) {
          this.onShowFloatingToolbar(element)
        }
      }
    )

    this.styleBrushTool.setOnDeactivate(() => {
      // 样式刷停用
      if (this.onStyleBrushReset) {
        this.onStyleBrushReset()
      }
      // 不切换工具，保持格式刷工具激活状态
    })
  }

  /**
   * 设置历史管理器回调
   */
  private setupHistoryCallbacks(): void {
    // 保存 store 的原始回调（如果有的话）
    // 使用类型断言访问私有属性
    const historyManagerAny = this.canvasStore.historyManager as any
    const originalCallback = historyManagerAny.onHistoryChange as ((canUndo: boolean, canRedo: boolean) => void) | undefined
    
    // 设置历史状态变化回调（保留原始回调并调用它）
    this.canvasStore.historyManager.setOnHistoryChange((canUndo: boolean, canRedo: boolean) => {
      // 调用原始回调（store 的回调），它会更新 store 的响应式状态
      if (originalCallback) {
        try {
          originalCallback(canUndo, canRedo)
        } catch (e) {
          // 调用原始回调失败
        }
      }
    })

    // 设置状态恢复回调
    this.canvasStore.historyManager.setOnStateRestore((elements: CanvasElement[], selectedElementIds: string[]) => {
      // 恢复元素列表
      this.elements = elements
      
      // 恢复选中状态
      this.selectedElementIds = selectedElementIds
      
      // 更新选择工具的元素列表
      const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
      if (selectTool) {
        selectTool.setAllElements(this.elements)
        selectTool.setSelectedElements(this.elements.filter(el => selectedElementIds.includes(el.id)))
      }
      
      // 更新操作执行器的状态
      this.operationExecutor.setElements(this.elements)
      this.operationExecutor.setSelectedElements(selectedElementIds)
      
      // 重新渲染
      this.render()
      
      // 通知外部状态变化
      if (this.onSelectionChange) {
        this.onSelectionChange(this.elements.filter(el => selectedElementIds.includes(el.id)))
      }
    })

        // 设置命令撤销回调
        this.canvasStore.historyManager.setOnCommandUndo((command: any) => {
          this.operationExecutor.undoCommand(command)
          this.render()
        })

        // 设置命令重做回调
        this.canvasStore.historyManager.setOnCommandRedo((command: any) => {
          this.operationExecutor.redoCommand(command)
          this.render()
        })

    // 设置操作执行器回调
    this.operationExecutor.setOnElementsChange((elements: CanvasElement[]) => {
      this.elements = elements
      this.requestRender()
    })

    this.operationExecutor.setOnSelectionChange((selectedElementIds: string[]) => {
      this.selectedElementIds = selectedElementIds
      if (this.onSelectionChange) {
        this.onSelectionChange(this.elements.filter(el => selectedElementIds.includes(el.id)))
      }
    })

    this.operationExecutor.setOnElementUpdate((element: CanvasElement) => {
      // 元素更新，更新连接到该元素的所有连接线（因为元素大小或位置可能改变）
      this.updateConnectionLinesForElement(element.id)
      // 重新渲染
      this.requestRender()
    })

    this.operationExecutor.setOnElementDelete((elementId: string) => {
      // 元素删除，重新渲染
      this.requestRender()
    })

    this.operationExecutor.setOnElementCreate((element: CanvasElement) => {
      // 元素创建，重新渲染
      this.requestRender()
    })

    this.operationExecutor.setOnThumbnailUpdate((layerId: string) => {
      // 缩略图更新
      this.thumbnailManager.markForUpdate(layerId)
    })

    // 设置图层相关回调
    this.operationExecutor.setOnLayersChange((layers: any[]) => {
      // 通知外部图层变化
      if (this.onLayersChange) {
        this.onLayersChange(layers)
      }
    })

    this.operationExecutor.setOnCurrentLayerChange((layerId: string | null) => {
      this.layerManager.setCurrentLayer(layerId)
      if (this.onCurrentLayerChange) {
        this.onCurrentLayerChange(layerId)
      }
    })

    this.operationExecutor.setOnLayerHighlight((layerId: string | null) => {
      // 可以在这里添加图层高亮的UI反馈
    })

    this.operationExecutor.setOnLayerDelete((layerId: string) => {
      // 直接删除LayerManager中的图层
      this.layerManager.deleteLayer(layerId)
      // 通知图层变化
      if (this.onLayersChange) {
        this.onLayersChange(this.layerManager.getAllLayers())
      }
      // 重新渲染
      this.render()
    })

    this.operationExecutor.setOnLayerCreate((layer: any) => {
      // 直接创建LayerManager中的图层
      this.layerManager.createLayer(layer.name, layer.parentId)
      // 通知图层变化
      if (this.onLayersChange) {
        this.onLayersChange(this.layerManager.getAllLayers())
      }
      // 重新渲染
      this.render()
    })

    this.operationExecutor.setOnLayerStateSync((layers: any[]) => {
      // 同步图层状态到LayerManager
      this.syncLayersToLayerManager(layers)
      // 通知图层变化
      if (this.onLayersChange) {
        this.onLayersChange(this.layerManager.getAllLayers())
      }
      // 重新渲染
      this.render()
    })

        this.operationExecutor.setOnSelectionChange((selectedElementIds: string[]) => {
          // 选择状态变化，更新内部状态并通知外部
          this.selectedElementIds = selectedElementIds
          if (this.onSelectionChange) {
            const selectedElements = this.elements.filter(el => selectedElementIds.includes(el.id))
            this.onSelectionChange(selectedElements)
          }
        })
  }

  /**
   * 设置变换管理器回调
   */
  private setupTransformCallbacks(): void {
    // 设置变换回调
    this.transformManager.setOnTransform((elements: CanvasElement[], delta: Vector2, handle: TransformHandleType) => {
      this.handleElementTransform(elements, delta, handle)
    })
    // 设置变换开始回调
    this.transformManager.setOnTransformStart((elements: CanvasElement[]) => {
      this.handleTransformStart(elements)
    })
    
    // 设置变换结束回调
    this.transformManager.setOnTransformEnd((elements: CanvasElement[]) => {
      this.handleTransformEnd(elements)
    })
  }

  /**
   * 检查变换手柄悬浮状态
   */
  private checkTransformHandleHover(position: Vector2): void {
    // 检查是否有选中的元素 - 使用 TransformManager 的选中元素
    const selectedElements = this.transformManager.getSelectedElements()
    
    if (selectedElements.length === 0) {
      this.canvas.style.cursor = 'default'
      return
    }

    // 如果正在变换，跳过手柄悬浮检查，保持当前鼠标样式
    if (this.transformManager.isTransforming()) {
      return
    }

    // 检查是否悬浮在变换手柄上
    const handle = this.transformManager.getHandleAtPosition(position)
    
    if (handle) {
      // 设置手柄对应的鼠标样式
      const cursorStyle = handle.getCursorStyle()
      this.canvas.style.cursor = cursorStyle
    } else {
      // 恢复默认鼠标样式
      this.canvas.style.cursor = 'default'
    }
  }

  /**
   * 检查连接点悬浮
   */
  private checkConnectionPointHover(position: Vector2): void {
    // 转换鼠标位置到画布坐标
    const canvasPosition = this.viewportManager.getCoordinateTransformer().screenToVirtual(position)
    
    // 查找鼠标悬浮的元素
    const hoveredElement = this.getElementAtPosition(canvasPosition)
    
    if (hoveredElement && hoveredElement.type === 'shape') {
      // 设置悬浮的元素
      this.renderer.setHoveredElement(hoveredElement)
      
      // 获取当前工具
      const currentTool = this.toolManager.getCurrentTool()
      
      // 检查是否悬浮在连接点上（只有形状工具才检测连接点悬浮）
      if (currentTool && currentTool.getName() === 'shape') {
        const shapeTool = currentTool as any
        const hoveredConnectionPoint = shapeTool.checkConnectionPointHover(position, hoveredElement)
        
        if (hoveredConnectionPoint) {
          this.renderer.setHoveredConnectionPoint(hoveredConnectionPoint)
          this.canvas.style.cursor = 'crosshair'
        } else {
          this.renderer.setHoveredConnectionPoint(null)
          this.canvas.style.cursor = 'default'
        }
      } else {
        // 非形状工具，只显示连接点但不检测悬浮
        this.renderer.setHoveredConnectionPoint(null)
        this.canvas.style.cursor = 'default'
      }
    } else {
      // 没有悬浮在形状元素上
      this.renderer.setHoveredElement(null)
      this.renderer.setHoveredConnectionPoint(null)
      this.canvas.style.cursor = 'default'
    }
    
    // 触发重新渲染以显示连接点
    this.render()
  }

  /**
   * 检查连接点点击
   */
  private checkConnectionPointClick(position: Vector2, element: CanvasElement): Vector2 | null {
    if (element && element.type === 'shape') {
      // 获取当前工具
      const currentTool = this.toolManager.getCurrentTool()
      
      // 检查是否点击在连接点上（只有形状工具才检测连接点点击）
      if (currentTool && currentTool.getName() === 'shape') {
        const shapeTool = currentTool as any
        const connectionPoint = shapeTool.checkConnectionPointHover(position, element)
        return connectionPoint
      }
    }
    
    return null
  }

  /**
   * 处理元素变换
   */
  private handleElementTransform(elements: CanvasElement[], delta: Vector2, handle: TransformHandleType): void {
    
    if (elements.length === 0) return

    const handleType = handle
    
    // 根据手柄类型执行不同的变换（实时更新，不创建历史记录）
    switch (handleType) {
      case 'resize-nw':
      case 'resize-n':
      case 'resize-ne':
      case 'resize-e':
      case 'resize-se':
      case 'resize-s':
      case 'resize-sw':
      case 'resize-w':
        this.handleElementResize(elements, delta, handleType)
        break
      case 'rotate':
        this.handleRotate(elements, delta)
        break
    }
    
    // 重新渲染（实时更新显示）
    this.requestRender()
  }

  /**
   * 处理缩放变换
   */
  private handleElementResize(elements: CanvasElement[], delta: Vector2, handleType: string): void {
    elements.forEach(element => {
      // 使用初始状态进行计算
      const initialState = element.initialTransformState
      if (!initialState) {
        return
      }
      
      const originalSize = { ...initialState.size }
      const originalPosition = { ...initialState.position }
      
      
      // 计算新的尺寸和位置
      let newWidth = originalSize.x
      let newHeight = originalSize.y
      let newX = originalPosition.x
      let newY = originalPosition.y
      
      // 根据手柄类型计算新的尺寸和位置
      if (handleType.includes('e')) {
        // 右边缘：宽度 = 原始宽度 + delta.x
        newWidth = originalSize.x + delta.x
      }
      if (handleType.includes('w')) {
        // 左边缘：宽度 = 原始宽度 - delta.x，位置 = 原始位置 + delta.x
        newWidth = originalSize.x - delta.x
        newX = originalPosition.x + delta.x
      }
      if (handleType.includes('s')) {
        // 下边缘：高度 = 原始高度 + delta.y
        newHeight = originalSize.y + delta.y
      }
      if (handleType.includes('n')) {
        // 上边缘：高度 = 原始高度 - delta.y，位置 = 原始位置 + delta.y
        newHeight = originalSize.y - delta.y
        newY = originalPosition.y + delta.y
      }
      
      // 限制最小尺寸
      const minSize = 10
      newWidth = Math.max(minSize, newWidth)
      newHeight = Math.max(minSize, newHeight)
      
      // 更新元素
      element.size.x = newWidth
      element.size.y = newHeight
      element.position.x = newX
      element.position.y = newY
      
      // 同步到 canvasStore
      if (this.canvasStore && this.canvasStore.elements) {
        const storeElement = this.canvasStore.elements.value.find((el: CanvasElement) => el.id === element.id)
        if (storeElement) {
          storeElement.size.x = newWidth
          storeElement.size.y = newHeight
          storeElement.position.x = newX
          storeElement.position.y = newY
        }
      }
      
      // 更新连接到该元素的所有连接线（因为元素大小改变会影响连接点位置）
      this.updateConnectionLinesForElement(element.id)
    })
    
    // 批量触发响应式更新（使用 requestAnimationFrame 防抖）
    if (this.canvasStore && this.canvasStore.elements && !this._syncPending) {
      this._syncPending = true
      requestAnimationFrame(() => {
        // 创建新数组，确保 Vue 能检测到变化
        this.canvasStore.elements.value = [...this.canvasStore.elements.value]
        this._syncPending = false
      })
    }
  }

  /**
   * 处理旋转变换
   */
  private handleRotate(elements: CanvasElement[], delta: Vector2): void {
    if (elements.length !== 1) return // 只支持单选旋转
    
    const element = elements[0]
    const centerX = element.position.x + element.size.x / 2
    const centerY = element.position.y + element.size.y / 2
    
    // 计算从中心点到鼠标位置的向量
    const mouseX = centerX + delta.x
    const mouseY = centerY + delta.y
    
    // 计算当前鼠标位置相对于中心点的角度
    const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX)
    
    // 如果没有记录初始角度，记录当前角度作为基准
    if (!this.rotationStartAngle) {
      this.rotationStartAngle = currentAngle
      this.rotationStartElementAngle = element.rotation
    }
    
    // 计算角度差（当前角度 - 初始角度）
    let angleDelta = currentAngle - this.rotationStartAngle
    
    // 处理角度跨越问题（-π 到 π 的边界）
    if (angleDelta > Math.PI) {
      angleDelta -= 2 * Math.PI
    } else if (angleDelta < -Math.PI) {
      angleDelta += 2 * Math.PI
    }
    
    // 更新旋转角度：初始角度 + 角度差
    element.rotation = this.rotationStartElementAngle + (angleDelta * 180 / Math.PI)
  }

  /**
   * 处理变换开始（隐藏UI）
   */
  private handleTransformStart(elements: CanvasElement[]): void {
    // 隐藏浮动工具栏
    if (this.onHideFloatingToolbar) {
      this.onHideFloatingToolbar()
    }
    
    // 临时清除选中状态（变换过程中不显示选中状态）
    this.clearSelection()
    
    // 隐藏选中样式（通过设置内部状态）
    this.isInternalUpdate = true
    
    // 重置旋转相关变量
    this.rotationStartAngle = null
    this.rotationStartElementAngle = 0
  }

  /**
   * 保存变换开始时的状态（用于历史记录）
   */
  saveTransformStartState(elements: CanvasElement[]): void {
    this.transformStartStates.clear()
    elements.forEach(element => {
      this.transformStartStates.set(element.id, {
        position: { ...element.position },
        size: { ...element.size },
        rotation: element.rotation
      })
    })
  }

  /**
   * 处理变换结束（创建历史记录）
   */
  private handleTransformEnd(elements: CanvasElement[]): void {
    elements.forEach(element => {
      const startState = this.transformStartStates.get(element.id)
      if (startState) {
        const endState = {
          position: { ...element.position },
          size: { ...element.size },
          rotation: element.rotation
        }
        
        // 判断变换类型，生成描述
        const positionChanged = 
          Math.abs(startState.position.x - endState.position.x) > 0.01 ||
          Math.abs(startState.position.y - endState.position.y) > 0.01
        const sizeChanged = 
          Math.abs(startState.size.x - endState.size.x) > 0.01 ||
          Math.abs(startState.size.y - endState.size.y) > 0.01
        const rotationChanged = Math.abs(startState.rotation - endState.rotation) > 0.01
        
        let description = `变换${element.type}元素`
        if (sizeChanged && positionChanged && rotationChanged) {
          description = `变换${element.type}元素（位置、大小、旋转）`
        } else if (sizeChanged && positionChanged) {
          description = `变换${element.type}元素（位置、大小）`
        } else if (sizeChanged && rotationChanged) {
          description = `变换${element.type}元素（大小、旋转）`
        } else if (positionChanged && rotationChanged) {
          description = `变换${element.type}元素（位置、旋转）`
        } else if (sizeChanged) {
          description = `调整${element.type}元素大小`
        } else if (positionChanged) {
          description = `移动${element.type}元素`
        } else if (rotationChanged) {
          description = `旋转${element.type}元素`
        }
        
        // 创建变换操作
        const command = OperationFactory.transformElement(
          element.id,
          startState,
          endState
        )
        this.canvasStore.historyManager.recordCommand(command, description)
        
        // 清理保存的状态
        this.transformStartStates.delete(element.id)
      }
    })

    // 恢复UI状态
    this.isInternalUpdate = false
    
    // 恢复选中状态（变换结束后重新选中元素）
    if (elements.length > 0) {
      this.setSelectedElementIds(elements.map(el => el.id))
      
      // 显示浮动工具栏
      if (this.onShowFloatingToolbar) {
        this.onShowFloatingToolbar(elements[0])
      }
    }
  }

  /**
   * 处理鼠标进入事件
   */
  private handleMouseEnter(event: MouseEvent): void {
    // 鼠标进入画布时立即渲染，确保画布可见
    this.render()
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(event: MouseEvent): void {
    try {
    const rect = this.canvas.getBoundingClientRect()
      const position: Vector2 = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    // 检查当前是否是形状工具
    const currentTool = this.toolManager.getCurrentTool()
    const isShapeTool = currentTool?.getName() === 'shape'
    
    // 设置鼠标按下状态
    this.isMouseDown = true
    
    // 记录点击位置，用于形状文字编辑的点击检测
    this.lastClickPosition = position
    

      const toolEvent: ToolEvent = {
        type: 'mousedown',
        position,
        button: event.button,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: undefined,
        originalEvent: event
      }

      // 检查是否应该开始拖拽画布（按住空格键、中键或Ctrl键）
      if (event.button === 1 || event.altKey || event.ctrlKey) { // 中键、Alt键或Ctrl键
        this.isPanning = true
        this.viewportManager.startPan(position)
        this.canvas.style.cursor = 'grabbing'
        return
      }

      // 检测复制模式
      this.detectCopyMode(position)

      // 检查是否点击了连接点（如果正在拖拽连接线，优先处理）
      if (this.isDraggingConnection) {
        // 如果正在拖拽连接线，让当前工具处理
        this.toolManager.handleMouseDown(toolEvent)
        return
      }

      // 优先检查连接点点击（在任何其他检测之前）
      const hoveredElement = this.getHoveredElement()
      
      if (hoveredElement) {
        const connectionPoint = this.checkConnectionPointClick(position, hoveredElement)
        if (connectionPoint) {
          // 开始连接线拖拽
          this.startConnectionDrag(connectionPoint, hoveredElement)
          return
        }
      }

      // 优先检查变换手柄状态（无论当前是什么工具）
      if (this.selectedElementIds.length > 0) {
        // 检查是否点击在变换手柄上
        const handleAtPosition = this.transformManager.getHandleAtPosition(position);
        
        if (handleAtPosition) {
          // 点击在变换手柄上，开始变换
          this.transformManager.startTransform(position, handleAtPosition)
          this.render()
          return
        }
      }

      // 检查是否点击在现有元素上
      const virtualPos = this.viewportManager.getCoordinateTransformer().screenToVirtual(position)
      const clickedElement = this.getElementAtPosition(virtualPos)
 
      if (clickedElement) {
        
        // 检查是否是双击
        const currentTime = Date.now()
        const isDoubleClick = (currentTime - this.lastClickTime < this.doubleClickThreshold) && 
                             this.lastClickElement && 
                             this.lastClickElement.id === clickedElement.id
        
        
        if (isDoubleClick && clickedElement.type === 'text') {
          // 双击文本元素，触发文本编辑
          const textTool = this.toolManager.getTool(ToolType.TEXT) as any
          if (textTool) {
            textTool.onMouseDown(toolEvent)
          }
          return // 阻止继续执行其他逻辑
        } else if (isDoubleClick && clickedElement.type === 'shape') {
          // 双击形状元素，触发形状文字编辑
          this.startShapeTextEdit(clickedElement, toolEvent)
          return // 阻止继续执行其他逻辑
        } else {

          
          // 单击或非文本元素，优先处理拖拽
          // 使用之前获取的 currentTool，避免重复获取

          
          if (currentTool) {
            // 如果是格式刷工具，直接处理，不进行拖拽
            if (currentTool.getName() === 'styleBrush') {
              currentTool.onMouseDown(toolEvent)
            } else if (currentTool.getName() === 'shape' && clickedElement.type === 'shape') {
              // 如果是形状工具且点击的是形状元素
              if (this.isEditingShapeText) {
                // 只选中元素，不进行拖拽操作
                this.selectElement(clickedElement)
              } else {
                // 先选中元素，再处理拖拽
                this.selectElement(clickedElement)
                // 然后让形状工具处理拖拽
                currentTool.onMouseDown(toolEvent)
              }
            } else {
              // 其他工具，优先使用选择工具进行拖拽和变换
              const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
              
              if (selectTool) {
                // 使用选择工具处理拖拽和变换
                selectTool.onMouseDown(toolEvent)
              }
            }
          }
        }
        
        // 记录点击信息用于双击检测
        this.lastClickTime = currentTime
        this.lastClickElement = clickedElement
          } else {
            // 如果点击在空白区域，先清除选中状态，然后使用当前工具创建新元素
      // 先清除选中状态（任何工具点击空白区域都应该清除选中）
      this.clearSelection()
      
      // 然后使用当前工具处理点击事件
      this.toolManager.handleMouseDown(toolEvent)
        
        // 清空双击检测状态
        this.lastClickTime = 0
        this.lastClickElement = null
      }
      
      // 重新渲染（如果不在编辑形状文字模式）
      if (!this.isEditingShapeText) {
        this.render()
      } else {
      }
    } catch (error) {
      // 处理鼠标按下事件时出错
    }
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    
    const rect = this.canvas.getBoundingClientRect()
    const position: Vector2 = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    // 如果正在编辑形状文字，阻止拖拽操作
    if (this.isEditingShapeText) {
      return // 阻止拖拽，让用户专注于文字编辑
    }

    // 如果鼠标没有按下，只处理悬浮效果，不处理拖动
    if (!this.isMouseDown) {
      // 检查是否悬浮在变换手柄上
      this.checkTransformHandleHover(position)
      // 检查连接点悬浮
      this.checkConnectionPointHover(position)
      this.requestRender()
      return
    }

    // 如果正在拖拽画布
    if (this.isPanning) {
      // 检查是否是Ctrl键拖拽（无限画布模式）
      if (event.ctrlKey) {
        this.viewportManager.updatePanWithExpansion(position, this)
      } else {
        this.viewportManager.updatePan(position)
      }
      this.requestRender()
      return
    }

    // 检查是否悬浮在变换手柄上
    this.checkTransformHandleHover(position)

    // 检查连接点悬浮
    this.checkConnectionPointHover(position)
    
    // 连接点检测后需要重新渲染（如果不在编辑形状文字模式）
    if (!this.isEditingShapeText) {
      this.requestRender()
    } else {
    }

      const toolEvent: ToolEvent = {
        type: 'mousemove',
        position,
        button: event.button,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: undefined,
        originalEvent: event
      }

    // 如果正在拖拽连接线，优先处理
    if (this.isDraggingConnection) {
      this.toolManager.handleMouseMove(toolEvent)
      return
    }

    // 检查当前工具
    const currentTool = this.toolManager.getCurrentTool()
    
    // 如果是格式刷工具，直接处理鼠标移动，不进行拖拽
    if (currentTool && currentTool.getName() === 'styleBrush') {
      currentTool.onMouseMove(toolEvent)
      this.requestRender()
      return
    }
	   
    // 优先检查变换手柄状态（无论当前是什么工具）
    // 检查是否正在变换（拖动手柄被激活）
    if (this.transformManager.isTransforming()) {
      this.transformManager.updateTransform(position)
      this.requestRender()
      return
    }
    
    // 检查鼠标是否悬浮在拖动手柄上
    if (this.selectedElementIds.length > 0) {
      const handleAtPosition = this.transformManager.getHandleAtPosition(position);
      
      if (handleAtPosition) {
        // 鼠标悬浮在拖动手柄上，更新鼠标样式
        this.canvas.style.cursor = handleAtPosition.getCursorStyle()
        this.requestRender()
        return
      }
    }
    
    // 检查选择工具是否正在拖动元素
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool && selectTool.isCurrentlyDragging()) {
      selectTool.onMouseMove(toolEvent)
      this.requestRender()
      return
    }
    
    // 只有当鼠标不在拖动手柄上时，才使用当前工具处理
    const needsRender = this.toolManager.handleMouseMove(toolEvent)
    
    // 检查是否有元素正在被拖拽，如果有则处理智能参考线
    this.handleSmartGuidesForCurrentTool(toolEvent)
	
    if (needsRender) {
      this.requestRender()
    }
  }

  /**
   * 处理鼠标抬起事件
   */
  private handleMouseUp(event: MouseEvent): void {
      const rect = this.canvas.getBoundingClientRect()
    const position: Vector2 = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    
    // 清除鼠标按下状态
    this.isMouseDown = false
    
    // 如果正在编辑形状文字，阻止拖拽操作
    if (this.isEditingShapeText) {
      return // 阻止拖拽，让用户专注于文字编辑
    }
    
    // 如果正在拖拽画布，结束拖拽
    if (this.isPanning) {
      this.isPanning = false
      this.viewportManager.endPan()
      this.canvas.style.cursor = 'default'
      this.requestRender()
      return
    }
      
      const toolEvent: ToolEvent = {
        type: 'mouseup',
        position,
        button: event.button,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        key: undefined,
        originalEvent: event
      }

    // 如果正在拖拽连接线，优先处理
    if (this.isDraggingConnection) {
      this.toolManager.handleMouseUp(toolEvent)
      return
    }

    // 检查当前工具
    const currentTool = this.toolManager.getCurrentTool()
    
    // 优先检查变换手柄状态
    if (this.transformManager.isTransforming()) {
      // 结束变换
      this.transformManager.endTransform()
      this.requestRender()
      return
    }
    
    // 如果是格式刷工具，直接处理鼠标抬起，不进行拖拽
    if (currentTool && currentTool.getName() === 'styleBrush') {
      currentTool.onMouseUp(toolEvent)
    } else {
      // 检查选择工具是否正在拖动元素
      const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
      if (selectTool && selectTool.isCurrentlyDragging()) {
        // 如果选择工具正在拖动，直接调用选择工具的鼠标抬起处理
        selectTool.onMouseUp(toolEvent)
      } else {
        // 让工具管理器处理鼠标抬起
        this.toolManager.handleMouseUp(toolEvent)
      }
    }
    
    // 清除智能参考线（拖拽结束时）
    this.clearSmartGuides()
    
    // 重新渲染（如果不在编辑形状文字模式）
    if (!this.isEditingShapeText) {
      this.requestRender()
    } else {
    }
  }

  /**
   * 处理鼠标滚轮事件
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault()

    const rect = this.canvas.getBoundingClientRect()
    const position: Vector2 = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    const delta = event.deltaY > 0 ? 0.95 : 1.05
    this.viewportManager.zoom(delta, position)
    this.requestRender()
  }

  /**
   * 处理键盘按下事件
   */
  handleKeyDown(event: KeyboardEvent): void {
    const toolEvent: ToolEvent = {
      type: 'keydown',
      position: { x: 0, y: 0 },
      button: 0,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      key: event.key,
      originalEvent: event
    }

    this.toolManager.handleKeyDown(toolEvent)
    this.requestRender()
  }

  /**
   * 处理键盘抬起事件
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const toolEvent: ToolEvent = {
      type: 'keyup',
      position: { x: 0, y: 0 },
      button: 0,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      key: event.key,
      originalEvent: event
    }

    this.toolManager.handleKeyUp(toolEvent)
    this.requestRender()
  }

  /**
   * 处理鼠标离开事件
   */
  private handleMouseLeave(event: MouseEvent): void {
    // 重置鼠标样式
    this.canvas.style.cursor = 'default'
  }

  /**
   * 处理触摸开始事件
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault()
    
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      const position: Vector2 = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }

      const toolEvent: ToolEvent = {
        type: 'touchstart',
        position,
        button: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        key: undefined,
        originalEvent: event
      }

      this.toolManager.handleMouseDown(toolEvent)
      this.requestRender()
    }
  }

  /**
   * 处理触摸移动事件
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault()
    
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      const position: Vector2 = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }

      const toolEvent: ToolEvent = {
        type: 'touchmove',
        position,
        button: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        key: undefined,
        originalEvent: event
      }

      const needsRender = this.toolManager.handleMouseMove(toolEvent)
      if (needsRender) {
        this.requestRender()
      }
    }
  }

  /**
   * 处理触摸结束事件
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault()
    
    if (event.touches.length === 0) {
      const toolEvent: ToolEvent = {
        type: 'touchend',
        position: { x: 0, y: 0 },
        button: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        key: undefined,
        originalEvent: event
      }

      this.toolManager.handleMouseUp(toolEvent)
      this.requestRender()
    }
  }

  /**
   * 处理窗口大小变化事件
   */
  private handleResize(): void {
    this.render()
  }

  /**
   * 渲染画布
   */
  render(): void {
    if (!this.isInitialized) return

    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    // 清除画布
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 设置背景色
    ctx.fillStyle = this.settings.backgroundColor
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 渲染网格（在视口变换之前，确保网格在标尺下方）
    if (this.settings.gridVisible) {
      this.renderer.renderGrid()
    }

    // 渲染标尺（在视口变换之前，确保标尺位置固定，在网格之上）
    if (this.settings.rulersVisible) {
      this.renderer.renderRulers()
    }

    // 应用视口变换
    this.viewportManager.applyTransform(ctx)

    // 按图层顺序渲染元素
    this.renderElementsByLayer()

    // 更新箭头工具的元素列表（用于吸附功能）
    const arrowTool = this.toolManager.getTool(ToolType.ARROW)
    if (arrowTool && 'updateElements' in arrowTool) {
      (arrowTool as any).updateElements(this.elements)
    }

    // 更新格式刷工具的元素列表（用于元素检测）
    const styleBrushTool = this.toolManager.getTool(ToolType.STYLE_BRUSH)
    if (styleBrushTool && 'updateElements' in styleBrushTool) {
      (styleBrushTool as any).updateElements(this.elements)
    }

    // 恢复变换，让工具使用屏幕坐标
    this.viewportManager.restoreTransform(ctx)
    
    // 确保画布状态正确
    ctx.save()
    
    // 渲染工具预览（使用屏幕坐标，确保在最顶层）
    this.toolManager.render(ctx)
    
    // 渲染选中元素高亮和其他覆盖层
    this.renderer.renderOverlay(this.isInternalUpdate)
    
    // 渲染变换手柄
    this.renderTransformHandles(ctx)
    
    // 渲染连接点（在最后渲染，确保在最上层）
    this.renderer.renderConnectionPoints()
    
    // 渲染连接线（拖拽时）
    this.renderer.renderConnectionLine()
    
    // 渲染智能参考线（在最后渲染，确保在最上层）
    this.renderer.renderSmartGuidesOnly()
    
    // 恢复画布状态
    ctx.restore()
  }

  /**
   * 请求渲染（用于工具内部调用）
   */
  requestRender(): void {

    
    // 如果正在编辑形状文字，跳过渲染以避免干扰输入框
    if (this.isEditingShapeText) {

      return
    }
    
    if (this.animationFrameId) {
      return // 已经安排了渲染
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.render()
      this.animationFrameId = null
    })
  }

  /**
   * 渲染变换手柄
   */
  private renderTransformHandles(ctx: CanvasRenderingContext2D): void {
    if (this.selectedElementIds.length === 0) return
    
    // 获取选中的元素
    const selectedElements = this.elements.filter(el => this.selectedElementIds.includes(el.id))
    if (selectedElements.length === 0) return
    
    // 只有在不在变换过程中时才重新设置选中元素，避免覆盖 initialTransformState
    if (!this.transformManager.isTransforming()) {
      this.transformManager.setSelectedElements(selectedElements)
    }
    
    // 渲染变换手柄
    this.transformManager.render(ctx)
  }

  /**
   * 创建形状元素
   */
  createShapeElement(type: string, position: Vector2, size: Vector2, style: any): CanvasElement {
    const element: CanvasElement = {
      id: this.generateId(),
      type: ElementType.SHAPE,
      position,
      size,
      rotation: 0,
      style,
      layer: this.layerManager.getCurrentLayer()?.id || 'default',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: { shapeType: type }
    }

    // 不在这里添加元素，让addElement方法统一处理
    return element
  }

  /**
   * 创建路径元素
   */
  createPathElement(points: Vector2[], style: any): CanvasElement {
    // ✅ 修复：将屏幕坐标转换为虚拟坐标
    const virtualPoints = points.map(point => this.viewportManager.getCoordinateTransformer().screenToVirtual(point))
    const bounds = this.calculatePathBounds(virtualPoints)
    
    // ✅ 修复：将路径点转换为相对于元素位置的坐标
    const relativePoints = virtualPoints.map(point => ({
      x: point.x - bounds.position.x,
      y: point.y - bounds.position.y
    }))
    
    const element: CanvasElement = {
      id: this.generateId(),
        type: ElementType.PATH,
      position: bounds.position,
      size: bounds.size,
      rotation: 0,
      style: {
        fill: style.fill || 'transparent',
        stroke: style.stroke || '#000000',
        strokeWidth: style.strokeWidth || 2,
        opacity: style.opacity || 1,
        lineStyle: style.penSettings?.lineStyle || 'solid'
      },
      layer: this.layerManager.getCurrentLayer()?.id || 'default',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: { 
        points: relativePoints, // ✅ 使用相对于元素位置的坐标
        penSettings: style.penSettings || {
          strokeColor: style.stroke || '#000000',
          strokeWidth: style.strokeWidth || 2,
          opacity: style.opacity || 1,
          smoothing: true,
          minDistance: 2,
          lineStyle: style.penSettings?.lineStyle || 'solid'
        }
      }
    }

    // 不在这里添加元素，让addElement方法统一处理
    return element
  }

  /**
   * 从点数组创建线条元素
   */
  createLineElementFromPoints(points: Vector2[], style: any, lineType: string = 'straight'): CanvasElement {
    if (points.length < 2) {
      throw new Error('线条至少需要两个点')
    }

    // ✅ 修复：将屏幕坐标转换为虚拟坐标
    const virtualPoints = points.map(point => this.viewportManager.getCoordinateTransformer().screenToVirtual(point))
    const bounds = this.calculatePathBounds(virtualPoints)
    
    // ✅ 修复：将绝对坐标转换为相对于元素位置的坐标
    const relativePoints = virtualPoints.map(point => ({
      x: point.x - bounds.position.x,
      y: point.y - bounds.position.y
    }))
    
    const element: CanvasElement = {
      id: this.generateId(),
        type: ElementType.LINE,
      position: bounds.position,
      size: bounds.size,
      rotation: 0,
      style: {
        fill: 'transparent',
        stroke: style.strokeColor || '#000000',
        strokeWidth: style.strokeWidth || 2,
        opacity: style.opacity || 1
      },
      layer: this.layerManager.getCurrentLayer()?.id || 'default',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        points: relativePoints, // ✅ 使用相对坐标
        lineType: lineType,
        lineStyle: style
      }
    }

    return element
  }

  /**
   * 从点数组创建箭头元素
   */
  createArrowElementFromPoints(points: Vector2[], style: any, arrowType: string = 'line'): CanvasElement {
    if (points.length < 2) {
      throw new Error('箭头至少需要两个点')
    }

    // ✅ 修复：将屏幕坐标转换为虚拟坐标
    const virtualPoints = points.map(point => this.viewportManager.getCoordinateTransformer().screenToVirtual(point))
    const bounds = this.calculatePathBounds(virtualPoints)
    
    
    // ✅ 修复：将绝对坐标转换为相对于元素位置的坐标
    const relativePoints = virtualPoints.map(point => ({
      x: point.x - bounds.position.x,
      y: point.y - bounds.position.y
    }))
    
    const element: CanvasElement = {
      id: this.generateId(),
      type: ElementType.ARROW,
      position: bounds.position,
      size: bounds.size,
      rotation: 0,
      style: {
        fill: 'transparent',
        stroke: style.strokeColor || '#000000',
        strokeWidth: style.strokeWidth || 2,
        opacity: style.opacity || 1
      },
      layer: this.layerManager.getCurrentLayer()?.id || 'default',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        points: relativePoints, // ✅ 使用相对坐标
        arrowType: arrowType,
        arrowStyle: style
      }
    }


    return element
  }

  /**
   * 创建连接线元素
   */
  createConnectionLineElement(startPoint: Vector2, endPoint: Vector2, sourceElement: CanvasElement, targetElement?: CanvasElement): CanvasElement {
    
    // 创建连接线样式
    const connectionStyle = {
      strokeColor: '#1976d2',
      color: '#1976d2', // 箭头填充颜色
      strokeWidth: 2,
      dashPattern: [8, 4], // 虚线样式
      opacity: 1,
      size: 10, // 箭头大小
      shape: 'triangle' // 箭头形状
    }
    
    // 使用箭头创建方法，确保有箭头
    const connectionLine = this.createArrowElementFromPoints([startPoint, endPoint], connectionStyle, 'straight')
    
    // 添加连接信息到数据中
    connectionLine.data = {
      ...connectionLine.data,
      isConnectionLine: true,
      sourceElementId: sourceElement.id,
      targetElementId: targetElement?.id,
      connectionType: 'flow',
      points: [
        { x: startPoint.x - connectionLine.position.x, y: startPoint.y - connectionLine.position.y },
        { x: endPoint.x - connectionLine.position.x, y: endPoint.y - connectionLine.position.y }
      ],
      // 保存绝对终点坐标，用于后续移动时保持终点固定
      absoluteEndPoint: endPoint,
      // 保存自定义连接点位置（相对于元素的比例位置）
      customStartPoint: {
        x: (startPoint.x - sourceElement.position.x) / sourceElement.size.x,
        y: (startPoint.y - sourceElement.position.y) / sourceElement.size.y
      },
      customEndPoint: targetElement ? {
        x: (endPoint.x - targetElement.position.x) / targetElement.size.x,
        y: (endPoint.y - targetElement.position.y) / targetElement.size.y
      } : undefined
    }
    
    
    return connectionLine
  }

  /**
   * 查找连接到指定元素的所有连接线
   */
  findConnectionLinesConnectedTo(elementId: string): CanvasElement[] {
    // 查找所有箭头和线条元素
    const allConnectionElements = this.elements.filter(element => 
      element.type === ElementType.ARROW || element.type === ElementType.LINE
    )
    
    // 查找所有连接线
    const connectionLines = allConnectionElements.filter(element => {
      const isConnectionLine = element.data?.isConnectionLine === true
      const hasSourceMatch = element.data?.sourceElementId === elementId
      const hasTargetMatch = element.data?.targetElementId === elementId
      const isConnected = hasSourceMatch || hasTargetMatch
      
      return isConnectionLine && isConnected
    })
    
    return connectionLines
  }

  /**
   * 获取连接线的实际连接点（起点或终点）
   * 如果元素是连接线，返回它的实际起点或终点；否则返回null
   */
  private getConnectionLineActualPoint(element: CanvasElement, isStart: boolean): Vector2 | null {
    if (!element.data?.isConnectionLine) {
      return null
    }
    
    const points = element.data?.points || []
    if (points.length === 0) {
      return null
    }
    
    // 根据 isStart 返回起点或终点
    const point = isStart ? points[0] : points[points.length - 1]
    
    // 将相对坐标转换为绝对坐标
    return {
      x: element.position.x + point.x,
      y: element.position.y + point.y
    }
  }

  /**
   * 更新连接线的起点和终点
   */
  updateConnectionLinePoints(connectionLine: CanvasElement, sourceElement: CanvasElement, targetElement?: CanvasElement): void {
    // 确保 connectionLine.data 存在
    if (!connectionLine.data) {
      connectionLine.data = { isConnectionLine: true }
    }

    if (!connectionLine.data.isConnectionLine) {
      console.warn(`⚠️ [CanvasEngine] updateConnectionLinePoints - 连接线 ${connectionLine.id} 不是连接线类型`)
      return
    }

    // 获取当前的连接点信息
    const currentPoints = connectionLine.data?.points || []
    
    // 如果points数组为空，初始化一个基本的连接点
    if (currentPoints.length === 0) {
      // 对于 LINE 类型，如果 points 数组为空，根据 position 和 size 计算 points
      if (connectionLine.type === ElementType.LINE) {
        // 转换为相对坐标
        connectionLine.data.points = [
          { x: 0, y: 0 },
          { x: connectionLine.size.x, y: connectionLine.size.y }
        ]
      } else {
        // 对于 ARROW 类型，使用源元素的中心点
      const sourceCenterX = sourceElement.position.x + sourceElement.size.x / 2
      const sourceCenterY = sourceElement.position.y + sourceElement.size.y / 2
      connectionLine.data.points = [
        { x: sourceCenterX - connectionLine.position.x, y: sourceCenterY - connectionLine.position.y },
        { x: sourceCenterX - connectionLine.position.x, y: sourceCenterY - connectionLine.position.y + 40 }
      ]
      }
    }

    // 计算源元素的连接点（起点跟随源元素移动）
    // 如果源元素是连接线，使用它的实际起点；否则使用相对位置或默认连接点
    let sourceConnectionPoint: Vector2
    
    // 检查源元素是否是连接线
    const sourceActualStartPoint = this.getConnectionLineActualPoint(sourceElement, true)
    if (sourceActualStartPoint) {
      // 源元素是连接线，使用它的实际起点
      sourceConnectionPoint = sourceActualStartPoint
      // 保存标记，表示连接到连接线的起点
      connectionLine.data.useSourceActualPoint = true
      // 保存占位符，表示使用实际起点
      if (!connectionLine.data.customStartPoint) {
        connectionLine.data.customStartPoint = { x: 0, y: 0 }
      }
    } else {
      // 源元素不是连接线，使用相对位置或默认连接点
      connectionLine.data.useSourceActualPoint = false
      
      // 检查是否有有效的自定义起点（x 和 y 都在 [0, 1] 范围内，表示相对位置）
      const hasValidCustomStartPoint = connectionLine.data?.customStartPoint && 
          typeof connectionLine.data.customStartPoint.x === 'number' &&
          typeof connectionLine.data.customStartPoint.y === 'number' &&
          connectionLine.data.customStartPoint.x >= 0 && 
          connectionLine.data.customStartPoint.x <= 1 &&
          connectionLine.data.customStartPoint.y >= 0 && 
          connectionLine.data.customStartPoint.y <= 1
      
      if (hasValidCustomStartPoint) {
        // 如果有有效的自定义起点，保持相对位置
      const relativeOffset = connectionLine.data.customStartPoint
      sourceConnectionPoint = {
        x: sourceElement.position.x + sourceElement.size.x * relativeOffset.x,
        y: sourceElement.position.y + sourceElement.size.y * relativeOffset.y
      }
    } else {
      // 如果没有自定义起点，使用默认的右边中点
      sourceConnectionPoint = this.calculateElementConnectionPoint(sourceElement, 'right')
      // 保存相对位置信息
      connectionLine.data.customStartPoint = {
        x: (sourceConnectionPoint.x - sourceElement.position.x) / sourceElement.size.x,
        y: (sourceConnectionPoint.y - sourceElement.position.y) / sourceElement.size.y
        }
      }
    }
    
    // 计算终点
    let endPoint: Vector2
    if (targetElement) {
      // 检查目标元素是否是连接线
      const targetActualEndPoint = this.getConnectionLineActualPoint(targetElement, false)
      if (targetActualEndPoint) {
        // 目标元素是连接线，使用它的实际终点
        endPoint = targetActualEndPoint
        // 保存标记，表示连接到连接线的终点
        connectionLine.data.useTargetActualPoint = true
        // 保存占位符，表示使用实际终点
        if (!connectionLine.data.customEndPoint) {
          connectionLine.data.customEndPoint = { x: 0, y: 0 }
        }
      } else {
        // 目标元素不是连接线，使用相对位置或默认连接点
        connectionLine.data.useTargetActualPoint = false
        
        // 检查是否有有效的自定义终点（x 和 y 都在 [0, 1] 范围内，表示相对位置）
        const hasValidCustomEndPoint = connectionLine.data?.customEndPoint && 
            typeof connectionLine.data.customEndPoint.x === 'number' &&
            typeof connectionLine.data.customEndPoint.y === 'number' &&
            connectionLine.data.customEndPoint.x >= 0 && 
            connectionLine.data.customEndPoint.x <= 1 &&
            connectionLine.data.customEndPoint.y >= 0 && 
            connectionLine.data.customEndPoint.y <= 1
        
        if (hasValidCustomEndPoint) {
          // 如果有有效的自定义终点，保持相对位置
        const relativeOffset = connectionLine.data.customEndPoint
        endPoint = {
          x: targetElement.position.x + targetElement.size.x * relativeOffset.x,
          y: targetElement.position.y + targetElement.size.y * relativeOffset.y
        }
      } else {
        // 如果没有自定义终点，使用默认的左边中点
        endPoint = this.calculateElementConnectionPoint(targetElement, 'left')
        // 保存相对位置信息
        connectionLine.data.customEndPoint = {
          x: (endPoint.x - targetElement.position.x) / targetElement.size.x,
          y: (endPoint.y - targetElement.position.y) / targetElement.size.y
          }
        }
      }
    } else {
      // 如果没有目标元素，终点保持固定 - 使用保存的绝对坐标
      if (connectionLine.data?.absoluteEndPoint) {
        // 使用保存的绝对终点坐标（保持固定）
        endPoint = connectionLine.data.absoluteEndPoint
      } else {
        // 如果没有保存的绝对坐标，使用当前终点位置并保存
        endPoint = {
          x: connectionLine.position.x + currentPoints[currentPoints.length - 1].x,
          y: connectionLine.position.y + currentPoints[currentPoints.length - 1].y
        }
        // 保存绝对终点坐标
        connectionLine.data.absoluteEndPoint = endPoint
      }
    }

    // 先计算新的位置和大小
    const x = Math.min(sourceConnectionPoint.x, endPoint.x)
    const y = Math.min(sourceConnectionPoint.y, endPoint.y)
    const width = Math.abs(endPoint.x - sourceConnectionPoint.x)
    const height = Math.abs(endPoint.y - sourceConnectionPoint.y)

    // 基于新位置计算相对points（关键修复：先更新位置，再计算相对坐标）
    const newPoints = [
      { x: sourceConnectionPoint.x - x, y: sourceConnectionPoint.y - y },
      { x: endPoint.x - x, y: endPoint.y - y }
    ]

    // 更新连接线的位置、大小和points
    connectionLine.position = { x, y }
    connectionLine.size = { x: width, y: height }
    connectionLine.data.points = newPoints
    connectionLine.updatedAt = Date.now()

  }

  /**
   * 更新连接线的自定义连接点位置
   */
  updateConnectionLineCustomPoints(connectionLine: CanvasElement, startPoint?: Vector2, endPoint?: Vector2): void {
    if (!connectionLine.data?.isConnectionLine) return

    // 更新起点位置
    if (startPoint && connectionLine.data.sourceElementId) {
      const sourceElement = this.getElement(connectionLine.data.sourceElementId)
      if (sourceElement) {
        connectionLine.data.customStartPoint = {
          x: (startPoint.x - sourceElement.position.x) / sourceElement.size.x,
          y: (startPoint.y - sourceElement.position.y) / sourceElement.size.y
        }
      }
    }

    // 更新终点位置
    if (endPoint && connectionLine.data.targetElementId) {
      const targetElement = this.getElement(connectionLine.data.targetElementId)
      if (targetElement) {
        connectionLine.data.customEndPoint = {
          x: (endPoint.x - targetElement.position.x) / targetElement.size.x,
          y: (endPoint.y - targetElement.position.y) / targetElement.size.y
        }
      }
    }

    // 重新计算连接线位置
    if (connectionLine.data.sourceElementId) {
      const sourceElement = this.getElement(connectionLine.data.sourceElementId)
      const targetElement = connectionLine.data.targetElementId ? this.getElement(connectionLine.data.targetElementId) : undefined
      if (sourceElement) {
        this.updateConnectionLinePoints(connectionLine, sourceElement, targetElement)
      }
    }
  }

  /**
   * 计算元素的连接点
   */
  calculateElementConnectionPoint(element: CanvasElement, side: 'left' | 'right' | 'top' | 'bottom'): Vector2 {
    const { position, size } = element
    const centerX = position.x + size.x / 2
    const centerY = position.y + size.y / 2

    switch (side) {
      case 'left':
        return { x: position.x, y: centerY }
      case 'right':
        return { x: position.x + size.x, y: centerY }
      case 'top':
        return { x: centerX, y: position.y }
      case 'bottom':
        return { x: centerX, y: position.y + size.y }
      default:
        return { x: centerX, y: centerY }
    }
  }

  /**
   * 查找元素
   */
  findElement(elementId: string): CanvasElement | null {
    return this.elements.find(el => el.id === elementId) || null
  }

  /**
   * 更新连接到指定元素的所有连接线
   * @param elementId 元素ID
   * @param processedIds 已处理的连接线ID集合，用于避免无限递归
   */
  updateConnectionLinesForElement(elementId: string, processedIds: Set<string> = new Set()): void {
    const connectionLines = this.findConnectionLinesConnectedTo(elementId)
    
    if (connectionLines.length === 0) {
      return
    }
    
    // 记录本次更新中涉及的连接线ID，用于后续递归更新
    const updatedConnectionLineIds: string[] = []
    
    for (let i = 0; i < connectionLines.length; i++) {
      const connectionLine = connectionLines[i]
      
      // 如果已经处理过，跳过（避免重复处理）
      if (processedIds.has(connectionLine.id)) {
        continue
      }
      
      const sourceElementId = connectionLine.data?.sourceElementId
      const targetElementId = connectionLine.data?.targetElementId
      
      let shouldUpdate = false
      let sourceElement: CanvasElement | null = null
      let targetElement: CanvasElement | null = null
      
      if (sourceElementId === elementId) {
        // 更新源元素（源元素是移动的元素）
        sourceElement = this.findElement(sourceElementId)
        targetElement = targetElementId ? this.findElement(targetElementId) : null
        
        if (sourceElement) {
          shouldUpdate = true
        } else {
          console.warn(`    ⚠️ [${i + 1}] 源元素不存在: ${sourceElementId}`)
        }
      } else if (targetElementId === elementId) {
        // 更新目标元素（目标元素是移动的元素）
        sourceElement = sourceElementId ? this.findElement(sourceElementId) : null
        targetElement = this.findElement(targetElementId)
        
        // 确保源元素和目标元素都存在，更新连接线
        if (sourceElement && targetElement) {
          shouldUpdate = true
        } else {
          console.warn(`    ⚠️ [${i + 1}] 连接线 ${connectionLine.id} 的元素缺失: source=${!!sourceElement}, target=${!!targetElement}`)
        }
      }
      
      // 执行更新
      if (shouldUpdate && sourceElement) {
        try {
          this.updateConnectionLinePoints(connectionLine, sourceElement, targetElement || undefined)
          
          // 记录已更新的连接线ID
          updatedConnectionLineIds.push(connectionLine.id)
          processedIds.add(connectionLine.id)
        } catch (error) {
          console.error(`    ❌ [${i + 1}] 连接线 ${connectionLine.id} 更新失败:`, error)
        }
      }
    }
    
    // 递归更新：检查是否有其他连接线连接到刚才更新的连接线
    for (const updatedConnectionLineId of updatedConnectionLineIds) {
      // 检查是否有其他连接线连接到这条连接线
      const nestedConnectionLines = this.findConnectionLinesConnectedTo(updatedConnectionLineId)
      if (nestedConnectionLines.length > 0) {
        // 递归调用，传入已处理的ID集合
        this.updateConnectionLinesForElement(updatedConnectionLineId, processedIds)
      }
    }
    
    // 如果有连接线更新，触发响应式更新以确保 UI 能检测到变化
    if (updatedConnectionLineIds.length > 0) {
      // 使用防抖机制，避免频繁更新
      if (!this._syncPending) {
        this._syncPending = true
        setTimeout(() => {
          // 创建新数组，确保 Vue 能检测到变化
          this.canvasStore.elements.value = [...this.canvasStore.elements.value]
          this._syncPending = false
        }, 0)
      }
    }
  }

  /**
   * 创建箭头元素
   */
  createArrowElement(start: Vector2, end: Vector2, style: any): CanvasElement {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    const element: CanvasElement = {
      id: this.generateId(),
      type: ElementType.ARROW,
      position: { x, y },
      size: { x: width, y: height },
      rotation: 0,
      style,
      layer: this.layerManager.getCurrentLayer()?.id || 'default',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: { start, end }
    }

    // 不在这里添加元素，让addElement方法统一处理
    return element
  }

  /**
   * 创建直线元素
   */
  createLineElement(start: Vector2, end: Vector2, style: any): CanvasElement {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    const element: CanvasElement = {
      id: this.generateId(),
      type: ElementType.LINE,
      position: { x, y },
      size: { x: width, y: height },
      rotation: 0,
      style,
      layer: this.layerManager.getCurrentLayer()?.id || 'default',
      locked: false,
      visible: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: { start, end }
    }

    // 不在这里添加元素，让addElement方法统一处理
    return element
  }

  /**
   * 计算路径边界
   */
  private calculatePathBounds(points: Vector2[]): { position: Vector2; size: Vector2 } {
    if (points.length === 0) {
      return { position: { x: 0, y: 0 }, size: { x: 0, y: 0 } }
    }

    let minX = points[0].x
    let minY = points[0].y
    let maxX = points[0].x
    let maxY = points[0].y

    for (const point of points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    // ✅ 修复：确保箭头有最小尺寸，避免0尺寸问题
    const minSize = 1 // 最小尺寸为1像素
    const width = Math.max(minSize, Math.abs(maxX - minX))
    const height = Math.max(minSize, Math.abs(maxY - minY))

    const bounds = {
      position: { x: minX, y: minY },
      size: { x: width, y: height }
    }


    return bounds
  }

  /**
   * 重置视口
   */
  resetViewport(): void {
    this.viewportManager.resetViewport()
    this.render()
  }

  /**
   * 添加元素
   */
  addElement(element: CanvasElement): void {
    // 检查是否已存在相同ID的元素
    if (this.elements.some(el => el.id === element.id)) {
      return
    }
    
    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 设置元素的图层ID
    const currentLayer = this.layerManager.getCurrentLayer()
    if (currentLayer) {
      element.layer = currentLayer.id
    }

    this.elements.push(element)
    
    // 🔥 关键修复：为图片元素设置加载完成回调，实现立即渲染
    if (element.type === 'image' && 'setOnImageLoaded' in element) {
      const imageElement = element as any
      imageElement.setOnImageLoaded(() => {
        // 图片加载完成后立即重新渲染画布
        this.render()
      })
    }
    
    // 将元素添加到当前图层
    if (currentLayer) {
      this.layerManager.moveElementToLayer(element.id, currentLayer.id)
    }
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录历史操作
    const command = OperationFactory.createElement(element, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `创建${element.type}元素`)
    
    // 更新选择工具的元素列表
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool) {
      selectTool.setAllElements(this.elements)
    }
    
    // 更新操作执行器的状态
    this.operationExecutor.setElements(this.elements)
    
    // 设置内部更新标志，避免循环同步
    this.isInternalUpdate = true
    
    // 同步到 canvasStore
    this.canvasStore.elements.value = [...this.elements]
    
    // 使用setTimeout确保Vue的响应式更新完成后再重置标志
    setTimeout(() => {
      this.isInternalUpdate = false
    }, 0)
    
    // 更新缩略图
    if (currentLayer) {
      this.thumbnailManager.markForUpdate(currentLayer.id)
    }
    
    // 更新样式刷工具的元素列表
    if (this.styleBrushTool && 'updateElements' in this.styleBrushTool) {
      (this.styleBrushTool as any).updateElements(this.elements)
    }
    
    
    this.render()
  }

  /**
   * 删除元素
   */
  removeElement(elementId: string): void {
    const index = this.elements.findIndex(el => el.id === elementId)
    if (index !== -1) {
      // 记录操作前状态
      const beforeState = {
        elements: [...this.elements],
        layers: [...this.layerManager.getAllLayers()],
        selectedElementIds: [...this.selectedElementIds]
      }
      
      const element = this.elements[index]
      this.elements.splice(index, 1)
      
      // 记录操作后状态
      const afterState = {
        elements: [...this.elements],
        layers: [...this.layerManager.getAllLayers()],
        selectedElementIds: [...this.selectedElementIds]
      }
      
      // 记录历史操作
      const command = OperationFactory.deleteElement(element, beforeState, afterState)
      this.canvasStore.historyManager.recordCommand(command, `删除${element.type}元素`)
      
      // 更新选择工具的元素列表
      const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
      if (selectTool) {
        selectTool.setAllElements(this.elements)
      }
      
      // 更新操作执行器的状态
      this.operationExecutor.setElements(this.elements)
      
      // 设置内部更新标志，避免循环同步
      this.isInternalUpdate = true
      
      // 同步到 canvasStore
      this.canvasStore.elements.value = [...this.elements]
      
      // 重置内部更新标志
      this.isInternalUpdate = false
      
      // 更新缩略图
      this.thumbnailManager.markForUpdate(element.layer)
      
      // 更新样式刷工具的元素列表
      if (this.styleBrushTool && 'updateElements' in this.styleBrushTool) {
        (this.styleBrushTool as any).updateElements(this.elements)
      }
      
      this.render()
    }
  }

  /**
   * 更新元素
   */
  updateElement(updatedElement: CanvasElement): boolean {
    const index = this.elements.findIndex(el => el.id === updatedElement.id)
    if (index !== -1) {
      this.elements[index] = updatedElement
      
      // 为更新后的图片元素设置加载完成回调
      if (updatedElement.type === 'image' && 'setOnImageLoaded' in updatedElement) {
        const imageElement = updatedElement as any
        imageElement.setOnImageLoaded(() => {
          this.render()
        })
      }
      
      // 同步到 canvasStore，确保 MiniMap 和其他监听器能检测到变化
      if (this.canvasStore && this.canvasStore.elements) {
        const storeIndex = this.canvasStore.elements.value.findIndex((el: CanvasElement) => el.id === updatedElement.id)
        if (storeIndex !== -1) {
          this.canvasStore.elements.value[storeIndex] = { ...updatedElement }
          // 立即触发响应式更新：替换整个数组引用
          this.canvasStore.elements.value = [...this.canvasStore.elements.value]
        }
      }
      
      this.render()
      return true
    }
    return false
  }

  /**
   * 替换元素（用新元素替换指定ID的元素）
   */
  replaceElement(elementId: string, newElement: CanvasElement): boolean {
    const index = this.elements.findIndex(el => el.id === elementId)
    if (index !== -1) {
      // 保持原有的ID，确保引用关系不变
      newElement.id = elementId
      this.elements[index] = newElement
      
      // 为新的图片元素设置加载完成回调
      if (newElement.type === 'image' && 'setOnImageLoaded' in newElement) {
        const imageElement = newElement as any
        imageElement.setOnImageLoaded(() => {
          this.render()
        })
      }
      
      this.render()
      return true
    }
    return false
  }

  /**
   * 更新元素位置（用于实时拖动）
   */
  updateElementPosition(elementId: string, newPosition: Vector2): boolean {
    const element = this.elements.find(el => el.id === elementId)
    if (element) {
      // 获取当前工具类型
      const currentTool = this.toolManager.getCurrentToolType()
      const toolName = currentTool ? this.toolManager.getCurrentTool()?.getName() : 'unknown'
      
      // 检查位置是否真的变化了（避免不必要的更新）
      const positionChanged = 
        Math.abs(element.position.x - newPosition.x) > 0.01 ||
        Math.abs(element.position.y - newPosition.y) > 0.01
      
      if (!positionChanged) {
        return false // 位置没有实际变化，不需要更新
      }
      
      // 同步到 canvasStore，确保 MiniMap 和其他监听器能检测到变化
      // 注意：必须在更新 element.position 之前获取 storeElement 和旧位置值
      // 因为 element 和 storeElement 可能是同一个对象的引用
      let storeElement: CanvasElement | undefined
      let storeOldPos: Vector2 | undefined
      
      if (this.canvasStore && this.canvasStore.elements) {
        storeElement = this.canvasStore.elements.value.find((el: CanvasElement) => el.id === elementId)
        if (storeElement) {
          // 在更新 element.position 之前保存旧位置
          storeOldPos = { ...storeElement.position }
        }
      }
      
      // 现在更新 element.position（这会同时更新 storeElement.position，因为它们是同一个引用）
      element.position = { ...newPosition }
      
      // 如果找到了 storeElement，触发响应式更新
      if (storeElement && storeOldPos) {
        // 使用保存的旧位置值进行比较（因为现在 storeElement.position 已经更新了）
        const storePositionChanged = 
          Math.abs(storeOldPos.x - newPosition.x) > 0.01 ||
          Math.abs(storeOldPos.y - newPosition.y) > 0.01
        
        if (storePositionChanged) {
          // 触发响应式更新：替换整个数组引用
          // 使用防抖机制，但延迟很短（0ms，下一个事件循环），确保响应式系统能及时检测到变化
          if (!this._syncPending) {
            this._syncPending = true
            // 使用 setTimeout(0) 确保在下一个事件循环中立即执行，比 requestAnimationFrame 更快
            setTimeout(() => {
              // 创建新数组，确保 Vue 能检测到变化
              this.canvasStore.elements.value = [...this.canvasStore.elements.value]
              this._syncPending = false
            }, 0) // 0ms，下一个事件循环立即执行
          }
        }
      } else if (!storeElement) {
        console.warn(`⚠️ [CanvasEngine] updateElementPosition - 在 canvasStore 中未找到元素`, {
          tool: toolName,
          elementId,
          storeElementsCount: this.canvasStore?.elements?.value?.length ?? 0
        })
      } else if (!this.canvasStore || !this.canvasStore.elements) {
        console.warn(`⚠️ [CanvasEngine] updateElementPosition - canvasStore 或 elements 不存在`)
      }
      
      // 更新连接到该元素的所有连接线
      this.updateConnectionLinesForElement(elementId)
      
      // 实时更新缩略图
      this.thumbnailManager.markForUpdate(element.layer)
      
      // 重新渲染
      this.render()
      return true
    }
    return false
  }

  /**
   * 更新元素文本
   */
  updateElementText(elementId: string, newText: string): void {
    const element = this.elements.find(el => el.id === elementId)
    if (element && element.type === 'text' && element.data) {
      element.data.text = newText
      element.updatedAt = Date.now()
      this.render()
    }
  }

  /**
   * 获取元素
   */
  getElement(elementId: string): CanvasElement | undefined {
    return this.elements.find(el => el.id === elementId)
  }

  /**
   * 获取所有元素
   */
  getElements(): CanvasElement[] {
    return [...this.elements]
  }

  /**
   * 清空所有元素
   */
  clearElements(): void {
    this.elements = []
    this.render()
  }

  /**
   * 获取视口管理器
   */
  getViewportManager(): ViewportManager {
    return this.viewportManager
  }

  /**
   * 获取渲染器
   */
  getRenderer(): Renderer {
    return this.renderer
  }

  /**
   * 获取事件管理器
   */
  getEventManager(): EventManager {
    return this.eventManager
  }

  /**
   * 获取工具管理器
   */
  getToolManager(): ToolManager {
    return this.toolManager
  }

  /**
   * 设置当前工具
   */
  setCurrentTool(toolType: ToolType): void {
    this.toolManager.setCurrentTool(toolType)
    const currentTool = this.toolManager.getCurrentTool()

    if (currentTool) {
      currentTool.setCanvasEngine(this)
    }
  }

  /**
   * 获取当前工具
   */
  getCurrentTool(): ToolType {
    return this.toolManager.getCurrentToolType()
  }

  /**
   * 更新当前样式
   */
  updateCurrentStyle(styleUpdates: Partial<any>): void {
    
    // 更新样式管理器的当前样式
    this.styleManager.updateCurrentStyle(styleUpdates)
    
    // 通知所有工具样式已更新
    this.toolManager.updateCurrentStyle(styleUpdates)
    
    // 记录样式更新历史操作
    if (this.selectedElementIds.length > 0) {
      const oldStyles: any[] = []
      const newStyles: any[] = []
      
      this.selectedElementIds.forEach(elementId => {
        const element = this.getElement(elementId)
        if (element) {
          oldStyles.push({ 
            style: { ...element.style },
            data: element.data ? { ...element.data } : undefined
          })
          
          // 更新样式
          element.style = { ...element.style, ...styleUpdates }
          
          // 如果styleUpdates包含data字段，更新元素数据
          if (styleUpdates.data) {
            element.data = { ...element.data, ...styleUpdates.data }
          }
          
          newStyles.push({ 
            style: { ...element.style },
            data: element.data ? { ...element.data } : undefined
          })
        }
      })
      
      // 记录批量样式更新操作
      const command = OperationFactory.updateMultipleStyles(this.selectedElementIds, oldStyles, newStyles)
      this.canvasStore.historyManager.recordCommand(command, `更新${this.selectedElementIds.length}个元素样式`)
    }
    
    // 重新渲染画布（强制渲染，即使在编辑模式下）
    this.render()
  }

  /**
   * 设置绘制状态变化回调
   */
  setOnDrawingStateChange(callback: (isDrawing: boolean) => void): void {
    this.onDrawingStateChange = callback
  }

  /**
   * 设置元素创建回调
   */
  setOnElementCreated(callback: (element: CanvasElement) => void): void {
    this.onElementCreated = callback
  }

  /**
   * 设置元素添加回调
   */
  setOnElementsAdded(callback: (elements: CanvasElement[]) => void): void {
    this.onElementsAdded = callback
  }

  /**
   * 设置样式刷重置回调
   */
  setOnStyleBrushReset(callback: () => void): void {
    this.onStyleBrushReset = callback
  }

  /**
   * 设置浮动工具栏回调
   */
  setOnFloatingToolbarCallbacks(
    onHideFloatingToolbar?: () => void,
    onShowFloatingToolbar?: (element: CanvasElement) => void
  ): void {
    this.onHideFloatingToolbar = onHideFloatingToolbar
    this.onShowFloatingToolbar = onShowFloatingToolbar
  }

  /**
   * 设置选择变化回调
   */
  setOnSelectionChange(callback: (elements: CanvasElement[]) => void): void {
    this.onSelectionChange = callback
  }

  /**
   * 设置浮动工具栏可见性变化回调
   */
  setOnFloatingToolbarVisibilityChange(callback: (visible: boolean) => void): void {
    this.onFloatingToolbarVisibilityChange = callback
  }

  /**
   * 设置图层变化回调
   */
  setOnLayersChange(callback: (layers: any[]) => void): void {
    this.onLayersChange = callback
  }

  /**
   * 设置形状文字编辑状态变化回调
   */
  setOnShapeTextEditStateChange(callback: (isEditing: boolean, element?: CanvasElement) => void): void {
    this.onShapeTextEditStateChange = callback
  }

  /**
   * 设置当前图层变化回调
   */
  setOnCurrentLayerChange(callback: (layerId: string | null) => void): void {
    this.onCurrentLayerChange = callback
  }

  // ==================== 图层管理方法 ====================

  /**
   * 获取图层管理器
   */
  getLayerManager(): LayerManager {
    return this.layerManager
  }

  /**
   * 同步图层状态到LayerManager
   */
  private syncLayersToLayerManager(layers: any[]): void {
    // 获取当前LayerManager中的所有图层
    const currentLayers = this.layerManager.getAllLayers()
    const currentLayerMap = new Map(currentLayers.map(layer => [layer.id, layer]))
    
    // 遍历要同步的图层
    for (const layer of layers) {
      const currentLayer = currentLayerMap.get(layer.id)
      
      if (currentLayer) {
        
        // 图层存在，更新属性
        if (currentLayer.visible !== layer.visible) {
          this.layerManager.toggleLayerVisibility(layer.id)
        }
        
        if (currentLayer.locked !== layer.locked) {
          this.layerManager.toggleLayerLock(layer.id)
        }
        
        if (currentLayer.name !== layer.name) {
          this.layerManager.renameLayer(layer.id, layer.name)
        }
        
        if (currentLayer.order !== layer.order) {
          this.layerManager.moveLayerToPosition(layer.id, layer.order, layer.parentId)
        }
        
        if (currentLayer.color !== layer.color) {
          this.layerManager.setLayerColor(layer.id, layer.color)
        }
      } else {
        // 图层不存在，创建新图层
        this.layerManager.createLayer(layer.name, layer.parentId)
      }
    }
    
    // 删除多余的图层
    const syncLayerIds = new Set(layers.map(layer => layer.id))
    for (const currentLayer of currentLayers) {
      if (!syncLayerIds.has(currentLayer.id)) {
        this.layerManager.deleteLayer(currentLayer.id)
      }
    }
  }

  /**
   * 创建新图层
   */
  createLayer(name?: string, parentId?: string): string {
    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    const layerId = this.layerManager.createLayer(name, parentId)
    const layer = this.layerManager.getLayer(layerId)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    if (layer) {
      const command = OperationFactory.createLayer(layerId, layer, beforeState, afterState)
      this.canvasStore.historyManager.recordCommand(command, `创建图层: ${layer.name}`)
    }
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    return layerId
  }

  /**
   * 创建分组图层
   */
  createGroup(name?: string, parentId?: string): string {
    const groupId = this.layerManager.createGroup(name, parentId)
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    return groupId
  }

  /**
   * 删除图层
   */
  deleteLayer(layerId: string): void {
    const layer = this.layerManager.getLayer(layerId)
    const elementsInLayer = this.elements.filter(el => el.layer === layerId)
    
    // 记录到历史
    if (layer) {
      const command = OperationFactory.deleteLayer(layerId, layer, elementsInLayer)
      this.canvasStore.historyManager.recordCommand(command, `删除图层: ${layer.name}`)
    }
    
    this.layerManager.deleteLayer(layerId)
    
    // 删除图层中的元素
    this.elements = this.elements.filter(el => el.layer !== layerId)
    
    // 更新缩略图 - 删除图层后需要更新所有图层的缩略图
    this.thumbnailManager.markMultipleForUpdate(this.layerManager.getAllLayers().map(l => l.id))
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    // 重新渲染
    this.render()
  }

  /**
   * 重命名图层
   */
  renameLayer(layerId: string, newName: string): void {
    const layer = this.layerManager.getLayer(layerId)
    const oldName = layer?.name || ''
    
    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    this.layerManager.renameLayer(layerId, newName)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    if (layer) {
      const command = OperationFactory.renameLayer(layerId, oldName, newName, beforeState, afterState)
      this.canvasStore.historyManager.recordCommand(command, `重命名图层: ${oldName} → ${newName}`)
    }
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
  }

  /**
   * 开始重命名图层（记录原始名称）
   */
  startRenameLayer(layerId: string, originalName: string): void {
    // 这里可以记录重命名开始的状态，但不记录到历史
    // 真正的历史记录在 finishRenameLayer 中进行
  }

  /**
   * 完成重命名图层（记录历史）
   */
  finishRenameLayer(layerId: string, newName: string): void {
    const layer = this.layerManager.getLayer(layerId)
    const oldName = layer?.name || ''
    
    if (oldName === newName) {
      return
    }
    
    // 记录操作前状态 - 手动构建正确的操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: this.layerManager.getAllLayers().map(l => ({
        ...l,
        name: l.id === layerId ? oldName : l.name  // 确保当前图层记录的是操作前的名称
      })),
      selectedElementIds: [...this.selectedElementIds]
    }
    
    
    this.layerManager.renameLayer(layerId, newName)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    
    // 记录到历史
    if (layer) {
      const command = OperationFactory.renameLayer(layerId, oldName, newName, beforeState, afterState)
      this.canvasStore.historyManager.recordCommand(command, `重命名图层: ${oldName} → ${newName}`)
    }
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
  }

  /**
   * 取消重命名图层（恢复到原始名称）
   */
  cancelRenameLayer(layerId: string): void {
    // 取消重命名时不需要记录历史，因为名称没有改变
    // 这里可以添加其他取消重命名的逻辑
  }

  /**
   * 设置图层颜色
   */
  setLayerColor(layerId: string, color: string): void {
    const layer = this.layerManager.getLayer(layerId)
    const oldColor = layer?.color || '#3b82f6'
    
    if (oldColor === color) {
      return
    }
    
    // 记录操作前状态 - 手动构建正确的操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: this.layerManager.getAllLayers().map(l => ({
        ...l,
        color: l.id === layerId ? oldColor : l.color  // 确保当前图层记录的是操作前的颜色
      })),
      selectedElementIds: [...this.selectedElementIds]
    }
    
    this.layerManager.setLayerColor(layerId, color)
    
    // 标记图层有自定义颜色
    this.layerManager.setLayerHasCustomColor(layerId, true)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    if (layer) {
      const command = OperationFactory.setLayerColor(layerId, oldColor, color, beforeState, afterState)
      this.canvasStore.historyManager.recordCommand(command, `设置图层颜色: ${oldColor} → ${color}`)
    }
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    
    // 重新渲染画布以显示新的图层背景颜色
    this.render()
  }

  /**
   * 切换图层可见性
   */
  toggleLayerVisibility(layerId: string): void {
    const layer = this.layerManager.getLayer(layerId)
    if (!layer) return
    
    // 记录操作前状态 - 手动构建正确的操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: this.layerManager.getAllLayers().map(l => ({
        ...l,
        visible: l.id === layerId ? layer.visible : l.visible  // 确保当前图层记录的是操作前的状态
      })),
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 先检查当前选中的元素是否属于这个图层
    const selectedElements = this.elements.filter(el => 
      this.selectedElementIds.includes(el.id) && el.layer === layerId
    )
    
    // 切换图层可见性
    this.layerManager.toggleLayerVisibility(layerId)
    
    // 获取切换后的图层状态
    const updatedLayer = this.layerManager.getLayer(layerId)
    
    // 如果隐藏图层，检查是否有该图层的元素正在显示浮动工具栏
    if (!updatedLayer?.visible && selectedElements.length > 0) {
      // 隐藏浮动工具栏
      if (this.onHideFloatingToolbar) {
        this.onHideFloatingToolbar()
      }
      // 清除选中状态
      this.clearSelection()
    }
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    const command = OperationFactory.toggleLayerVisibility(layerId, layer.visible, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `${layer.visible ? '隐藏' : '显示'}图层: ${layer.name}`)
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    // 重新渲染
    this.render()
  }

  /**
   * 切换图层锁定状态
   */
  toggleLayerLock(layerId: string): void {
    this.layerManager.toggleLayerLock(layerId)
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
  }

  /**
   * 设置图层透明度
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    this.layerManager.setLayerOpacity(layerId, opacity)
  }

  /**
   * 复制元素
   */
  private duplicateElement(element: CanvasElement, newLayerId: string): CanvasElement {
    const duplicatedElement: CanvasElement = {
      ...element,
      id: this.generateId(),
      layer: newLayerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { ...element.position },
      size: { ...element.size },
      style: { ...element.style },
      data: element.data ? JSON.parse(JSON.stringify(element.data)) : undefined
    }


    return duplicatedElement
  }

  /**
   * 复制图层
   */
  duplicateLayer(layerId: string): void {
    const sourceLayer = this.layerManager.getLayer(layerId)
    if (!sourceLayer) {
      return
    }

    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }

    // 复制图层
    const duplicatedLayerId = this.layerManager.duplicateLayer(layerId)
    const duplicatedLayer = this.layerManager.getLayer(duplicatedLayerId)
    
    if (!duplicatedLayer) {
      return
    }

    // 复制图层中的元素
    const layerElements = this.elements.filter(el => el.layer === layerId)

    const duplicatedElements: CanvasElement[] = []

    layerElements.forEach(element => {
      const duplicatedElement = this.duplicateElement(element, duplicatedLayerId)
      duplicatedElements.push(duplicatedElement)
      this.elements.push(duplicatedElement)
    })

    // 更新图层的元素列表
    const duplicatedElementIds = duplicatedElements.map(el => el.id)
    this.layerManager.updateLayerElements(duplicatedLayerId, duplicatedElementIds)

    // 验证图层元素列表是否正确更新
    const updatedLayer = this.layerManager.getLayer(duplicatedLayerId)


    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }

    // 记录到历史
    const command = OperationFactory.duplicateLayer(layerId, duplicatedLayerId, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `复制图层: ${sourceLayer.name} → ${duplicatedLayer.name}`)

    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }

    // 清除缩略图缓存，强制重新生成
    this.thumbnailManager.clearLayerCache(duplicatedLayerId)
    this.thumbnailManager.markForUpdate(duplicatedLayerId)

    // 立即生成新图层的缩略图
    this.forceGenerateThumbnail(duplicatedLayerId)

    // 重新渲染
    this.render()

  }


  /**
   * 移动图层到指定位置
   */
  moveLayerToPosition(layerId: string, newOrder: number, parentId?: string): void {
    // 获取操作前的图层信息
    const layer = this.layerManager.getLayer(layerId)
    const oldOrder = layer?.order || 0
    const oldParentId = layer?.parentId
    
    // 记录操作前状态 - 手动构建正确的操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: this.layerManager.getAllLayers().map(l => ({
        ...l,
        order: l.id === layerId ? oldOrder : l.order  // 确保当前图层记录的是操作前的顺序
      })),
      selectedElementIds: [...this.selectedElementIds]
    }
    
    
    this.layerManager.moveLayerToPosition(layerId, newOrder, parentId)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    
    // 记录到历史
    const command = OperationFactory.moveLayer(layerId, oldOrder, newOrder, oldParentId, parentId, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `移动图层到位置: ${newOrder}`)
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    // 重新渲染
    this.render()
  }

  /**
   * 将图层移到最顶层
   */
  moveLayerToTop(layerId: string): void {
    
    // 获取操作前的图层信息
    const layer = this.layerManager.getLayer(layerId)
    const oldOrder = layer?.order || 0
    const oldParentId = layer?.parentId
    
    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    this.layerManager.moveLayerToTop(layerId)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    const command = OperationFactory.moveLayer(layerId, oldOrder, 0, oldParentId, oldParentId, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `移动图层到顶层`)
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    // 重新渲染
    this.render()
  }

  /**
   * 将图层移到最底层
   */
  moveLayerToBottom(layerId: string): void {
    
    // 获取操作前的图层信息
    const layer = this.layerManager.getLayer(layerId)
    const oldOrder = layer?.order || 0
    const oldParentId = layer?.parentId
    
    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    this.layerManager.moveLayerToBottom(layerId)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    const command = OperationFactory.moveLayer(layerId, oldOrder, 999, oldParentId, oldParentId, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `移动图层到底层`)
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    // 重新渲染
    this.render()
  }

  /**
   * 将图层上移一层
   */
  moveLayerUp(layerId: string): void {
    
    // 获取操作前的图层信息
    const layer = this.layerManager.getLayer(layerId)
    const oldOrder = layer?.order || 0
    const oldParentId = layer?.parentId
    
    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    this.layerManager.moveLayerUp(layerId)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    const command = OperationFactory.moveLayer(layerId, oldOrder, oldOrder - 1, oldParentId, oldParentId, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `图层上移一层`)
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    // 重新渲染
    this.render()
  }

  /**
   * 将图层下移一层
   */
  moveLayerDown(layerId: string): void {
    
    // 获取操作前的图层信息
    const layer = this.layerManager.getLayer(layerId)
    const oldOrder = layer?.order || 0
    const oldParentId = layer?.parentId
    
    // 记录操作前状态
    const beforeState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    this.layerManager.moveLayerDown(layerId)
    
    // 记录操作后状态
    const afterState = {
      elements: [...this.elements],
      layers: [...this.layerManager.getAllLayers()],
      selectedElementIds: [...this.selectedElementIds]
    }
    
    // 记录到历史
    const command = OperationFactory.moveLayer(layerId, oldOrder, oldOrder + 1, oldParentId, oldParentId, beforeState, afterState)
    this.canvasStore.historyManager.recordCommand(command, `图层下移一层`)
    
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
    // 重新渲染
    this.render()
  }

  /**
   * 将元素移动到指定图层
   */
  moveElementToLayer(elementId: string, targetLayerId: string): void {
    this.layerManager.moveElementToLayer(elementId, targetLayerId)
  }

  /**
   * 批量移动元素到指定图层
   */
  moveMultipleElementsToLayer(elementIds: string[], targetLayerId: string): void {
    elementIds.forEach(elementId => {
      this.layerManager.moveElementToLayer(elementId, targetLayerId)
    })
  }

  /**
   * 获取所有图层
   */
  getAllLayers(): any[] {
    return this.layerManager.getAllLayers()
  }

  /**
   * 获取当前图层ID
   */
  getCurrentLayerId(): string | null {
    return this.layerManager.getCurrentLayer()?.id || null
  }

  /**
   * 获取当前图层
   */
  getCurrentLayer(): any {
    return this.layerManager.getCurrentLayer()
  }

  /**
   * 设置当前图层
   */
  setCurrentLayer(layerId: string | null): void {
    this.layerManager.setCurrentLayer(layerId)
    // 通知当前图层变化
    if (this.onCurrentLayerChange) {
      this.onCurrentLayerChange(layerId)
    }
    // 通知图层变化
    if (this.onLayersChange) {
      this.onLayersChange(this.layerManager.getAllLayers())
    }
  }

  /**
   * 获取图层
   */
  getLayer(layerId: string): any {
    return this.layerManager.getLayer(layerId)
  }

  /**
   * 检查元素是否可操作
   */
  isElementOperable(element: CanvasElement): boolean {
    return this.layerManager.isElementOperable(element)
  }

  /**
   * 按图层顺序渲染元素
   */
  private renderElementsByLayer(): void {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    // 获取所有图层，按顺序排列
    const layers = this.layerManager.getAllLayers()
    
    layers.forEach(layer => {
      // 如果图层不可见，跳过
      if (!layer.visible) {
        return
      }

      // 设置图层透明度
      ctx.save()
      ctx.globalAlpha = layer.opacity

      // 渲染图层背景颜色（只有当图层有明确设置的颜色时才渲染背景）
      // 默认情况下图层背景是透明的，只有用户主动选择颜色后才显示背景
      if (this.shouldRenderLayerBackground(layer)) {
        this.renderLayerBackground(layer, ctx)
      }

      // 渲染该图层下的所有元素
      layer.elements.forEach(elementId => {
        const element = this.elements.find(el => el.id === elementId)
        if (element) {
          this.renderer.renderElement(element)
        }
      })

      ctx.restore()
    })
  }

  /**
   * 判断是否应该渲染图层背景
   * 默认情况下图层背景是透明的，只有用户主动选择颜色后才显示背景
   */
  private shouldRenderLayerBackground(layer: Layer): boolean {
    // 如果图层没有自定义颜色标记，说明是默认状态，不渲染背景
    if (!layer.hasCustomColor) {
      return false
    }

    // 如果图层有自定义颜色标记，但颜色是透明或无效的，也不渲染背景
    if (!layer.color || 
        layer.color === 'transparent' || 
        layer.color === 'rgba(0,0,0,0)' ||
        layer.color === '#00000000' ||
        layer.color === '') {
      return false
    }

    return true
  }

  /**
   * 渲染图层背景颜色
   */
  private renderLayerBackground(layer: Layer, ctx: CanvasRenderingContext2D): void {
    // 计算图层中所有元素的边界框
    const layerElements = this.elements.filter(el => el.layer === layer.id)

    if (layerElements.length === 0) {
      return
    }

    // 计算图层边界框
    const bounds = this.calculateLayerBounds(layerElements)

    if (!bounds) {
      return
    }

    // 添加100px内边距
    const padding = 100
    const paddedBounds = {
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + (padding * 2),
      height: bounds.height + (padding * 2)
    }

    // 设置背景颜色（带透明度0.2）
    
    // 将颜色转换为带透明度的RGBA格式
    const colorWithAlpha = this.addAlphaToColor(layer.color, 0.2)
    ctx.fillStyle = colorWithAlpha
    ctx.fillRect(paddedBounds.x, paddedBounds.y, paddedBounds.width, paddedBounds.height)
  }

  /**
   * 为颜色添加透明度
   */
  private addAlphaToColor(color: string, alpha: number): string {
    // 如果颜色已经是RGBA格式，提取RGB部分
    if (color.startsWith('rgba(')) {
      const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/)
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
    }
    
    // 如果颜色是RGB格式，添加透明度
    if (color.startsWith('rgb(')) {
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
    }
    
    // 如果颜色是HEX格式，转换为RGBA
    if (color.startsWith('#')) {
      const hex = color.replace('#', '')
      let r, g, b
      
      if (hex.length === 3) {
        // 短格式 #RGB
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
      } else if (hex.length === 6) {
        // 长格式 #RRGGBB
        r = parseInt(hex.substring(0, 2), 16)
        g = parseInt(hex.substring(2, 4), 16)
        b = parseInt(hex.substring(4, 6), 16)
      } else {
        // 无效格式，返回原颜色
        return color
      }
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    
    // 如果颜色格式不支持，返回原颜色
    return color
  }

  /**
   * 计算图层边界框
   */
  private calculateLayerBounds(elements: CanvasElement[]): { x: number; y: number; width: number; height: number } | null {
    if (elements.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    elements.forEach(element => {
      const elementBounds = this.calculateElementBounds(element)
      minX = Math.min(minX, elementBounds.x)
      minY = Math.min(minY, elementBounds.y)
      maxX = Math.max(maxX, elementBounds.x + elementBounds.width)
      maxY = Math.max(maxY, elementBounds.y + elementBounds.height)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 计算元素边界框
   */
  private calculateElementBounds(element: CanvasElement): { x: number; y: number; width: number; height: number } {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.x,
      height: element.size.y
    }
  }

  /**
   * 更新元素样式
   */
  updateElementStyle(elementId: string, style: any): void {
    const element = this.getElement(elementId)
    if (element) {
      element.style = { ...element.style, ...style }
      this.render()
    }
  }

  /**
   * 设置选中的元素ID列表
   */
  setSelectedElementIds(elementIds: string[]): void {
    this.selectedElementIds = [...elementIds]
    // 同步到 OperationExecutor
    this.operationExecutor.setSelectedElements(elementIds)
  }

  /**
   * 获取选中的元素ID列表
   */
  getSelectedElementIds(): string[] {
    return [...this.selectedElementIds]
  }

  /**
   * 激活样式刷
   */
  activateStyleBrush(sourceElementId: string): void {
    const sourceElement = this.getElement(sourceElementId)
    if (sourceElement) {
      if (this.toolManager.getCurrentToolType() !== ToolType.STYLE_BRUSH) {
        this.toolManager.setTool(ToolType.STYLE_BRUSH)
      }
      this.styleBrushTool.setSourceElement(sourceElement)
    }
  }

  /**
   * 停用样式刷
   */
  deactivateStyleBrush(): void {
    this.styleBrushTool.resetState()
  }

  /**
   * 切换样式刷
   */
  toggleStyleBrush(): void {
    if (this.toolManager.getCurrentToolType() === ToolType.STYLE_BRUSH) {
      this.toolManager.setTool(ToolType.SELECT)
      this.styleBrushTool.resetState()
    } else {
      // 激活格式刷时，如果有选中的元素，设置为源元素
      if (this.selectedElementIds && this.selectedElementIds.length > 0) {
        const sourceElement = this.elements.find(el => el.id === this.selectedElementIds[0])
        if (sourceElement) {
          this.styleBrushTool.setSourceElement(sourceElement)
        }
      }
      
      // 不清除选中状态，保持浮动工具栏显示
      // this.clearSelection()
      
      this.toolManager.setTool(ToolType.STYLE_BRUSH)
    }
  }

  /**
   * 清除选中状态
   */
  clearSelection(): void {
    // 清空选中元素ID列表
    this.selectedElementIds = []
    
    // 同步到Renderer
    this.renderer.setSelectedElements([])
    
    // 同步到选择工具
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool) {
      selectTool.clearSelection()
    }
    
    // 通知外部选择变化
    if (this.onSelectionChange) {
      this.onSelectionChange([])
    }
    
    // 重新渲染
    this.render()
  }

  /**
   * 删除选中的元素
   */
  deleteSelectedElements(): void {
    if (this.selectedElementIds.length === 0) return

    // 记录删除的元素，用于历史记录
    const elementsToDelete = this.elements.filter(el => this.selectedElementIds.includes(el.id))
    
    // 从元素列表中删除
    this.selectedElementIds.forEach(elementId => {
      const index = this.elements.findIndex(el => el.id === elementId)
      if (index !== -1) {
        this.elements.splice(index, 1)
      }
    })
    
    // 记录历史操作
    elementsToDelete.forEach(element => {
      const command = OperationFactory.deleteElement(element)
      this.canvasStore.historyManager.recordCommand(command, `删除${element.type}元素`)
    })
    
    // 更新选择工具的元素列表
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool) {
      selectTool.setAllElements(this.elements)
      // 清除选择工具的内部选中状态
      selectTool.clearSelection()
    }
    
    // 更新操作执行器的状态
    this.operationExecutor.setElements(this.elements)
    
    // 设置内部更新标志，避免循环同步
    this.isInternalUpdate = true
    
    // 同步到 canvasStore
    this.canvasStore.elements.value = [...this.elements]
    this.canvasStore.selectedElementIds = []
    
    // 重置内部更新标志
    this.isInternalUpdate = false
    
    // 更新缩略图 - 获取所有受影响的图层
    const affectedLayers = new Set(elementsToDelete.map(el => el.layer))
    affectedLayers.forEach(layerId => {
      this.thumbnailManager.markForUpdate(layerId)
    })
    
    // 清空选中状态
    this.selectedElementIds = []
    this.operationExecutor.setSelectedElements([])
    
    // 通知选择变化（这会导致浮动工具栏消失）
    if (this.onSelectionChange) {
      this.onSelectionChange([])
    }
    
    this.render()
  }

  /**
   * 将元素置于顶层
   */
  bringElementToFront(elementId: string): void {
    const element = this.getElement(elementId)
    if (element) {
      const index = this.elements.indexOf(element)
      if (index !== -1) {
        this.elements.splice(index, 1)
    this.elements.push(element)
        this.render()
      }
    }
  }

  /**
   * 将元素置于底层
   */
  sendElementToBack(elementId: string): void {
    const element = this.getElement(elementId)
    if (element) {
      const index = this.elements.indexOf(element)
      if (index !== -1) {
        this.elements.splice(index, 1)
        this.elements.unshift(element)
        this.render()
      }
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 撤销操作
   */
  undo(): boolean {
    // 同步图层数据到操作执行器
    const allLayers = this.layerManager.getAllLayers()
    this.operationExecutor.setLayers(allLayers)
    this.operationExecutor.setCurrentLayerId(this.layerManager.getCurrentLayer()?.id || null)
    return this.canvasStore.historyManager.undo()
  }

  /**
   * 重做操作
   */
  redo(): boolean {
    // 同步图层数据到操作执行器
    this.operationExecutor.setLayers(this.layerManager.getAllLayers())
    this.operationExecutor.setCurrentLayerId(this.layerManager.getCurrentLayer()?.id || null)
    return this.canvasStore.historyManager.redo()
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.canvasStore.historyManager.canUndo()
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.canvasStore.historyManager.canRedo()
  }

  /**
   * 获取历史统计信息
   */
  getHistoryStats() {
    return this.canvasStore.historyManager.getHistoryStats()
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.canvasStore.historyManager.clear()
  }

  /**
   * 同步视口状态
   */
  syncViewport(viewport: Viewport): void {
    
    // 更新视口尺寸
    this.viewportManager.updateViewportSize(viewport.width, viewport.height)
    
    // 安全地设置偏移量
    if (viewport.offset && typeof viewport.offset.x === 'number' && typeof viewport.offset.y === 'number') {
      this.viewportManager.setOffset(viewport.offset)
    } else {
      this.viewportManager.setOffset({ x: 0, y: 0 })
    }
    
    // 安全地设置缩放
    if (typeof viewport.scale === 'number' && viewport.scale > 0) {
      this.viewportManager.zoomTo(viewport.scale)
    } else {
      this.viewportManager.zoomTo(1)
    }
    
    // 更新输入框位置（如果正在编辑形状文字）
    this.updateShapeTextInputPosition()
  }

  /**
   * 同步外部状态到CanvasEngine
   */
  syncState(elements: CanvasElement[], selectedElementIds: string[]): void {
    // 如果元素数量和选中数量都没有变化，跳过同步
    if (elements.length === this.elements.length && 
        selectedElementIds.length === this.selectedElementIds.length &&
        this.elements.length > 0) {
      return
    }
    
    
    // 设置内部更新标志，避免循环同步
    this.isInternalUpdate = true
    
    // 更新内部状态
    this.elements = elements
    this.selectedElementIds = selectedElementIds
    
    // 同步到 canvasStore
    this.canvasStore.elements.value = [...this.elements]
    this.canvasStore.selectedElementIds = [...selectedElementIds]
    
    // 更新选择工具的元素列表
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool) {
      selectTool.setAllElements(this.elements)
      selectTool.setSelectedElements(this.elements.filter(el => selectedElementIds.includes(el.id)))
    }
    
    // 更新操作执行器的状态
    this.operationExecutor.setElements(this.elements)
    this.operationExecutor.setSelectedElements(selectedElementIds)
    
    // 更新其他工具的元素列表
    const arrowTool = this.toolManager.getTool(ToolType.ARROW) as any
    if (arrowTool && 'updateElements' in arrowTool) {
      (arrowTool as any).updateElements(this.elements)
    }
    
    const styleBrushTool = this.toolManager.getTool(ToolType.STYLE_BRUSH) as any
    if (styleBrushTool && 'updateElements' in styleBrushTool) {
      (styleBrushTool as any).updateElements(this.elements)
    }
    
    // 重置内部更新标志
    this.isInternalUpdate = false
    
    // 重新渲染
    this.render()
    
    // 通知外部选择变化
    if (this.onSelectionChange) {
      this.onSelectionChange(this.elements.filter(el => selectedElementIds.includes(el.id)))
    }
  }

  /**
   * 复制选中的元素
   */
  copySelectedElements(): void {
    let elementsToCopy: CanvasElement[] = []

    if (this.copyMode === 'click' && this.lastSelectedElements.length > 0) {
      // 点击复制模式：使用最后选中的元素
      elementsToCopy = this.lastSelectedElements
    } else if (this.selectedElementIds.length > 0) {
      // 连续复制模式：使用当前选中的元素
      elementsToCopy = this.elements.filter(el => this.selectedElementIds.includes(el.id))
    }


    if (elementsToCopy.length === 0) return

    // 复制到剪贴板
    this.clipboardManager.copy(elementsToCopy)

    // 记录复制操作到历史
    const command = OperationFactory.copyElements(elementsToCopy)
    this.canvasStore.historyManager.recordCommand(command, `复制 ${elementsToCopy.length} 个元素`)
    
    // 复制后清除所有选择状态
    this.selectedElementIds = []
    this.canvasStore.selectedElementIds = []
    
    // 清除SelectTool内部选择状态
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool && 'setSelectedElements' in selectTool) {
      selectTool.setSelectedElements([])
    }
    
    // 重置Ctrl键状态
    if (selectTool && 'resetCtrlState' in selectTool) {
      selectTool.resetCtrlState()
    }
    
    // 禁用选择功能
    if (selectTool && 'disableSelection' in selectTool) {
      selectTool.disableSelection()
    }
  }

  /**
   * 粘贴元素
   */
  pasteElements(): void {
    if (!this.clipboardManager.hasData()) return

    // 从剪贴板获取元素
    let pastedElements = this.clipboardManager.paste()
    
    if (pastedElements.length === 0) return

    // 如果是点击复制模式，调整元素位置
    if (this.copyMode === 'click' && this.lastClickPosition && this.lastSelectedElements.length > 0) {
      pastedElements = this.adjustElementsPosition(pastedElements, this.lastClickPosition)
    }

    // 添加元素到画布（使用addElement方法确保正确添加到图层）
    pastedElements.forEach(element => {
      this.addElement(element)
    })

    // 同步到 canvasStore
    this.canvasStore.elements.value = [...this.elements]

    // 粘贴后清除所有选择
    this.selectedElementIds = []
    this.canvasStore.selectedElementIds = []

    // 更新选择工具的元素列表
    const selectTool = this.toolManager.getTool(ToolType.SELECT) as any
    if (selectTool && 'updateElements' in selectTool) {
      selectTool.updateElements(this.elements)
    }
    
    // 清除SelectTool内部的选择状态
    if (selectTool && 'setSelectedElements' in selectTool) {
      selectTool.setSelectedElements([])
    }
    
    // 禁用选择功能
    if (selectTool && 'disableSelection' in selectTool) {
      selectTool.disableSelection()
    }

    // 记录粘贴操作到历史
    const command = OperationFactory.pasteElements(pastedElements)
    this.canvasStore.historyManager.recordCommand(command, `粘贴 ${pastedElements.length} 个元素`)

    // 更新缩略图 - 获取所有受影响的图层
    const affectedLayers = new Set(pastedElements.map(el => el.layer))
    affectedLayers.forEach(layerId => {
      this.thumbnailManager.markForUpdate(layerId)
    })

    // 重新渲染
    this.render()

    // 不通知外部选择变化，因为粘贴的元素没有被选中

    // 通知元素创建
    pastedElements.forEach(element => {
      if (this.onElementCreated) {
        this.onElementCreated(element)
      }
    })
  }

  /**
   * 检查剪贴板是否有数据
   */
  canPaste(): boolean {
    return this.clipboardManager.hasData()
  }

  /**
   * 清空剪贴板
   */
  clearClipboard(): void {
    this.clipboardManager.clear()
  }

  /**
   * 检测复制模式
   */
  private detectCopyMode(position: Vector2): void {
    // 转换屏幕坐标到虚拟坐标
    const virtualPos = this.viewportManager.getCoordinateTransformer().screenToVirtual(position)
    
    // 检查是否点击在元素上
    const clickedElement = this.getElementAtPosition(virtualPos)
    
    if (clickedElement) {
      // 点击在元素上，切换到连续复制模式
      this.copyMode = 'continuous'
      this.lastSelectedElements = [clickedElement]
    } else {
      // 点击在空白区域
      if (this.lastSelectedElements.length > 0) {
        // 之前有选中元素，切换到点击复制模式
        this.copyMode = 'click'
        this.lastClickPosition = virtualPos
      } else {
        // 没有选中元素，重置状态
        this.copyMode = 'continuous'
        this.lastSelectedElements = []
        this.lastClickPosition = null
      }
    }
  }

  /**
   * 选中单个元素
   */
  private selectElement(element: CanvasElement): void {
    
    // 设置选中元素
    this.setSelectedElementIds([element.id])
    
    // 更新渲染器
    this.renderer.setSelectedElements([element])
    
    // 触发选择变化回调
    if (this.onSelectionChange) {
      this.onSelectionChange([element])
    }
    
    // 显示浮动工具栏
    if (this.onShowFloatingToolbar) {
      this.onShowFloatingToolbar(element)
    }
  }

  /**
   * 获取指定位置的元素（公共方法）
   */
  public getElementAtPositionPublic(position: Vector2): CanvasElement | null {
    return this.getElementAtPosition(position)
  }

  /**
   * 对外暴露的元素命中测试
   */
  public isPointInElementPublic(point: Vector2, element: CanvasElement): boolean {
    return this.isPointInElement(point, element)
  }

  /**
   * 获取指定位置的元素
   */
  private getElementAtPosition(position: Vector2): CanvasElement | null {

    
    // 从后往前遍历，优先选择最上层的元素
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i]
      const isInElement = this.isPointInElement(position, element)
      const isOperable = this.isElementOperable(element)
      

      if (isInElement) {
        // 检查元素是否可操作（未被锁定且可见）
        if (isOperable) {
          return element
        } 
      }
    }


    return null
  }

  /**
   * 检查点是否在元素内
   */
  private isPointInElement(point: Vector2, element: CanvasElement): boolean {
    if (!element.visible) {
      return false
    }

    switch (element.type) {
      case ElementType.LINE:
      case ElementType.ARROW:
      case ElementType.PATH:
        return this.isPointNearPath(point, element)
      default:
        return this.isPointInsideBoundingBox(point, element)
    }
  }

  private isPointInsideBoundingBox(point: Vector2, element: CanvasElement): boolean {
    const { position, size } = element
    return (
      point.x >= position.x &&
      point.x <= position.x + size.x &&
      point.y >= position.y &&
      point.y <= position.y + size.y
    )
  }

  private isPointNearPath(point: Vector2, element: CanvasElement): boolean {
    const points = element.data?.points as Vector2[] | undefined
    if (!points || points.length === 0) {
      return false
    }

    const localPoint = {
      x: point.x - element.position.x,
      y: point.y - element.position.y
    }
    const tolerance = this.getPathHitTolerance(element)

    for (let i = 0; i < points.length - 1; i++) {
      if (this.isPointNearSegment(localPoint, points[i], points[i + 1], tolerance)) {
        return true
      }
    }

    // 额外检查终点附近（例如箭头的箭头部分）
    const lastPoint = points[points.length - 1]
    const dx = localPoint.x - lastPoint.x
    const dy = localPoint.y - lastPoint.y
    const distanceToEnd = Math.sqrt(dx * dx + dy * dy)

    return distanceToEnd <= tolerance
  }

  private getPathHitTolerance(element: CanvasElement): number {
    const baseTolerancePx = Math.max(6, (element.style?.strokeWidth || 2) + 4)
    const transformer = this.viewportManager?.getCoordinateTransformer()
    return transformer
      ? transformer.screenDistanceToVirtual(baseTolerancePx)
      : baseTolerancePx
  }

  private isPointNearSegment(point: Vector2, start: Vector2, end: Vector2, tolerance: number): boolean {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lengthSq = dx * dx + dy * dy

    if (lengthSq === 0) {
      const dist = Math.sqrt(
        Math.pow(point.x - start.x, 2) + Math.pow(point.y - start.y, 2)
      )
      return dist <= tolerance
    }

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq
    t = Math.max(0, Math.min(1, t))

    const closestX = start.x + t * dx
    const closestY = start.y + t * dy
    const distance = Math.sqrt(
      Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
    )

    return distance <= tolerance
  }

  /**
   * 检查连接线拖拽路径是否穿过自身元素
   */
  private doesConnectionPathCrossSourceElement(startPoint: Vector2, endPoint: Vector2, sourceElement: CanvasElement): boolean {
    
    const deltaX = endPoint.x - startPoint.x
    const deltaY = endPoint.y - startPoint.y
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (length === 0) {
      return true
    }
    
    const sampleDistance = Math.min(4, length * 0.5)
    const t = sampleDistance / length
    
    const samplePoint = {
      x: startPoint.x + deltaX * t,
      y: startPoint.y + deltaY * t
    }
    
    return this.isPointInElement(samplePoint, sourceElement)
  }

  /**
   * 调整元素位置，使元素中心出现在指定位置
   */
  private adjustElementsPosition(elements: CanvasElement[], targetPosition: Vector2): CanvasElement[] {
    if (elements.length === 0) return elements

    // 计算原始元素的中心点
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    elements.forEach(element => {
      minX = Math.min(minX, element.position.x)
      minY = Math.min(minY, element.position.y)
      maxX = Math.max(maxX, element.position.x + element.size.x)
      maxY = Math.max(maxY, element.position.y + element.size.y)
    })

    const originalCenterX = (minX + maxX) / 2
    const originalCenterY = (minY + maxY) / 2

    // 计算偏移量
    const offsetX = targetPosition.x - originalCenterX
    const offsetY = targetPosition.y - originalCenterY

    // 调整所有元素的位置
    return elements.map(element => ({
      ...element,
      position: {
        x: element.position.x + offsetX,
        y: element.position.y + offsetY
      }
    }))
  }

  /**
   * 更新图层缩略图
   */
  updateLayerThumbnail(layerId: string): void {
    this.thumbnailManager.markForUpdate(layerId)
  }

  /**
   * 批量更新图层缩略图
   */
  updateAllLayerThumbnails(): void {
    const layerIds = this.layerManager.getAllLayers().map(layer => layer.id)
    this.thumbnailManager.markMultipleForUpdate(layerIds)
  }

  /**
   * 强制生成图层缩略图
   */
  private forceGenerateThumbnail(layerId: string): void {
    const layer = this.layerManager.getLayer(layerId)
    if (!layer) return

    // 直接生成缩略图，不使用缓存
    const thumbnailUrl = this.thumbnailManager.getThumbnail(layer, this.elements)
  }

  /**
   * 获取图层缩略图
   */
  async getLayerThumbnail(layerId: string): Promise<string> {
    const layer = this.layerManager.getLayer(layerId)
    if (!layer) return ''
    
    return await this.thumbnailManager.getThumbnail(layer, this.elements)
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 移除事件监听器
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
    
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    
    window.removeEventListener('resize', this.handleResize.bind(this))

    // 取消动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 开始连接线拖拽
   */
  startConnectionDrag(startPoint: Vector2, element: CanvasElement): void {
    
    this.isDraggingConnection = true
    this.connectionStartPoint = startPoint
    this.connectionStartElement = element
    
    
    // 通知渲染器开始连接线拖拽
    this.renderer.setConnectionDragState(true, startPoint, startPoint)
    this.render()
  }

  /**
   * 更新连接线拖拽
   */
  updateConnectionDrag(mousePosition: Vector2): void {
    
    if (!this.isDraggingConnection || !this.connectionStartPoint) {
      return
    }
    
    // 将屏幕坐标转换为世界坐标
    const worldPosition = this.viewportManager.getCoordinateTransformer().screenToVirtual(mousePosition)
    
    // 更新渲染器的连接线终点
    this.renderer.updateConnectionEndPoint(worldPosition)
    this.render()
  }

  /**
   * 结束连接线拖拽
   */
  endConnectionDrag(): void {
    
    // 获取当前的连接终点
    let endPoint = this.renderer.getConnectionEndPoint()
    
    // 如果鼠标悬浮在某个形状元素的连接点上，则将终点吸附到该连接点
    const hoveredSnapPoint = this.renderer.getHoveredConnectionPoint && this.renderer.getHoveredConnectionPoint()
    if (hoveredSnapPoint) {
      endPoint = hoveredSnapPoint
    }
    
    // 如果有起点和终点，创建连接线元素
    if (this.connectionStartPoint && endPoint && this.connectionStartElement) {
      const crossesSourceElement = this.doesConnectionPathCrossSourceElement(
        this.connectionStartPoint,
        endPoint,
        this.connectionStartElement
      )
      
      if (!crossesSourceElement) {
        // 检测终点位置是否有目标元素
        const targetElement = this.getElementAtPosition(endPoint)
        
        // 创建连接线元素
        const connectionLine = this.createConnectionLineElement(
          this.connectionStartPoint,
          endPoint,
          this.connectionStartElement,
          targetElement || undefined
        )
        
        // 添加到画布
        this.addElement(connectionLine)
      }
    }
    
    // 清除拖拽状态
    this.isDraggingConnection = false
    this.connectionStartPoint = null
    this.connectionStartElement = null
    
    // 通知渲染器结束连接线拖拽
    this.renderer.setConnectionDragState(false)
    this.render()
  }

  /**
   * 检查是否在拖拽连接线
   */
  isConnectionDragging(): boolean {
    return this.isDraggingConnection
  }

  /**
   * 获取当前悬浮的元素
   */
  getHoveredElement(): CanvasElement | null {
    return this.renderer.getHoveredElement()
  }

  /**
   * 开始形状文字编辑
   */
  startShapeTextEdit(shapeElement: CanvasElement, toolEvent: ToolEvent): void {
    
    // 如果已经在编辑其他形状，先结束编辑
    if (this.isEditingShapeText) {
      this.finishShapeTextEdit()
    }

    // 保存编辑前的工具
    this.toolBeforeShapeTextEdit = this.toolManager.getCurrentToolType()

    this.isEditingShapeText = true
    this.editingShapeElement = shapeElement
    this.currentTextStyle = null // 重置样式

    // 通知Vue组件形状文字编辑状态变化
    if (this.onShapeTextEditStateChange) {
      this.onShapeTextEditStateChange(true, shapeElement)
    }

    // 创建输入框
    this.createShapeTextInput(shapeElement, toolEvent.position)
  }

  /**
   * 创建形状文字输入框
   */
  private createShapeTextInput(shapeElement: CanvasElement, _position: Vector2): void {
    
    // 移除现有的输入框（如果存在）
    if (this.shapeTextInput) {
      this.removeShapeTextInput()
    }

    // 创建输入框元素
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = '输入文字...'
    input.style.position = 'absolute'
    input.style.border = '2px solid #1976d2'
    input.style.borderRadius = '4px'
    input.style.padding = '8px'
    input.style.fontSize = '16px'
    input.style.fontFamily = 'Arial, sans-serif'
    input.style.backgroundColor = 'white'
    input.style.outline = 'none'
    input.style.zIndex = '1000'
    input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'

    // 设置输入框位置（在形状中心）
    const shapeCenter = {
      x: shapeElement.position.x + shapeElement.size.x / 2,
      y: shapeElement.position.y + shapeElement.size.y / 2
    }
    
    
    const screenPos = this.viewportManager.getCoordinateTransformer().virtualToScreen(shapeCenter)
    
    
    // 输入框尺寸
    const inputWidth = 200
    const inputHeight = 40
    
    // 获取画布在页面中的位置
    const canvasRect = this.canvas.getBoundingClientRect()
    
    // 计算居中位置（需要加上画布的偏移量）
    const inputLeft = screenPos.x - inputWidth / 2 + canvasRect.left
    const inputTop = screenPos.y - inputHeight / 2 + canvasRect.top
    
    input.style.left = `${inputLeft}px`
    input.style.top = `${inputTop}px`
    input.style.width = `${inputWidth}px`
    input.style.height = `${inputHeight}px`
    

    // 设置初始文字（如果形状已有文字）
    if (shapeElement.data?.text) {
      input.value = shapeElement.data.text
    }

    // 添加到页面
    document.body.appendChild(input)
    this.shapeTextInput = input
    

    // 立即聚焦，确保输入框获得焦点
    setTimeout(() => {
      if (this.shapeTextInput === input && document.body.contains(input)) {
        input.focus()
        input.select()
      }
    }, 10) // 减少延迟时间

    // 绑定事件
    this.bindShapeTextInputEvents(input, shapeElement)
    
  }

  /**
   * 绑定形状文字输入框事件
   */
  private bindShapeTextInputEvents(input: HTMLInputElement, shapeElement: CanvasElement): void {
    
    // 完成编辑的事件
    const finishEdit = () => {
      this.finishShapeTextEdit()
    }

    // 键盘事件
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        finishEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        this.cancelShapeTextEdit()
      }
    })

    // 失去焦点事件
    input.addEventListener('blur', () => {
      
      // 延迟执行，避免点击其他元素时立即结束编辑
      setTimeout(() => {
        
        // 检查是否点击了浮动工具栏
        const activeElement = document.activeElement
        
        // 检查是否有工具栏交互标记
        if (this.toolbarInteractionTimeout) {
          return
        }
        
        const isToolbarInteraction = activeElement && (
          activeElement.closest('.floating-toolbar') ||
          activeElement.closest('.el-button') ||
          activeElement.closest('.el-input') ||
          activeElement.closest('.el-select') ||
          activeElement.closest('.el-color-picker') ||
          activeElement.closest('.el-dropdown') ||
          activeElement.closest('.el-popper') ||
          activeElement.closest('.el-select-dropdown') ||
          activeElement.closest('.el-color-picker__panel') ||
          activeElement.closest('.toolbar-group')
        )
        
        
        // 如果焦点转移到了工具栏，不结束编辑
        if (isToolbarInteraction) {
          return
        }
        
        // 检查是否点击了当前编辑的形状元素
        const lastClickPosition = this.lastClickPosition
        
        if (lastClickPosition && this.editingShapeElement) {
          const virtualPos = this.viewportManager.getCoordinateTransformer().screenToVirtual(lastClickPosition)
          const clickedElement = this.getElementAtPosition(virtualPos)
          
          
          // 如果点击的是当前编辑的形状元素，重新聚焦输入框
          if (clickedElement && clickedElement.id === this.editingShapeElement.id) {
            if (this.shapeTextInput && document.body.contains(this.shapeTextInput)) {
              setTimeout(() => {
                this.shapeTextInput!.focus()
              }, 10)
            }
            return
          }
          
          // 如果点击的是空白区域（没有元素），强制清除工具栏交互标记
          if (!clickedElement) {
            if (this.toolbarInteractionTimeout) {
              clearTimeout(this.toolbarInteractionTimeout)
              this.toolbarInteractionTimeout = null
            }
          }
        }
        
        // 检查编辑状态
        
        // 如果到达这里，说明点击了空白区域或其他元素，应该结束编辑
        if (this.isEditingShapeText && 
            this.editingShapeElement === shapeElement && 
            this.shapeTextInput === input &&
            document.body.contains(input)) {
          finishEdit()
        }
      }, 300) // 增加延迟时间到300ms
    })

    // 点击事件（阻止事件冒泡）
    input.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    // 移除全局点击事件监听器，只使用blur事件和键盘事件处理退出

    // 鼠标按下事件（阻止事件冒泡）
    input.addEventListener('mousedown', (e) => {
      e.stopPropagation()
    })

    // 鼠标抬起事件（阻止事件冒泡）
    input.addEventListener('mouseup', (e) => {
      e.stopPropagation()
    })
  }

  /**
   * 完成形状文字编辑
   */
  finishShapeTextEdit(): void {
    
    if (!this.isEditingShapeText || !this.editingShapeElement || !this.shapeTextInput) {
      return
    }

    const text = this.shapeTextInput.value.trim()
    
    // 更新形状元素数据
    if (text) {
      // 使用当前的样式设置，如果没有则使用默认值
      const finalTextStyle = this.currentTextStyle || {
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        color: '#000000',
        textDecoration: 'none'
      }
      
      
      this.editingShapeElement.data = {
        ...this.editingShapeElement.data,
        text: text,
        textStyle: finalTextStyle
      }
      this.editingShapeElement.updatedAt = Date.now()
    }

    // 清理状态
    this.removeShapeTextInput()
    this.isEditingShapeText = false
    this.editingShapeElement = null

    // 恢复编辑前的工具，而不是切换到选择工具
    if (this.toolBeforeShapeTextEdit !== null) {
      this.toolManager.setTool(this.toolBeforeShapeTextEdit)
      this.toolBeforeShapeTextEdit = null
    }

    // 通知Vue组件形状文字编辑状态变化
    if (this.onShapeTextEditStateChange) {
      this.onShapeTextEditStateChange(false)
    }

    // 重新渲染
    this.render()
    
  }

  /**
   * 检查当前工具是否有元素正在被拖拽，如果有则处理智能参考线
   */
  private handleSmartGuidesForCurrentTool(toolEvent: ToolEvent): void {
    const currentTool = this.toolManager.getCurrentTool()
    if (!currentTool) {

      return
    }
    
    const coordinateTransformer = this.viewportManager?.getCoordinateTransformer()
    const pointerVirtualPosition = coordinateTransformer
      ? coordinateTransformer.screenToVirtual(toolEvent.position)
      : toolEvent.position
    
    
    // 检查选择工具
    if (currentTool.getName() === 'select') {
      const selectTool = currentTool as any

      if (selectTool.isCurrentlyDragging && selectTool.isCurrentlyDragging()) {
        const draggedElement = selectTool.draggedElement || selectTool.selectedElements?.[0]
        if (draggedElement) {
          const currentPosition = {
            x: draggedElement.position.x,
            y: draggedElement.position.y
          }

          const snapSettings = this.snapManager.getSettings()
          const maxSnapDistance = snapSettings.snapThreshold ?? 10

          if (this.snapLockActive && this.snapLockPosition) {
            const releaseThreshold = maxSnapDistance * this.snapReleaseMultiplier
            const { maintain, pointerDelta, pointerReference } = this.evaluateSnapLock(pointerVirtualPosition, releaseThreshold)
            
            if (maintain) {
              this.logSnapEvent('snap-lock-maintained', {
                tool: 'select',
                pointerDelta,
                releaseThreshold,
                pointerReference,
                pointerVirtualPosition,
                activeAxes: this.snapLockAxes
              })
              draggedElement.position.x = this.snapLockPosition.x
              draggedElement.position.y = this.snapLockPosition.y
              draggedElement.updatedAt = Date.now()
              return
            }
            
            this.logSnapEvent('snap-lock-release-threshold-exceeded', {
              tool: 'select',
              pointerDelta,
              releaseThreshold,
              pointerReference,
              pointerVirtualPosition,
              activeAxes: this.snapLockAxes
            })
            const releaseAxes = {
              x: this.snapLockAxes.x && !!pointerDelta && pointerDelta.x > releaseThreshold,
              y: this.snapLockAxes.y && !!pointerDelta && pointerDelta.y > releaseThreshold
            }
            this.resetSnapLock('select-distance-threshold', true)
            if (releaseAxes.x || releaseAxes.y) {
              this.activateSnapSuppression(releaseAxes)
            }
          }

          const rawSnapOffset = this.handleSmartGuides(draggedElement, currentPosition)
          const snapOffset = this.applySnapSuppression(rawSnapOffset, 'select')
          
          const pointerDistanceSinceLastSnap = this.calculateAxisAwarePointerDistance(
            pointerVirtualPosition,
            this.lastSnapPointerPosition,
            this.lastSnapAxes
          )
          const reengageThreshold = maxSnapDistance * this.snapReengageMultiplier
          
          // 应用吸附偏移量（添加脱离机制、重吸附距离和冷却时间控制）
          if (!this.snapLockActive && (snapOffset.x !== 0 || snapOffset.y !== 0)) {
            if (pointerDistanceSinceLastSnap !== null && pointerDistanceSinceLastSnap < reengageThreshold) {
              this.logSnapEvent('snap-lock-skip-reengage-distance', {
                tool: 'select',
                pointerDistanceSinceLastSnap,
                reengageThreshold,
                lastSnapPointerPosition: this.lastSnapPointerPosition,
                pointerVirtualPosition
              })
            } else {
              const now = Date.now()
              const timeSinceLastSnap = now - this.lastSnapTime
              
              // 计算拖拽距离，如果距离太远就停止吸附
              const dragDistance = Math.sqrt(snapOffset.x * snapOffset.x + snapOffset.y * snapOffset.y)
              
              // 只有在冷却时间过后且距离合适时才应用吸附
              if (dragDistance <= maxSnapDistance * this.snapCatchMultiplier && timeSinceLastSnap >= this.snapCooldown) {
                draggedElement.position.x += snapOffset.x
                draggedElement.position.y += snapOffset.y
                draggedElement.updatedAt = Date.now()
                this.lastSnapTime = now
                this.snapLockActive = true
                this.snapLockPosition = {
                  x: draggedElement.position.x,
                  y: draggedElement.position.y
                }
                this.snapLockPointerPosition = pointerVirtualPosition
                const snapAxes = {
                  x: snapOffset.x !== 0,
                  y: snapOffset.y !== 0
                }
                this.snapLockAxes = snapAxes
                this.lastSnapAxes = snapAxes
                this.lastSnapPointerPosition = pointerVirtualPosition
                this.logSnapEvent('snap-lock-engaged', {
                  tool: 'select',
                  dragDistance,
                  snapOffset,
                  pointerVirtualPosition,
                  snapLockPosition: this.snapLockPosition,
                  activeAxes: this.snapLockAxes
                })
              } else {
                this.logSnapEvent('snap-lock-skip', {
                  tool: 'select',
                  dragDistance,
                  maxCatchDistance: maxSnapDistance * this.snapCatchMultiplier,
                  timeSinceLastSnap,
                  snapCooldown: this.snapCooldown
                })
              }
            }
          }
        }
      } else {
        this.resetSnapLock('select-tool-not-dragging')
        this.clearSnapSuppression('select-tool-not-dragging')
      }
    }
    
    // 检查形状工具
    if (currentTool.getName() === 'shape') {
      const shapeTool = currentTool as any

      if (shapeTool.isDragging) {
        const draggedElement = shapeTool.draggedElement
		
        if (draggedElement) {
          const currentPosition = {
            x: draggedElement.position.x,
            y: draggedElement.position.y
          }

          const snapSettings = this.snapManager.getSettings()
          const maxSnapDistance = snapSettings.snapThreshold ?? 10

          if (this.snapLockActive && this.snapLockPosition) {
            const releaseThreshold = maxSnapDistance * this.snapReleaseMultiplier
            const { maintain, pointerDelta, pointerReference } = this.evaluateSnapLock(pointerVirtualPosition, releaseThreshold)
            
            if (maintain) {
              this.logSnapEvent('snap-lock-maintained', {
                tool: 'shape',
                pointerDelta,
                releaseThreshold,
                pointerReference,
                pointerVirtualPosition,
                activeAxes: this.snapLockAxes
              })
              draggedElement.position.x = this.snapLockPosition.x
              draggedElement.position.y = this.snapLockPosition.y
              draggedElement.updatedAt = Date.now()
              return
            }
            
            this.logSnapEvent('snap-lock-release-threshold-exceeded', {
              tool: 'shape',
              pointerDelta,
              releaseThreshold,
              pointerReference,
              pointerVirtualPosition,
              activeAxes: this.snapLockAxes
            })
            const releaseAxes = {
              x: this.snapLockAxes.x && !!pointerDelta && pointerDelta.x > releaseThreshold,
              y: this.snapLockAxes.y && !!pointerDelta && pointerDelta.y > releaseThreshold
            }
            this.resetSnapLock('shape-distance-threshold', true)
            if (releaseAxes.x || releaseAxes.y) {
              this.activateSnapSuppression(releaseAxes)
            }
          }

          const rawSnapOffset = this.handleSmartGuides(draggedElement, currentPosition)
          const snapOffset = this.applySnapSuppression(rawSnapOffset, 'shape')
          
          const pointerDistanceSinceLastSnap = this.calculateAxisAwarePointerDistance(
            pointerVirtualPosition,
            this.lastSnapPointerPosition,
            this.lastSnapAxes
          )
          const reengageThreshold = maxSnapDistance * this.snapReengageMultiplier
          
          // 应用吸附偏移量（添加脱离机制、重吸附距离和冷却时间控制）
          if (!this.snapLockActive && (snapOffset.x !== 0 || snapOffset.y !== 0)) {
            if (pointerDistanceSinceLastSnap !== null && pointerDistanceSinceLastSnap < reengageThreshold) {
              this.logSnapEvent('snap-lock-skip-reengage-distance', {
                tool: 'shape',
                pointerDistanceSinceLastSnap,
                reengageThreshold,
                lastSnapPointerPosition: this.lastSnapPointerPosition,
                pointerVirtualPosition
              })
            } else {
              const now = Date.now()
              const timeSinceLastSnap = now - this.lastSnapTime
              
              // 计算拖拽距离，如果距离太远就停止吸附
              const dragDistance = Math.sqrt(snapOffset.x * snapOffset.x + snapOffset.y * snapOffset.y)
              
              // 只有在冷却时间过后且距离合适时才应用吸附
              if (dragDistance <= maxSnapDistance * this.snapCatchMultiplier && timeSinceLastSnap >= this.snapCooldown) {
                draggedElement.position.x += snapOffset.x
                draggedElement.position.y += snapOffset.y
                draggedElement.updatedAt = Date.now()
                this.lastSnapTime = now
                this.snapLockActive = true
                this.snapLockPosition = {
                  x: draggedElement.position.x,
                  y: draggedElement.position.y
                }
                this.snapLockPointerPosition = pointerVirtualPosition
                const snapAxes = {
                  x: snapOffset.x !== 0,
                  y: snapOffset.y !== 0
                }
                this.snapLockAxes = snapAxes
                this.lastSnapAxes = snapAxes
                this.lastSnapPointerPosition = pointerVirtualPosition
                this.logSnapEvent('snap-lock-engaged', {
                  tool: 'shape',
                  dragDistance,
                  snapOffset,
                  pointerVirtualPosition,
                  snapLockPosition: this.snapLockPosition,
                  activeAxes: this.snapLockAxes
                })
              } else {
                this.logSnapEvent('snap-lock-skip', {
                  tool: 'shape',
                  dragDistance,
                  maxCatchDistance: maxSnapDistance * this.snapCatchMultiplier,
                  timeSinceLastSnap,
                  snapCooldown: this.snapCooldown
                })
              }
            }
          }
        }
      } else {
        this.resetSnapLock('shape-tool-not-dragging')
        this.clearSnapSuppression('shape-tool-not-dragging')
      }
    }
  }

  /**
   * 检测并渲染智能参考线
   */
  private handleSmartGuides(draggedElement: CanvasElement, position: Vector2): Vector2 {
    if (!this.smartGuideManager.isEnabled()) {
      this.renderer.clearSmartGuides()
      return Vector2Utils.create(0, 0)
    }

    // 获取画布尺寸
    const canvasSize = {
      width: this.canvas.width,
      height: this.canvas.height
    }

    // 检测参考线
    const guides = this.smartGuideManager.detectGuides(
      draggedElement,
      this.elements,
      canvasSize,
      position
    )



    // 计算吸附偏移
    const snapOffset = this.snapManager.calculateSnapOffset(
      draggedElement,
      guides,
      position
    )

    // 设置参考线到渲染器
    this.renderer.setSmartGuides(guides)
    
    // 返回吸附偏移量，让工具自己决定是否应用
    return snapOffset
    
    // 触发重新渲染以显示参考线
    this.requestRender()
  }
  
  private evaluateSnapLock(pointerPosition: Vector2, releaseThreshold: number): {
    maintain: boolean
    pointerDelta: { x: number; y: number } | null
    pointerReference: Vector2 | null
  } {
    if (!this.snapLockActive || (!this.snapLockPointerPosition && !this.snapLockPosition)) {
      return {
        maintain: false,
        pointerDelta: null,
        pointerReference: null
      }
    }
    
    const pointerReference = this.snapLockPointerPosition || this.snapLockPosition!
    const pointerDelta = {
      x: Math.abs(pointerPosition.x - pointerReference.x),
      y: Math.abs(pointerPosition.y - pointerReference.y)
    }
    
    const withinX = !this.snapLockAxes.x || pointerDelta.x <= releaseThreshold
    const withinY = !this.snapLockAxes.y || pointerDelta.y <= releaseThreshold
    
    return {
      maintain: withinX && withinY,
      pointerDelta,
      pointerReference
    }
  }
  
  private calculateAxisAwarePointerDistance(
    currentPosition: Vector2,
    referencePosition: Vector2 | null,
    axes?: { x: boolean; y: boolean }
  ): number | null {
    if (!referencePosition) {
      return null
    }
    
    if (!axes || (!axes.x && !axes.y)) {
      return Vector2Utils.distance(currentPosition, referencePosition)
    }
    
    const deltaX = axes.x ? Math.abs(currentPosition.x - referencePosition.x) : 0
    const deltaY = axes.y ? Math.abs(currentPosition.y - referencePosition.y) : 0
    
    if (axes.x && axes.y) {
      return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    }
    
    return axes.x ? deltaX : deltaY
  }

  private resetSnapLock(reason: string = 'manual-reset', preservePointerForReengage: boolean = false): void {
    if (this.snapLockActive) {
      this.logSnapEvent('snap-lock-reset', {
        reason,
        previousLockPosition: this.snapLockPosition,
        previousPointerPosition: this.snapLockPointerPosition
      })
    }
    
    if (preservePointerForReengage && (this.snapLockPointerPosition || this.snapLockPosition)) {
      const referencePointer = this.snapLockPointerPosition || this.snapLockPosition!
      this.lastSnapPointerPosition = { ...referencePointer }
      this.lastSnapAxes = { ...this.snapLockAxes }
    } else if (!preservePointerForReengage) {
      this.lastSnapPointerPosition = null
      this.lastSnapAxes = { x: false, y: false }
    }
    
    this.snapLockActive = false
    this.snapLockPosition = null
    this.snapLockPointerPosition = null
    this.snapLockAxes = { x: false, y: false }
  }

  private activateSnapSuppression(axes: { x: boolean; y: boolean }): void {
    const shouldActivate = axes.x || axes.y
    if (!shouldActivate) {
      return
    }
    this.snapSuppressionActive = true
    this.snapSuppressionAxes = { ...axes }
    this.logSnapEvent('snap-suppression-activated', {
      suppressionAxes: this.snapSuppressionAxes
    })
  }

  private clearSnapSuppression(reason: string): void {
    if (!this.snapSuppressionActive) {
      return
    }
    this.snapSuppressionActive = false
    this.snapSuppressionAxes = { x: false, y: false }
    this.logSnapEvent('snap-suppression-cleared', { reason })
  }

  private applySnapSuppression(offset: Vector2, tool: string): Vector2 {
    if (!this.snapSuppressionActive) {
      return offset
    }

    const suppressedX = this.snapSuppressionAxes.x && offset.x !== 0
    const suppressedY = this.snapSuppressionAxes.y && offset.y !== 0

    if (!suppressedX && !suppressedY) {
      this.clearSnapSuppression('suppressed-axes-inactive')
      return offset
    }

    const adjustedOffset = {
      x: suppressedX ? 0 : offset.x,
      y: suppressedY ? 0 : offset.y
    }

    this.logSnapEvent('snap-offset-suppressed', {
      tool,
      originalOffset: { ...offset },
      adjustedOffset,
      suppressionAxes: this.snapSuppressionAxes
    })

    return adjustedOffset
  }
  
  private logSnapEvent(action: string, details?: Record<string, unknown>): void {
    if (!this.snapDebugLogging) {
      return
    }
    console.log(`[SnapDebug] ${action}`, {
      ...details,
      timestamp: Date.now()
    })
  }

  /**
   * 更新形状文字输入框的样式（实时预览）
   */
  updateShapeTextInputStyle(styleUpdates: Partial<any>): void {
    
    if (!this.isEditingShapeText || !this.shapeTextInput) {
      return
    }

    const input = this.shapeTextInput
    
    // 存储当前的样式设置
    this.currentTextStyle = {
      ...this.currentTextStyle,
      ...styleUpdates
    }
    
    // 更新输入框的样式
    if (styleUpdates.fontSize) {
      input.style.fontSize = `${styleUpdates.fontSize}px`
    }
    
    if (styleUpdates.fontFamily) {
      input.style.fontFamily = styleUpdates.fontFamily
    }
    
    if (styleUpdates.fontWeight) {
      input.style.fontWeight = styleUpdates.fontWeight
    }
    
    if (styleUpdates.fontStyle) {
      input.style.fontStyle = styleUpdates.fontStyle
    }
    
    if (styleUpdates.color) {
      input.style.color = styleUpdates.color
    }
    
    if (styleUpdates.textAlign) {
      input.style.textAlign = styleUpdates.textAlign
    }
    
    if (styleUpdates.textDecoration) {
      input.style.textDecoration = styleUpdates.textDecoration
    }
    
    
    // 如果输入框失去焦点，重新聚焦
    if (document.activeElement !== input) {
      setTimeout(() => {
        if (this.shapeTextInput === input && document.body.contains(input)) {
          input.focus()
        }
      }, 10)
    }
  }

  /**
   * 更新形状文字样式
   */
  updateShapeTextStyle(styleUpdates: Partial<any>): void {
    if (!this.isEditingShapeText || !this.editingShapeElement) {
      return
    }

    // 更新文字样式
    this.editingShapeElement.data = {
      ...this.editingShapeElement.data,
      textStyle: {
        ...this.editingShapeElement.data?.textStyle,
        ...styleUpdates
      }
    }
    this.editingShapeElement.updatedAt = Date.now()

    // 重新渲染
    this.render()
  }

  /**
   * 标记工具栏交互，防止形状文字编辑意外结束
   */
  markToolbarInteraction(): void {
    
    // 清除之前的超时
    if (this.toolbarInteractionTimeout) {
      clearTimeout(this.toolbarInteractionTimeout)
    }
    
    // 设置一个标记，表示最近有工具栏交互
    this.toolbarInteractionTimeout = window.setTimeout(() => {
      this.toolbarInteractionTimeout = null
    }, 1000) // 1秒内认为有工具栏交互
  }

  /**
    return this.editingShapeElement
  }

  /**
   * 取消形状文字编辑
   */
  cancelShapeTextEdit(): void {
    this.removeShapeTextInput()
    this.isEditingShapeText = false
    this.editingShapeElement = null
    this.currentTextStyle = null // 清理样式
    
    // 恢复编辑前的工具，而不是切换到选择工具
    if (this.toolBeforeShapeTextEdit !== null) {
      this.toolManager.setTool(this.toolBeforeShapeTextEdit)
      this.toolBeforeShapeTextEdit = null
    }
    
    // 通知Vue组件形状文字编辑状态变化
    if (this.onShapeTextEditStateChange) {
      this.onShapeTextEditStateChange(false)
    }
    
    this.render()
  }

  /**
   * 移除形状文字输入框
   */
  private removeShapeTextInput(): void {
    if (this.shapeTextInput && this.shapeTextInput.parentNode) {
      this.shapeTextInput.parentNode.removeChild(this.shapeTextInput)
    } else {
    }
    this.shapeTextInput = null
  }

  /**
   * 检查是否正在编辑形状文字
   */
  isEditingShapeTextMode(): boolean {
    return this.isEditingShapeText
  }

  /**
   * 更新输入框位置（当视口变化时）
   */
  updateShapeTextInputPosition(): void {
    if (!this.isEditingShapeText || !this.editingShapeElement || !this.shapeTextInput) {
      return
    }

    const shapeElement = this.editingShapeElement
    const shapeCenter = {
      x: shapeElement.position.x + shapeElement.size.x / 2,
      y: shapeElement.position.y + shapeElement.size.y / 2
    }
    
    const screenPos = this.viewportManager.getCoordinateTransformer().virtualToScreen(shapeCenter)
    
    // 获取画布在页面中的位置
    const canvasRect = this.canvas.getBoundingClientRect()
    
    // 输入框尺寸
    const inputWidth = 200
    const inputHeight = 40
    
    // 计算居中位置（需要加上画布的偏移量）
    const inputLeft = screenPos.x - inputWidth / 2 + canvasRect.left
    const inputTop = screenPos.y - inputHeight / 2 + canvasRect.top
    
    this.shapeTextInput.style.left = `${inputLeft}px`
    this.shapeTextInput.style.top = `${inputTop}px`
    
  }

  /**
   * 设置智能参考线设置
   */
  setSmartGuideSettings(settings: Partial<GuideSettings>): void {
    this.smartGuideManager.updateSettings(settings)
    this.snapManager.updateSettings(settings)
  }

  /**
   * 获取智能参考线设置
   */
  getSmartGuideSettings(): GuideSettings {
    return this.smartGuideManager.getSettings()
  }

  /**
   * 启用/禁用智能参考线
   */
  setSmartGuidesEnabled(enabled: boolean): void {
    this.smartGuideManager.setEnabled(enabled)
    this.snapManager.setEnabled(enabled)
  }

  /**
   * 检查智能参考线是否启用
   */
  isSmartGuidesEnabled(): boolean {
    return this.smartGuideManager.isEnabled()
  }

  /**
   * 清除智能参考线
   */
  clearSmartGuides(): void {
    this.renderer.clearSmartGuides()
  }

  // ==================== 模板相关方法 ====================

  /**
   * 添加模板到画布
   */
  addTemplate(templateId: string): void {
    const template = this.templateManager.getTemplate(templateId)
    if (!template) {
      return
    }


    // 设置内部更新标志，防止显示浮动工具栏
    this.isInternalUpdate = true

    // 计算模板位置
    const canvasSize = {
      width: this.canvas.width,
      height: this.canvas.height
    }
    const offset = this.templateManager.calculateTemplatePosition(
      template, 
      canvasSize, 
      this.elements
    )


    // 转换模板元素为画布元素（包含ID映射）
    const { elements: templateElements } = this.templateManager.templateToCanvasElements(template, offset)
    
    // 先添加所有元素到画布
    for (const element of templateElements) {
             this.addElement(element)
           }

    // 初始化所有连接线的位置
    // 遍历所有箭头和线条元素，更新其连接点位置（使用已添加到画布的元素引用）
    for (const element of templateElements) {
      if ((element.type === ElementType.ARROW || element.type === ElementType.LINE) && element.data?.isConnectionLine) {
        const connectionLineId = element.id
        const connectionLine = this.findElement(connectionLineId) // 获取已添加到画布的元素引用
        if (!connectionLine) {
          console.warn(`   ⚠️ [addTemplate] 无法找到连接线 ${connectionLineId}`)
          continue
        }
        
        const sourceElementId = connectionLine.data?.sourceElementId
        const targetElementId = connectionLine.data?.targetElementId
        
        if (sourceElementId) {
          const sourceElement = this.findElement(sourceElementId)
          const targetElement = targetElementId ? this.findElement(targetElementId) : undefined
          
          if (sourceElement) {
            // 更新连接线的起点和终点位置
            this.updateConnectionLinePoints(connectionLine, sourceElement, targetElement || undefined)
          } else {
            console.warn(`   ⚠️ [addTemplate] 无法找到源元素 ${sourceElementId}`)
          }
        } else {
          console.warn(`   ⚠️ [addTemplate] 连接线 ${connectionLineId} 没有源元素ID`)
        }
      }
    }

    // 重置内部更新标志
    this.isInternalUpdate = false


    // 触发重新渲染
    this.requestRender()

    // 触发元素添加回调
    if (this.onElementsAdded) {
      this.onElementsAdded(templateElements)
    }
  }

  /**
   * 获取模板管理器
   */
  getTemplateManager(): TemplateManager {
    return this.templateManager
  }

  /**
   * 检查并扩展画布边界（限制扩展方向）
   */
  checkAndExpandCanvas(offset: Vector2): void {
    const viewport = this.viewportManager.getViewport()
    const threshold = this.canvasExpansionThreshold
    
    // 计算当前视口在虚拟坐标中的边界
    const viewportLeft = offset.x
    const viewportTop = offset.y
    const viewportRight = offset.x + viewport.width / viewport.scale
    const viewportBottom = offset.y + viewport.height / viewport.scale
    
    let needsExpansion = false
    
    // 设置3.0k边界限制
    const maxBoundary = 3000
    
    // 只允许向右和向下扩展，边界为0,0，最大为3.0k
    // 检查是否需要向右扩展
    if (viewportRight > this.canvasBounds.maxX - threshold) {
      this.canvasBounds.maxX = Math.min(maxBoundary, viewportRight + threshold)
      needsExpansion = true
    }
    
    // 检查是否需要向下扩展
    if (viewportBottom > this.canvasBounds.maxY - threshold) {
      this.canvasBounds.maxY = Math.min(maxBoundary, viewportBottom + threshold)
      needsExpansion = true
    }
    
    // 确保边界不会小于0,0，也不会超过3.0k
    this.canvasBounds.minX = Math.max(0, this.canvasBounds.minX)
    this.canvasBounds.minY = Math.max(0, this.canvasBounds.minY)
    this.canvasBounds.maxX = Math.min(maxBoundary, this.canvasBounds.maxX)
    this.canvasBounds.maxY = Math.min(maxBoundary, this.canvasBounds.maxY)
    
  }

  /**
   * 获取当前画布边界
   */
  getCanvasBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    return { ...this.canvasBounds }
  }

  /**
   * 设置画布扩展回调
   */
  setOnCanvasExpansion(callback: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void): void {
    this.onCanvasExpansion = callback
  }

  /**
   * 导出为图片
   * @param elements 要导出的元素列表，如果为空或undefined则导出所有元素
   * @param format 导出格式：'png' | 'jpg'
   * @param quality JPG质量（0-1），仅对JPG格式有效
   * @param backgroundColor 背景颜色
   */
  async exportToImage(
    elements?: CanvasElement[],
    format: 'png' | 'jpg' = 'png',
    quality: number = 0.92,
    backgroundColor?: string
  ): Promise<string> {
    const elementsToExport = elements || this.elements
    const bgColor = backgroundColor || this.settings.backgroundColor
    
    // 获取 ImageRenderer（从 Renderer 内部获取）
    const imageRenderer = (this.renderer as any).imageRenderer
    
    return this.exportManager.exportToImage(
      elementsToExport,
      format,
      quality,
      bgColor,
      imageRenderer
    )
  }

  /**
   * 导出并下载图片
   * @param filename 文件名（不包含扩展名）
   * @param elements 要导出的元素列表，如果为空或undefined则导出所有元素
   * @param format 导出格式：'png' | 'jpg'
   * @param quality JPG质量（0-1），仅对JPG格式有效
   * @param backgroundColor 背景颜色
   */
  async exportAndDownload(
    filename: string,
    elements?: CanvasElement[],
    format: 'png' | 'jpg' = 'png',
    quality: number = 0.92,
    backgroundColor?: string
  ): Promise<void> {
    const elementsToExport = elements || this.elements
    const bgColor = backgroundColor || this.settings.backgroundColor
    
    // 获取 ImageRenderer（从 Renderer 内部获取）
    const imageRenderer = (this.renderer as any).imageRenderer
    
    return this.exportManager.exportAndDownload(
      elementsToExport,
      filename,
      format,
      quality,
      bgColor,
      imageRenderer
    )
  }
}