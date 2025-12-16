import { ImageElement } from '../elements/ImageElement'
import { ImageSelectorModal } from '../../components/ImageSelectorModal'
import { ImageFloatingToolbar } from '../../components/ImageFloatingToolbar'
import { ImageToolbarButton } from '../../components/ImageToolbarButton'
import { Vector2 } from '@/types/canvas.types'

/**
 * 图片工具管理器
 */
export class ImageToolManager {
  private isActive: boolean = false
  private selectedImage: ImageElement | null = null
  private floatingToolbarPosition: Vector2 = { x: 0, y: 0 }
  private showFloatingToolbar: boolean = false
  private onImageAdd?: (image: ImageElement) => void
  private onImageUpdate?: (image: ImageElement) => void
  private onImageDelete?: (imageId: string) => void

  constructor() {}

  /**
   * 设置图片添加回调
   */
  setOnImageAdd(callback: (image: ImageElement) => void): void {
    this.onImageAdd = callback
  }

  /**
   * 设置图片更新回调
   */
  setOnImageUpdate(callback: (image: ImageElement) => void): void {
    this.onImageUpdate = callback
  }

  /**
   * 设置图片删除回调
   */
  setOnImageDelete(callback: (imageId: string) => void): void {
    this.onImageDelete = callback
  }

  /**
   * 激活图片工具
   */
  activate(): void {
    this.isActive = true
  }

  /**
   * 停用图片工具
   */
  deactivate(): void {
    this.isActive = false
    this.selectedImage = null
    this.showFloatingToolbar = false
  }

  /**
   * 检查是否激活
   */
  isToolActive(): boolean {
    return this.isActive
  }

  /**
   * 选择图片
   */
  selectImage(image: ImageElement): void {
    this.selectedImage = image
    this.showFloatingToolbar = true
  }

  /**
   * 取消选择图片
   */
  deselectImage(): void {
    this.selectedImage = null
    this.showFloatingToolbar = false
  }

  /**
   * 获取选中的图片
   */
  getSelectedImage(): ImageElement | null {
    return this.selectedImage
  }

  /**
   * 处理图片选择
   */
  handleImageSelect(image: ImageElement): void {
    if (this.onImageAdd) {
      this.onImageAdd(image)
    }
  }

  /**
   * 处理图片更新
   */
  handleImageUpdate(image: ImageElement): void {
    if (this.onImageUpdate) {
      this.onImageUpdate(image)
    }
  }

  /**
   * 处理图片删除
   */
  handleImageDelete(imageId: string): void {
    if (this.onImageDelete) {
      this.onImageDelete(imageId)
    }
    this.deselectImage()
  }

  /**
   * 设置浮动工具栏位置
   */
  setFloatingToolbarPosition(position: Vector2): void {
    this.floatingToolbarPosition = position
  }

  /**
   * 获取浮动工具栏位置
   */
  getFloatingToolbarPosition(): Vector2 {
    return this.floatingToolbarPosition
  }

  /**
   * 检查是否显示浮动工具栏
   */
  shouldShowFloatingToolbar(): boolean {
    return this.showFloatingToolbar && this.selectedImage !== null
  }

  /**
   * 获取工具栏按钮组件
   */
  getToolbarButton(): React.ComponentType<{ isActive: boolean; onClick: () => void }> {
    return ImageToolbarButton
  }

  /**
   * 获取图片选择弹窗组件
   */
  getImageSelectorModal(): React.ComponentType<{
    isOpen: boolean
    onClose: () => void
    onImageSelect: (image: ImageElement) => void
  }> {
    return ImageSelectorModal
  }

  /**
   * 获取浮动工具栏组件
   */
  getFloatingToolbar(): React.ComponentType<{
    image: ImageElement
    onUpdate: (image: ImageElement) => void
    onDelete: (imageId: string) => void
    position: Vector2
    visible: boolean
  }> {
    return ImageFloatingToolbar
  }

  /**
   * 处理画布点击
   */
  handleCanvasClick(position: Vector2): void {
    if (!this.isActive) return

    // 如果点击了空白区域，取消选择
    this.deselectImage()
  }

  /**
   * 处理图片点击
   */
  handleImageClick(image: ImageElement, position: Vector2): void {
    if (!this.isActive) return

    // 选择图片并显示浮动工具栏
    this.selectImage(image)
    this.setFloatingToolbarPosition(position)
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isActive) return

    // 按Delete键删除选中的图片
    if (event.key === 'Delete' && this.selectedImage) {
      this.handleImageDelete(this.selectedImage.id)
    }

    // 按Escape键取消选择
    if (event.key === 'Escape') {
      this.deselectImage()
    }
  }

  /**
   * 获取工具状态
   */
  getToolState(): {
    isActive: boolean
    selectedImage: ImageElement | null
    showFloatingToolbar: boolean
    floatingToolbarPosition: Vector2
  } {
    return {
      isActive: this.isActive,
      selectedImage: this.selectedImage,
      showFloatingToolbar: this.showFloatingToolbar,
      floatingToolbarPosition: this.floatingToolbarPosition
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.deactivate()
    this.onImageAdd = undefined
    this.onImageUpdate = undefined
    this.onImageDelete = undefined
  }
}
