<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="选择颜色"
    width="320px"
    :close-on-click-modal="true"
    @close="handleClose"
  >
    <div class="simple-color-picker">
      <!-- 常用颜色 -->
      <div class="color-section">
        <h4>常用颜色</h4>
        <div class="color-grid">
          <div
            v-for="color in commonColors"
            :key="color"
            class="color-item"
            :style="{ backgroundColor: color }"
            :class="{ active: selectedColor === color }"
            @click="selectColor(color)"
            :title="color"
          ></div>
        </div>
      </div>

      <!-- 更多颜色 -->
      <div class="color-section">
        <h4>更多颜色</h4>
        <div class="color-grid">
          <div
            v-for="color in moreColors"
            :key="color"
            class="color-item"
            :style="{ backgroundColor: color }"
            :class="{ active: selectedColor === color }"
            @click="selectColor(color)"
            :title="color"
          ></div>
        </div>
      </div>

      <!-- 自定义颜色 -->
      <div class="color-section">
        <h4>自定义颜色</h4>
        <div class="custom-color-input">
          <input
            type="color"
            v-model="customColor"
            @change="selectColor(customColor)"
            class="color-input"
          />
          <span class="color-label">{{ customColor }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="confirmColor">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface SimpleColorPickerProps {
  visible: boolean
  modelValue: string
}

interface SimpleColorPickerEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = defineProps<SimpleColorPickerProps>()
const emit = defineEmits<SimpleColorPickerEmits>()

// 响应式数据
const selectedColor = ref(props.modelValue)
const customColor = ref(props.modelValue)

// 常用颜色
const commonColors = ref([
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#FFA500',
  '#800080', '#008000', '#FFC0CB', '#A52A2A', '#000080',
  '#808000', '#FFD700', '#C0C0C0', '#FF6347', '#32CD32'
])

// 更多颜色
const moreColors = ref([
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE',
  '#AED6F1', '#A9DFBF', '#F9E79F', '#D5DBDB', '#FADBD8',
  '#E8DAEF', '#D1F2EB', '#D5F4E6', '#FEF9E7', '#FAD7A0',
  '#D6EAF8', '#D1F2EB', '#FCF3CF', '#F8D7DA', '#D4EDDA'
])

// 选择颜色
function selectColor(color: string) {
  selectedColor.value = color
  customColor.value = color
}

// 确认颜色
function confirmColor() {
  emit('update:modelValue', selectedColor.value)
  emit('change', selectedColor.value)
  emit('update:visible', false)
}

// 关闭对话框
function handleClose() {
  emit('update:visible', false)
}

// 监听外部颜色变化
watch(() => props.modelValue, (newValue) => {
  selectedColor.value = newValue
  customColor.value = newValue
})
</script>

<style scoped>
.simple-color-picker {
  padding: 16px 0;
}

.color-section {
  margin-bottom: 24px;
}

.color-section:last-child {
  margin-bottom: 0;
}

.color-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.color-item {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.color-item:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.color-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.color-item.active::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.custom-color-input {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
  border-radius: 6px;
  overflow: hidden;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

.color-label {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  background: white;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-width: 80px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 0 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  
  .color-item {
    width: 28px;
    height: 28px;
  }
  
  .custom-color-input {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .color-input {
    width: 100%;
    height: 40px;
  }
  
  .color-label {
    text-align: center;
  }
}

/* 动画效果 */
.color-item {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 悬停效果 */
.color-item:hover {
  animation: pulse 0.6s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  to {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }
}

/* 选中状态动画 */
.color-item.active {
  animation: selectPulse 0.4s ease-out;
}

@keyframes selectPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1.1);
  }
}
</style>