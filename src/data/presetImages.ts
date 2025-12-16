/**
 * 预设图片库数据
 * 包含装饰、图标、背景、形状等分类的预设图片
 */

export interface PresetImage {
  id: string
  name: string
  url: string
  category: string
  tags: string[]
  description?: string
}

// 预设图片库
export const PRESET_IMAGES: PresetImage[] = [
  // 装饰类图片
  {
    id: 'decoration_1',
    name: '装饰边框1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBzdHJva2U9IiM0MDllZmYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTAsMTAiIGZpbGw9IiNmMGY5ZmYiLz4KPC9zdmc+',
    category: '装饰',
    tags: ['边框', '装饰', '蓝色'],
    description: '蓝色虚线装饰边框'
  },
  {
    id: 'decoration_2',
    name: '装饰边框2',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBzdHJva2U9IiNmZjYzNDciIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iNSw1IiBmaWxsPSIjZmZmNWY1Ii8+Cjwvc3ZnPg==',
    category: '装饰',
    tags: ['边框', '装饰', '红色'],
    description: '红色点线装饰边框'
  },
  {
    id: 'decoration_3',
    name: '装饰边框3',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBzdHJva2U9IiM1MmM0ODIiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMTUsNSIgZmlsbD0iI2YwZjlmMCIvPgo8L3N2Zz4=',
    category: '装饰',
    tags: ['边框', '装饰', '绿色'],
    description: '绿色长虚线装饰边框'
  },

  // 图标类图片
  {
    id: 'icon_1',
    name: '心形图标',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMDAgMTgwQzQwIDEyMCA0MCA4MCA0MCA2MEM0MCA0MCA2MCAyMCAxMDAgMjBDMTQwIDIwIDE2MCA0MCAxNjAgNjBDMTYwIDgwIDEyMCAxMjAgMTAwIDE4MFoiIGZpbGw9IiNmZjYzNDciLz4KPC9zdmc+',
    category: '图标',
    tags: ['心形', '爱心', '红色'],
    description: '红色心形图标'
  },
  {
    id: 'icon_2',
    name: '星星图标',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMDAgMjBMMTIwIDgwTDE4MCA4MEwxMzAgMTIwTDE1MCAxODBMMTAwIDE0MEw1MCAxODBMNzAgMTIwTDIwIDgwTDgwIDgwTDEwMCAyMFoiIGZpbGw9IiNmZmQ3MDAiLz4KPC9zdmc+',
    category: '图标',
    tags: ['星星', '五角星', '黄色'],
    description: '黄色五角星图标'
  },
  {
    id: 'icon_3',
    name: '圆形图标',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9IiM0MDllZmYiLz4KPC9zdmc+',
    category: '图标',
    tags: ['圆形', '蓝色', '基础'],
    description: '蓝色圆形图标'
  },

  // 背景类图片
  {
    id: 'background_1',
    name: '渐变背景1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0MDllZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM3M2M0ZjQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+Cjwvc3ZnPg==',
    category: '背景',
    tags: ['渐变', '蓝色', '背景'],
    description: '蓝色渐变背景'
  },
  {
    id: 'background_2',
    name: '渐变背景2',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjYzNDciLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZmE1YjUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+Cjwvc3ZnPg==',
    category: '背景',
    tags: ['渐变', '红色', '背景'],
    description: '红色渐变背景'
  },
  {
    id: 'background_3',
    name: '网格背景',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2U1ZTdlYiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZ3JpZCkiLz4KPC9zdmc+',
    category: '背景',
    tags: ['网格', '线条', '背景'],
    description: '网格线条背景'
  },

  // 形状类图片
  {
    id: 'shape_1',
    name: '三角形',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMDAgMjBMMjAgMTgwSDE4MEwxMDAgMjBaIiBmaWxsPSIjNTJjNDgyIi8+Cjwvc3ZnPg==',
    category: '形状',
    tags: ['三角形', '绿色', '几何'],
    description: '绿色三角形'
  },
  {
    id: 'shape_2',
    name: '菱形',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMDAgMjBMMTYwIDEwMEwxMDAgMTgwTDQwIDEwMEwxMDAgMjBaIiBmaWxsPSIjOWMyN2IwIi8+Cjwvc3ZnPg==',
    category: '形状',
    tags: ['菱形', '紫色', '几何'],
    description: '紫色菱形'
  },
  {
    id: 'shape_3',
    name: '六边形',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMDAgMjBMMTYwIDYwTDE2MCAxNDBMMTAwIDE4MEw0MCAxNDBMNDAgNjBMMTAwIDIwWiIgZmlsbD0iI2ZmZDUwMCIvPgo8L3N2Zz4=',
    category: '形状',
    tags: ['六边形', '橙色', '几何'],
    description: '橙色六边形'
  },

  // 更多装饰类
  {
    id: 'decoration_4',
    name: '花朵装饰',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9IiNmZmUwYjEiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI2MCIgZmlsbD0iI2ZmYzEwNyIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjZmZmNWY1Ii8+Cjwvc3ZnPg==',
    category: '装饰',
    tags: ['花朵', '装饰', '彩色'],
    description: '彩色花朵装饰'
  },
  {
    id: 'decoration_5',
    name: '波浪装饰',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDEwMEM1MCA1MCAxMDAgMTUwIDE1MCAxMDBMMjAwIDEwMEwyMDAgMjAwTDAgMjAwWiIgZmlsbD0iIzQwOWVmZiIvPgo8L3N2Zz4=',
    category: '装饰',
    tags: ['波浪', '装饰', '蓝色'],
    description: '蓝色波浪装饰'
  },

  // 更多图标类
  {
    id: 'icon_4',
    name: '箭头图标',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0yMCAxMDBMMTgwIDEwMEwxNDAgNjBMMTYwIDgwTDE0MCAxMDBMMTYwIDEyMEwxNDAgMTQwWiIgZmlsbD0iIzMzMzMzMyIvPgo8L3N2Zz4=',
    category: '图标',
    tags: ['箭头', '方向', '黑色'],
    description: '黑色箭头图标'
  },
  {
    id: 'icon_5',
    name: '圆形图标2',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9IiNmZjYzNDciIHN0cm9rZT0iI2ZmYzEwNyIgc3Ryb2tlLXdpZHRoPSI0Ii8+Cjwvc3ZnPg==',
    category: '图标',
    tags: ['圆形', '红色', '边框'],
    description: '红色圆形带边框图标'
  }
]

// 获取所有分类
export const getCategories = (): string[] => {
  return Array.from(new Set(PRESET_IMAGES.map(img => img.category)))
}

// 获取所有标签
export const getAllTags = (): string[] => {
  const tags = PRESET_IMAGES.flatMap(img => img.tags)
  return Array.from(new Set(tags))
}

// 根据分类过滤图片
export const getImagesByCategory = (category: string): PresetImage[] => {
  if (category === '全部') {
    return PRESET_IMAGES
  }
  return PRESET_IMAGES.filter(img => img.category === category)
}

// 根据标签过滤图片
export const getImagesByTag = (tag: string): PresetImage[] => {
  return PRESET_IMAGES.filter(img => img.tags.includes(tag))
}

// 搜索图片
export const searchImages = (query: string): PresetImage[] => {
  if (!query.trim()) {
    return PRESET_IMAGES
  }
  
  const lowerQuery = query.toLowerCase()
  return PRESET_IMAGES.filter(img => 
    img.name.toLowerCase().includes(lowerQuery) ||
    img.description?.toLowerCase().includes(lowerQuery) ||
    img.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
