<template>
  <div class="mini-map-container" v-if="visible">
    <div class="mini-map-wrapper" ref="miniMapWrapper">
      <canvas 
        ref="previewCanvas" 
        class="mini-map-canvas"
        @mousedown="handleCanvasMouseDown"
      ></canvas>
      <div 
        v-if="isDragging"
        class="viewport-frame"
        :style="viewportFrameStyle"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'
import type { CanvasElement } from '@/types/canvas.types'
import { ElementType } from '@/types/canvas.types'

interface Props {
  visible?: boolean
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  width: 200,
  height: 150
})

const canvasStore = useCanvasStore()
const miniMapWrapper = ref<HTMLDivElement | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)

let previewCtx: CanvasRenderingContext2D | null = null
const isDragging = ref(false)
let dragStart = { x: 0, y: 0 }
let viewportStart = { x: 0, y: 0 }

// 图片加载缓存
const imageCache = new Map<string, HTMLImageElement>()

// 计算画布边界
const canvasBounds = computed(() => {
  const elements = canvasStore.elements.value
  // 安全检查：确保 elements 存在且是数组
  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    return {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  elements.forEach(element => {
    // 跳过无效元素
    if (!element.position || !element.size) {
      return
    }
    
    // 处理有points的元素（箭头、线条、路径）
    const points = (element.data as any)?.points || []
    if (points.length > 0) {
      points.forEach((point: { x: number; y: number }) => {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
          const absX = element.position.x + point.x
          const absY = element.position.y + point.y
          minX = Math.min(minX, absX)
          minY = Math.min(minY, absY)
          maxX = Math.max(maxX, absX)
          maxY = Math.max(maxY, absY)
        }
      })
    } else {
      // 普通元素
      const x = element.position.x
      const y = element.position.y
      const w = element.size.x
      const h = element.size.y
      
      if (typeof x === 'number' && typeof y === 'number' && 
          typeof w === 'number' && typeof h === 'number') {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x + w)
        maxY = Math.max(maxY, y + h)
      }
    }
  })

  // 添加边距
  const padding = 50
  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(maxX - minX + padding * 2, 1000),
    height: Math.max(maxY - minY + padding * 2, 1000)
  }
})

// 计算缩放比例
const scale = computed(() => {
  const bounds = canvasBounds.value
  const scaleX = props.width / bounds.width
  const scaleY = props.height / bounds.height
  return Math.min(scaleX, scaleY, 1) // 不超过1，避免放大
})

// 计算视口框样式
const viewportFrameStyle = computed(() => {
  const viewport = canvasStore.viewport
  const bounds = canvasBounds.value
  const scaleValue = scale.value

  // 计算视口在画布空间的位置
  const viewportX = -viewport.offset.x / viewport.scale
  const viewportY = -viewport.offset.y / viewport.scale
  const viewportWidth = viewport.width / viewport.scale
  const viewportHeight = viewport.height / viewport.scale

  // 转换为缩略图坐标
  const x = (viewportX - bounds.x) * scaleValue
  const y = (viewportY - bounds.y) * scaleValue
  const width = viewportWidth * scaleValue
  const height = viewportHeight * scaleValue

  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

// 渲染预览
const renderPreview = async () => {
  if (!previewCanvas.value || !previewCtx) {
    return
  }

  const canvas = previewCanvas.value
  const ctx = previewCtx
  const bounds = canvasBounds.value
  const scaleValue = scale.value

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制背景
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格（可选）
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5
  const gridSize = 20 * scaleValue
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }

  // 绘制元素 - 显示所有已添加到画布上的元素
  const elements = canvasStore.elements.value
  // 安全检查：确保 elements 存在且是数组
  if (!elements || !Array.isArray(elements)) {
    return
  }
  elements.forEach((element) => {
    drawElement(ctx, element, bounds, scaleValue)
  })
}

// 绘制单个元素
const drawElement = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  bounds: { x: number; y: number; width: number; height: number },
  scaleValue: number
) => {
  // 使用 toRaw 确保从响应式对象中提取实际值
  const rawElement = toRaw(element)
  const rawPosition = rawElement.position ? toRaw(rawElement.position) : null
  const rawSize = rawElement.size ? toRaw(rawElement.size) : null
  
  // 验证元素数据
  if (!rawPosition || !rawSize) {
    return
  }

  const x = (rawPosition.x - bounds.x) * scaleValue
  const y = (rawPosition.y - bounds.y) * scaleValue
  const width = rawSize.x * scaleValue
  const height = rawSize.y * scaleValue

  // 检查元素是否在可见区域内（允许一些溢出）
  const canvasWidth = previewCanvas.value?.width || props.width
  const canvasHeight = previewCanvas.value?.height || props.height
  if (x + width < -10 || x > canvasWidth + 10 ||
      y + height < -10 || y > canvasHeight + 10) {
    // 元素在可见区域外，跳过绘制
    return
  }

  ctx.save()

  try {
    switch (element.type) {
      case ElementType.SHAPE:
        drawShape(ctx, element, x, y, width, height)
        break
      case ElementType.TEXT:
        drawText(ctx, element, x, y, width, height)
        break
      case ElementType.IMAGE:
        drawImage(ctx, element, x, y, width, height)
        break
      case ElementType.ARROW:
      case ElementType.LINE:
        drawLine(ctx, element, bounds, scaleValue)
        break
      case ElementType.PATH:
        drawPath(ctx, element, bounds, scaleValue)
        break
    }
  } catch (error) {
    // 绘制元素时出错
  }

  ctx.restore()
}

// 绘制形状
const drawShape = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const style = element.style || {}
  const data = element.data as any

  ctx.fillStyle = style.fill || 'transparent'
  ctx.strokeStyle = style.stroke || '#000000'
  ctx.lineWidth = (style.strokeWidth || 2) * 0.5 // 缩放线宽

  const shapeType = data?.shapeType || 'rectangle'

  ctx.beginPath()
  switch (shapeType) {
    case 'rectangle':
      ctx.rect(x, y, width, height)
      break
    case 'circle':
      ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
      break
    case 'ellipse':
      ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
      break
    case 'triangle':
      ctx.moveTo(x + width / 2, y)
      ctx.lineTo(x, y + height)
      ctx.lineTo(x + width, y + height)
      ctx.closePath()
      break
    default:
      ctx.rect(x, y, width, height)
  }

  if (style.fill && style.fill !== 'transparent') {
    ctx.fill()
  }
  if (style.stroke) {
    ctx.stroke()
  }
}

// 绘制文本
const drawText = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const style = element.style || {}
  const data = element.data as any

  ctx.fillStyle = style.fill || '#000000'
  ctx.font = `${(style.fontSize || 16) * 0.5}px ${style.fontFamily || 'Arial'}`
  ctx.textAlign = (style.textAlign as CanvasTextAlign) || 'left'
  
  const text = data?.text || ''
  ctx.fillText(text.substring(0, 20), x, y + height / 2) // 限制文本长度
}

// 绘制图片
const drawImage = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const data = element.data as any
  
  // 获取图片源
  const imageSrc = data?.src || data?.imageUrl || data?.imageSrc
  
  if (!imageSrc) {
    // 没有图片源，显示占位符
    ctx.fillStyle = '#e0e0e0'
    ctx.fillRect(x, y, width, height)
    ctx.strokeStyle = '#999'
    ctx.strokeRect(x, y, width, height)
    return
  }
  
  // 优先使用 ImageElement 实例的方法（如果可用）
  if (element.type === ElementType.IMAGE && 'getImage' in element && 'loadImage' in element) {
    const imageElement = element as any
    
    // 尝试获取已加载的图片
    if (imageElement.isLoaded && imageElement.isLoaded()) {
      const img = imageElement.getImage()
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          ctx.drawImage(img, x, y, width, height)
          return
        } catch (error) {
          // 绘制已加载图片失败
        }
      }
    }
  }
  
  // 检查缓存
  const cachedImg = imageCache.get(imageSrc)
  if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
    try {
      ctx.drawImage(cachedImg, x, y, width, height)
      return
    } catch (error) {
      imageCache.delete(imageSrc)
    }
  }
  
  // 图片未加载，先显示占位符
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = '#999'
  ctx.strokeRect(x, y, width, height)
  
  // 异步加载图片
  const loadImage = async () => {
    try {
      // 优先使用 ImageElement 的 loadImage 方法
      if (element.type === ElementType.IMAGE && 'loadImage' in element) {
        const imageElement = element as any
        const img = await imageElement.loadImage()
        if (img && img.complete && img.naturalWidth > 0) {
          imageCache.set(imageSrc, img)
          // 触发重新渲染
          nextTick(() => {
            renderPreview()
          })
          return
        }
      }
      
      // 如果 ImageElement 方法不可用，直接创建图片对象
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        if (img.complete && img.naturalWidth > 0) {
          imageCache.set(imageSrc, img)
          // 触发重新渲染
          nextTick(() => {
            renderPreview()
          })
        }
      }
      
      img.onerror = () => {
        imageCache.delete(imageSrc)
      }
      
      img.src = imageSrc
    } catch (error) {
      // 加载图片出错
    }
  }
  
  // 异步加载（不阻塞）
  loadImage()
}

// 绘制线条/箭头
const drawLine = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  bounds: { x: number; y: number },
  scaleValue: number
) => {
  const style = element.style || {}
  const data = element.data as any
  const points = data?.points || []

  if (points.length < 2) return

  ctx.strokeStyle = style.stroke || '#000000'
  ctx.lineWidth = (style.strokeWidth || 2) * 0.5
  ctx.lineCap = 'round'

  ctx.beginPath()
  points.forEach((point: { x: number; y: number }, index: number) => {
    const x = (element.position.x + point.x - bounds.x) * scaleValue
    const y = (element.position.y + point.y - bounds.y) * scaleValue
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()
}

// 绘制路径（画笔元素）
const drawPath = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  bounds: { x: number; y: number },
  scaleValue: number
) => {
  const style = element.style || {}
  const data = element.data as any
  const points = data?.points || []

  if (points.length === 0) return

  ctx.strokeStyle = style.stroke || '#000000'
  ctx.fillStyle = style.fill || 'transparent'
  ctx.lineWidth = (style.strokeWidth || 2) * 0.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 将相对坐标转换为绝对坐标并应用缩放
  const absolutePoints = points.map((point: { x: number; y: number }) => ({
    x: (element.position.x + point.x - bounds.x) * scaleValue,
    y: (element.position.y + point.y - bounds.y) * scaleValue
  }))

  ctx.beginPath()

  if (absolutePoints.length === 1) {
    // 单点，绘制一个小圆点
    const radius = Math.max(1, ctx.lineWidth / 2)
    ctx.arc(absolutePoints[0].x, absolutePoints[0].y, radius, 0, Math.PI * 2)
    ctx.fill()
  } else if (absolutePoints.length === 2) {
    // 两个点，绘制直线
    ctx.moveTo(absolutePoints[0].x, absolutePoints[0].y)
    ctx.lineTo(absolutePoints[1].x, absolutePoints[1].y)
    ctx.stroke()
  } else {
    // 多个点，使用平滑路径
    ctx.moveTo(absolutePoints[0].x, absolutePoints[0].y)
    
    // 使用二次贝塞尔曲线绘制平滑路径
    for (let i = 1; i < absolutePoints.length - 1; i++) {
      const current = absolutePoints[i]
      const next = absolutePoints[i + 1]
      
      // 计算控制点（当前点和下一个点的中点）
      const controlX = (current.x + next.x) / 2
      const controlY = (current.y + next.y) / 2
      
      ctx.quadraticCurveTo(current.x, current.y, controlX, controlY)
    }
    
    // 连接到最后一个点
    const lastPoint = absolutePoints[absolutePoints.length - 1]
    ctx.lineTo(lastPoint.x, lastPoint.y)
    
    if (style.fill && style.fill !== 'transparent') {
      ctx.fill()
    }
    if (style.stroke) {
      ctx.stroke()
    }
  }
}

// 处理画布鼠标按下
const handleCanvasMouseDown = (e: MouseEvent) => {
  if (!previewCanvas.value) return

  e.preventDefault()
  isDragging.value = true
  dragStart = { x: e.clientX, y: e.clientY }
  viewportStart = { ...canvasStore.viewport.offset }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !previewCanvas.value) return

  const deltaX = e.clientX - dragStart.x
  const deltaY = e.clientY - dragStart.y

  // 转换为画布坐标的增量
  const scaleValue = scale.value
  const canvasDeltaX = deltaX / scaleValue
  const canvasDeltaY = deltaY / scaleValue

  // 计算新的视口偏移
  const viewport = canvasStore.viewport
  const newOffsetX = viewportStart.x - canvasDeltaX * viewport.scale
  const newOffsetY = viewportStart.y - canvasDeltaY * viewport.scale

  // 更新视口
  canvasStore.updateViewport({
    offset: { x: newOffsetX, y: newOffsetY }
  })
}

// 处理鼠标抬起
const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 初始化
onMounted(async () => {
  await nextTick()
  
  if (previewCanvas.value) {
    previewCanvas.value.width = props.width
    previewCanvas.value.height = props.height
    previewCtx = previewCanvas.value.getContext('2d')
    
    if (!previewCtx) {
      return
    }
    
    const elements = canvasStore.elements.value
    // 初始化快照
    lastSnapshot = JSON.parse(JSON.stringify(elementsSnapshot.value))
    // 初始渲染
    renderPreview()
    // 开始定期检查
    animationFrameId = requestAnimationFrame(checkElementChanges)
  }
})

// 防抖渲染函数
let renderTimer: number | null = null
const debouncedRender = (immediate = false) => {
  if (renderTimer) {
    clearTimeout(renderTimer)
    renderTimer = null
  }
  
  const doRender = () => {
    if (previewCanvas.value && previewCtx) {
      renderPreview()
    }
  }
  
  if (immediate) {
    // 立即渲染（用于元素创建/删除）
    doRender()
  } else {
    // 防抖渲染（用于位置/大小变化）
    renderTimer = setTimeout(() => {
      doRender()
      renderTimer = null
    }, 50)
  }
}

// 创建一个计算属性来序列化元素的关键属性，用于触发更新
let snapshotCallCount = 0
const elementsSnapshot = computed(() => {
  snapshotCallCount++
  const elements = canvasStore.elements.value
  
  // 安全检查：确保 elements 存在且是数组
  if (!elements || !Array.isArray(elements)) {
    return []
  }
  // 使用 toRaw 确保从响应式对象中提取实际值
  const snapshot = elements.map(element => {
    const rawElement = toRaw(element)
    const rawPosition = rawElement.position ? toRaw(rawElement.position) : null
    const rawSize = rawElement.size ? toRaw(rawElement.size) : null
    return {
      id: rawElement.id,
      x: rawPosition?.x ?? 0,
      y: rawPosition?.y ?? 0,
      width: rawSize?.x ?? 0,
      height: rawSize?.y ?? 0,
      rotation: rawElement.rotation ?? 0,
      visible: rawElement.visible ?? true
    }
  })
  
  return snapshot
})

// 存储上一次的快照，用于比较
let lastSnapshot: ReturnType<typeof elementsSnapshot.value> = []

// 使用 requestAnimationFrame 定期检查元素变化
let animationFrameId: number | null = null
let checkCount = 0
const checkElementChanges = () => {
  checkCount++
  const currentSnapshot = elementsSnapshot.value
  
  // 检查是否有变化
  const lengthChanged = currentSnapshot.length !== lastSnapshot.length
  let detailChanged = false
  let changedDetails: any[] = []
  
  // 如果长度变化，立即渲染
  if (lengthChanged) {
    lastSnapshot = JSON.parse(JSON.stringify(currentSnapshot)) // 深拷贝
    debouncedRender(true) // 立即渲染
    animationFrameId = requestAnimationFrame(checkElementChanges)
    return // 直接返回，不继续检查细节
  }
  
  if (currentSnapshot.length > 0) {
    // 检查每个元素是否有变化
    currentSnapshot.forEach((el, i) => {
      const old = lastSnapshot[i]
      if (!old || old.id !== el.id) {
        detailChanged = true
        changedDetails.push({ index: i, reason: 'id或位置变化', old, new: el })
      } else {
        const propsChanged = [
          old.x !== el.x && { prop: 'x', old: old.x, new: el.x },
          old.y !== el.y && { prop: 'y', old: old.y, new: el.y },
          old.width !== el.width && { prop: 'width', old: old.width, new: el.width },
          old.height !== el.height && { prop: 'height', old: old.height, new: el.height },
          old.rotation !== el.rotation && { prop: 'rotation', old: old.rotation, new: el.rotation },
          old.visible !== el.visible && { prop: 'visible', old: old.visible, new: el.visible }
        ].filter(Boolean)
        
        if (propsChanged.length > 0) {
          detailChanged = true
          changedDetails.push({ 
            index: i, 
            id: el.id, 
            changes: propsChanged 
          })
        }
      }
    })
  }
  
  const hasChanged = lengthChanged || detailChanged
  
  if (hasChanged) {
    lastSnapshot = JSON.parse(JSON.stringify(currentSnapshot)) // 深拷贝
    debouncedRender()
  }
  
  // 继续检查
  animationFrameId = requestAnimationFrame(checkElementChanges)
}

// 使用 watchEffect 来验证响应式是否工作
let lastElementsCount = 0
watchEffect(() => {
  const elements = canvasStore.elements.value
  const count = elements?.length ?? 0
  // 只在变化时更新计数
  if (count !== lastElementsCount) {
    lastElementsCount = count
  }
})

// 监听元素快照变化（作为主要触发方式）
// 使用自定义比较函数，只在真正的位置/大小变化时才触发渲染
watch(
  elementsSnapshot,
  (newSnapshot, oldSnapshot) => {
    // 深度比较，检查是否有真正的变化
    let hasRealChange = false
    const changes: any[] = []
    
    // 如果数组长度变化（新增/删除元素），立即渲染
    if (!oldSnapshot || oldSnapshot.length !== newSnapshot.length) {
      hasRealChange = true
      changes.push({ type: 'length', old: oldSnapshot?.length, new: newSnapshot.length })

      // 立即渲染，不防抖
      lastSnapshot = JSON.parse(JSON.stringify(newSnapshot)) // 深拷贝
      debouncedRender(true) // 立即渲染
      return // 直接返回，不继续检查细节变化
    } else {
      // 检查每个元素的位置、大小等属性是否真正变化
      for (let i = 0; i < newSnapshot.length; i++) {
        const newEl = newSnapshot[i]
        const oldEl = oldSnapshot[i]
        
        if (!oldEl || oldEl.id !== newEl.id) {
          hasRealChange = true
          changes.push({ type: 'id', index: i, old: oldEl?.id, new: newEl.id })
          break
        }
        
        // 检查位置、大小、旋转、可见性是否有变化
        const positionChanged = Math.abs((oldEl.x ?? 0) - (newEl.x ?? 0)) > 0.01 || 
                                Math.abs((oldEl.y ?? 0) - (newEl.y ?? 0)) > 0.01
        const sizeChanged = Math.abs((oldEl.width ?? 0) - (newEl.width ?? 0)) > 0.01 || 
                           Math.abs((oldEl.height ?? 0) - (newEl.height ?? 0)) > 0.01
        const rotationChanged = Math.abs((oldEl.rotation ?? 0) - (newEl.rotation ?? 0)) > 0.01
        const visibleChanged = (oldEl.visible ?? true) !== (newEl.visible ?? true)
        
        if (positionChanged || sizeChanged || rotationChanged || visibleChanged) {
          hasRealChange = true
          changes.push({
            type: 'props',
            id: newEl.id,
            positionChanged,
            sizeChanged,
            rotationChanged,
            visibleChanged,
            old: { x: oldEl.x, y: oldEl.y, w: oldEl.width, h: oldEl.height },
            new: { x: newEl.x, y: newEl.y, w: newEl.width, h: newEl.height }
          })
        }
      }
    }
    
    if (hasRealChange) {
      lastSnapshot = JSON.parse(JSON.stringify(newSnapshot)) // 深拷贝
      debouncedRender()
    } else {
      // 即使没有真正变化也更新 lastSnapshot，避免重复触发
      lastSnapshot = JSON.parse(JSON.stringify(newSnapshot))
    }
  },
  { deep: true, immediate: true }
)

// 也监听元素数组引用变化（作为备用）
watch(
  () => canvasStore.elements.value,
  (newElements, oldElements) => {
    const newCount = newElements?.length ?? 0
    const oldCount = oldElements?.length ?? 0
    
    // 检查元素属性是否变化
    const elementsChanged = newCount !== oldCount || 
      (newElements && oldElements && newElements.some((el, i) => {
        const old = oldElements[i]
        return !old || 
          old.id !== el.id ||
          old.position?.x !== el.position?.x ||
          old.position?.y !== el.position?.y ||
          old.size?.x !== el.size?.x ||
          old.size?.y !== el.size?.y
      }))
    
    if (elementsChanged) {
      const isLengthChange = newCount !== oldCount
      const changedElements = newElements && oldElements ? newElements.filter((el, i) => {
        const old = oldElements[i]
        return !old || 
          old.id !== el.id ||
          old.position?.x !== el.position?.x ||
          old.position?.y !== el.position?.y ||
          old.size?.x !== el.size?.x ||
          old.size?.y !== el.size?.y
      }) : []
      
      
      // 如果是长度变化（新增/删除），立即渲染；否则延迟渲染
      if (isLengthChange) {
        nextTick(() => {
          debouncedRender(true) // 立即渲染
        })
      } else {
        // 延迟一下，让 elementsSnapshot 先更新
        nextTick(() => {
          debouncedRender() // 防抖渲染
        })
      }
    }
  },
  { deep: true }
)

// 监听视口变化（不需要重新渲染预览，只需要更新视口框位置）
watch(
  () => canvasStore.viewport,
  () => {
    // 视口框通过 computed 自动更新，这里可以添加其他逻辑
  },
  { deep: true }
)

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  
  // 清理定时器
  if (renderTimer) {
    clearTimeout(renderTimer)
    renderTimer = null
  }
  
  // 停止动画帧检查
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})
</script>

<style scoped>
.mini-map-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.mini-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.mini-map-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.mini-map-canvas:active {
  cursor: grabbing;
}

.viewport-frame {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.1);
  pointer-events: none;
  box-sizing: border-box;
}
</style>
