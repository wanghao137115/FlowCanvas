/**
 * 坐标系统测试
 * 验证预览和最终绘制的一致性
 */

import type { CanvasElement, Vector2 } from '@/types/canvas.types'
import { Renderer } from './Renderer'
import { ViewportManager } from './ViewportManager'
import { CoordinateTransformer } from './CoordinateTransformer'

/**
 * 坐标系统测试类
 */
export class CoordinateTest {
  private renderer: Renderer
  private viewportManager: ViewportManager
  private coordinateTransformer: CoordinateTransformer

  constructor(canvas: HTMLCanvasElement) {
    this.viewportManager = new ViewportManager()
    this.coordinateTransformer = new CoordinateTransformer(this.viewportManager)
    this.renderer = new Renderer(canvas, this.viewportManager, this.coordinateTransformer)
  }

  /**
   * 测试文本元素坐标一致性
   */
  testTextElementCoordinates(): void {
    console.log('🧪 测试文本元素坐标一致性')
    
    // 创建测试文本元素
    const textElement: CanvasElement = {
      id: 'test_text_1',
      type: 'text',
      position: { x: 100, y: 100 },
      size: { x: 200, y: 50 },
      rotation: 0,
      visible: true,
      style: {
        fill: '#000000',
        fontSize: 16,
        fontFamily: 'Arial'
      },
      data: {
        text: '测试文本'
      }
    }

    // 测试预览坐标
    console.log('📝 文本元素预览坐标:', {
      element: textElement,
      screenPos: this.coordinateTransformer.virtualToScreen(textElement.position),
      viewport: this.viewportManager.getViewport()
    })

    // 开始预览
    this.renderer.startPreview()
    this.renderer.setPreviewElements([textElement])
    
    // 模拟最终绘制
    setTimeout(() => {
      this.renderer.endPreview()
      this.renderer.render([textElement])
      console.log('✅ 文本元素最终绘制完成')
    }, 1000)
  }

  /**
   * 测试路径元素坐标一致性
   */
  testPathElementCoordinates(): void {
    console.log('🧪 测试路径元素坐标一致性')
    
    // 创建测试路径元素
    const pathElement: CanvasElement = {
      id: 'test_path_1',
      type: 'path',
      position: { x: 150, y: 150 },
      size: { x: 100, y: 100 },
      rotation: 0,
      visible: true,
      style: {
        stroke: '#FF0000',
        strokeWidth: 3
      },
      data: {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 50 },
          { x: 100, y: 0 }
        ]
      }
    }

    // 测试预览坐标
    console.log('🖊️ 路径元素预览坐标:', {
      element: pathElement,
      screenPos: this.coordinateTransformer.virtualToScreen(pathElement.position),
      viewport: this.viewportManager.getViewport()
    })

    // 开始预览
    this.renderer.startPreview()
    this.renderer.setPreviewElements([pathElement])
    
    // 模拟最终绘制
    setTimeout(() => {
      this.renderer.endPreview()
      this.renderer.render([pathElement])
      console.log('✅ 路径元素最终绘制完成')
    }, 1000)
  }

  /**
   * 测试图片元素坐标一致性
   */
  testImageElementCoordinates(): void {
    console.log('🧪 测试图片元素坐标一致性')
    
    // 创建测试图片元素
    const imageElement: CanvasElement = {
      id: 'test_image_1',
      type: 'image',
      position: { x: 200, y: 200 },
      size: { x: 100, y: 100 },
      rotation: 0,
      visible: true,
      style: {},
      data: {
        image: null // 这里应该是实际的图片对象
      }
    }

    // 测试预览坐标
    console.log('🖼️ 图片元素预览坐标:', {
      element: imageElement,
      screenPos: this.coordinateTransformer.virtualToScreen(imageElement.position),
      viewport: this.viewportManager.getViewport()
    })

    // 开始预览
    this.renderer.startPreview()
    this.renderer.setPreviewElements([imageElement])
    
    // 模拟最终绘制
    setTimeout(() => {
      this.renderer.endPreview()
      this.renderer.render([imageElement])
      console.log('✅ 图片元素最终绘制完成')
    }, 1000)
  }

  /**
   * 测试箭头元素坐标一致性
   */
  testArrowElementCoordinates(): void {
    console.log('🧪 测试箭头元素坐标一致性')
    
    // 创建测试箭头元素
    const arrowElement: CanvasElement = {
      id: 'test_arrow_1',
      type: 'arrow',
      position: { x: 250, y: 250 },
      size: { x: 100, y: 50 },
      rotation: 0,
      visible: true,
      style: {
        stroke: '#00FF00',
        strokeWidth: 3
      },
      data: {
        points: [
          { x: 0, y: 25 },
          { x: 100, y: 25 }
        ],
        arrowType: 'line',
        arrowStyle: {
          size: 10,
          shape: 'triangle'
        }
      }
    }

    // 测试预览坐标
    console.log('🏹 箭头元素预览坐标:', {
      element: arrowElement,
      screenPos: this.coordinateTransformer.virtualToScreen(arrowElement.position),
      viewport: this.viewportManager.getViewport()
    })

    // 开始预览
    this.renderer.startPreview()
    this.renderer.setPreviewElements([arrowElement])
    
    // 模拟最终绘制
    setTimeout(() => {
      this.renderer.endPreview()
      this.renderer.render([arrowElement])
      console.log('✅ 箭头元素最终绘制完成')
    }, 1000)
  }

  /**
   * 运行所有测试
   */
  runAllTests(): void {
    console.log('🚀 开始坐标系统一致性测试')
    
    // 设置测试视口
    this.viewportManager.setOffset({ x: 50, y: 50 })
    this.viewportManager.setScale(1.5)
    
    console.log('📊 测试视口设置:', this.viewportManager.getViewport())
    
    // 依次运行测试
    this.testTextElementCoordinates()
    
    setTimeout(() => {
      this.testPathElementCoordinates()
    }, 2000)
    
    setTimeout(() => {
      this.testImageElementCoordinates()
    }, 4000)
    
    setTimeout(() => {
      this.testArrowElementCoordinates()
    }, 6000)
    
    setTimeout(() => {
      console.log('🎉 所有坐标系统测试完成')
    }, 8000)
  }
}

/**
 * 创建坐标测试实例
 */
export function createCoordinateTest(canvas: HTMLCanvasElement): CoordinateTest {
  return new CoordinateTest(canvas)
}
