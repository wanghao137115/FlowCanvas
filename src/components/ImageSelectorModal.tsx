import React, { useState, useRef } from 'react'
import { ImageElement } from '../core/elements/ImageElement'

interface ImageSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onImageSelect: (image: ImageElement) => void
}

interface PresetImage {
  id: string
  name: string
  url: string
  category: string
}

// 预设图片库
const PRESET_IMAGES: PresetImage[] = [
  // 装饰性图片
  { id: 'decoration_1', name: '装饰边框1', url: '/images/presets/decoration_1.png', category: '装饰' },
  { id: 'decoration_2', name: '装饰边框2', url: '/images/presets/decoration_2.png', category: '装饰' },
  { id: 'decoration_3', name: '装饰边框3', url: '/images/presets/decoration_3.png', category: '装饰' },
  
  // 图标
  { id: 'icon_1', name: '图标1', url: '/images/presets/icon_1.png', category: '图标' },
  { id: 'icon_2', name: '图标2', url: '/images/presets/icon_2.png', category: '图标' },
  { id: 'icon_3', name: '图标3', url: '/images/presets/icon_3.png', category: '图标' },
  
  // 背景
  { id: 'background_1', name: '背景1', url: '/images/presets/background_1.png', category: '背景' },
  { id: 'background_2', name: '背景2', url: '/images/presets/background_2.png', category: '背景' },
  { id: 'background_3', name: '背景3', url: '/images/presets/background_3.png', category: '背景' },
  
  // 形状
  { id: 'shape_1', name: '形状1', url: '/images/presets/shape_1.png', category: '形状' },
  { id: 'shape_2', name: '形状2', url: '/images/presets/shape_2.png', category: '形状' },
  { id: 'shape_3', name: '形状3', url: '/images/presets/shape_3.png', category: '形状' }
]

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  isOpen,
  onClose,
  onImageSelect
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('preset')
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取所有分类
  const categories = ['全部', ...Array.from(new Set(PRESET_IMAGES.map(img => img.category)))]

  // 过滤图片
  const filteredImages = selectedCategory === '全部' 
    ? PRESET_IMAGES 
    : PRESET_IMAGES.filter(img => img.category === selectedCategory)

  // 处理预设图片选择
  const handlePresetImageSelect = async (presetImage: PresetImage) => {
    try {
      // 创建图片元素
      const imageElement = new ImageElement({
        id: `preset_${presetImage.id}_${Date.now()}`,
        fileName: presetImage.name,
        fileSize: 0, // 预设图片大小未知
        mimeType: 'image/png',
        data: '', // 将通过URL加载
        position: { x: 100, y: 100 },
        size: { x: 200, y: 200 },
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: 1,
        url: presetImage.url // 使用URL而不是base64
      })

      onImageSelect(imageElement)
      onClose()
    } catch (error) {
      console.error('选择预设图片失败:', error)
    }
  }

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('不支持的图片格式！请选择 JPG、PNG、GIF、SVG 或 WebP 格式的图片。')
        return
      }

      // 验证文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('图片文件过大！请选择小于 10MB 的图片。')
        return
      }

      // 读取文件
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result as string
        const base64Data = data.split(',')[1]

        // 创建图片元素
        const imageElement = new ImageElement({
          id: `upload_${Date.now()}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          data: base64Data,
          position: { x: 100, y: 100 },
          size: { x: 200, y: 200 },
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 1
        })

        onImageSelect(imageElement)
        onClose()
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('上传图片失败:', error)
      alert('上传图片失败，请重试。')
    } finally {
      setIsUploading(false)
    }
  }

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-4/5 max-w-4xl h-4/5 max-h-3xl flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">选择图片</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'preset' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('preset')}
          >
            预设图片
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'upload' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            上传图片
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-4 overflow-hidden">
          {activeTab === 'preset' ? (
            <div className="h-full flex flex-col">
              {/* 分类筛选 */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* 图片网格 */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-4 gap-4">
                  {filteredImages.map(presetImage => (
                    <div
                      key={presetImage.id}
                      className="border rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow"
                      onClick={() => handlePresetImageSelect(presetImage)}
                    >
                      <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <img
                          src={presetImage.url}
                          alt={presetImage.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            // 如果图片加载失败，显示占位符
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden text-gray-400 text-sm">图片加载失败</div>
                      </div>
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {presetImage.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {presetImage.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">上传本地图片</h3>
                <p className="text-gray-500 mb-6">支持 JPG、PNG、GIF、SVG、WebP 格式，最大 10MB</p>
                <button
                  onClick={triggerFileSelect}
                  disabled={isUploading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? '上传中...' : '选择文件'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
