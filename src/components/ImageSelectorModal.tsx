import React, { useState, useRef } from 'react'
import { ImageElement } from '../core/elements/ImageElement'

interface ImageSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onImageSelect: (image: ImageElement) => void
}

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  isOpen,
  onClose,
  onImageSelect
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setIsUploading(false)
        return
      }

      // 验证文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('图片文件过大！请选择小于 10MB 的图片。')
        setIsUploading(false)
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
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('上传图片失败:', error)
      alert('上传图片失败，请重试。')
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
      <div className="bg-white rounded-lg shadow-xl w-4/5 max-w-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">上传图片</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-8">
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
      </div>
    </div>
  )
}
