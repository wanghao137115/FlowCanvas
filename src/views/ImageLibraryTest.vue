<template>
  <div class="image-library-test">
    <div class="test-header">
      <h1>图片库管理功能测试</h1>
      <p>测试预设图片库的分类筛选、搜索和UI优化功能</p>
    </div>

    <div class="test-controls">
      <el-button type="primary" @click="openImageSelector">
        打开图片选择器
      </el-button>
      <el-button @click="showStats">
        显示统计信息
      </el-button>
      <el-button @click="testSearch">
        测试搜索功能
      </el-button>
    </div>

    <div class="test-content">
      <div class="stats-section" v-if="showStatsInfo">
        <h3>图片库统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ totalImages }}</div>
            <div class="stat-label">总图片数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ categories.length }}</div>
            <div class="stat-label">分类数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ allTags.length }}</div>
            <div class="stat-label">标签数</div>
          </div>
        </div>
        
        <div class="category-stats">
          <h4>分类统计</h4>
          <div class="category-list">
            <div 
              v-for="category in categories" 
              :key="category"
              class="category-item"
            >
              <span class="category-name">{{ category }}</span>
              <span class="category-count">{{ getCategoryCount(category) }}</span>
            </div>
          </div>
        </div>

        <div class="tag-stats">
          <h4>热门标签</h4>
          <div class="tag-cloud">
            <el-tag 
              v-for="tag in popularTags" 
              :key="tag"
              :type="getTagType(tag)"
              size="small"
              class="tag-cloud-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="search-test" v-if="showSearchTest">
        <h3>搜索功能测试</h3>
        <div class="search-examples">
          <div class="search-example">
            <h4>按名称搜索</h4>
            <el-button 
              v-for="query in searchQueries" 
              :key="query"
              @click="testSearchQuery(query)"
              size="small"
            >
              {{ query }}
            </el-button>
          </div>
          <div class="search-example">
            <h4>按分类筛选</h4>
            <el-button 
              v-for="category in categories.slice(1)" 
              :key="category"
              @click="testCategoryFilter(category)"
              size="small"
            >
              {{ category }}
            </el-button>
          </div>
          <div class="search-example">
            <h4>按标签筛选</h4>
            <el-button 
              v-for="tag in popularTags.slice(0, 5)" 
              :key="tag"
              @click="testTagFilter(tag)"
              size="small"
            >
              {{ tag }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片选择器模态框 -->
    <ImageSelectorModal
      :isOpen="imageSelectorOpen"
      @close="imageSelectorOpen = false"
      @imageSelect="handleImageSelect"
    />

    <!-- 搜索结果展示 -->
    <div class="search-results" v-if="searchResults.length > 0">
      <h3>搜索结果 ({{ searchResults.length }} 个)</h3>
      <div class="results-grid">
        <div 
          v-for="image in searchResults" 
          :key="image.id"
          class="result-item"
        >
          <img :src="image.url" :alt="image.name" />
          <div class="result-info">
            <div class="result-name">{{ image.name }}</div>
            <div class="result-category">{{ image.category }}</div>
            <div class="result-tags">
              <el-tag 
                v-for="tag in image.tags.slice(0, 3)" 
                :key="tag"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ImageSelectorModal from '@/components/ImageSelectorModal.vue'
import { 
  PRESET_IMAGES, 
  getCategories, 
  getAllTags, 
  getImagesByCategory, 
  getImagesByTag, 
  searchImages,
  type PresetImage 
} from '@/data/presetImages'

const imageSelectorOpen = ref(false)
const showStatsInfo = ref(false)
const showSearchTest = ref(false)
const searchResults = ref<PresetImage[]>([])

// 统计数据
const totalImages = computed(() => PRESET_IMAGES.length)
const categories = computed(() => ['全部', ...getCategories()])
const allTags = computed(() => getAllTags())
const popularTags = computed(() => allTags.value.slice(0, 8))

// 搜索测试数据
const searchQueries = ['logo', 'icon', 'background', 'decoration', 'shape', 'business', 'tech']

// 获取分类数量
const getCategoryCount = (category: string): number => {
  if (category === '全部') {
    return PRESET_IMAGES.length
  }
  return PRESET_IMAGES.filter(img => img.category === category).length
}

// 获取标签类型（用于颜色区分）
const getTagType = (tag: string): string => {
  const types = ['', 'success', 'warning', 'danger', 'info']
  const index = allTags.value.indexOf(tag) % types.length
  return types[index]
}

// 打开图片选择器
const openImageSelector = () => {
  imageSelectorOpen.value = true
}

// 显示统计信息
const showStats = () => {
  showStatsInfo.value = !showStatsInfo.value
  showSearchTest.value = false
  searchResults.value = []
}

// 测试搜索功能
const testSearch = () => {
  showSearchTest.value = !showSearchTest.value
  showStatsInfo.value = false
  searchResults.value = []
}

// 测试搜索查询
const testSearchQuery = (query: string) => {
  const results = searchImages(query)
  searchResults.value = results
  ElMessage.success(`搜索 "${query}" 找到 ${results.length} 个结果`)
}

// 测试分类筛选
const testCategoryFilter = (category: string) => {
  const results = getImagesByCategory(category)
  searchResults.value = results
  ElMessage.success(`分类 "${category}" 有 ${results.length} 个图片`)
}

// 测试标签筛选
const testTagFilter = (tag: string) => {
  const results = getImagesByTag(tag)
  searchResults.value = results
  ElMessage.success(`标签 "${tag}" 有 ${results.length} 个图片`)
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
  max-width: 1200px;
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

.stats-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  
  h3 {
    color: #303133;
    margin-bottom: 20px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    
    .stat-item {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      .stat-number {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #606266;
      }
    }
  }
  
  .category-stats, .tag-stats {
    margin-bottom: 20px;
    
    h4 {
      color: #303133;
      margin-bottom: 12px;
    }
  }
  
  .category-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    
    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e4e7ed;
      
      .category-name {
        font-weight: 500;
        color: #303133;
      }
      
      .category-count {
        color: #409eff;
        font-weight: bold;
      }
    }
  }
  
  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .tag-cloud-item {
      margin: 0;
    }
  }
}

.search-test {
  background: #f0f9ff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #b3d8ff;
  
  h3 {
    color: #303133;
    margin-bottom: 20px;
  }
  
  .search-examples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    
    .search-example {
      h4 {
        color: #303133;
        margin-bottom: 12px;
        font-size: 14px;
      }
      
      .el-button {
        margin: 4px;
      }
    }
  }
}

.search-results {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  
  h3 {
    color: #303133;
    margin-bottom: 20px;
  }
  
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    
    .result-item {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
      }
      
      img {
        width: 100%;
        height: 120px;
        object-fit: cover;
      }
      
      .result-info {
        padding: 12px;
        
        .result-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .result-category {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }
        
        .result-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
      }
    }
  }
}
</style>
