/**
 * 2D变换矩阵�?
 */
export class Matrix2D {
  public a: number = 1  // scaleX
  public b: number = 0  // skewY
  public c: number = 0  // skewX
  public d: number = 1  // scaleY
  public e: number = 0  // translateX
  public f: number = 0  // translateY

  constructor(a: number = 1, b: number = 0, c: number = 0, d: number = 1, e: number = 0, f: number = 0) {
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f
  }

  /**
   * 创建单位矩阵
   */
  static identity(): Matrix2D {
    return new Matrix2D()
  }

  /**
   * 创建平移矩阵
   */
  static translate(x: number, y: number): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, x, y)
  }

  /**
   * 创建缩放矩阵
   */
  static scale(sx: number, sy: number = sx): Matrix2D {
    return new Matrix2D(sx, 0, 0, sy, 0, 0)
  }

  /**
   * 创建旋转矩阵
   */
  static rotate(angle: number): Matrix2D {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return new Matrix2D(cos, sin, -sin, cos, 0, 0)
  }

  /**
   * 矩阵乘法
   */
  multiply(other: Matrix2D): Matrix2D {
    return new Matrix2D(
      this.a * other.a + this.c * other.b,
      this.b * other.a + this.d * other.b,
      this.a * other.c + this.c * other.d,
      this.b * other.c + this.d * other.d,
      this.a * other.e + this.c * other.f + this.e,
      this.b * other.e + this.d * other.f + this.f
    )
  }

  /**
   * 变换�?
   */
  transformPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f
    }
  }

  /**
   * 逆变换点
   */
  inverseTransformPoint(x: number, y: number): { x: number; y: number } {
    const det = this.a * this.d - this.b * this.c
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible')
    }

    const invDet = 1 / det
    const invA = this.d * invDet
    const invB = -this.b * invDet
    const invC = -this.c * invDet
    const invD = this.a * invDet
    const invE = (this.c * this.f - this.d * this.e) * invDet
    const invF = (this.b * this.e - this.a * this.f) * invDet

    return {
      x: invA * x + invC * y + invE,
      y: invB * x + invD * y + invF
    }
  }

  /**
   * 获取逆矩�?
   */
  inverse(): Matrix2D {
    const det = this.a * this.d - this.b * this.c
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible')
    }

    const invDet = 1 / det
    return new Matrix2D(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.f - this.d * this.e) * invDet,
      (this.b * this.e - this.a * this.f) * invDet
    )
  }

  /**
   * 克隆矩阵
   */
  clone(): Matrix2D {
    return new Matrix2D(this.a, this.b, this.c, this.d, this.e, this.f)
  }

  /**
   * 重置为单位矩�?
   */
  reset(): void {
    this.a = 1
    this.b = 0
    this.c = 0
    this.d = 1
    this.e = 0
    this.f = 0
  }

  /**
   * 应用变换到Canvas 2D上下�?
   */
  applyToContext(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.a, this.b, this.c, this.d, this.e, this.f)
  }
}
