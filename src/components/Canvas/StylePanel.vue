<template>
  <div class="style-panel" :class="{ 'panel-open': isOpen }">
    <!-- 样式面板切换按钮 -->
    <el-button 
      @click="togglePanel"
      class="style-panel-toggle"
      :class="{ 'active': isOpen }"
    >
      <Icon icon="mdi:palette" />
      <span>样式</span>
    </el-button>

    <!-- 样式面板内容 -->
    <div v-if="isOpen" class="style-panel-content">
      <div class="panel-header">
        <h3>样式设置</h3>
        <el-button 
          type="text" 
          @click="togglePanel"
          class="close-button"
        >
          <Icon icon="mdi:close" />
        </el-button>
      </div>

      <div class="panel-body">
        <!-- 线条样式 -->
        <div class="style-section">
          <div class="section-title">
            <Icon icon="mdi:vector-line" />
            <span>线条样式</span>
          </div>
          
          <div class="style-group">
            <label>线条粗细</label>
            <div class="stroke-width-control">
              <el-slider 
                v-model="currentStyle.strokeWidth"
                :min="1"
                :max="20"
                :step="1"
                @change="updateStyle"
                show-input
                input-size="small"
              />
            </div>
          </div>

          <div class="style-group">
            <label>线条样式</label>
            <el-select 
              v-model="currentStyle.lineStyle"
              @change="updateStyle"
              size="small"
              style="width: 100%"
            >
              <el-option 
                v-for="style in lineStyles" 
                :key="style.value"
                :label="style.label"
                :value="style.value"
              />
            </el-select>
          </div>

          <div class="style-group">
            <label>线条端点</label>
            <el-select 
              v-model="currentStyle.lineCap"
              @change="updateStyle"
              size="small"
              style="width: 100%"
            >
              <el-option 
                v-for="cap in lineCaps" 
                :key="cap.value"
                :label="cap.label"
                :value="cap.value"
              />
            </el-select>
          </div>
        </div>

        <!-- 填充样式 -->
        <div class="style-section">
          <div class="section-title">
            <Icon icon="mdi:format-color-fill" />
            <span>填充样式</span>
          </div>
          
          <div class="style-group">
            <label>填充类型</label>
            <el-radio-group 
              v-model="currentStyle.fillType"
              @change="updateStyle"
              size="small"
            >
              <el-radio label="solid">纯色</el-radio>
              <el-radio label="gradient">渐变</el-radio>
            </el-radio-group>
          </div>

          <div v-if="currentStyle.fillType === 'solid'" class="style-group">
            <label>填充颜色</label>
            <div class="color-picker-group">
              <el-button 
                :style="{ backgroundColor: currentStyle.fill }"
                @click="openColorPicker('fill')"
                class="color-picker-button"
              >
                <Icon icon="mdi:palette" />
              </el-button>
              <el-input 
                v-model="currentStyle.fill"
                @change="updateStyle"
                size="small"
                placeholder="#000000"
              />
            </div>
          </div>

          <div v-if="currentStyle.fillType === 'gradient'" class="style-group">
            <label>渐变方向</label>
            <el-select 
              v-model="currentStyle.gradientDirection"
              @change="updateStyle"
              size="small"
              style="width: 100%"
            >
              <el-option 
                v-for="direction in gradientDirections" 
                :key="direction.value"
                :label="direction.label"
                :value="direction.value"
              />
            </el-select>
          </div>

          <div class="style-group">
            <el-checkbox 
              v-model="currentStyle.fillEnabled"
              @change="updateStyle"
            >
              启用填充
            </el-checkbox>
          </div>
        </div>

        <!-- 边框样式 -->
        <div class="style-section">
          <div class="section-title">
            <Icon icon="mdi:border-outside" />
            <span>边框样式</span>
          </div>
          
          <div class="style-group">
            <label>边框颜色</label>
            <div class="color-picker-group">
              <el-button 
                :style="{ backgroundColor: currentStyle.stroke }"
                @click="openColorPicker('stroke')"
                class="color-picker-button"
              >
                <Icon icon="mdi:palette" />
              </el-button>
              <el-input 
                v-model="currentStyle.stroke"
                @change="updateStyle"
                size="small"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        <!-- 文本样式 -->
        <div class="style-section">
          <div class="section-title">
            <Icon icon="mdi:format-text" />
            <span>文本样式</span>
          </div>
          
          <div class="style-group">
            <label>字体</label>
            <el-select 
              v-model="currentStyle.fontFamily"
              @change="updateStyle"
              size="small"
              style="width: 100%"
            >
              <el-option 
                v-for="font in fontFamilies" 
                :key="font.value"
                :label="font.label"
                :value="font.value"
                :style="{ fontFamily: font.value }"
              />
            </el-select>
          </div>

          <div class="style-group">
            <label>字体大小</label>
            <el-input-number 
              v-model="currentStyle.fontSize"
              @change="updateStyle"
              :min="8"
              :max="72"
              size="small"
              style="width: 100%"
            />
          </div>

          <div class="style-group">
            <label>文本对齐</label>
            <el-radio-group 
              v-model="currentStyle.textAlign"
              @change="updateStyle"
              size="small"
            >
              <el-radio label="left">左对齐</el-radio>
              <el-radio label="center">居中</el-radio>
              <el-radio label="right">右对齐</el-radio>
            </el-radio-group>
          </div>

          <div class="style-group">
            <label>文本装饰</label>
            <el-checkbox-group 
              v-model="textDecorations"
              @change="updateTextDecoration"
            >
              <el-checkbox label="underline">下划线</el-checkbox>
              <el-checkbox label="line-through">删除线</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 预设样式 -->
        <div class="style-section">
          <div class="section-title">
            <Icon icon="mdi:bookmark" />
            <span>预设样式</span>
          </div>
          
          <div class="preset-styles">
            <div 
              v-for="preset in stylePresets" 
              :key="preset.name"
              class="preset-item"
              @click="applyPreset(preset)"
              :title="preset.name"
            >
              <div class="preset-preview" :style="getPresetStyle(preset)"></div>
              <span class="preset-name">{{ preset.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import type { ElementStyle } from '@/types/canvas.types'

interface StylePanelProps {
  modelValue: ElementStyle
  visible?: boolean
}

interface StylePanelEmits {
  (e: 'update:modelValue', style: ElementStyle): void
  (e: 'open:color-picker', type: 'fill' | 'stroke'): void
}

const props = withDefaults(defineProps<StylePanelProps>(), {
  visible: true
})

const emit = defineEmits<StylePanelEmits>()

// 响应式数据
const isOpen = ref(false)

// 当前样式
const currentStyle = ref<ElementStyle>({ ...props.modelValue })

// 文本装饰数组
const textDecorations = ref<string[]>([])

// 字体选项
const fontFamilies = ref([
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Georgia', value: 'Georgia' },
  { label: '宋体', value: 'SimSun' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '黑体', value: 'SimHei' }
])

// 线条样式选项
const lineStyles = ref([
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' }
])

const lineCaps = ref([
  { label: '圆形', value: 'round' },
  { label: '方形', value: 'square' },
  { label: '平直', value: 'butt' }
])

// 渐变方向选项
const gradientDirections = ref([
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' },
  { label: '对角线', value: 'diagonal' },
  { label: '径向', value: 'radial' }
])

// 预设样式
const stylePresets = ref([
  {
    name: '默认',
    style: {
      fill: '#000000',
      fillEnabled: true,
      fillType: 'solid',
      gradientDirection: 'horizontal',
      stroke: '#000000',
      strokeWidth: 2,
      lineStyle: 'solid',
      lineCap: 'round',
      fontSize: 16,
      fontFamily: 'Arial',
      textAlign: 'left',
      textDecoration: 'none'
    }
  },
  {
    name: '强调',
    style: {
      fill: '#FF6B6B',
      fillEnabled: true,
      fillType: 'solid',
      gradientDirection: 'horizontal',
      stroke: '#E74C3C',
      strokeWidth: 3,
      lineStyle: 'solid',
      lineCap: 'round',
      fontSize: 18,
      fontFamily: 'Arial',
      textAlign: 'center',
      textDecoration: 'none'
    }
  },
  {
    name: '优雅',
    style: {
      fill: '#6C5CE7',
      fillEnabled: true,
      fillType: 'solid',
      gradientDirection: 'horizontal',
      stroke: '#5F3DC4',
      strokeWidth: 2,
      lineStyle: 'solid',
      lineCap: 'round',
      fontSize: 16,
      fontFamily: 'Georgia',
      textAlign: 'left',
      textDecoration: 'none'
    }
  },
  {
    name: '商务',
    style: {
      fill: '#2D3436',
      fillEnabled: true,
      fillType: 'solid',
      gradientDirection: 'horizontal',
      stroke: '#636E72',
      strokeWidth: 1,
      lineStyle: 'solid',
      lineCap: 'round',
      fontSize: 14,
      fontFamily: 'Arial',
      textAlign: 'left',
      textDecoration: 'none'
    }
  }
])

// 更新样式
function updateStyle() {
  emit('update:modelValue', { ...currentStyle.value })
}

// 打开颜色选择器
function openColorPicker(type: 'fill' | 'stroke') {
  emit('open:color-picker', type)
}

// 更新文本装饰
function updateTextDecoration() {
  currentStyle.value.textDecoration = textDecorations.value.join(' ')
  updateStyle()
}

// 应用预设样式
function applyPreset(preset: any) {
  currentStyle.value = { ...preset.style }
  textDecorations.value = preset.style.textDecoration ? preset.style.textDecoration.split(' ') : []
  updateStyle()
}

// 获取预设样式
function getPresetStyle(preset: any) {
  return {
    backgroundColor: preset.style.fill,
    border: `2px solid ${preset.style.stroke}`,
    borderRadius: '4px'
  }
}

// 切换面板
function togglePanel() {
  isOpen.value = !isOpen.value
}

// 监听外部样式变化
watch(() => props.modelValue, (newStyle) => {
  currentStyle.value = { ...newStyle }
  textDecorations.value = newStyle.textDecoration ? newStyle.textDecoration.split(' ') : []
}, { deep: true })

// 初始化
onMounted(() => {
  textDecorations.value = currentStyle.value.textDecoration ? currentStyle.value.textDecoration.split(' ') : []
})
</script>

<style scoped>
.style-panel {
  position: relative;
  display: inline-block;
}

.style-panel-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
}

.style-panel-toggle:hover {
  background: #f8f9fa;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.style-panel-toggle.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.style-panel-content {
  position: absolute;
  top: 100%;
  left: 0;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  z-index: 1000;
  margin-top: 8px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-button {
  padding: 4px;
  color: #666;
}

.close-button:hover {
  color: #333;
  background-color: #f5f5f5;
}

.panel-body {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.style-section {
  margin-bottom: 24px;
}

.style-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.style-group {
  margin-bottom: 16px;
}

.style-group:last-child {
  margin-bottom: 0;
}

.style-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.color-picker-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker-button {
  width: 32px;
  height: 32px;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.color-picker-button:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.preset-styles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.preset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-item:hover {
  border-color: #409eff;
  background: #f8f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.preset-preview {
  width: 40px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.preset-name {
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* 滚动条样式 */
.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .style-panel-content {
    width: 280px;
  }
  
  .preset-styles {
    grid-template-columns: 1fr;
  }
}

/* 表单元素样式 */
.el-slider {
  margin: 8px 0;
}

.el-select,
.el-input,
.el-input-number {
  width: 100%;
}

.el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 动画效果 */
.style-section {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>