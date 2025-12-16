/**
 * 浮动工具栏配置类�?
 */
export interface ToolbarConfig {
  // 基础功能
  fillColor?: boolean      // 填充颜色
  strokeColor?: boolean    // 描边颜色
  strokeWidth?: boolean    // 线条粗细
  strokeStyle?: boolean    // 线条样式
  opacity?: boolean        // 透明�?
  
  // 文本功能
  fontFamily?: boolean     // 字体�?
  fontSize?: boolean       // 字体大小
  fontWeight?: boolean     // 粗体
  fontStyle?: boolean      // 斜体
  textAlign?: boolean      // 文本对齐
  lineHeight?: boolean     // 行高
  textDecoration?: boolean // 下划�?删除�?
  
  // 画笔功能
  brushSize?: boolean      // 画笔大小
  brushType?: boolean      // 画笔类型
  pressure?: boolean       // 压感
  smoothing?: boolean      // 平滑�?
  
  // 箭头功能
  arrowStyle?: boolean     // 箭头样式
  arrowSize?: boolean      // 箭头大小
  arrowDirection?: boolean // 箭头方向
  
  // 线条功能
  lineType?: boolean       // 线条类型
  endCap?: boolean         // 端点样式
  lineJoin?: boolean       // 连接样式
  
  // 图层管理
  layerManagement?: boolean // 置于顶层/底层
  delete?: boolean         // 删除
  copy?: boolean           // 复制
  transform?: boolean      // 变换
  
  // 对齐功能
  align?: boolean          // 对齐
  distribute?: boolean     // 分布
  group?: boolean          // 组合
}

/**
 * 工具类型枚举
 */
export enum ToolType {
  SELECT = 'select',
  SHAPE = 'shape',
  TEXT = 'text',
  PEN = 'pen',
  ARROW = 'arrow',
  LINE = 'line',
  IMAGE = 'image'
}

/**
 * 工具栏配置映�?
 */
export const TOOLBAR_CONFIGS: Record<ToolType, ToolbarConfig> = {
  [ToolType.SELECT]: {
    // 选择工具 - 通用功能 + 变换 + 对齐
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
    strokeStyle: true,
    opacity: true,
    layerManagement: true,
    delete: true,
    copy: true,
    transform: true,
    align: true,
    distribute: true,
    group: true
  },
  
  [ToolType.SHAPE]: {
    // 形状工具 - 基础样式功能
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
    strokeStyle: true,
    opacity: true,
    layerManagement: true,
    delete: true
  },
  
  [ToolType.TEXT]: {
    // 文本工具 - 文本专用功能
    fillColor: false,      // 文本用fillColor作为文字颜色
    strokeColor: false,
    strokeWidth: false,
    strokeStyle: false,
    opacity: true,
    fontFamily: true,
    fontSize: true,
    fontWeight: true,
    fontStyle: true,
    textAlign: true,
    lineHeight: true,
    textDecoration: true,
    layerManagement: true,
    delete: true
  },
  
  [ToolType.PEN]: {
    // 画笔工具 - 画笔专用功能
    fillColor: false,      // 画笔用strokeColor
    strokeColor: true,
    strokeWidth: true,
    strokeStyle: true,
    opacity: true,
    brushSize: true,
    brushType: true,
    pressure: true,
    smoothing: true,
    layerManagement: true,
    delete: true
  },
  
  [ToolType.ARROW]: {
    // 箭头工具 - 箭头专用功能
    fillColor: false,      // 箭头用strokeColor
    strokeColor: true,
    strokeWidth: true,
    strokeStyle: true,
    opacity: true,
    arrowStyle: true,
    arrowSize: true,
    arrowDirection: true,
    layerManagement: true,
    delete: true
  },
  
  [ToolType.LINE]: {
    // 线条工具 - 线条专用功能
    fillColor: false,      // 线条用strokeColor
    strokeColor: true,
    strokeWidth: true,
    strokeStyle: true,
    opacity: true,
    lineType: true,
    endCap: true,
    lineJoin: true,
    layerManagement: true,
    delete: true
  },
  
  [ToolType.IMAGE]: {
    // 图片工具 - 图片专用功能
    fillColor: false,
    strokeColor: false,
    strokeWidth: false,
    strokeStyle: false,
    opacity: true,
    layerManagement: true,
    delete: true,
    copy: true,
    transform: true
  }
}
