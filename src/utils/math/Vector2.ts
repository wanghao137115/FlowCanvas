import type { Vector2 } from '@/types/canvas.types'

/**
 * 2D向量工具�?
 */
export class Vector2Utils {
  /**
   * 创建向量
   */
  static create(x: number = 0, y: number = 0): Vector2 {
    return { x, y }
  }

  /**
   * 向量加法
   */
  static add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y }
  }

  /**
   * 向量减法
   */
  static subtract(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y }
  }

  /**
   * 向量乘法（标量）
   */
  static multiply(vector: Vector2, scalar: number): Vector2 {
    return { x: vector.x * scalar, y: vector.y * scalar }
  }

  /**
   * 向量除法（标量）
   */
  static divide(vector: Vector2, scalar: number): Vector2 {
    return { x: vector.x / scalar, y: vector.y / scalar }
  }

  /**
   * 向量长度
   */
  static length(vector: Vector2): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
  }

  /**
   * 向量归一�?
   */
  static normalize(vector: Vector2): Vector2 {
    const len = this.length(vector)
    if (len === 0) return { x: 0, y: 0 }
    return { x: vector.x / len, y: vector.y / len }
  }

  /**
   * 向量点积
   */
  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y
  }

  /**
   * 向量距离
   */
  static distance(a: Vector2, b: Vector2): number {
    return this.length(this.subtract(a, b))
  }

  /**
   * 向量插�?
   */
  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    }
  }

  /**
   * 向量克隆
   */
  static clone(vector: Vector2): Vector2 {
    return { x: vector.x, y: vector.y }
  }

  /**
   * 向量是否相等
   */
  static equals(a: Vector2, b: Vector2, epsilon: number = 0.001): boolean {
    return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon
  }
}
