import type { Vector2, Bounds } from '@/types/canvas.types'
import { Vector2Utils } from './Vector2'

/**
 * 几何工具�?
 */
export class GeometryUtils {
  /**
   * 检查点是否在矩形内
   */
  static pointInRect(point: Vector2, rect: Bounds): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width &&
           point.y >= rect.y && 
           point.y <= rect.y + rect.height
  }

  /**
   * 检查两个矩形是否相�?
   */
  static rectsIntersect(rect1: Bounds, rect2: Bounds): boolean {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y)
  }

  /**
   * 获取两个矩形的交�?
   */
  static rectIntersection(rect1: Bounds, rect2: Bounds): Bounds | null {
    const left = Math.max(rect1.x, rect2.x)
    const top = Math.max(rect1.y, rect2.y)
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width)
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height)

    if (left < right && top < bottom) {
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
      }
    }

    return null
  }

  /**
   * 获取包围多个点的矩形
   */
  static getBoundingRect(points: Vector2[]): Bounds {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
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

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 计算点到线段的距�?
   */
  static pointToLineDistance(point: Vector2, lineStart: Vector2, lineEnd: Vector2): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D

    if (lenSq === 0) {
      return Vector2Utils.distance(point, lineStart)
    }

    let param = dot / lenSq

    let xx: number, yy: number

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 计算点到矩形的距�?
   */
  static pointToRectDistance(point: Vector2, rect: Bounds): number {
    const dx = Math.max(0, Math.max(rect.x - point.x, point.x - (rect.x + rect.width)))
    const dy = Math.max(0, Math.max(rect.y - point.y, point.y - (rect.y + rect.height)))
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 角度转弧�?
   */
  static degToRad(degrees: number): number {
    return degrees * Math.PI / 180
  }

  /**
   * 弧度转角�?
   */
  static radToDeg(radians: number): number {
    return radians * 180 / Math.PI
  }

  /**
   * 标准化角度到 [0, 2π] 范围
   */
  static normalizeAngle(angle: number): number {
    while (angle < 0) angle += 2 * Math.PI
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI
    return angle
  }

  /**
   * 计算两点间的角度
   */
  static angleBetweenPoints(from: Vector2, to: Vector2): number {
    return Math.atan2(to.y - from.y, to.x - from.x)
  }

  /**
   * 计算矩形的中心点
   */
  static getRectCenter(rect: Bounds): Vector2 {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    }
  }

  /**
   * 扩展矩形以包含点
   */
  static expandRectToIncludePoint(rect: Bounds, point: Vector2): Bounds {
    const newX = Math.min(rect.x, point.x)
    const newY = Math.min(rect.y, point.y)
    const newWidth = Math.max(rect.x + rect.width, point.x) - newX
    const newHeight = Math.max(rect.y + rect.height, point.y) - newY

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    }
  }

  /**
   * 扩展矩形以包含另一个矩�?
   */
  static expandRectToIncludeRect(rect1: Bounds, rect2: Bounds): Bounds {
    const newX = Math.min(rect1.x, rect2.x)
    const newY = Math.min(rect1.y, rect2.y)
    const newWidth = Math.max(rect1.x + rect1.width, rect2.x + rect2.width) - newX
    const newHeight = Math.max(rect1.y + rect1.height, rect2.y + rect2.height) - newY

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    }
  }
}
