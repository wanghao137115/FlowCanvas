import React, { useState } from 'react'
import { ImageElement } from '../core/elements/ImageElement'

interface ImageFloatingToolbarProps {
  image: ImageElement
  onUpdate: (image: ImageElement) => void
  onDelete: (imageId: string) => void
  position: { x: number; y: number }
  visible: boolean
}

export const ImageFloatingToolbar: React.FC<ImageFloatingToolbarProps> = ({
  image,
  onUpdate,
  onDelete,
  position,
  visible
}) => {
  const [showBorderPanel, setShowBorderPanel] = useState(false)
  const [showShadowPanel, setShowShadowPanel] = useState(false)
  const [showOpacityPanel, setShowOpacityPanel] = useState(false)
  const [showRadiusPanel, setShowRadiusPanel] = useState(false)
  const [showCropPanel, setShowCropPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // 边框设置
  const handleBorderChange = (border: { width: number; color: string; style: string }) => {
    const updatedImage = image.clone()
    updatedImage.setBorder(border)
    onUpdate(updatedImage)
  }

  // 阴影设置
  const handleShadowChange = (shadow: { x: number; y: number; blur: number; color: string }) => {
    const updatedImage = image.clone()
    updatedImage.setShadow(shadow)
    onUpdate(updatedImage)
  }

  // 透明度设置
  const handleOpacityChange = (opacity: number) => {
    const updatedImage = image.clone()
    updatedImage.setOpacity(opacity)
    onUpdate(updatedImage)
  }

  // 圆角设置
  const handleRadiusChange = (radius: number) => {
    const updatedImage = image.clone()
    updatedImage.setBorderRadius(radius)
    onUpdate(updatedImage)
  }

  // 裁剪功能
  const handleCrop = () => {
    // 这里可以打开裁剪界面
    console.log('开始裁剪图片')
  }

  // 滤镜设置
  const handleFilterChange = (filter: string) => {
    const updatedImage = image.clone()
    updatedImage.setFilter(filter)
    onUpdate(updatedImage)
  }

  // 删除图片
  const handleDelete = () => {
    if (confirm('确定要删除这张图片吗？')) {
      onDelete(image.id)
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50"
      style={{
        left: position.x,
        top: position.y - 60
      }}
    >
      {/* 主工具栏 */}
      <div className="flex items-center gap-1">
        {/* 边框 */}
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => setShowBorderPanel(!showBorderPanel)}
            title="边框"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          {showBorderPanel && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-64">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">边框宽度</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={image.border?.width || 0}
                    onChange={(e) => handleBorderChange({
                      ...image.border,
                      width: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">边框颜色</label>
                  <input
                    type="color"
                    value={image.border?.color || '#000000'}
                    onChange={(e) => handleBorderChange({
                      ...image.border,
                      color: e.target.value
                    })}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">边框样式</label>
                  <select
                    value={image.border?.style || 'solid'}
                    onChange={(e) => handleBorderChange({
                      ...image.border,
                      style: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="solid">实线</option>
                    <option value="dashed">虚线</option>
                    <option value="dotted">点线</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 阴影 */}
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => setShowShadowPanel(!showShadowPanel)}
            title="阴影"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          {showShadowPanel && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-64">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X偏移</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={image.shadow?.x || 0}
                    onChange={(e) => handleShadowChange({
                      ...image.shadow,
                      x: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y偏移</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={image.shadow?.y || 0}
                    onChange={(e) => handleShadowChange({
                      ...image.shadow,
                      y: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模糊半径</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={image.shadow?.blur || 0}
                    onChange={(e) => handleShadowChange({
                      ...image.shadow,
                      blur: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">阴影颜色</label>
                  <input
                    type="color"
                    value={image.shadow?.color || '#000000'}
                    onChange={(e) => handleShadowChange({
                      ...image.shadow,
                      color: e.target.value
                    })}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 透明度 */}
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => setShowOpacityPanel(!showOpacityPanel)}
            title="透明度"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          {showOpacityPanel && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-48">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">透明度</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={image.opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(image.opacity * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 圆角 */}
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => setShowRadiusPanel(!showRadiusPanel)}
            title="圆角"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          {showRadiusPanel && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-48">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">圆角半径</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={image.borderRadius || 0}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {image.borderRadius || 0}px
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 裁剪 */}
        <button
          className="p-2 hover:bg-gray-100 rounded"
          onClick={handleCrop}
          title="裁剪"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        </button>

        {/* 滤镜 */}
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title="滤镜"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          {showFilterPanel && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-48">
              <div className="space-y-2">
                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    image.filter === 'none' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('none')}
                >
                  无滤镜
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    image.filter === 'grayscale' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('grayscale')}
                >
                  灰度
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    image.filter === 'sepia' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('sepia')}
                >
                  复古
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    image.filter === 'blur' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('blur')}
                >
                  模糊
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    image.filter === 'brightness' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('brightness')}
                >
                  亮度
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 删除 */}
        <button
          className="p-2 hover:bg-red-100 rounded text-red-600"
          onClick={handleDelete}
          title="删除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
