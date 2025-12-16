/**
 * 绘制系统使用示例
 * 展示如何使用新的预览和最终绘制系统
 */

import type { CanvasElement, Vector2 } from '@/types/canvas.types'
import { Renderer } from './Renderer'
import { ViewportManager } from './ViewportManager'
import { CoordinateTransformer } from './CoordinateTransformer'
import { ArrowTool, ArrowType, ArrowShape } from '../tools/ArrowTool'

/**
 * 绘制系统示例类
 */
export class DrawingSystemExample {
  private renderer: Renderer
  private arrowTool: ArrowTool
  private elements: CanvasElement[] = []
  private isDrawing: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    // 初始化核心组件
    const viewportManager = new ViewportManager()
    const coordinateTransformer = new CoordinateTransformer(viewportManager)
    this.renderer = new Renderer(canvas, viewportManager, coordinateTransformer)
    
    // 初始化箭头工具
    this.arrowTool = new ArrowTool()
    this.setupArrowTool()
    
    // 绑定画布事件
    this.bindCanvasEvents(canvas)
  }

  /**
   * 设置箭头工具
   */
  private setupArrowTool(): void {
    // 设置箭头类型和样式
    this.arrowTool.setArrowType(ArrowType.LINE)
    this.arrowTool.setArrowStyle({
      size: 20,
      shape: ArrowShape.TRIANGLE,
      color: '#007AFF',
      strokeWidth: 3,
      strokeColor: '#007AFF',
      opacity: 1
    })

    // 设置回调函数
    this.arrowTool.setOnArrowComplete((arrow) => {
      if (arrow.element) {
        // 添加最终元素到画布
        this.elements.push(arrow.element)
        
        // 结束预览模式
        this.renderer.endPreview()
        
        // 重新渲染画布
        this.renderer.render(this.elements)
        
        console.log('✅ 箭头绘制完成，元素已添加到画布')
      }
    })

    this.arrowTool.setOnDrawingStateChange((isDrawing) => {
      this.isDrawing = isDrawing
      if (isDrawing) {
        // 开始预览模式
        this.renderer.startPreview()
        console.log('🎨 开始绘制箭头，预览模式已启动')
      }
    })
  }

  /**
   * 绑定画布事件
   */
  private bindCanvasEvents(canvas: HTMLCanvasElement): void {
    // 鼠标按下事件
    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect()
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      
      this.arrowTool.onMouseDown({ position, event })
    })

    // 鼠标移动事件
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect()
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      
      this.arrowTool.onMouseMove({ position, event })
      
      // 如果正在绘制，更新预览
      if (this.isDrawing) {
        this.updatePreview()
      }
    })

    // 鼠标抬起事件
    canvas.addEventListener('mouseup', (event) => {
      const rect = canvas.getBoundingClientRect()
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      
      this.arrowTool.onMouseUp({ position, event })
    })

    // 键盘事件
    document.addEventListener('keydown', (event) => {
      this.arrowTool.onKeyDown({ event })
    })
  }

  /**
   * 更新预览
   */
  private updatePreview(): void {
    // 创建预览元素
    const previewElement = this.arrowTool.createArrowElement()
    if (previewElement) {
      // 设置预览元素（带虚线效果）
      this.renderer.setPreviewElements([previewElement])
    }
  }

  /**
   * 添加测试元素
   */
  addTestElements(): void {
    // 添加一个矩形作为吸附目标
    const rectangle: CanvasElement = {
      id: 'test_rect_1',
      type: 'shape',
      position: { x: 100, y: 100 },
      size: { x: 200, y: 150 },
      rotation: 0,
      visible: true,
      style: {
        fill: '#E3F2FD',
        stroke: '#2196F3',
        strokeWidth: 2
      },
      data: {}
    }

    // 添加一个文本元素
    const text: CanvasElement = {
      id: 'test_text_1',
      type: 'text',
      position: { x: 350, y: 120 },
      size: { x: 150, y: 50 },
      rotation: 0,
      visible: true,
      style: {
        fill: '#333333',
        fontSize: 18,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      },
      data: {
        text: '测试文本'
      }
    }

    this.elements.push(rectangle, text)
    this.renderer.render(this.elements)
    
    console.log('📦 测试元素已添加到画布')
  }

  /**
   * 清空画布
   */
  clearCanvas(): void {
    this.elements = []
    this.renderer.render(this.elements)
    console.log('🗑️ 画布已清空')
  }

  /**
   * 获取当前元素数量
   */
  getElementCount(): number {
    return this.elements.length
  }

  /**
   * 获取所有元素
   */
  getAllElements(): CanvasElement[] {
    return [...this.elements]
  }
}

/**
 * 使用示例
 */
export function createDrawingSystemExample(canvas: HTMLCanvasElement): DrawingSystemExample {
  const example = new DrawingSystemExample(canvas)
  
  // 添加一些测试元素
  example.addTestElements()
  
  return example
}
