<template>
  <div class="image-tool-test">
    <h1>图片工具测试</h1>
    
    <!-- 工具栏测试 -->
    <div class="toolbar-test">
      <h2>工具栏按钮测试</h2>
      <el-button 
        :type="currentTool === 'image' ? 'primary' : 'default'"
        @click="setTool('image')"
        :icon="Picture"
        title="图片工具 (I)"
      >
        图片 (I)
      </el-button>
      <p>当前工具: {{ currentTool }}</p>
    </div>

    <!-- 图片选择弹窗测试 -->
    <div class="modal-test">
      <h2>图片选择弹窗测试</h2>
      <el-button @click="showImageSelector = true">打开图片选择弹窗</el-button>
      
      <ImageSelectorModal
        :is-open="showImageSelector"
        @close="handleImageSelectorClose"
        @image-select="handleImageSelect"
      />
    </div>

    <!-- 图片浮动工具栏测试 -->
    <div class="floating-toolbar-test">
      <h2>图片浮动工具栏测试</h2>
      <el-button @click="showFloatingToolbar = true">显示浮动工具栏</el-button>
      
      <ImageFloatingToolbar
        v-if="testImage"
        :image="testImage"
        :on-update="handleImageUpdate"
        :on-delete="handleImageDelete"
        :position="{ x: 100, y: 100 }"
        :visible="showFloatingToolbar"
      />
    </div>

    <!-- 测试结果 -->
    <div class="test-results">
      <h2>测试结果</h2>
      <p>工具栏按钮: {{ currentTool === 'image' ? '✅ 正常' : '❌ 异常' }}</p>
      <p>图片选择弹窗: {{ showImageSelector ? '✅ 打开' : '❌ 关闭' }}</p>
      <p>浮动工具栏: {{ showFloatingToolbar ? '✅ 显示' : '❌ 隐藏' }}</p>
      <p>选中图片: {{ testImage ? '✅ 有图片' : '❌ 无图片' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import ImageSelectorModal from '../components/ImageSelectorModal.vue'
import ImageFloatingToolbar from '../components/ImageFloatingToolbar.vue'
import { ImageElement } from '../core/elements/ImageElement'

// 测试状态
const currentTool = ref('select')
const showImageSelector = ref(false)
const showFloatingToolbar = ref(false)
const testImage = ref<ImageElement | null>(null)

// 创建测试图片
const createTestImage = () => {
  return new ImageElement({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    data: {
      src: '/src/examples/logo.png',
      fileName: 'Logo.png',
      fileSize: 1024,
      filter: 'none',
      border: {
        width: 2,
        color: '#409eff',
        style: 'solid'
      },
      shadow: {
        x: 2,
        y: 2,
        blur: 4,
        color: '#000000'
      },
      borderRadius: 8
    }
  })
}

// 设置工具
const setTool = (tool: string) => {
  currentTool.value = tool
  if (tool === 'image') {
    showImageSelector.value = true
  }
}

// 处理图片选择弹窗关闭
const handleImageSelectorClose = () => {
  showImageSelector.value = false
  currentTool.value = 'select'
}

// 处理图片选择
const handleImageSelect = (imageElement: ImageElement) => {
  testImage.value = imageElement
  showImageSelector.value = false
  showFloatingToolbar.value = true
  currentTool.value = 'select'
}

// 处理图片更新
const handleImageUpdate = (imageElement: ImageElement) => {
  testImage.value = imageElement
  console.log('图片已更新:', imageElement)
}

// 处理图片删除
const handleImageDelete = (imageId: string) => {
  testImage.value = null
  showFloatingToolbar.value = false
  console.log('图片已删除:', imageId)
}

// 初始化测试图片
testImage.value = createTestImage()
</script>

<style scoped>
.image-tool-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.toolbar-test,
.modal-test,
.floating-toolbar-test,
.test-results {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.toolbar-test h2,
.modal-test h2,
.floating-toolbar-test h2,
.test-results h2 {
  margin-top: 0;
  color: #303133;
}

.test-results p {
  margin: 10px 0;
  font-size: 16px;
}
</style>
