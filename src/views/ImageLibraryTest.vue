<template>
  <div class="image-library-test">
    <div class="test-header">
      <h1>图片上传功能测试</h1>
      <p>测试本地上传图片功能</p>
    </div>

    <div class="test-controls">
      <el-button type="primary" @click="openImageSelector">
        打开图片选择器
      </el-button>
    </div>

    <div class="test-content">
      <div class="info-section">
        <h3>支持的格式</h3>
        <div class="format-list">
          <el-tag v-for="format in formats" :key="format" type="success">{{ format }}</el-tag>
        </div>
        <p class="tip">单文件最大 10MB</p>
      </div>
    </div>

    <!-- 图片选择器模态框 -->
    <ImageSelectorModal
      :isOpen="imageSelectorOpen"
      @close="imageSelectorOpen = false"
      @imageSelect="handleImageSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ImageSelectorModal from '@/components/ImageSelectorModal.vue'

const imageSelectorOpen = ref(false)
const formats = ['JPG', 'PNG', 'GIF', 'SVG', 'WebP']

// 打开图片选择器
const openImageSelector = () => {
  imageSelectorOpen.value = true
}

// 处理图片选择
const handleImageSelect = (image: any) => {
  ElMessage.success(`已选择图片: ${image.name || '上传的图片'}`)
  imageSelectorOpen.value = false
}
</script>

<style scoped>
.image-library-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    color: #303133;
    margin-bottom: 10px;
  }
  
  p {
    color: #606266;
    font-size: 16px;
  }
}

.test-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 30px;
}

.test-content {
  margin-bottom: 30px;
}

.info-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  
  h3 {
    color: #303133;
    margin-bottom: 12px;
  }
  
  .format-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .tip {
    color: #909399;
    font-size: 14px;
  }
}
</style>
