<template>
  <div class="color-picker-container">
    <!-- 颜色选择器按钮 -->
    <el-button 
      :style="{ backgroundColor: currentColor, border: '2px solid #ddd' }"
      @click="showPicker = !showPicker"
      class="color-picker-button"
    >
      <Icon icon="mdi:palette" class="color-icon" />
    </el-button>

    <!-- 弹出式颜色选择器面板 -->
    <div v-if="showPicker" class="color-picker-panel">
      <div class="color-picker-header">
        <span>颜色选择器</span>
        <el-button 
          type="text" 
          @click="showPicker = false"
          class="close-button"
        >
          <Icon icon="mdi:close" />
        </el-button>
      </div>

      <div class="color-picker-content">
        <!-- 颜色预览 -->
        <div class="color-preview">
          <div 
            class="current-color" 
            :style="{ backgroundColor: currentColor }"
          ></div>
          <div class="color-info">
            <div class="color-hex">{{ currentColor }}</div>
            <div class="color-rgb">{{ rgbString }}</div>
          </div>
        </div>

        <!-- 颜色选择区域 -->
        <div class="color-selection">
          <!-- 色相饱和度选择器 -->
          <div class="hue-saturation-picker">
            <div 
              class="hue-saturation-area"
              :style="{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }"
              @mousedown="startHueSaturationDrag"
            >
              <div 
                class="hue-saturation-handle"
                :style="{ 
                  left: `${(hsv.s / 100) * 200}px`, 
                  top: `${200 - (hsv.v / 100) * 200}px` 
                }"
              ></div>
            </div>
          </div>

          <!-- 色相滑块 -->
          <div class="hue-slider">
            <div 
              class="hue-slider-track"
              @mousedown="startHueDrag"
            >
              <div 
                class="hue-slider-handle"
                :style="{ left: `${(hsv.h / 360) * 200}px` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 颜色输入区域 -->
        <div class="color-inputs">
          <div class="input-group">
            <label>HEX</label>
            <el-input 
              v-model="hexInput" 
              @input="updateFromHex"
              placeholder="#000000"
            />
          </div>
          
          <div class="input-group">
            <label>RGB</label>
            <div class="rgb-inputs">
              <el-input-number 
                v-model="rgb.r" 
                :min="0" 
                :max="255" 
                @change="updateFromRgb"
                size="small"
              />
              <el-input-number 
                v-model="rgb.g" 
                :min="0" 
                :max="255" 
                @change="updateFromRgb"
                size="small"
              />
              <el-input-number 
                v-model="rgb.b" 
                :min="0" 
                :max="255" 
                @change="updateFromRgb"
                size="small"
              />
            </div>
          </div>

          <div class="input-group">
            <label>HSV</label>
            <div class="hsv-inputs">
              <el-input-number 
                v-model="hsv.h" 
                :min="0" 
                :max="360" 
                @change="updateFromHsv"
                size="small"
              />
              <el-input-number 
                v-model="hsv.s" 
                :min="0" 
                :max="100" 
                @change="updateFromHsv"
                size="small"
              />
              <el-input-number 
                v-model="hsv.v" 
                :min="0" 
                :max="100" 
                @change="updateFromHsv"
                size="small"
              />
            </div>
          </div>
        </div>

        <!-- 预设颜色 -->
        <div class="preset-colors">
          <div class="preset-title">预设颜色</div>
          <div class="preset-grid">
            <div 
              v-for="color in presetColors" 
              :key="color"
              class="preset-color"
              :style="{ backgroundColor: color }"
              @click="selectPresetColor(color)"
            ></div>
          </div>
        </div>

        <!-- 颜色历史 -->
        <div class="color-history" v-if="colorHistory.length > 0">
          <div class="history-title">最近使用</div>
          <div class="history-grid">
            <div 
              v-for="color in colorHistory" 
              :key="color"
              class="history-color"
              :style="{ backgroundColor: color }"
              @click="selectPresetColor(color)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

interface RGB {
  r: number
  g: number
  b: number
}

interface HSV {
  h: number
  s: number
  v: number
}

interface ColorPickerProps {
  modelValue: string
  showHistory?: boolean
  maxHistory?: number
}

interface ColorPickerEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<ColorPickerProps>(), {
  showHistory: true,
  maxHistory: 10
})

const emit = defineEmits<ColorPickerEmits>()

// 响应式数据
const showPicker = ref(false)
const isDragging = ref(false)
const dragType = ref<'hue' | 'saturation' | null>(null)

// 颜色数据
const currentColor = ref(props.modelValue)
const hexInput = ref(props.modelValue)
const rgb = ref<RGB>({ r: 0, g: 0, b: 0 })
const hsv = ref<HSV>({ h: 0, s: 0, v: 0 })

// 预设颜色
const presetColors = ref([
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#000000', '#FFFFFF', '#808080', '#FFA500', '#800080', '#008000',
  '#FFC0CB', '#A52A2A', '#000080', '#808000', '#FFD700', '#C0C0C0'
])

// 颜色历史
const colorHistory = ref<string[]>([])

// 计算属性
const rgbString = computed(() => `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`)

// 颜色转换函数
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6
    } else if (max === g) {
      h = (b - r) / diff + 2
    } else {
      h = (r - g) / diff + 4
    }
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const s = max === 0 ? 0 : diff / max
  const v = max

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  }
}

function hsvToRgb(h: number, s: number, v: number): RGB {
  h = h / 360
  s = s / 100
  v = v / 100

  const c = v * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = v - c

  let r = 0, g = 0, b = 0

  if (h >= 0 && h < 1/6) {
    r = c; g = x; b = 0
  } else if (h >= 1/6 && h < 2/6) {
    r = x; g = c; b = 0
  } else if (h >= 2/6 && h < 3/6) {
    r = 0; g = c; b = x
  } else if (h >= 3/6 && h < 4/6) {
    r = 0; g = x; b = c
  } else if (h >= 4/6 && h < 5/6) {
    r = x; g = 0; b = c
  } else if (h >= 5/6 && h < 1) {
    r = c; g = 0; b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

// 更新颜色
function updateColor() {
  const hex = rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b)
  currentColor.value = hex
  hexInput.value = hex
  emit('update:modelValue', hex)
  emit('change', hex)
}

// 从HEX更新
function updateFromHex() {
  if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
    rgb.value = hexToRgb(hexInput.value)
    hsv.value = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b)
    updateColor()
  }
}

// 从RGB更新
function updateFromRgb() {
  hsv.value = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b)
  updateColor()
}

// 从HSV更新
function updateFromHsv() {
  rgb.value = hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v)
  updateColor()
}

// 选择预设颜色
function selectPresetColor(color: string) {
  currentColor.value = color
  hexInput.value = color
  rgb.value = hexToRgb(color)
  hsv.value = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b)
  updateColor()
  addToHistory(color)
}

// 添加到历史记录
function addToHistory(color: string) {
  if (!props.showHistory) return
  
  const index = colorHistory.value.indexOf(color)
  if (index > -1) {
    colorHistory.value.splice(index, 1)
  }
  
  colorHistory.value.unshift(color)
  if (colorHistory.value.length > props.maxHistory) {
    colorHistory.value = colorHistory.value.slice(0, props.maxHistory)
  }
}

// 鼠标事件处理
function startHueSaturationDrag(event: MouseEvent) {
  isDragging.value = true
  dragType.value = 'saturation'
  handleHueSaturationDrag(event)
  document.addEventListener('mousemove', handleHueSaturationDrag)
  document.addEventListener('mouseup', stopDrag)
}

function startHueDrag(event: MouseEvent) {
  isDragging.value = true
  dragType.value = 'hue'
  handleHueDrag(event)
  document.addEventListener('mousemove', handleHueDrag)
  document.addEventListener('mouseup', stopDrag)
}

function handleHueSaturationDrag(event: MouseEvent) {
  if (!isDragging.value || dragType.value !== 'saturation') return
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = Math.max(0, Math.min(200, event.clientX - rect.left))
  const y = Math.max(0, Math.min(200, event.clientY - rect.top))
  
  hsv.value.s = Math.round((x / 200) * 100)
  hsv.value.v = Math.round(100 - (y / 200) * 100)
  
  updateFromHsv()
}

function handleHueDrag(event: MouseEvent) {
  if (!isDragging.value || dragType.value !== 'hue') return
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = Math.max(0, Math.min(200, event.clientX - rect.left))
  
  hsv.value.h = Math.round((x / 200) * 360)
  
  updateFromHsv()
}

function stopDrag() {
  isDragging.value = false
  dragType.value = null
  document.removeEventListener('mousemove', handleHueSaturationDrag)
  document.removeEventListener('mousemove', handleHueDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function handleClose() {
  showPicker.value = false
}

// 监听外部点击
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.color-picker-container')) {
    showPicker.value = false
  }
}

// 初始化颜色
function initializeColor() {
  const rgbValue = hexToRgb(props.modelValue)
  rgb.value = rgbValue
  hsv.value = rgbToHsv(rgbValue.r, rgbValue.g, rgbValue.b)
  hexInput.value = props.modelValue
}

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== currentColor.value) {
    currentColor.value = newValue
    initializeColor()
  }
})

// 生命周期
onMounted(() => {
  initializeColor()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('mousemove', handleHueSaturationDrag)
  document.removeEventListener('mousemove', handleHueDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.color-picker-container {
  position: relative;
  display: inline-block;
}

.color-picker-button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-picker-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-icon {
  font-size: 18px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.color-picker-panel {
  position: absolute;
  top: 50px;
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  z-index: 1000;
  min-width: 280px;
  max-width: 320px;
}

.color-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.color-picker-header span {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.close-button {
  padding: 4px;
  color: #666;
}

.close-button:hover {
  color: #333;
  background-color: #f5f5f5;
}

.color-picker-content {
  padding: 20px;
}

.color-preview {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.current-color {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #ddd;
  margin-right: 12px;
}

.color-info {
  flex: 1;
}

.color-hex {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 4px;
}

.color-rgb {
  font-size: 12px;
  color: #666;
}

.color-selection {
  margin-bottom: 20px;
}

.hue-saturation-picker {
  margin-bottom: 12px;
}

.hue-saturation-area {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  position: relative;
  cursor: crosshair;
  border: 1px solid #ddd;
}

.hue-saturation-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.hue-slider {
  height: 20px;
}

.hue-slider-track {
  width: 200px;
  height: 20px;
  border-radius: 10px;
  background: linear-gradient(to right, 
    #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, 
    #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%);
  position: relative;
  cursor: pointer;
  border: 1px solid #ddd;
}

.hue-slider-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border: 2px solid #333;
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-inputs {
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 12px;
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
}

.rgb-inputs,
.hsv-inputs {
  display: flex;
  gap: 4px;
}

.rgb-inputs .el-input-number,
.hsv-inputs .el-input-number {
  flex: 1;
}

.preset-colors {
  margin-bottom: 20px;
}

.preset-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.preset-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  transition: all 0.2s ease;
}

.preset-color:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-history {
  margin-bottom: 0;
}

.history-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.history-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  transition: all 0.2s ease;
}

.history-color:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>