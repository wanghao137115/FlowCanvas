/**
 * 模板管理器
 * 负责模板的加载、渲染和管理
 */

import { FlowTemplate } from '../../types/template.types'
import { CanvasElement, ElementType, Vector2 } from '../../types/canvas.types'
import { simpleTemplateLibrary } from '../../data/simpleTemplates'

export class TemplateManager {
  private static instance: TemplateManager
  private templates: Map<string, FlowTemplate> = new Map()

  private constructor() {
    this.loadTemplates()
  }

  public static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager()
    }
    return TemplateManager.instance
  }

  /**
   * 加载模板数据
   */
  private loadTemplates(): void {
    // 加载所有分类中的模板
    for (const category of simpleTemplateLibrary.categories) {
      for (const template of category.templates) {
        this.templates.set(template.id, template)
      }
    }
    
    // 加载推荐模板
    for (const template of simpleTemplateLibrary.featured) {
      this.templates.set(template.id, template)
    }
  }

  /**
   * 获取模板
   */
  public getTemplate(templateId: string): FlowTemplate | null {
    const template = this.templates.get(templateId) || null
    return template
  }

  /**
   * 添加模板
   */
  public addTemplate(template: FlowTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * 获取所有模板
   */
  public getAllTemplates(): FlowTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 将模板转换为画布元素，并建立ID映射
   * @returns 返回元素数组和ID映射表 { elements, idMap }
   */
  public templateToCanvasElements(
    template: FlowTemplate, 
    offset: Vector2 = { x: 0, y: 0 }
  ): { elements: CanvasElement[], idMap: Map<string, string> } {
    // 建立模板ID到画布元素ID的映射
    const idMap = new Map<string, string>()
    
    // 第一遍：创建所有元素并建立ID映射
    const canvasElements = template.elements.map(templateElement => {
      const canvasElementId = this.generateElementId()
      idMap.set(templateElement.id, canvasElementId)
      
      const canvasElement: CanvasElement = {
        id: canvasElementId,
        type: templateElement.type as ElementType,
        position: {
          x: templateElement.position.x + offset.x,
          y: templateElement.position.y + offset.y
        },
        size: templateElement.size,
        rotation: 0,
        style: templateElement.style,
        layer: 'default',
        locked: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: templateElement.data ? { ...templateElement.data } : undefined // 浅拷贝，避免修改原数据
      }
      
      return canvasElement
    })
    
    // 第二遍：处理所有箭头和线条元素，自动识别连接线并更新ID
    canvasElements.forEach(element => {
      // 处理 ARROW 和 LINE 类型的连接线
      if (element.type === ElementType.ARROW || element.type === ElementType.LINE) {
        // 确保 data 对象存在
        if (!element.data) {
          element.data = {}
        }
        
        // 对于 LINE 类型，如果没有 points 数组但有 isConnectionLine 标记，根据 position 和 size 计算 points
        if (element.type === ElementType.LINE && element.data.isConnectionLine && (!element.data.points || element.data.points.length === 0)) {
          // 转换为相对坐标
          element.data.points = [
            { x: 0, y: 0 },
            { x: element.size.x, y: element.size.y }
          ]
        }
        
        // 如果元素有 points 或 isConnectionLine 标记，将其视为连接线
        if ((element.data.points && element.data.points.length >= 2) || element.data.isConnectionLine) {
          element.data.isConnectionLine = true
        }
        
        // 处理连接线：更新 sourceElementId 和 targetElementId
        if (element.data.isConnectionLine) {
          
          // 如果有源和目标模板ID，直接更新
          let sourceTemplateId = element.data.sourceElementId
          let targetTemplateId = element.data.targetElementId
          
          // 如果没有源和目标ID，但有点位信息，尝试根据位置推断
          if (!sourceTemplateId && element.data.points && element.data.points.length >= 2) {
            // 计算箭头的绝对起点和终点
            const startPoint = {
              x: element.position.x + (element.data.points[0]?.x || 0),
              y: element.position.y + (element.data.points[0]?.y || 0)
            }
            const endPoint = {
              x: element.position.x + (element.data.points[element.data.points.length - 1]?.x || 0),
              y: element.position.y + (element.data.points[element.data.points.length - 1]?.y || 0)
            }
            
            // 查找与起点相交的元素（源元素）
            const sourceElement = canvasElements.find(el => 
              el.id !== element.id && 
              el.type !== ElementType.ARROW &&
              el.type !== ElementType.LINE &&
              startPoint.x >= el.position.x &&
              startPoint.x <= el.position.x + el.size.x &&
              startPoint.y >= el.position.y &&
              startPoint.y <= el.position.y + el.size.y
            )
            
            // 查找与终点相交的元素（目标元素）
            const targetElement = canvasElements.find(el => 
              el.id !== element.id && 
              el.type !== ElementType.ARROW &&
              el.type !== ElementType.LINE &&
              endPoint.x >= el.position.x &&
              endPoint.x <= el.position.x + el.size.x &&
              endPoint.y >= el.position.y &&
              endPoint.y <= el.position.y + el.size.y
            )
            
            // 如果找到了源元素，直接使用其画布元素ID
            if (sourceElement) {
              element.data.sourceElementId = sourceElement.id
            }
            
            // 如果找到了目标元素，直接使用其画布元素ID
            if (targetElement) {
              element.data.targetElementId = targetElement.id
            }
            
            // 更新 sourceTemplateId 和 targetTemplateId 用于后续ID转换
            if (sourceElement) {
              sourceTemplateId = sourceElement.id
            }
            if (targetElement) {
              targetTemplateId = targetElement.id
            }
          }
          
          // 更新源元素ID（从模板ID转换为画布元素ID）
          // 如果还没有设置 sourceElementId（即 sourceTemplateId 是模板ID），则进行转换
          if (!element.data.sourceElementId && sourceTemplateId) {
            if (idMap.has(sourceTemplateId)) {
              const newSourceId = idMap.get(sourceTemplateId)!
              element.data.sourceElementId = newSourceId
            }
          }
          
          // 更新目标元素ID（从模板ID转换为画布元素ID）
          // 如果还没有设置 targetElementId（即 targetTemplateId 是模板ID），则进行转换
          if (!element.data.targetElementId && targetTemplateId) {
            if (idMap.has(targetTemplateId)) {
              const newTargetId = idMap.get(targetTemplateId)!
              element.data.targetElementId = newTargetId
            }
          }
          
          // 根据源和目标元素的位置重新计算连接点
          const finalSourceId = element.data.sourceElementId
          const finalTargetId = element.data.targetElementId
          
          if (finalSourceId) {
            const sourceEl = canvasElements.find(el => el.id === finalSourceId)
            const targetEl = finalTargetId ? canvasElements.find(el => el.id === finalTargetId) : null
            
            if (sourceEl && targetEl) {
              console.log('🔗 处理连接线:', {
                connectionId: element.id,
                sourceId: finalSourceId,
                targetId: finalTargetId,
                sourceEl: {
                  id: sourceEl.id,
                  type: sourceEl.type,
                  position: sourceEl.position,
                  size: sourceEl.size,
                  label: sourceEl.data?.label || 'N/A'
                },
                targetEl: {
                  id: targetEl.id,
                  type: targetEl.type,
                  position: targetEl.position,
                  size: targetEl.size,
                  label: targetEl.data?.label || 'N/A'
                },
                hasCustomPoints: !!(element.data.customStartPoint && element.data.customEndPoint),
                customStartPoint: element.data.customStartPoint,
                customEndPoint: element.data.customEndPoint
              })
              
              let startPoint: Vector2
              let endPoint: Vector2
              
              // 如果模板中已经有自定义连接点，使用它们
              if (element.data.customStartPoint && element.data.customEndPoint) {
                console.log('✅ 使用模板中的自定义连接点')
                // 使用模板中的自定义连接点（相对坐标 0-1）
                startPoint = {
                  x: sourceEl.position.x + element.data.customStartPoint.x * sourceEl.size.x,
                  y: sourceEl.position.y + element.data.customStartPoint.y * sourceEl.size.y
                }
                endPoint = {
                  x: targetEl.position.x + element.data.customEndPoint.x * targetEl.size.x,
                  y: targetEl.position.y + element.data.customEndPoint.y * targetEl.size.y
                }
                
                const sourceCenterX = sourceEl.position.x + sourceEl.size.x / 2
                const sourceCenterY = sourceEl.position.y + sourceEl.size.y / 2
                const targetCenterX = targetEl.position.x + targetEl.size.x / 2
                const targetCenterY = targetEl.position.y + targetEl.size.y / 2
                
                console.log('📍 从自定义点计算:', {
                  customStartPoint: element.data.customStartPoint,
                  customEndPoint: element.data.customEndPoint,
                  calculatedStartPoint: startPoint,
                  calculatedEndPoint: endPoint
                })
                
                console.log('📊 分支详细信息 (使用自定义点):', {
                  中心节点: {
                    id: sourceEl.id,
                    position: sourceEl.position,
                    size: sourceEl.size,
                    center: { x: sourceCenterX, y: sourceCenterY },
                    shapeType: sourceEl.data?.shapeType
                  },
                  分支节点: {
                    id: targetEl.id,
                    position: targetEl.position,
                    size: targetEl.size,
                    center: { x: targetCenterX, y: targetCenterY },
                    shapeType: targetEl.data?.shapeType
                  },
                  初始连接点: {
                    position: startPoint,
                    relativeToSource: element.data.customStartPoint
                  },
                  结束连接点: {
                    position: endPoint,
                    relativeToTarget: element.data.customEndPoint
                  }
                })
              } else {
                console.log('🔄 重新计算连接点')
                console.log('🔍 元素类型检查:', {
                  sourceShapeType: sourceEl.data?.shapeType,
                  targetShapeType: targetEl.data?.shapeType,
                  sourceType: sourceEl.type,
                  targetType: targetEl.type
                })
                // 根据相对位置计算最佳连接点
                const connectionPoints = this.calculateOptimalConnectionPoints(sourceEl, targetEl)
                startPoint = connectionPoints.startPoint
                endPoint = connectionPoints.endPoint
                
                // 计算调试信息
                const sourceCenterX = sourceEl.position.x + sourceEl.size.x / 2
                const sourceCenterY = sourceEl.position.y + sourceEl.size.y / 2
                const targetCenterX = targetEl.position.x + targetEl.size.x / 2
                const targetCenterY = targetEl.position.y + targetEl.size.y / 2
                const dx = targetCenterX - sourceCenterX
                const dy = targetCenterY - sourceCenterY
                const angle = Math.atan2(dy, dx) * 180 / Math.PI
                
                // 计算思维导图决策信息
                const absDx = Math.abs(dx)
                const absDy = Math.abs(dy)
                const verticalRatio = absDy / (absDx + absDy)
                const useVertical = absDy >= absDx * 0.7 || verticalRatio >= 0.4
                
                // 保存自定义连接点位置（相对于元素的比例位置）
                element.data.customStartPoint = {
                  x: (startPoint.x - sourceEl.position.x) / sourceEl.size.x,
                  y: (startPoint.y - sourceEl.position.y) / sourceEl.size.y
                }
                
                if (targetEl) {
                  element.data.customEndPoint = {
                    x: (endPoint.x - targetEl.position.x) / targetEl.size.x,
                    y: (endPoint.y - targetEl.position.y) / targetEl.size.y
                  }
                }
                
                // 打印详细的连接点信息
                console.log('📍 计算出的连接点:', {
                  startPoint,
                  endPoint,
                  startSide: connectionPoints.startSide,
                  endSide: connectionPoints.endSide,
                  dx,
                  dy,
                  absDx,
                  absDy,
                  angle: angle.toFixed(2),
                  verticalRatio: verticalRatio.toFixed(2),
                  useVertical
                })
                
                console.log('📊 分支详细信息:', {
                  中心节点: {
                    id: sourceEl.id,
                    position: sourceEl.position,
                    size: sourceEl.size,
                    center: { x: sourceCenterX, y: sourceCenterY },
                    shapeType: sourceEl.data?.shapeType
                  },
                  分支节点: {
                    id: targetEl.id,
                    position: targetEl.position,
                    size: targetEl.size,
                    center: { x: targetCenterX, y: targetCenterY },
                    shapeType: targetEl.data?.shapeType
                  },
                  初始连接点: {
                    position: startPoint,
                    relativeToSource: {
                      x: element.data.customStartPoint.x,
                      y: element.data.customStartPoint.y
                    },
                    side: connectionPoints.startSide
                  },
                  结束连接点: {
                    position: endPoint,
                    relativeToTarget: {
                      x: element.data.customEndPoint.x,
                      y: element.data.customEndPoint.y
                    },
                    side: connectionPoints.endSide
                  }
                })
                
                console.log('💾 保存的自定义点:', {
                  customStartPoint: element.data.customStartPoint,
                  customEndPoint: element.data.customEndPoint
                })
              }
              
              // 更新连接线的位置和大小
              const x = Math.min(startPoint.x, endPoint.x)
              const y = Math.min(startPoint.y, endPoint.y)
              const width = Math.abs(endPoint.x - startPoint.x)
              const height = Math.abs(endPoint.y - startPoint.y)
              
              element.position = { x, y }
              element.size = { x: width, y: height }
              
              // 更新连接线的点（相对于连接线位置）
              element.data.points = [
                { x: startPoint.x - x, y: startPoint.y - y },
                { x: endPoint.x - x, y: endPoint.y - y }
              ]
              
              console.log('📐 最终连接线信息:', {
                connectionId: element.id,
                position: element.position,
                size: element.size,
                points: element.data.points,
                startPointY: startPoint.y,
                endPointY: endPoint.y,
                sourceCenterY: sourceEl.position.y + sourceEl.size.y / 2,
                targetCenterY: targetEl.position.y + targetEl.size.y / 2
              })
            }
          }
        }
      }
    })
    
    return { elements: canvasElements, idMap }
  }


  /**
   * 生成唯一元素ID
   */
  private generateElementId(): string {
    return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 计算模板在画布中的最佳位置
   */
  public calculateTemplatePosition(
    template: FlowTemplate, 
    canvasSize: { width: number; height: number },
    existingElements: CanvasElement[] = []
  ): Vector2 {
    // 计算模板的边界
    const templateBounds = this.calculateTemplateBounds(template)
    
    // 始终放置在画布正中央
    const x = (canvasSize.width - templateBounds.width) / 2
    const y = (canvasSize.height - templateBounds.height) / 2
    
    return { x, y }
  }

  /**
   * 计算模板边界
   */
  private calculateTemplateBounds(template: FlowTemplate): { 
    width: number; 
    height: number; 
    minX: number; 
    minY: number 
  } {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    for (const element of template.elements) {
      minX = Math.min(minX, element.position.x)
      minY = Math.min(minY, element.position.y)
      maxX = Math.max(maxX, element.position.x + element.size.x)
      maxY = Math.max(maxY, element.position.y + element.size.y)
    }
    
    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY
    }
  }

  /**
   * 计算已占用区域
   */
  private calculateOccupiedAreas(elements: CanvasElement[]): Array<{
    x: number
    y: number
    width: number
    height: number
  }> {
    return elements.map(element => ({
      x: element.position.x,
      y: element.position.y,
      width: element.size.x,
      height: element.size.y
    }))
  }

  /**
   * 寻找最佳位置
   */
  private findBestPosition(
    templateBounds: { width: number; height: number },
    occupiedAreas: Array<{ x: number; y: number; width: number; height: number }>,
    canvasSize: { width: number; height: number }
  ): Vector2 | null {
    const margin = 50 // 边距
    const step = 50 // 搜索步长
    
    // 从画布中心开始搜索
    const centerX = canvasSize.width / 2
    const centerY = canvasSize.height / 2
    
    // 搜索范围
    const searchRadius = Math.min(canvasSize.width, canvasSize.height) / 2
    
    for (let radius = 0; radius <= searchRadius; radius += step) {
      for (let angle = 0; angle < 360; angle += 30) {
        const x = centerX + radius * Math.cos(angle * Math.PI / 180)
        const y = centerY + radius * Math.sin(angle * Math.PI / 180)
        
        // 检查边界
        if (x < margin || y < margin || 
            x + templateBounds.width > canvasSize.width - margin || 
            y + templateBounds.height > canvasSize.height - margin) {
          continue
        }
        
        // 检查是否与现有元素重叠
        const newArea = {
          x: x,
          y: y,
          width: templateBounds.width,
          height: templateBounds.height
        }
        
        if (!this.isOverlapping(newArea, occupiedAreas)) {
          return { x: x, y: y }
        }
      }
    }
    
    return null
  }

  /**
   * 检查是否重叠
   */
  private isOverlapping(
    area: { x: number; y: number; width: number; height: number },
    occupiedAreas: Array<{ x: number; y: number; width: number; height: number }>
  ): boolean {
    for (const occupied of occupiedAreas) {
      if (this.rectanglesOverlap(area, occupied)) {
        return true
      }
    }
    return false
  }

  /**
   * 检查两个矩形是否重叠
   */
  private rectanglesOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y)
  }

  /**
   * 根据源和目标元素的相对位置计算最佳连接点
   */
  private calculateOptimalConnectionPoints(
    sourceElement: CanvasElement, 
    targetElement: CanvasElement
  ): { 
    startPoint: Vector2, 
    endPoint: Vector2, 
    startSide: 'left' | 'right' | 'top' | 'bottom',
    endSide: 'left' | 'right' | 'top' | 'bottom'
  } {
    const sourceCenterX = sourceElement.position.x + sourceElement.size.x / 2
    const sourceCenterY = sourceElement.position.y + sourceElement.size.y / 2
    const targetCenterX = targetElement.position.x + targetElement.size.x / 2
    const targetCenterY = targetElement.position.y + targetElement.size.y / 2
    
    // 检查是否是思维导图结构（中心节点通常是圆形或椭圆）
    const isCenterNode = sourceElement.data?.shapeType === 'ellipse' || 
                        sourceElement.data?.shapeType === 'circle'
    const isBranchNode = targetElement.data?.shapeType === 'rectangle'
    
    // 如果是思维导图结构，使用特殊规则
    if (isCenterNode && isBranchNode) {
      // 计算分支相对于中心节点的位置
      const dx = targetCenterX - sourceCenterX
      const dy = targetCenterY - sourceCenterY
      
      // 计算距离以确定主要方向
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      
      let startSide: 'left' | 'right' | 'top' | 'bottom'
      let endSide: 'left' | 'right' | 'top' | 'bottom'
      
      // 对于思维导图，优先考虑垂直方向（上下连接更符合思维导图的视觉习惯）
      // 如果垂直距离足够大（至少是水平距离的70%），使用上下连接
      // 否则使用左右连接
      const verticalRatio = absDy / (absDx + absDy) // 垂直距离占比
      const useVertical = absDy >= absDx * 0.7 || verticalRatio >= 0.4
      
      if (useVertical) {
        // 垂直方向为主
        if (dy < 0) {
          // 分支在中心节点的上方
          startSide = 'top'
          endSide = 'bottom'
        } else {
          // 分支在中心节点的下方
          startSide = 'bottom'
          endSide = 'top'
        }
      } else {
        // 水平方向为主
        if (dx < 0) {
          // 分支在中心节点的左侧
          startSide = 'left'
          endSide = 'right'
        } else {
          // 分支在中心节点的右侧
          startSide = 'right'
          endSide = 'left'
        }
      }
      
      // 计算连接点
      const startPoint = this.calculateConnectionPoint(sourceElement, startSide)
      const endPoint = this.calculateConnectionPoint(targetElement, endSide)
      
      return { startPoint, endPoint, startSide, endSide }
    }
    
    // 非思维导图结构，使用原有逻辑
    // 计算源元素到目标元素的方向
    const dx = targetCenterX - sourceCenterX
    const dy = targetCenterY - sourceCenterY
    
    // 计算距离（用于确定主要方向）
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    
    let startSide: 'left' | 'right' | 'top' | 'bottom'
    let endSide: 'left' | 'right' | 'top' | 'bottom'
    
    // 根据主要方向选择连接边
    if (absDx > absDy) {
      // 水平方向为主
      if (dx > 0) {
        // 目标在源的右边
        startSide = 'right'
        endSide = 'left'
      } else {
        // 目标在源的左边
        startSide = 'left'
        endSide = 'right'
      }
    } else {
      // 垂直方向为主
      if (dy > 0) {
        // 目标在源的下边
        startSide = 'bottom'
        endSide = 'top'
      } else {
        // 目标在源的上边
        startSide = 'top'
        endSide = 'bottom'
      }
    }
    
    // 计算连接点
    const startPoint = this.calculateConnectionPoint(sourceElement, startSide)
    const endPoint = this.calculateConnectionPoint(targetElement, endSide)
    
    return { startPoint, endPoint, startSide, endSide }
  }
  
  /**
   * 计算元素指定边的连接点
   */
  private calculateConnectionPoint(
    element: CanvasElement, 
    side: 'left' | 'right' | 'top' | 'bottom'
  ): Vector2 {
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
   * 更新连接线元素的位置（简化版本 - 直接返回原元素）
   */
  public updateConnectionElements(
    elements: CanvasElement[], 
    template: FlowTemplate
  ): CanvasElement[] {
    // 简化版本：直接返回原元素，不进行复杂的连接线更新
    return elements
  }
}
