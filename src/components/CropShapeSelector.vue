<template>
  <div class="crop-shape-selector">
    <div class="shape-categories">
      <div class="category-tabs">
        <button 
          v-for="category in categories" 
          :key="category.key"
          :class="['category-tab', { active: activeCategory === category.key }]"
          @click="activeCategory = category.key"
        >
          {{ category.label }}
        </button>
      </div>
      
      <div class="shapes-grid">
        <div 
          v-for="shape in getCurrentShapes()" 
          :key="shape.value"
          :class="['shape-item', { active: selectedShape === shape.value }]"
          @click="selectShape(shape.value)"
          :title="shape.label"
        >
          <div :class="['shape-preview', `shape-${shape.value}`]"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface CropShape {
  value: string
  label: string
  category: string
}

const props = defineProps<{
  selectedShape?: string
}>()

const emit = defineEmits<{
  'shape-select': [shape: string]
}>()

const activeCategory = ref('basic')
const selectedShape = ref(props.selectedShape || 'rectangle')

// 形状分类和定义
const categories = [
  { key: 'basic', label: '基础形状' },
  { key: 'geometric', label: '几何形状' },
  { key: 'organic', label: '有机形状' }
]

const shapes: CropShape[] = [
  // 基础形状
  { value: 'rectangle', label: '矩形', category: 'basic' },
  { value: 'circle', label: '圆形', category: 'basic' },
  { value: 'ellipse', label: '椭圆', category: 'basic' },
  { value: 'square', label: '正方形', category: 'basic' },
  { value: 'rounded', label: '圆角矩形', category: 'basic' },
  { value: 'squircle', label: '超圆角', category: 'basic' },
  
  // 几何形状
  { value: 'triangle', label: '三角形', category: 'geometric' },
  { value: 'diamond', label: '菱形', category: 'geometric' },
  { value: 'hexagon', label: '六边形', category: 'geometric' },
  { value: 'octagon', label: '八边形', category: 'geometric' },
  { value: 'pentagon', label: '五边形', category: 'geometric' },
  { value: 'parallelogram', label: '平行四边形', category: 'geometric' },
  { value: 'stadium', label: '体育场形', category: 'geometric' },
  
  // 有机形状
  { value: 'heart', label: '心形', category: 'organic' },
  { value: 'star', label: '星形', category: 'organic' },
  { value: 'cloud', label: '云朵', category: 'organic' },
  { value: 'flower', label: '花朵', category: 'organic' },
  { value: 'egg', label: '蛋形', category: 'organic' },
  { value: 'clover', label: '四叶草', category: 'organic' },
  { value: 'wave', label: '波浪', category: 'organic' },
  { value: 'blob', label: '水滴', category: 'organic' }
]

const getCurrentShapes = () => {
  return shapes.filter(shape => shape.category === activeCategory.value)
}

const selectShape = (shape: string) => {
  selectedShape.value = shape
  emit('shape-select', shape)
}
</script>

<style scoped>
.crop-shape-selector {
  width: 100%;
  max-width: 400px;
}

.category-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 16px;
}

.category-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.category-tab:hover {
  color: #333;
  background: #f5f5f5;
}

.category-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  background: #f0f8ff;
}

.shapes-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 8px 0;
}

.shape-item {
  width: 48px;
  height: 48px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.shape-item:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.shape-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.shape-preview {
  width: 24px;
  height: 24px;
  background: #1890ff;
}

/* 形状样式定义 */
.shape-rectangle {
  border-radius: 0;
}

.shape-circle {
  border-radius: 50%;
}

.shape-ellipse {
  border-radius: 50%;
  width: 32px;
  height: 20px;
}

.shape-square {
  border-radius: 0;
}

.shape-rounded {
  border-radius: 4px;
}

.shape-squircle {
  border-radius: 8px;
}

.shape-triangle {
  width: 0;
  height: 0;
  background: transparent;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid #1890ff;
}

.shape-diamond {
  transform: rotate(45deg);
  border-radius: 0;
}

.shape-hexagon {
  width: 20px;
  height: 20px;
  background: #1890ff;
  position: relative;
  border-radius: 0;
}

.shape-hexagon::before,
.shape-hexagon::after {
  content: '';
  position: absolute;
  width: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
}

.shape-hexagon::before {
  bottom: 100%;
  border-bottom: 6px solid #1890ff;
}

.shape-hexagon::after {
  top: 100%;
  border-top: 6px solid #1890ff;
}

.shape-octagon {
  width: 20px;
  height: 20px;
  background: #1890ff;
  position: relative;
  border-radius: 0;
}

.shape-octagon::before,
.shape-octagon::after {
  content: '';
  position: absolute;
  width: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
}

.shape-octagon::before {
  bottom: 100%;
  border-bottom: 4px solid #1890ff;
}

.shape-octagon::after {
  top: 100%;
  border-top: 4px solid #1890ff;
}

.shape-pentagon {
  width: 20px;
  height: 20px;
  background: #1890ff;
  position: relative;
  border-radius: 0;
}

.shape-pentagon::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 8px solid #1890ff;
}

.shape-parallelogram {
  transform: skew(-20deg);
  border-radius: 0;
}

.shape-stadium {
  border-radius: 20px;
  width: 32px;
  height: 20px;
}

.shape-heart {
  width: 20px;
  height: 18px;
  background: #1890ff;
  position: relative;
  border-radius: 0;
}

.shape-heart::before,
.shape-heart::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 16px;
  background: #1890ff;
  border-radius: 10px 10px 0 0;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
}

.shape-heart::after {
  left: 10px;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}

.shape-star {
  width: 20px;
  height: 20px;
  background: #1890ff;
  position: relative;
  border-radius: 0;
}

.shape-star::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 7px solid #1890ff;
}

.shape-star::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 7px solid #1890ff;
}

.shape-cloud {
  width: 24px;
  height: 16px;
  background: #1890ff;
  border-radius: 20px;
  position: relative;
}

.shape-cloud::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 4px;
  width: 12px;
  height: 12px;
  background: #1890ff;
  border-radius: 50%;
}

.shape-cloud::after {
  content: '';
  position: absolute;
  top: -6px;
  right: 4px;
  width: 10px;
  height: 10px;
  background: #1890ff;
  border-radius: 50%;
}

.shape-flower {
  width: 20px;
  height: 20px;
  background: #1890ff;
  border-radius: 50%;
  position: relative;
}

.shape-flower::before,
.shape-flower::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1890ff;
  border-radius: 50%;
}

.shape-flower::before {
  top: -6px;
  left: 4px;
}

.shape-flower::after {
  bottom: -6px;
  right: 4px;
}

.shape-egg {
  width: 16px;
  height: 20px;
  background: #1890ff;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
}

.shape-clover {
  width: 20px;
  height: 20px;
  background: #1890ff;
  border-radius: 50%;
  position: relative;
}

.shape-clover::before,
.shape-clover::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1890ff;
  border-radius: 50%;
}

.shape-clover::before {
  top: -6px;
  left: 4px;
}

.shape-clover::after {
  bottom: -6px;
  right: 4px;
}

.shape-wave {
  width: 24px;
  height: 16px;
  background: #1890ff;
  border-radius: 0 0 50% 50%;
  position: relative;
}

.shape-wave::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 8px;
  background: #1890ff;
  border-radius: 50% 0 0 0;
}

.shape-wave::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 8px;
  background: #1890ff;
  border-radius: 0 50% 0 0;
}

.shape-blob {
  width: 20px;
  height: 20px;
  background: #1890ff;
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
}
</style>
