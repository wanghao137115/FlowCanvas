import React, { useState, useRef, useEffect } from 'react'
import { ImageToolManager } from '../core/managers/ImageToolManager'
import { ImageElement } from '../core/elements/ImageElement'
import { ImageSelectorModal } from '../components/ImageSelectorModal'
import { ImageFloatingToolbar } from '../components/ImageFloatingToolbar'
import { ImageToolbarButton } from '../components/ImageToolbarButton'

interface ImageToolIntegrationProps {
  canvas: HTMLCanvasElement
  onImageAdd?: (image: ImageElement) => void
  onImageUpdate?: (image: ImageElement) => void
  onImageDelete?: (imageId: string) => void
}

export const ImageToolIntegration: React.FC<ImageToolIntegrationProps> = ({
  canvas,
  onImageAdd,
  onImageUpdate,
  onImageDelete
}) => {
  const [imageToolManager] = useState(() => new ImageToolManager())
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [images, setImages] = useState<ImageElement[]>([])
  const [selectedImage, setSelectedImage] = useState<ImageElement | null>(null)
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 })
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false)

  // 设置回调
  useEffect(() => {
    imageToolManager.setOnImageAdd((image) => {
      setImages(prev => [...prev, image])
      if (onImageAdd) onImageAdd(image)
    })

    imageToolManager.setOnImageUpdate((image) => {
      setImages(prev => prev.map(img => img.id === image.id ? image : img))
      if (onImageUpdate) onImageUpdate(image)
    })

    imageToolManager.setOnImageDelete((imageId) => {
      setImages(prev => prev.filter(img => img.id !== imageId))
      if (onImageDelete) onImageDelete(imageId)
    })
  }, [imageToolManager, onImageAdd, onImageUpdate, onImageDelete])

  // 处理工具栏按钮点击
  const handleToolbarButtonClick = () => {
    if (imageToolManager.isToolActive()) {
      imageToolManager.deactivate()
    } else {
      imageToolManager.activate()
      setShowImageSelector(true)
    }
  }

  // 处理图片选择
  const handleImageSelect = (image: ImageElement) => {
    imageToolManager.handleImageSelect(image)
    setShowImageSelector(false)
  }

  // 处理图片更新
  const handleImageUpdate = (image: ImageElement) => {
    imageToolManager.handleImageUpdate(image)
    setSelectedImage(image)
  }

  // 处理图片删除
  const handleImageDelete = (imageId: string) => {
    imageToolManager.handleImageDelete(imageId)
    setSelectedImage(null)
    setShowFloatingToolbar(false)
  }

  // 处理画布点击
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    imageToolManager.handleCanvasClick({ x, y })
    setShowFloatingToolbar(false)
  }

  // 处理图片点击
  const handleImageClick = (image: ImageElement, event: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    imageToolManager.handleImageClick(image, { x, y })
    setSelectedImage(image)
    setFloatingToolbarPosition({ x, y })
    setShowFloatingToolbar(true)
  }

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      imageToolManager.handleKeyDown(event)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [imageToolManager])

  return (
    <div className="relative">
      {/* 工具栏按钮 */}
      <ImageToolbarButton
        isActive={imageToolManager.isToolActive()}
        onClick={handleToolbarButtonClick}
      />

      {/* 图片选择弹窗 */}
      {showImageSelector && (
        <ImageSelectorModal
          isOpen={showImageSelector}
          onClose={() => setShowImageSelector(false)}
          onImageSelect={handleImageSelect}
        />
      )}

      {/* 浮动工具栏 */}
      {showFloatingToolbar && selectedImage && (
        <ImageFloatingToolbar
          image={selectedImage}
          onUpdate={handleImageUpdate}
          onDelete={handleImageDelete}
          position={floatingToolbarPosition}
          visible={showFloatingToolbar}
        />
      )}

      {/* 画布点击处理 */}
      <canvas
        ref={(ref) => {
          if (ref) {
            ref.addEventListener('click', handleCanvasClick as any)
          }
        }}
        onClick={handleCanvasClick}
      />
    </div>
  )
}

/**
 * 使用示例
 */
export const ImageToolExample: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [images, setImages] = useState<ImageElement[]>([])

  const handleImageAdd = (image: ImageElement) => {
    console.log('图片已添加:', image.getFileName())
  }

  const handleImageUpdate = (image: ImageElement) => {
    console.log('图片已更新:', image.getFileName())
  }

  const handleImageDelete = (imageId: string) => {
    console.log('图片已删除:', imageId)
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 bg-gray-100 border-b">
        <h1 className="text-xl font-bold">图片工具示例</h1>
        {canvasRef.current && (
          <ImageToolIntegration
            canvas={canvasRef.current}
            onImageAdd={handleImageAdd}
            onImageUpdate={handleImageUpdate}
            onImageDelete={handleImageDelete}
          />
        )}
      </div>

      {/* 画布区域 */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-300"
        />
      </div>

      {/* 图片列表 */}
      <div className="p-4 bg-gray-50 border-t">
        <h3 className="text-lg font-semibold mb-2">图片列表</h3>
        <div className="grid grid-cols-4 gap-2">
          {images.map(image => (
            <div key={image.id} className="border rounded p-2">
              <div className="text-sm font-medium">{image.getFileName()}</div>
              <div className="text-xs text-gray-500">
                {image.getFormattedFileSize()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
