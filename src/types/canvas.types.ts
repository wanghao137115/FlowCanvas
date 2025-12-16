/**
 * 2D向量接口
 */
export interface Vector2 {
  x: number
  y: number
}

/**
 * 边界框接�?
 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 视口接口
 */
export interface Viewport {
  scale: number
  offset: Vector2
  width: number
  height: number
}

/**
 * 画布设置接口
 */
export interface CanvasSettings {
  gridSize: number
  gridVisible: boolean
  rulersVisible: boolean
  snapToGrid: boolean
  backgroundColor: string
}

/**
 * 元素类型枚举
 */
export enum ElementType {
  SHAPE = 'shape',
  TEXT = 'text',
  PATH = 'path',
  IMAGE = 'image',
  ARROW = 'arrow',
  LINE = 'line'
}

/**
 * 元素样式接口
 */
export interface ElementStyle {
  fill?: string
  fillEnabled?: boolean
  fillType?: string
  gradientDirection?: string
  stroke?: string
  strokeWidth?: number
  lineStyle?: string
  lineDash?: number[]
  lineCap?: string
  opacity?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  textDecoration?: string
}

/**
 * 画布元素基础接口
 */
export interface CanvasElement {
  id: string
  type: ElementType
  position: Vector2
  size: Vector2
  rotation: number
  style: ElementStyle
  layer: string  // 图层ID，字符串类型
  locked: boolean
  visible: boolean
  createdAt: number
  updatedAt: number
  data?: any
  // 图层管理相关属性
  layerName?: string
  layerColor?: string
  layerOpacity?: number
  layerBlendMode?: string
  // 变换相关属性
  initialTransformState?: {
    position: Vector2
    size: Vector2
    rotation: number
  }
}

/**
 * 图层接口
 */
export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  color: string
  blendMode: string
  elements: string[] // 元素ID列表
  order: number // 图层顺序
  parentId?: string // 父图层ID，支持嵌套分组
  children: string[] // 子图层ID列表
  isGroup: boolean // 是否为分组图层
  expanded: boolean // 是否展开（用于UI显示）
  hasCustomColor?: boolean // 是否有自定义颜色（默认false，表示透明背景）
  createdAt: number
  updatedAt: number
}

/**
 * 图层操作类型枚举
 */
export enum LayerOperationType {
  CREATE_LAYER = 'create_layer',
  DELETE_LAYER = 'delete_layer',
  RENAME_LAYER = 'rename_layer',
  TOGGLE_VISIBILITY = 'toggle_visibility',
  TOGGLE_LOCK = 'toggle_lock',
  CHANGE_ORDER = 'change_order',
  CHANGE_OPACITY = 'change_opacity',
  CHANGE_COLOR = 'change_color',
  MOVE_ELEMENT_TO_LAYER = 'move_element_to_layer'
}

/**
 * 工具类型枚举
 */
export enum ToolType {
  SELECT = 'select',
  PEN = 'pen',
  SHAPE = 'shape',
  TEXT = 'text',
  ARROW = 'arrow',
  LINE = 'line',
  ERASER = 'eraser',
  STYLE_BRUSH = 'styleBrush',
  IMAGE = 'image'
}

/**
 * 事件处理器类�?
 */
export type EventHandler = (event: Event) => void

/**
 * 渲染任务接口
 */
export interface RenderTask {
  id: string
  priority: number
  execute: () => void
}
