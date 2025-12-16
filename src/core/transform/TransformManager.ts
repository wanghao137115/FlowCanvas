import type { Vector2, CanvasElement, Bounds } from '@/types/canvas.types'
import { TransformHandle, TransformHandleType, type TransformHandleStyle } from './TransformHandle'
import { GeometryUtils } from '@/utils/math/Geometry'

/**
 * 变换管理�?
 * 负责管理选中元素的变换手柄和变换操作
 */
export class TransformManager {
  private handles: Map<TransformHandleType, TransformHandle> = new Map()
  private selectedElements: CanvasElement[] = []
  private isVisible: boolean = false
  private activeHandle: TransformHandle | null = null
  private transformStartPosition: Vector2 | null = null
  private transformStartBounds: Bounds | null = null
  private onTransform?: (elements: CanvasElement[], delta: Vector2, handle: TransformHandleType) => void
  private onTransformStart?: (elements: CanvasElement[]) => void
  private onTransformEnd?: (elements: CanvasElement[]) => void
  private canvasEngine: any = null

  constructor(style?: Partial<TransformHandleStyle>) {
    this.initializeHandles(style)
  }

  /**
   * 设置画布引擎
   */
  setCanvasEngine(canvasEngine: any): void {
    this.canvasEngine = canvasEngine
  }

  /**
   * 屏幕坐标转虚拟坐标
   */
  private screenToVirtual(screenPoint: Vector2): Vector2 {
    if (this.canvasEngine?.viewportManager) {
      return this.canvasEngine.viewportManager.getCoordinateTransformer().screenToVirtual(screenPoint)
    }
    return screenPoint
  }

  /**
   * 初始化变换手�?
   */
  private initializeHandles(style?: Partial<TransformHandleStyle>): void {
    const handleTypes = [
      TransformHandleType.RESIZE_NW,
      TransformHandleType.RESIZE_N,
      TransformHandleType.RESIZE_NE,
      TransformHandleType.RESIZE_E,
      TransformHandleType.RESIZE_SE,
      TransformHandleType.RESIZE_S,
      TransformHandleType.RESIZE_SW,
      TransformHandleType.RESIZE_W,
      TransformHandleType.ROTATE
    ]

    handleTypes.forEach(type => {
      this.handles.set(type, new TransformHandle(type, style))
    })
  }

  /**
   * 设置选中元素
   */
  setSelectedElements(elements: CanvasElement[]): void {
    this.selectedElements = [...elements]
    this.isVisible = elements.length > 0
    

    
    this.updateHandlePositionsWithRotation()
  }

  /**
   * 设置变换回调
   */
  setOnTransform(callback: (elements: CanvasElement[], delta: Vector2, handle: TransformHandleType) => void): void {
    this.onTransform = callback
  }

  /**
   * 设置变换开始回调
   */
  setOnTransformStart(callback: (elements: CanvasElement[]) => void): void {
    this.onTransformStart = callback
  }

  /**
   * 设置变换结束回调
   */
  setOnTransformEnd(callback: (elements: CanvasElement[]) => void): void {
    this.onTransformEnd = callback
  }

  /**
   * 开始变�?
   */
  startTransform(position: Vector2, handle: TransformHandle): void {
    console.log('🔄 TransformManager.startTransform called with handle:', handle.getType())
    console.log('🔄 Selected elements:', this.selectedElements.length)
    
    this.activeHandle = handle
    this.transformStartPosition = { ...position }
    this.transformStartBounds = this.getSelectedBounds()
    handle.setActive(true)

    // 保存每个元素的初始状态
    this.selectedElements.forEach(element => {
      element.initialTransformState = {
        position: { ...element.position },
        size: { ...element.size },
        rotation: element.rotation
      }
    })
    
    // 通知画布引擎保存变换前的状态（用于历史记录）
    if (this.canvasEngine && this.canvasEngine.saveTransformStartState) {
      console.log('🔄 Calling canvasEngine.saveTransformStartState')
      this.canvasEngine.saveTransformStartState(this.selectedElements)
    }

    // 调用变换开始回调（用于隐藏UI）
    if (this.onTransformStart && this.selectedElements.length > 0) {
      console.log('🔄 Calling onTransformStart callback')
      this.onTransformStart(this.selectedElements)
    } else {
      console.log('🔄 onTransformStart callback not set or no selected elements')
    }
  }

  /**
   * 更新变换
   */
  updateTransform(position: Vector2): void {
    if (!this.activeHandle || !this.transformStartPosition || !this.transformStartBounds) {
      return
    }

    // ✅ 修复：将屏幕坐标转换为虚拟坐标进行计算
    const virtualPosition = this.screenToVirtual(position)
    const virtualTransformStartPosition = this.screenToVirtual(this.transformStartPosition)

    const delta = {
      x: virtualPosition.x - virtualTransformStartPosition.x,
      y: virtualPosition.y - virtualTransformStartPosition.y
    }


    if (this.onTransform) {
     
      this.onTransform(this.selectedElements, delta, this.activeHandle.getType())
    }
  }

  /**
   * 结束变换
   */
  endTransform(): void {
    console.log('🔄 TransformManager.endTransform called')
    console.log('🔄 Selected elements:', this.selectedElements.length)
    
    if (this.activeHandle) {
      this.activeHandle.setActive(false)
      this.activeHandle = null
    }
    this.transformStartPosition = null
    this.transformStartBounds = null
    
    // 调用变换结束回调（用于创建历史记录）
    if (this.onTransformEnd && this.selectedElements.length > 0) {
      console.log('🔄 Calling onTransformEnd callback')
      this.onTransformEnd(this.selectedElements)
    } else {
      console.log('🔄 onTransformEnd callback not set or no selected elements')
    }
    
    // 清理元素的初始状态
    this.selectedElements.forEach(element => {
      delete element.initialTransformState
    })
  }

  /**
   * 获取指定位置的手�?
   */
  getHandleAtPosition(position: Vector2): TransformHandle | null {
    for (const handle of this.handles.values()) {
      const contains = handle.contains(position)
      
      if (contains) {
        return handle
      }
    }

    return null
  }

  /**
   * 渲染变换手柄
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible || this.selectedElements.length === 0) return

    // 检查选中的元素是否是连接线，如果是，不显示变换手柄
    const isConnectionLine = this.selectedElements.length === 1 && 
                             this.selectedElements[0].data?.isConnectionLine
    if (isConnectionLine) {
      // 连接线不显示变换手柄，只渲染连接线（可选）
      this.renderConnectionLines(ctx)
      return
    }

    // 更新手柄位置
    this.updateHandlePositionsWithRotation()

    // 渲染所有手�?
    this.handles.forEach(handle => {
      handle.render(ctx)
    })

    // 渲染连接线（可选）
    this.renderConnectionLines(ctx)
  }

  /**
   * 更新手柄位置
   */
  private updateHandlePositions(): void {
    if (this.selectedElements.length === 0) return

    const bounds = this.getSelectedBounds()
    if (!bounds) return


    // 检查元素是否太小（小于20px�?
    const isTooSmall = bounds.width < 20 || bounds.height < 20
    const isMultipleSelection = this.selectedElements.length > 1

    const margin = 10 // 手柄距离边界的距�?

    // 设置各个手柄的位�?
    this.handles.get(TransformHandleType.RESIZE_NW)?.setPosition({
      x: bounds.x - margin,
      y: bounds.y - margin
    })

    this.handles.get(TransformHandleType.RESIZE_N)?.setPosition({
      x: bounds.x + bounds.width / 2,
      y: bounds.y - margin
    })

    this.handles.get(TransformHandleType.RESIZE_NE)?.setPosition({
      x: bounds.x + bounds.width + margin,
      y: bounds.y - margin
    })

    this.handles.get(TransformHandleType.RESIZE_E)?.setPosition({
      x: bounds.x + bounds.width + margin,
      y: bounds.y + bounds.height / 2
    })

    this.handles.get(TransformHandleType.RESIZE_SE)?.setPosition({
      x: bounds.x + bounds.width + margin,
      y: bounds.y + bounds.height + margin
    })

    this.handles.get(TransformHandleType.RESIZE_S)?.setPosition({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height + margin
    })

    this.handles.get(TransformHandleType.RESIZE_SW)?.setPosition({
      x: bounds.x - margin,
      y: bounds.y + bounds.height + margin
    })

    this.handles.get(TransformHandleType.RESIZE_W)?.setPosition({
      x: bounds.x - margin,
      y: bounds.y + bounds.height / 2
    })

    // 旋转手柄仅在单选时显示
    if (!isMultipleSelection) {
      this.handles.get(TransformHandleType.ROTATE)?.setPosition({
        x: bounds.x + bounds.width / 2,
        y: bounds.y - margin - 20
      })
    }

    // 设置手柄可见�?
    this.handles.forEach((handle, type) => {
      if (isTooSmall) {
        // 元素太小时隐藏所有手�?
        handle.setVisible(false)
      } else if (type === TransformHandleType.ROTATE && isMultipleSelection) {
        // 多选时隐藏旋转手柄
        handle.setVisible(false)
      } else {
        handle.setVisible(true)
      }
    })
  }

  /**
   * 获取选中元素的边界框
   */
  private getSelectedBounds(): Bounds | null {
    if (this.selectedElements.length === 0) return null

    if (this.selectedElements.length === 1) {
      const element = this.selectedElements[0]
      return {
        x: element.position.x,
        y: element.position.y,
        width: element.size.x,
        height: element.size.y
      }
    }

    // 多个元素时，计算包围�?
    const points: Vector2[] = []
    this.selectedElements.forEach(element => {
      points.push(element.position)
      points.push({
        x: element.position.x + element.size.x,
        y: element.position.y + element.size.y
      })
    })

    return GeometryUtils.getBoundingRect(points)
  }

  /**
   * 渲染连接�?
   */
  private renderConnectionLines(ctx: CanvasRenderingContext2D): void {
    if (this.selectedElements.length <= 1) return

    const bounds = this.getSelectedBounds()
    if (!bounds) return

    ctx.save()
    ctx.strokeStyle = '#007ACC'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    
    ctx.strokeRect(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    )
    
    ctx.restore()
  }

  /**
   * 隐藏变换手柄
   */
  hide(): void {
    this.isVisible = false
    this.handles.forEach(handle => {
      handle.setVisible(false)
    })
  }

  /**
   * 显示变换手柄
   */
  show(): void {
    this.isVisible = this.selectedElements.length > 0
  }

  /**
   * 获取当前激活的手柄
   */
  getActiveHandle(): TransformHandle | null {
    return this.activeHandle
  }

  /**
   * 是否正在变换
   */
  isTransforming(): boolean {
    return this.activeHandle !== null
  }

  /**
   * 获取选中元素
   */
  getSelectedElements(): CanvasElement[] {
    return [...this.selectedElements]
  }

  /**
   * 更新手柄位置（支持旋转）
   */
  private updateHandlePositionsWithRotation(): void {
    if (this.selectedElements.length === 0) return

    const bounds = this.getSelectedBounds()
    if (!bounds) return

    // 检查元素是否太小（小于20px）
    const isTooSmall = bounds.width < 20 || bounds.height < 20
    const isMultipleSelection = this.selectedElements.length > 1

    const margin = 10 // 手柄距离边界的距离

    // 获取元素中心点
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2

    // 获取旋转角度（单选时使用第一个元素的旋转角度）
    const rotation = this.selectedElements.length === 1 ? this.selectedElements[0].rotation : 0

    // 计算手柄位置的辅助函数
    const rotatePoint = (x: number, y: number, centerX: number, centerY: number, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const dx = x - centerX
      const dy = y - centerY
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos
      }
    }

    // 定义手柄的原始位置（相对于边界框）
    const handlePositions = {
      [TransformHandleType.RESIZE_NW]: { x: bounds.x - margin, y: bounds.y - margin },
      [TransformHandleType.RESIZE_N]: { x: bounds.x + bounds.width / 2, y: bounds.y - margin },
      [TransformHandleType.RESIZE_NE]: { x: bounds.x + bounds.width + margin, y: bounds.y - margin },
      [TransformHandleType.RESIZE_E]: { x: bounds.x + bounds.width + margin, y: bounds.y + bounds.height / 2 },
      [TransformHandleType.RESIZE_SE]: { x: bounds.x + bounds.width + margin, y: bounds.y + bounds.height + margin },
      [TransformHandleType.RESIZE_S]: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + margin },
      [TransformHandleType.RESIZE_SW]: { x: bounds.x - margin, y: bounds.y + bounds.height + margin },
      [TransformHandleType.RESIZE_W]: { x: bounds.x - margin, y: bounds.y + bounds.height / 2 },
      [TransformHandleType.ROTATE]: { x: bounds.x + bounds.width / 2, y: bounds.y - margin - 20 }
    }

    // 应用旋转并设置手柄位置
    Object.entries(handlePositions).forEach(([handleType, position]) => {
      const handle = this.handles.get(handleType as TransformHandleType)
      if (handle) {
        if (handleType === TransformHandleType.ROTATE && isMultipleSelection) {
          // 多选时隐藏旋转手柄
          handle.setVisible(false)
        } else {
          // 应用旋转变换（将角度转换为弧度）
          const rotatedPosition = rotatePoint(position.x, position.y, centerX, centerY, (rotation * Math.PI) / 180)
          handle.setPosition(rotatedPosition)
          handle.setVisible(!isTooSmall)
        }
      }
    })
  }
}
