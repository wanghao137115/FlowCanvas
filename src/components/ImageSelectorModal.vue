<template>
  <el-dialog
    v-model="visible"
    title="上传图片"
    width="600px"
    :before-close="handleClose"
    class="image-selector-dialog"
  >
    <div class="image-selector-content">
      <!-- 上传区域 -->
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        :accept="acceptedFormats"
        drag
        class="upload-dragger"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 JPG、PNG、GIF、SVG、WebP 格式，文件大小不超过 10MB
          </div>
        </template>
      </el-upload>
      
      <!-- 上传预览 -->
      <div v-if="selectedImage" class="upload-preview">
        <div class="preview-title">已选择的图片：</div>
        <div class="preview-image">
          <img :src="previewUrl" :alt="selectedImage.data.fileName" />
          <div class="preview-info">
            <div class="file-name">{{ selectedImage.data.fileName }}</div>
            <div class="file-size">{{ formatFileSize(selectedImage.data.fileSize) }}</div>
            <div class="file-dimensions" v-if="selectedImage.data.originalWidth && selectedImage.data.originalHeight">
              {{ selectedImage.data.originalWidth }} × {{ selectedImage.data.originalHeight }}
            </div>
          </div>
          <el-button type="danger" size="small" @click="clearSelection">清除</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedImage">
          插入图片
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ImageElement } from '@/core/elements/ImageElement'

interface Props {
  isOpen: boolean
  canvasEngine?: any
}

interface Emits {
  (e: 'close'): void
  (e: 'imageSelect', image: ImageElement): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) emit('close')
  }
})

const selectedImage = ref<ImageElement | null>(null)
const uploadRef = ref()
const previewUrl = ref<string>('')

const acceptedFormats = 'image/jpeg,image/png,image/gif,image/svg+xml,image/webp'

// 监听弹窗关闭，清空选择状态
watch(visible, (newVal) => {
  if (!newVal) {
    clearSelection()
  }
})

/**
 * 将 File/Blob 转换为 base64 字符串
 */
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 处理文件上传
const handleFileChange = async (file: any) => {
  if (!file) return

  // 验证文件格式
  if (!acceptedFormats.includes(file.raw.type)) {
    ElMessage.error('不支持的文件格式，请选择 JPG、PNG、GIF、SVG、WebP 格式的图片')
    return
  }

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }

  try {
    // 使用 blob URL 预览
    const blobUrl = URL.createObjectURL(file.raw)
    previewUrl.value = blobUrl
    
    // 获取图片原始尺寸
    const img = new Image()
    
    // 等待图片加载完成以获取尺寸
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = blobUrl
    })
    
    // 获取画布中心位置
    const canvasCenter = getCanvasCenter()
    
    // 计算合适的初始尺寸（最大200px）
    const maxSize = 200
    let width = img.naturalWidth
    let height = img.naturalHeight
    
    if (width > height && width > maxSize) {
      height = Math.round(height * (maxSize / width))
      width = maxSize
    } else if (height > maxSize) {
      width = Math.round(width * (maxSize / height))
      height = maxSize
    }
    
    // 将文件转换为 base64（用于永久保存）
    const base64Data = await fileToBase64(file.raw)
    
    // 创建ImageElement，使用 base64 数据
    const imageElement = new ImageElement(
      'image_' + Date.now(),
      canvasCenter,
      {
        src: base64Data,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.raw.type,
        filter: 'none',
        border: {
          width: 0,
          color: '#000000',
          style: 'solid'
        },
        shadow: {
          x: 0,
          y: 0,
          blur: 0,
          color: '#000000'
        },
        borderRadius: 0
      }
    )
    
    // 设置元素尺寸
    imageElement.size = { x: width, y: height }
    
    selectedImage.value = imageElement
    console.log('文件上传选择:', file.name, 'selectedImage:', selectedImage.value)
  } catch (error) {
    console.error('处理图片失败:', error)
    ElMessage.error('图片处理失败，请重试')
    clearSelection()
  }
}

// 清除选择
const clearSelection = () => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  selectedImage.value = null
}

// 处理确认
const handleConfirm = () => {
  if (selectedImage.value) {
    emit('imageSelect', selectedImage.value)
    handleClose()
  }
}

// 处理关闭
const handleClose = () => {
  clearSelection()
  emit('close')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取画布中心位置
const getCanvasCenter = () => {
  if (props.canvasEngine) {
    try {
      const viewportCenter = props.canvasEngine.getViewportManager().getViewportCenter()
      return viewportCenter
    } catch (error) {
      console.warn('获取画布中心失败:', error)
    }
  }
  return { x: 400, y: 300 }
}
</script>

<style scoped>
.image-selector-dialog {
  .image-selector-content {
    padding: 16px 0;
  }

  .upload-dragger {
    width: 100%;
    height: 200px;
    
    .el-icon--upload {
      font-size: 48px;
      color: #c0c4cc;
      margin-bottom: 16px;
    }
    
    .el-upload__text {
      color: #606266;
      font-size: 14px;
      
      em {
        color: #409eff;
        font-style: normal;
      }
    }
    
    .el-upload__tip {
      color: #909399;
      font-size: 12px;
      margin-top: 8px;
    }
  }
  
  .upload-preview {
    margin-top: 20px;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    background-color: #f8f9fa;
    
    .preview-title {
      font-size: 14px;
      font-weight: 500;
      color: #606266;
      margin-bottom: 12px;
    }
    
    .preview-image {
      display: flex;
      align-items: center;
      gap: 16px;
      
      img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
        background: white;
      }
      
      .preview-info {
        flex: 1;
        
        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
          word-break: break-all;
        }
        
        .file-size {
          font-size: 12px;
          color: #909399;
          margin-bottom: 2px;
        }
        
        .file-dimensions {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
