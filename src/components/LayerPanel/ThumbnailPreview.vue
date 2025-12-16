<template>
  <div 
    class="thumbnail-preview"
    @click="handleClick"
    @mouseenter="showPreview"
    @mouseleave="hidePreview"
  >
    <!-- 缩略图 -->
    <div class="thumbnail-container">
      <img 
        v-if="thumbnailUrl" 
        :src="thumbnailUrl" 
        :alt="layerName"
        class="thumbnail-image"
        @load="onImageLoad"
        @error="onImageError"
      />
      <div v-else class="thumbnail-placeholder">
        <el-icon v-if="isGroup">
          <Folder />
        </el-icon>
        <el-icon v-else>
          <Document />
        </el-icon>
      </div>
    </div>

    <!-- 悬停放大预览 -->
    <div 
      v-if="showHoverPreview" 
      class="hover-preview"
      :style="hoverPreviewStyle"
    >
      <div class="preview-content">
        <img 
          v-if="thumbnailUrl" 
          :src="thumbnailUrl" 
          :alt="layerName"
          class="preview-image"
        />
        <div class="preview-info">
          <div class="preview-title">{{ layerName }}</div>
          <div class="preview-details">
            <span v-if="isGroup">分组 ({{ elementCount }} 项)</span>
            <span v-else>{{ elementCount }} 个元素</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Folder, Document } from '@element-plus/icons-vue'

interface Props {
  thumbnailUrl: string
  layerName: string
  isGroup: boolean
  elementCount: number
  layerId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [layerId: string]
}>()

// 悬停预览状态
const showHoverPreview = ref(false)
const hoverPosition = ref({ x: 0, y: 0 })
const mousePosition = ref({ x: 0, y: 0 })

// 计算悬停预览样式
const hoverPreviewStyle = computed(() => {
  const offset = 10
  let left = mousePosition.value.x + offset
  let top = mousePosition.value.y + offset

  // 防止预览框超出视窗
  const previewWidth = 200
  const previewHeight = 150
  
  if (left + previewWidth > window.innerWidth) {
    left = mousePosition.value.x - previewWidth - offset
  }
  
  if (top + previewHeight > window.innerHeight) {
    top = mousePosition.value.y - previewHeight - offset
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999
  }
})

// 处理点击
const handleClick = () => {
  emit('click', props.layerId)
}

// 显示悬停预览
const showPreview = (event: MouseEvent) => {
  showHoverPreview.value = true
  updateMousePosition(event)
}

// 隐藏悬停预览
const hidePreview = () => {
  showHoverPreview.value = false
}

// 更新鼠标位置
const updateMousePosition = (event: MouseEvent) => {
  mousePosition.value = {
    x: event.clientX,
    y: event.clientY
  }
}

// 图片加载完成
const onImageLoad = () => {
  // 可以在这里添加加载完成的逻辑
}

// 图片加载失败
const onImageError = () => {
  console.warn('缩略图加载失败:', props.layerId)
}

// 监听鼠标移动
const handleMouseMove = (event: MouseEvent) => {
  if (showHoverPreview.value) {
    updateMousePosition(event)
  }
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
.thumbnail-preview {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.thumbnail-container {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.thumbnail-placeholder {
  color: #9ca3af;
  font-size: 16px;
}

.hover-preview {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 12px;
  min-width: 200px;
  max-width: 300px;
  pointer-events: none;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-image {
  width: 120px;
  height: 80px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #f9fafb;
}

.preview-info {
  text-align: center;
}

.preview-title {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  margin-bottom: 4px;
}

.preview-details {
  font-size: 12px;
  color: #6b7280;
}
</style>
