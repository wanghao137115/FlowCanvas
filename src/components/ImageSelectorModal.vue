<template>
  <el-dialog
    v-model="visible"
    title="选择图片"
    width="900px"
    :before-close="handleClose"
    class="image-selector-dialog"
  >
    <div class="image-selector-content">
      <!-- 分类选择 -->
      <div class="category-tabs">
        <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
          <el-tab-pane label="预设图片" name="preset">
            <!-- 搜索和筛选区域 -->
            <div class="search-filter-section">
              <!-- 搜索框 -->
              <div class="search-box">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索图片名称、描述或标签..."
                  clearable
                  @input="handleSearch"
                  @clear="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
              
              <!-- 分类筛选 -->
              <div class="category-filter">
                <div class="filter-label">分类：</div>
                <div class="category-buttons">
                  <el-button
                    v-for="category in categories"
                    :key="category"
                    :type="selectedCategory === category ? 'primary' : 'default'"
                    size="small"
                    @click="handleCategoryFilter(category)"
                  >
                    {{ category }}
                    <el-badge 
                      v-if="getCategoryCount(category) > 0" 
                      :value="getCategoryCount(category)" 
                      class="ml-1"
                    />
                  </el-button>
                </div>
              </div>
              
              <!-- 标签筛选 -->
              <div class="tag-filter">
                <div class="filter-label">标签：</div>
                <div class="tag-buttons">
                  <el-tag
                    v-for="tag in popularTags"
                    :key="tag"
                    :type="selectedTags.includes(tag) ? 'primary' : 'info'"
                    :effect="selectedTags.includes(tag) ? 'dark' : 'light'"
                    class="tag-item"
                    @click="toggleTag(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <!-- 图片展示区域 -->
            <div class="preset-images">
              <div 
                v-for="image in filteredPresetImages" 
                :key="image.id"
                class="preset-image-item"
                :class="{ 'selected': selectedPresetImage === image.id }"
                @click="selectPresetImage(image)"
              >
                <div class="image-container">
                  <img :src="image.url" :alt="image.name" />
                  <div class="image-overlay">
                    <div class="image-category">{{ image.category }}</div>
                    <div class="image-tags">
                      <el-tag
                        v-for="tag in image.tags.slice(0, 2)"
                        :key="tag"
                        size="small"
                        type="info"
                        effect="plain"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div class="image-name">{{ image.name }}</div>
                <div class="image-description">{{ image.description }}</div>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="filteredPresetImages.length === 0" class="empty-state">
              <el-empty description="没有找到匹配的图片">
                <el-button type="primary" @click="clearFilters">清除筛选</el-button>
              </el-empty>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="本地上传" name="upload">
            <div class="upload-section">
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
              <div v-if="selectedImage && activeCategory === 'upload'" class="upload-preview">
                <div class="preview-title">已选择的图片：</div>
                <div class="preview-image">
                  <img :src="selectedImage.data.src" :alt="selectedImage.data.fileName" />
                  <div class="preview-info">
                    <div class="file-name">{{ selectedImage.data.fileName }}</div>
                    <div class="file-size">{{ formatFileSize(selectedImage.data.fileSize) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedImage">
          确定 ({{ selectedImage ? '已选择' : '未选择' }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UploadFilled, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ImageElement } from '@/core/elements/ImageElement'
import { 
  PRESET_IMAGES, 
  getCategories, 
  getAllTags, 
  getImagesByCategory, 
  getImagesByTag, 
  searchImages,
  type PresetImage 
} from '@/data/presetImages'

interface Props {
  isOpen: boolean
  canvasEngine?: any // 画布引擎引用
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

const activeCategory = ref('preset')
const selectedImage = ref<ImageElement | null>(null)
const selectedPresetImage = ref<string | null>(null)
const uploadRef = ref()

// 搜索和筛选状态
const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedTags = ref<string[]>([])

// 获取分类和标签
const categories = computed(() => ['全部', ...getCategories()])
const allTags = computed(() => getAllTags())
const popularTags = computed(() => allTags.value.slice(0, 8)) // 显示前8个热门标签

const acceptedFormats = 'image/jpeg,image/png,image/gif,image/svg+xml,image/webp'

// 过滤预设图片
const filteredPresetImages = computed(() => {
  let images = PRESET_IMAGES
  
  // 按分类筛选
  if (selectedCategory.value !== '全部') {
    images = images.filter(img => img.category === selectedCategory.value)
  }
  
  // 按标签筛选
  if (selectedTags.value.length > 0) {
    images = images.filter(img => 
      selectedTags.value.some(tag => img.tags.includes(tag))
    )
  }
  
  // 按搜索词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    images = images.filter(img => 
      img.name.toLowerCase().includes(query) ||
      img.description?.toLowerCase().includes(query) ||
      img.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  return images
})

// 处理分类切换
const handleCategoryChange = (category: string) => {
  activeCategory.value = category
  selectedImage.value = null
  selectedPresetImage.value = null
}

// 处理分类筛选
const handleCategoryFilter = (category: string) => {
  selectedCategory.value = category
}

// 处理标签切换
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 获取分类数量
const getCategoryCount = (category: string): number => {
  if (category === '全部') {
    return PRESET_IMAGES.length
  }
  return PRESET_IMAGES.filter(img => img.category === category).length
}

// 清除所有筛选
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = '全部'
  selectedTags.value = []
}

// 选择预设图片
const selectPresetImage = (image: PresetImage) => {
  // 设置选中状态
  selectedPresetImage.value = image.id
  
  // 获取画布中心位置
  const canvasCenter = getCanvasCenter()
  
  // 创建ImageElement
  const imageElement = new ImageElement(
    'image_' + Date.now(), // id
    canvasCenter, // position - 使用画布中心
    {
      src: image.url,
      originalWidth: 200, // 预设图片的原始宽度
      originalHeight: 200, // 预设图片的原始高度
      fileName: image.name,
      fileSize: 0, // 预设图片没有文件大小
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
  
  selectedImage.value = imageElement
  console.log('预设图片选择:', image.name, 'selectedImage:', selectedImage.value)
}

// 处理文件上传
const handleFileChange = (file: any) => {
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

  // 创建文件URL
  const fileUrl = URL.createObjectURL(file.raw)
  
  // 获取图片原始尺寸
  const img = new Image()
  img.onload = () => {
    // 获取画布中心位置
    const canvasCenter = getCanvasCenter()
    
    // 创建ImageElement
    const imageElement = new ImageElement(
      'image_' + Date.now(), // id
      canvasCenter, // position - 使用画布中心
      {
        src: fileUrl,
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
    
    selectedImage.value = imageElement
    console.log('文件上传选择:', file.name, 'selectedImage:', selectedImage.value)
  }
  
  img.onerror = () => {
    ElMessage.error('图片加载失败')
  }
  
  img.src = fileUrl
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
  selectedImage.value = null
  selectedPresetImage.value = null
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
      // 获取视口中心点
      const viewportCenter = props.canvasEngine.getViewportManager().getViewportCenter()
      return viewportCenter
    } catch (error) {
      console.warn('获取画布中心失败:', error)
    }
  }
  // 默认位置
  return { x: 400, y: 300 }
}

onMounted(() => {
  // 组件挂载时的初始化
})
</script>

<style scoped>
.image-selector-dialog {
  .image-selector-content {
    .category-tabs {
      .search-filter-section {
        margin-bottom: 20px;
        padding: 16px;
        background-color: #f8f9fa;
        border-radius: 8px;
        
        .search-box {
          margin-bottom: 16px;
        }
        
        .category-filter, .tag-filter {
          margin-bottom: 12px;
          
          .filter-label {
            font-size: 14px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 8px;
          }
          
          .category-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .tag-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            
            .tag-item {
              cursor: pointer;
              transition: all 0.2s;
              
              &:hover {
                transform: translateY(-1px);
              }
            }
          }
        }
      }
      
      .preset-images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 16px;
        max-height: 500px;
        overflow-y: auto;
        padding: 8px;
        
        .preset-image-item {
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
          position: relative;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          
          &:hover {
            border-color: #409eff;
            background-color: #f0f9ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
          }
          
          &.selected {
            border-color: #409eff;
            background-color: #e6f7ff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
            
            &::after {
              content: '✓';
              position: absolute;
              top: 8px;
              right: 8px;
              width: 24px;
              height: 24px;
              background-color: #409eff;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
              z-index: 10;
            }
          }
          
          .image-container {
            position: relative;
            margin-bottom: 12px;
            
            img {
              width: 100%;
              height: 100px;
              object-fit: cover;
              border-radius: 8px;
            }
            
            .image-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
              border-radius: 8px;
              opacity: 0;
              transition: opacity 0.3s;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              padding: 8px;
              
              .image-category {
                color: white;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 4px;
              }
              
              .image-tags {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
              }
            }
          }
          
          &:hover .image-overlay {
            opacity: 1;
          }
          
          .image-name {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 4px;
            word-break: break-all;
          }
          
          .image-description {
            font-size: 12px;
            color: #909399;
            line-height: 1.4;
            word-break: break-all;
          }
        }
      }
      
      .empty-state {
        padding: 40px 20px;
        text-align: center;
      }
      
      .upload-section {
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
            gap: 12px;
            
            img {
              width: 80px;
              height: 80px;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid #e4e7ed;
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
              }
            }
          }
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
