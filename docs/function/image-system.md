# 图片系统

## 概述
图片系统负责图片的加载、渲染、裁剪、滤镜等处理。

## 核心组件

| 文件 | 职责 |
|------|------|
| `ImageElement.ts` | 图片元素封装 |
| `ImageRenderer.ts` | 图片渲染器 |
| `ImageManager.ts` | 图片管理器 |
| `ImageTool.ts` | 图片工具 |
| `ImageComposer.ts` | 图片合成 |

## 图片元素

```typescript
// src/core/elements/ImageElement.ts
export class ImageElement {
  private image: HTMLImageElement | null = null
  private loading: boolean = false
  private filters: ImageFilters = {}

  // 加载图片
  async loadImage(src: string): Promise<void>

  // 检查是否加载完成
  isLoaded(): boolean

  // 获取图片对象
  getImage(): HTMLImageElement | null

  // 应用滤镜
  applyFilters(filters: ImageFilters): void
}

interface ImageFilters {
  brightness?: number    // 亮度 (0-200)
  contrast?: number      // 对比度 (0-200)
  saturate?: number      // 饱和度 (0-200)
  hue?: number           // 色相 (0-360)
  blur?: number          // 模糊 (0-10)
  grayscale?: number     // 灰度 (0-100)
  sepia?: number         // 复古 (0-100)
  opacity?: number       // 透明度 (0-100)
}
```

## 图片渲染

```typescript
// src/core/renderers/ImageRenderer.ts
export class ImageRenderer {
  constructor(
    ctx: CanvasRenderingContext2D,
    viewport: { scale: number; offset: Vector2 }
  )

  // 渲染图片
  renderImage(element: CanvasElement): void

  // 更新视口
  updateViewport(viewport: { scale: number; offset: Vector2 }): void

  // 渲染滤镜
  applyFilters(filters: ImageFilters): void
}
```

## 图片工具

```typescript
// src/core/tools/ImageTool.ts
export class ImageTool extends BaseTool {
  // 从本地上传
  async selectFromLocal(): Promise<void>

  // 从图库选择
  async selectFromLibrary(): Promise<ImageItem | null>

  // 插入图片
  insertImage(imageSrc: string, position: Vector2): CanvasElement
}
```

## 图片库管理

```typescript
// src/core/managers/ImageLibraryManager.ts
interface ImageItem {
  id: string
  name: string
  thumbnail: string
  src: string
  category?: string
  tags?: string[]
  size: { width: number; height: number }
}

class ImageLibraryManager {
  // 获取分类
  getCategories(): string[]

  // 获取图片列表
  getImages(category?: string): ImageItem[]

  // 搜索图片
  searchImages(keyword: string): ImageItem[]

  // 添加到最近使用
  addToRecent(imageId: string): void

  // 获取最近使用
  getRecentImages(limit?: number): ImageItem[]
}
```

## 预设图片

预设图片存储在 `src/data/presetImages.ts`：

```typescript
interface PresetImage {
  id: string
  name: string
  category: string
  url: string
  thumbnail: string
  width: number
  height: number
}
```

## 图片处理

### 1. 加载图片
```typescript
const image = new Image()
image.onload = () => {
  // 图片加载完成
}
image.src = src
```

### 2. 裁剪图片
```typescript
ctx.drawImage(
  image,
  sx, sy, sw, sh,    // 源图片裁剪区域
  dx, dy, dw, dh     // 目标绘制区域
)
```

### 3. 应用滤镜
```typescript
ctx.filter = `brightness(${filters.brightness}%) 
               contrast(${filters.contrast}%) 
               saturate(${filters.saturate}%)`
ctx.drawImage(image, x, y)
```

### 4. 合成模式
```typescript
ctx.globalCompositeOperation = 'multiply' | 'screen' | 'overlay'
ctx.drawImage(image1, x, y)
ctx.drawImage(image2, x, y)
```

## 叠加文字

```typescript
interface OverlayText {
  text: string
  position: Vector2      // 相对于图片的百分比 (0-1)
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  textDecoration?: 'none' | 'underline' | 'line-through'
  visible?: boolean
}
```

## 关键文件
- `src/core/elements/ImageElement.ts` - 图片元素
- `src/core/renderers/ImageRenderer.ts` - 图片渲染
- `src/core/tools/ImageTool.ts` - 图片工具
- `src/core/managers/ImageManager.ts` - 图片管理
- `src/data/presetImages.ts` - 预设图片
