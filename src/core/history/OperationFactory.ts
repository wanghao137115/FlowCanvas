import type { CanvasElement, Vector2 } from '@/types/canvas.types'
import { OperationType, type OperationCommand } from './HistoryManager'
import { generateId } from '@/utils/common'

/**
 * 操作工厂类
 * 负责创建各种操作指令
 */
export class OperationFactory {
  /**
   * 创建元素创建操作
   */
  static createElement(element: CanvasElement, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.CREATE_ELEMENT,
      elementId: element.id,
      data: {
        element: this.cloneElement(element)
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建元素删除操作
   */
  static deleteElement(element: CanvasElement, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.DELETE_ELEMENT,
      elementId: element.id,
      data: {
        element: this.cloneElement(element)
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建元素移动操作
   */
  static moveElement(elementId: string, oldPosition: Vector2, newPosition: Vector2, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.MOVE_ELEMENT,
      elementId,
      data: {
        oldPosition: { ...oldPosition },
        newPosition: { ...newPosition }
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建元素变换操作
   */
  static transformElement(
    elementId: string, 
    oldTransform: { position: Vector2; size: Vector2; rotation: number },
    newTransform: { position: Vector2; size: Vector2; rotation: number },
    beforeState?: any,
    afterState?: any
  ): OperationCommand {
    return {
      type: OperationType.TRANSFORM_ELEMENT,
      elementId,
      data: {
        oldTransform: {
          position: { ...oldTransform.position },
          size: { ...oldTransform.size },
          rotation: oldTransform.rotation
        },
        newTransform: {
          position: { ...newTransform.position },
          size: { ...newTransform.size },
          rotation: newTransform.rotation
        }
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建样式更新操作
   */
  static updateStyle(elementId: string, oldStyle: any, newStyle: any, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.UPDATE_STYLE,
      elementId,
      data: {
        oldStyle: { ...oldStyle },
        newStyle: { ...newStyle }
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建批量操作
   */
  static batchOperation(operations: OperationCommand[], description: string, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.BATCH_OPERATION,
      data: {
        operations: operations.map(op => ({ ...op })),
        description
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建多元素样式更新操作
   */
  static updateMultipleStyles(elementIds: string[], oldStyles: any[], newStyles: any[], beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.BATCH_OPERATION,
      elementIds,
      data: {
        operations: elementIds.map((id, index) => ({
          type: OperationType.UPDATE_STYLE,
          elementId: id,
          data: {
            oldStyle: { ...oldStyles[index] },
            newStyle: { ...newStyles[index] }
          },
          timestamp: Date.now()
        })),
        description: `批量更新 ${elementIds.length} 个元素样式`
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建多元素移动操作
   */
  static moveMultipleElements(
    elementIds: string[], 
    oldPositions: Vector2[], 
    newPositions: Vector2[]
  ): OperationCommand {
    return {
      type: OperationType.BATCH_OPERATION,
      elementIds,
      data: {
        operations: elementIds.map((id, index) => ({
          type: OperationType.MOVE_ELEMENT,
          elementId: id,
          data: {
            oldPosition: { ...oldPositions[index] },
            newPosition: { ...newPositions[index] }
          },
          timestamp: Date.now()
        })),
        description: `批量移动 ${elementIds.length} 个元素`
      },
      timestamp: Date.now()
    }
  }

  /**
   * 创建多元素删除操作
   */
  static deleteMultipleElements(elements: CanvasElement[]): OperationCommand {
    return {
      type: OperationType.BATCH_OPERATION,
      elementIds: elements.map(el => el.id),
      data: {
        operations: elements.map(element => ({
          type: OperationType.DELETE_ELEMENT,
          elementId: element.id,
          data: {
            element: this.cloneElement(element)
          },
          timestamp: Date.now()
        })),
        description: `批量删除 ${elements.length} 个元素`
      },
      timestamp: Date.now()
    }
  }

  /**
   * 创建复制元素操作
   */
  static copyElements(elements: CanvasElement[]): OperationCommand {
    return {
      type: OperationType.COPY_ELEMENTS,
      elementIds: elements.map(el => el.id),
      data: {
        elements: elements.map(el => this.cloneElement(el))
      },
      timestamp: Date.now()
    }
  }

  /**
   * 创建粘贴元素操作
   */
  static pasteElements(elements: CanvasElement[]): OperationCommand {
    return {
      type: OperationType.PASTE_ELEMENTS,
      elementIds: elements.map(el => el.id),
      data: {
        elements: elements.map(el => this.cloneElement(el))
      },
      timestamp: Date.now()
    }
  }

  // ==================== 图层操作 ====================
  
  /**
   * 创建图层创建操作
   */
  static createLayer(layerId: string, layerData: any, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.CREATE_LAYER,
      elementId: layerId,
      data: {
        layer: this.cloneLayer(layerData)
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建图层删除操作
   */
  static deleteLayer(layerId: string, layerData: any, elements: CanvasElement[]): OperationCommand {
    return {
      type: OperationType.DELETE_LAYER,
      elementId: layerId,
      data: {
        layer: this.cloneLayer(layerData),
        elements: elements.map(el => this.cloneElement(el))
      },
      timestamp: Date.now()
    }
  }

  /**
   * 创建图层重命名操作
   */
  static renameLayer(layerId: string, oldName: string, newName: string, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.RENAME_LAYER,
      elementId: layerId,
      data: {
        oldName,
        newName
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建图层可见性切换操作
   */
  static toggleLayerVisibility(layerId: string, visible: boolean, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.TOGGLE_LAYER_VISIBILITY,
      elementId: layerId,
      data: {
        visible
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建图层锁定切换操作
   */
  static toggleLayerLock(layerId: string, locked: boolean): OperationCommand {
    return {
      type: OperationType.TOGGLE_LAYER_LOCK,
      elementId: layerId,
      data: {
        locked
      },
      timestamp: Date.now()
    }
  }

  /**
   * 创建图层移动操作
   */
  static moveLayer(layerId: string, oldOrder: number, newOrder: number, oldParentId?: string, newParentId?: string, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.MOVE_LAYER,
      elementId: layerId,
      data: {
        oldOrder,
        newOrder,
        oldParentId,
        newParentId
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建设置图层颜色命令
   */
  static setLayerColor(layerId: string, oldColor: string, newColor: string, beforeState?: any, afterState?: any): OperationCommand {
    return {
      type: OperationType.SET_LAYER_COLOR,
      elementId: layerId,
      data: {
        oldColor,
        newColor
      },
      timestamp: Date.now(),
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined
    }
  }

  /**
   * 创建图层拖拽操作
   */
  static dragLayer(layerId: string, oldOrder: number, newOrder: number, oldParentId?: string, newParentId?: string): OperationCommand {
    return {
      type: OperationType.DRAG_LAYER,
      elementId: layerId,
      data: {
        oldOrder,
        newOrder,
        oldParentId,
        newParentId
      },
      timestamp: Date.now()
    }
  }

  /**
   * 创建复制图层操作
   */
  static duplicateLayer(sourceLayerId: string, duplicatedLayerId: string, beforeState?: any, afterState?: any): OperationCommand {
    return {
      id: generateId(),
      type: 'duplicate_layer',
      elementId: sourceLayerId,
      data: {
        sourceLayerId,
        duplicatedLayerId
      },
      beforeState: beforeState ? this.cloneState(beforeState) : undefined,
      afterState: afterState ? this.cloneState(afterState) : undefined,
      timestamp: Date.now()
    }
  }

  /**
   * 深度克隆元素
   */
  private static cloneElement(element: CanvasElement): CanvasElement {
    return {
      ...element,
      position: { ...element.position },
      size: { ...element.size },
      style: { ...element.style },
      data: element.data ? JSON.parse(JSON.stringify(element.data)) : undefined
    }
  }

  /**
   * 深度克隆图层
   */
  private static cloneLayer(layer: any): any {
    return {
      ...layer,
      children: [...(layer.children || [])]
    }
  }

  /**
   * 克隆状态对象
   */
  private static cloneState(state: any): any {
    return JSON.parse(JSON.stringify(state))
  }
}
