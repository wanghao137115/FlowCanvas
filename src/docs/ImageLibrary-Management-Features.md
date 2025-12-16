# 图片库管理功能说明

## 功能概述

图片库管理功能为白板应用提供了完整的图片资源管理解决方案，包括预设图片库、分类筛选、搜索功能和优化的用户界面。

## 核心功能

### 1. 预设图片库 (`src/data/presetImages.ts`)

- **丰富的图片资源**: 包含装饰、图标、背景、形状四大分类的预设图片
- **结构化数据**: 每张图片包含名称、描述、分类、标签等元数据
- **易于扩展**: 支持轻松添加新的图片和分类

#### 图片数据结构
```typescript
interface PresetImage {
  id: string
  name: string
  url: string
  description?: string
  category: string
  tags: string[]
  keywords?: string[]
}
```

#### 主要API
- `PRESET_IMAGES`: 所有预设图片数组
- `getCategories()`: 获取所有分类
- `getAllTags()`: 获取所有标签
- `getImagesByCategory(category)`: 按分类获取图片
- `getImagesByTag(tag)`: 按标签获取图片
- `searchImages(query)`: 搜索图片

### 2. 图片选择器组件 (`src/components/ImageSelectorModal.vue`)

#### 功能特性
- **双模式选择**: 支持预设图片和上传图片两种模式
- **智能筛选**: 按分类、标签、搜索词进行多维度筛选
- **实时搜索**: 支持按名称、描述、标签进行实时搜索
- **响应式设计**: 适配不同屏幕尺寸

#### UI优化
- **卡片式布局**: 美观的图片卡片展示
- **悬停效果**: 丰富的交互反馈
- **标签云**: 直观的标签展示和筛选
- **空状态处理**: 优雅的无结果状态

### 3. 测试页面 (`src/views/ImageLibraryTest.vue`)

提供完整的功能测试和演示：
- **统计信息**: 显示图片库的统计数据
- **搜索测试**: 测试各种搜索和筛选功能
- **结果展示**: 实时显示搜索结果

## 使用方法

### 1. 在画布中使用图片选择器

```vue
<template>
  <ImageSelectorModal
    :isOpen="showImageSelector"
    @close="showImageSelector = false"
    @imageSelect="handleImageSelect"
  />
</template>

<script setup>
import ImageSelectorModal from '@/components/ImageSelectorModal.vue'

const showImageSelector = ref(false)

const handleImageSelect = (image) => {
  // 处理选中的图片
  console.log('选中的图片:', image)
}
</script>
```

### 2. 使用图片库API

```typescript
import { 
  PRESET_IMAGES, 
  getCategories, 
  searchImages 
} from '@/data/presetImages'

// 获取所有分类
const categories = getCategories()

// 搜索图片
const results = searchImages('logo')

// 按分类获取图片
const decorationImages = getImagesByCategory('decoration')
```

### 3. 添加新的预设图片

在 `src/data/presetImages.ts` 中添加新的图片：

```typescript
const newImage: PresetImage = {
  id: 'unique-id',
  name: '图片名称',
  url: '/path/to/image.png',
  description: '图片描述',
  category: 'decoration', // 或 'icon', 'background', 'shape'
  tags: ['tag1', 'tag2'],
  keywords: ['keyword1', 'keyword2']
}

// 添加到 PRESET_IMAGES 数组中
PRESET_IMAGES.push(newImage)
```

## 技术实现

### 1. 搜索算法
- **多字段搜索**: 同时搜索名称、描述、标签
- **模糊匹配**: 支持部分匹配和大小写不敏感
- **性能优化**: 使用computed属性实现响应式搜索

### 2. 筛选系统
- **组合筛选**: 支持分类、标签、搜索词的多重筛选
- **实时更新**: 筛选条件变化时自动更新结果
- **状态管理**: 使用Vue 3的响应式系统管理筛选状态

### 3. UI/UX设计
- **现代设计**: 使用Element Plus组件库
- **动画效果**: 丰富的过渡动画和悬停效果
- **响应式布局**: 使用CSS Grid和Flexbox
- **无障碍支持**: 良好的键盘导航和屏幕阅读器支持

## 扩展建议

### 1. 图片管理
- 添加图片编辑功能（裁剪、滤镜等）
- 支持图片收藏和收藏夹
- 添加图片使用统计

### 2. 性能优化
- 实现图片懒加载
- 添加图片缓存机制
- 优化大图片的处理

### 3. 用户体验
- 添加拖拽排序功能
- 支持批量操作
- 添加快捷键支持

## 测试

使用测试页面 (`src/views/ImageLibraryTest.vue`) 可以：
1. 测试所有搜索和筛选功能
2. 查看图片库统计信息
3. 验证UI交互效果
4. 测试图片选择流程

在App.vue中点击"图片库测试"按钮即可进入测试模式。
