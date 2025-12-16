<template>
  <div v-if="visible" class="template-modal-overlay" @click="closeModal">
    <div class="template-modal" @click.stop>
      <div class="template-modal-header">
        <h2>选择模板</h2>
        <button class="close-btn" @click="closeModal">
          <i class="el-icon-close"></i>
        </button>
      </div>
      
      <div class="template-modal-content">
        <!-- 分类标签 -->
        <div class="template-categories">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-tab"
            :class="{ active: selectedCategory === category.id }"
            @click="selectedCategory = category.id"
          >
            <i :class="`el-icon-${category.icon}`"></i>
            <span>{{ category.name }}</span>
          </div>
        </div>
        
        <!-- 模板列表 -->
        <div class="template-list">
          <div 
            v-for="template in currentTemplates" 
            :key="template.id"
            class="template-item"
            @click="selectTemplate(template)"
          >
            <div class="template-preview">
              <img 
                :src="template.previewImage" 
                :alt="template.name"
                @error="handleImageError"
              />
            </div>
            <div class="template-info">
              <h3>{{ template.name }}</h3>
              <p>{{ template.description }}</p>
              <div class="template-tags">
                <span 
                  v-for="tag in template.tags" 
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="currentTemplates.length === 0" class="empty-state">
          <i class="el-icon-document"></i>
          <p>该分类下暂无模板</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { simpleTemplateLibrary, FlowTemplate } from '../data/simpleTemplates'

// Props
interface Props {
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
})

// Emits
const emit = defineEmits<{
  close: []
  select: [template: FlowTemplate]
}>()

// 响应式数据
const selectedCategory = ref('simple-flowchart')
const categories = simpleTemplateLibrary.categories

// 计算属性
const currentTemplates = computed(() => {
  const category = categories.find(c => c.id === selectedCategory.value)
  return category ? category.templates : []
})

// 方法
const closeModal = () => {
  emit('close')
}

const selectTemplate = (template: FlowTemplate) => {
  emit('select', template)
  closeModal()
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 设置默认图片或占位符
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWOTBIODBWNjBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTIwIiBmaWxsPSIjOTk5OTk5IiBmb250LXNpemU9IjE0Ij7lm77niYfliqDovb3lpLHotKU8L3RleHQ+Cjwvc3ZnPgo='
}

// 生命周期
onMounted(() => {
  // 初始化选中第一个分类
  if (categories.length > 0) {
    selectedCategory.value = categories[0].id
  }
})
</script>

<style scoped>
.template-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.template-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 1000px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.template-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.template-modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #666;
}

.template-modal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.template-categories {
  display: flex;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e5e5;
  gap: 8px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  font-size: 14px;
}

.category-tab:hover {
  background-color: #f5f5f5;
  color: #333;
}

.category-tab.active {
  background-color: #007AFF;
  color: white;
}

.template-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.template-item {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.template-item:hover {
  border-color: #007AFF;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
  transform: translateY(-2px);
}

.template-preview {
  height: 150px;
  overflow: hidden;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-info {
  padding: 16px;
}

.template-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.template-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.template-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-modal {
    width: 95%;
    max-height: 90vh;
  }
  
  .template-list {
    grid-template-columns: 1fr;
  }
  
  .template-categories {
    flex-wrap: wrap;
  }
}
</style>
