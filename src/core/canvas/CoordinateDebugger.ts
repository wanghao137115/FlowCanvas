/**
 * 坐标调试工具
 * 用于调试画布坐标转换问题
 */

import type { CanvasElement, Vector2, Viewport } from '@/types/canvas.types'
import { Renderer } from './Renderer'
import { ViewportManager } from './ViewportManager'
import { CoordinateTransformer } from './CoordinateTransformer'

/**
 * 坐标调试器
 */
export class CoordinateDebugger {
  private renderer: Renderer
  private viewportManager: ViewportManager
  private coordinateTransformer: CoordinateTransformer
  private debugInfo: {
    preview: any[]
    final: any[]
    viewport: Viewport
  } = {
    preview: [],
    final: [],
    viewport: { offset: { x: 0, y: 0 }, scale: 1, width: 800, height: 600 }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.viewportManager = new ViewportManager()
    this.coordinateTransformer = new CoordinateTransformer(this.viewportManager.getViewport())
    this.renderer = new Renderer(canvas, this.viewportManager, this.coordinateTransformer)
  }

  /**
   * 记录预览坐标信息
   */
  logPreviewCoordinates(element: CanvasElement, screenPos: Vector2): void {
    const debugEntry = {
      timestamp: new Date().toISOString(),
      element: {
        id: element.id,
        type: element.type,
        position: { ...element.position },
        size: { ...element.size }
      },
      coordinates: {
        virtual: { ...element.position },
        screen: { ...screenPos },
        converted: this.coordinateTransformer.virtualToScreen(element.position)
      },
      viewport: { ...this.viewportManager.getViewport() }
    }
    
    this.debugInfo.preview.push(debugEntry)
    console.log('🔍 预览坐标调试:', debugEntry)
  }

  /**
   * 记录最终绘制坐标信息
   */
  logFinalCoordinates(element: CanvasElement): void {
    const debugEntry = {
      timestamp: new Date().toISOString(),
      element: {
        id: element.id,
        type: element.type,
        position: { ...element.position },
        size: { ...element.size }
      },
      coordinates: {
        virtual: { ...element.position },
        screen: this.coordinateTransformer.virtualToScreen(element.position)
      },
      viewport: { ...this.viewportManager.getViewport() }
    }
    
    this.debugInfo.final.push(debugEntry)
    console.log('🎯 最终绘制坐标调试:', debugEntry)
  }

  /**
   * 检查坐标一致性
   */
  checkCoordinateConsistency(): void {
    if (this.debugInfo.preview.length === 0 || this.debugInfo.final.length === 0) {
      console.log('⚠️ 没有足够的调试数据来检查坐标一致性')
      return
    }

    const lastPreview = this.debugInfo.preview[this.debugInfo.preview.length - 1]
    const lastFinal = this.debugInfo.final[this.debugInfo.final.length - 1]

    const previewScreen = lastPreview.coordinates.screen
    const finalScreen = lastFinal.coordinates.screen

    const deltaX = Math.abs(previewScreen.x - finalScreen.x)
    const deltaY = Math.abs(previewScreen.y - finalScreen.y)

    console.log('📊 坐标一致性检查:', {
      previewScreen,
      finalScreen,
      delta: { x: deltaX, y: deltaY },
      isConsistent: deltaX < 1 && deltaY < 1
    })

    if (deltaX > 1 || deltaY > 1) {
      console.error('❌ 坐标不一致！预览和最终绘制位置不匹配')
      console.error('预览位置:', previewScreen)
      console.error('最终位置:', finalScreen)
      console.error('差异:', { x: deltaX, y: deltaY })
    } else {
      console.log('✅ 坐标一致！预览和最终绘制位置匹配')
    }
  }

  /**
   * 获取调试信息摘要
   */
  getDebugSummary(): any {
    return {
      totalPreview: this.debugInfo.preview.length,
      totalFinal: this.debugInfo.final.length,
      viewport: this.debugInfo.viewport,
      lastPreview: this.debugInfo.preview[this.debugInfo.preview.length - 1],
      lastFinal: this.debugInfo.final[this.debugInfo.final.length - 1]
    }
  }

  /**
   * 清空调试信息
   */
  clearDebugInfo(): void {
    this.debugInfo.preview = []
    this.debugInfo.final = []
    console.log('🗑️ 调试信息已清空')
  }

  /**
   * 导出调试信息
   */
  exportDebugInfo(): string {
    return JSON.stringify(this.debugInfo, null, 2)
  }

  /**
   * 设置视口状态用于测试
   */
  setTestViewport(offset: Vector2, scale: number): void {
    this.viewportManager.setOffset(offset)
    this.viewportManager.setScale(scale)
    this.debugInfo.viewport = this.viewportManager.getViewport()
    console.log('🔧 测试视口已设置:', this.debugInfo.viewport)
  }

  /**
   * 模拟坐标转换问题
   */
  simulateCoordinateIssue(): void {
    console.log('🧪 模拟坐标转换问题...')
    
    // 设置一个复杂的视口状态
    this.setTestViewport({ x: 100, y: 50 }, 1.5)
    
    // 创建一个测试元素
    const testElement: CanvasElement = {
      id: 'test_coordinate_issue',
      type: 'text',
      position: { x: 200, y: 150 },
      size: { x: 100, y: 30 },
      rotation: 0,
      visible: true,
      style: {
        fill: '#FF0000',
        fontSize: 16,
        fontFamily: 'Arial'
      },
      data: {
        text: '坐标测试'
      }
    }

    // 记录预览坐标
    const screenPos = this.coordinateTransformer.virtualToScreen(testElement.position)
    this.logPreviewCoordinates(testElement, screenPos)
    
    // 记录最终绘制坐标
    this.logFinalCoordinates(testElement)
    
    // 检查一致性
    this.checkCoordinateConsistency()
  }
}

/**
 * 创建坐标调试器实例
 */
export function createCoordinateDebugger(canvas: HTMLCanvasElement): CoordinateDebugger {
  return new CoordinateDebugger(canvas)
}
