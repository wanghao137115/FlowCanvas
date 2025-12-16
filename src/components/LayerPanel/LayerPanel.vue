<template>
  <div class="layer-panel">
    <div class="layer-panel-header">
      <h3>图层</h3>
      <div class="layer-actions">
        <el-button 
          size="small" 
          :icon="Plus" 
          @click="createLayer"
          :disabled="layers.length >= 200"
        >
          新建
        </el-button>
        <el-button 
          size="small" 
          :icon="FolderAdd" 
          @click="createGroup"
          :disabled="layers.length >= 200"
        >
          分组
        </el-button>
      </div>
    </div>

    <div class="layer-list" @click="handleLayerListClick">
      <div 
        v-for="layer in visibleLayers" 
        :key="layer.id"
        class="layer-item"
        :class="{
          'layer-item--selected': currentLayerId === layer.id,
          'layer-item--group': layer.isGroup,
          'layer-item--hidden': !layer.visible,
          'layer-item--locked': layer.locked,
          'layer-item--dragging': draggingLayerId === layer.id
        }"
        :style="{ paddingLeft: `${getLayerIndent(layer)}px` }"
        draggable="true"
        @dragstart="handleDragStart($event, layer.id)"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @drop="handleDrop($event, layer.id)"
        @click="setCurrentLayer(layer.id)"
      >
        <!-- 展开/收起按钮 -->
        <div 
          v-if="layer.isGroup && layer.children.length > 0"
          class="layer-expand-btn"
          @click="toggleLayerExpansion(layer.id)"
        >
          <el-icon>
            <ArrowRight v-if="!layer.expanded" />
            <ArrowDown v-else />
          </el-icon>
        </div>
        <div v-else class="layer-expand-placeholder"></div>

        <!-- 图层颜色选择器 -->
        <div class="layer-color-picker">
          <el-color-picker
            v-model="layer.color"
            :predefine="predefineColors"
            show-alpha
            size="small"
            @change="handleColorChange(layer.id, $event)"
            @click.stop
          />
        </div>

        <!-- 图层缩略图 -->
        <ThumbnailPreview
          :thumbnail-url="getThumbnailUrl(layer)"
          :layer-name="layer.name"
          :is-group="layer.isGroup"
          :element-count="getLayerElementCount(layer)"
          :layer-id="layer.id"
          @click="setCurrentLayer"
        />

        <!-- 图层名称 -->
        <div 
          class="layer-name" 
          @dblclick="startRename(layer.id)"
          @keydown.f2="startRename(layer.id)"
        >
          <input
            v-if="editingLayerId === layer.id"
            ref="renameInput"
            v-model="editingName"
            @blur="finishRename"
            @keyup.enter="finishRename"
            @keyup.escape="cancelRename"
            @input="validateRenameInput"
            class="layer-name-input"
            :class="{ 'layer-name-input--error': renameError }"
            :maxlength="32"
            @click.stop
          />
          <span v-else class="layer-name-text">{{ layer.name }}</span>
          <div v-if="renameError" class="layer-name-error">{{ renameError }}</div>
        </div>

        <!-- 图层控制按钮 -->
        <div class="layer-controls">
          <!-- 可见性切换 -->
          <el-button
            size="small"
            :icon="layer.visible ? View : Hide"
            @click="toggleVisibility(layer.id)"
            :class="{ 'control-active': layer.visible }"
            text
          />
          
          <!-- 锁定切换 -->
          <el-button
            size="small"
            :icon="layer.locked ? Lock : Unlock"
            @click="toggleLock(layer.id)"
            :class="{ 'control-active': layer.locked }"
            text
          />

          <!-- 图层菜单 -->
          <el-dropdown @command="handleLayerCommand" trigger="click">
            <el-button size="small" :icon="MoreFilled" text />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'duplicate', layerId: layer.id }">
                  复制图层
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'moveToTop', layerId: layer.id }">
                  置顶
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'moveUp', layerId: layer.id }">
                  上移
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'moveDown', layerId: layer.id }">
                  下移
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'moveToBottom', layerId: layer.id }">
                  置底
                </el-dropdown-item>
                <el-dropdown-item divided :command="{ action: 'delete', layerId: layer.id }">
                  删除图层
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 图层属性面板 -->
    <div v-if="selectedLayer" class="layer-properties">
      <h4>图层属性</h4>
      <div class="property-item">
        <label>透明度</label>
        <el-slider
          v-model="selectedLayerOpacity"
          :min="0"
          :max="1"
          :step="0.01"
          @change="updateLayerOpacity"
        />
      </div>
      <div class="property-item">
        <label>颜色</label>
        <el-color-picker
          v-model="selectedLayerColor"
          @change="updateLayerColor"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { 
  Plus, 
  FolderAdd, 
  ArrowRight, 
  ArrowDown, 
  Folder, 
  View, 
  Hide, 
  Lock, 
  Unlock, 
  MoreFilled 
} from '@element-plus/icons-vue'
import type { Layer } from '@/types/canvas.types'
import ThumbnailPreview from './ThumbnailPreview.vue'
import { ThumbnailManager } from '@/core/thumbnail/ThumbnailManager'

interface Props {
  layers: Layer[]
  currentLayerId: string | null
  elements?: any[] // 画布元素数据，用于生成缩略图
}

interface Emits {
  (e: 'createLayer', name?: string, parentId?: string): void
  (e: 'createGroup', name?: string, parentId?: string): void
  (e: 'deleteLayer', layerId: string): void
  (e: 'duplicateLayer', layerId: string): void
  (e: 'renameLayer', layerId: string, newName: string): void
  (e: 'startRename', layerId: string, originalName: string): void
  (e: 'finishRename', layerId: string, newName: string): void
  (e: 'cancelRename', layerId: string): void
  (e: 'toggleVisibility', layerId: string): void
  (e: 'toggleLock', layerId: string): void
  (e: 'setCurrentLayer', layerId: string): void
  (e: 'moveLayer', layerId: string, newOrder: number, parentId?: string): void
  (e: 'moveLayerToTop', layerId: string): void
  (e: 'moveLayerToBottom', layerId: string): void
  (e: 'moveLayerUp', layerId: string): void
  (e: 'moveLayerDown', layerId: string): void
  (e: 'setLayerOpacity', layerId: string, opacity: number): void
  (e: 'setLayerColor', layerId: string, color: string): void
  (e: 'toggleExpansion', layerId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 添加调试信息，确认props.elements的变化

// 编辑状态
const editingLayerId = ref<string | null>(null)
const editingName = ref('')
const renameInput = ref<HTMLInputElement>()
const renameError = ref('')

// 预设颜色
const predefineColors = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  '#ff1493',
  '#ff6347',
  '#32cd32',
  '#00bfff',
  '#9370db',
  '#ff69b4',
  '#ffa500',
  '#20b2aa',
  '#87ceeb'
]

// 拖拽状态
const draggingLayerId = ref<string | null>(null)
const dragOverLayerId = ref<string | null>(null)

// 缩略图管理器
const thumbnailManager = ThumbnailManager.getInstance()

// 缩略图缓存
const thumbnailCache = ref<Map<string, string>>(new Map())

// 防抖函数
const debounce = (func: Function, delay: number) => {
  let timeoutId: number
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// 防抖的缩略图缓存清理函数
const debouncedCacheClear = debounce(() => {
  // 清除所有缓存，强制重新生成缩略图
  thumbnailCache.value.clear()
}, 150) // 150ms防抖，给快速绘制更多时间

// 选中的图层
const selectedLayer = computed(() => {
  if (!props.currentLayerId) return null
  return props.layers.find(layer => layer.id === props.currentLayerId) || null
})

const selectedLayerOpacity = ref(1)
const selectedLayerColor = ref('#3b82f6')

// 监听选中图层变化
watch(selectedLayer, (newLayer) => {
  if (newLayer) {
    selectedLayerOpacity.value = newLayer.opacity
    selectedLayerColor.value = newLayer.color
  }
})

// 监听elements变化，使用防抖清除缩略图缓存
watch(() => props.elements, (newElements, oldElements) => {
  
  // 使用防抖清除缓存，避免频繁更新
  debouncedCacheClear()
}, { deep: true })

// 监听强制更新缩略图事件
onMounted(() => {
  const layerPanel = document.querySelector('.layer-panel')
  if (layerPanel) {
    layerPanel.addEventListener('forceUpdateThumbnails', (event: any) => {
      
      // 立即清除所有缓存
      thumbnailCache.value.clear()
      
      // 强制重新生成所有缩略图
      nextTick(() => {
        // 触发响应式更新，强制重新计算缩略图
        const currentCache = thumbnailCache.value
        thumbnailCache.value = new Map()
        nextTick(() => {
          thumbnailCache.value = currentCache
        })
      })
    })
  }
})

// 添加更直接的监听

// 计算可见的图层（考虑展开状态）
const visibleLayers = computed(() => {
  const result: Layer[] = []
  
  const addLayer = (layer: Layer, depth: number = 0) => {
    result.push({ ...layer, _depth: depth })
    
    if (layer.isGroup && layer.expanded) {
      layer.children.forEach(childId => {
        const child = props.layers.find(l => l.id === childId)
        if (child) {
          addLayer(child, depth + 1)
        }
      })
    }
  }

  // 只添加顶级图层
  props.layers
    .filter(layer => !layer.parentId)
    .forEach(layer => addLayer(layer))

  return result
})

// 创建图层
const createLayer = () => {
  emit('createLayer')
}

// 创建分组
const createGroup = () => {
  emit('createGroup')
}

// 删除图层
const deleteLayer = (layerId: string) => {
  emit('deleteLayer', layerId)
}

// 开始重命名
const startRename = (layerId: string) => {
  const layer = props.layers.find(l => l.id === layerId)
  if (!layer) return

  editingLayerId.value = layerId
  editingName.value = layer.name
  renameError.value = ''

  // 记录重命名开始时的原始名称，用于撤销重做
  emit('startRename', layerId, layer.name)

  nextTick(() => {
    const input = renameInput.value as HTMLInputElement | undefined

    if (input && typeof input.focus === 'function') {
      input.focus()
      input.select()
    }
  })
}

// 验证重命名输入
const validateRenameInput = () => {
  const name = editingName.value.trim()
  
  if (!name) {
    renameError.value = '图层名称不能为空'
    return false
  }
  
  if (name.length > 32) {
    renameError.value = '图层名称不能超过32个字符'
    return false
  }
  
  // 检查名称重复（排除当前图层）
  const isDuplicate = props.layers.some(layer => 
    layer.id !== editingLayerId.value && 
    layer.name === name
  )
  
  if (isDuplicate) {
    renameError.value = '图层名称已存在'
    return false
  }
  
  renameError.value = ''
  return true
}

// 完成重命名
const finishRename = () => {
  if (editingLayerId.value && validateRenameInput()) {
    const newName = editingName.value.trim()
    const layer = props.layers.find(l => l.id === editingLayerId.value)
    if (layer && layer.name !== newName) {
      // 只有名称真正改变时才记录历史
      emit('finishRename', editingLayerId.value, newName)
    }
  }
  editingLayerId.value = null
  editingName.value = ''
  renameError.value = ''
}

// 取消重命名
const cancelRename = () => {
  if (editingLayerId.value) {
    // 取消重命名时也记录历史（恢复到原始名称）
    emit('cancelRename', editingLayerId.value)
  }
  editingLayerId.value = null
  editingName.value = ''
  renameError.value = ''
}

// 处理图层列表点击（用于取消重命名）
const handleLayerListClick = (event: MouseEvent) => {
  // 如果点击的不是图层项本身，取消重命名
  const target = event.target as HTMLElement
  if (!target.closest('.layer-item') && editingLayerId.value) {
    cancelRename()
  }
}

// 处理颜色变化
const handleColorChange = (layerId: string, color: string) => {
  emit('setLayerColor', layerId, color)
}

// 生成缓存键
const generateCacheKey = (layer: Layer): string => {
  if (!props.elements) return `${layer.id}-${layer.visible ? 'v' : 'h'}-${layer.color || ''}-no-elements`
  
  // 获取该图层的元素
  const layerElements = props.elements.filter(el => el.layer === layer.id)
  const elementIds = layerElements.map(el => el.id).sort().join(',')
  const elementHashes = layerElements.map(el => `${el.id}-${el.type}-${el.position.x}-${el.position.y}-${el.size.x}-${el.size.y}`).join(',')
  
  return `${layer.id}-${layer.visible ? 'v' : 'h'}-${layer.color || ''}-${elementIds}-${elementHashes.length}`
}

// 获取图层缩略图URL
const getThumbnailUrl = (layer: Layer): string => {
  const cacheKey = generateCacheKey(layer)
  
  if (thumbnailCache.value.has(cacheKey)) {
    return thumbnailCache.value.get(cacheKey)!
  }

  // 异步生成缩略图
  if (props.elements) {
    // 先返回空字符串，然后异步加载
    loadThumbnailAsync(layer, cacheKey)
    return ''
  }

  return ''
}

// 异步加载缩略图
const loadThumbnailAsync = async (layer: Layer, cacheKey: string) => {
  try {
    const thumbnailUrl = await thumbnailManager.getThumbnail(layer, props.elements!)
    thumbnailCache.value.set(cacheKey, thumbnailUrl)
  } catch (error) {
    console.error(`[LayerPanel] 缩略图加载失败:`, error)
  }
}

// 获取图层元素数量
const getLayerElementCount = (layer: Layer): number => {
  if (layer.isGroup) {
    return layer.children.length
  }
  
  if (props.elements) {
    return props.elements.filter(el => el.layer === layer.id).length
  }
  
  return 0
}

// 获取图层在列表中的索引
const getLayerIndex = (layer: Layer): number => {
  const topLevelLayers = props.layers.filter(l => !l.parentId)
  return topLevelLayers.findIndex(l => l.id === layer.id)
}

// 切换可见性
const toggleVisibility = (layerId: string) => {
  emit('toggleVisibility', layerId)
}

// 切换锁定
const toggleLock = (layerId: string) => {
  emit('toggleLock', layerId)
}

// 设置当前图层
const setCurrentLayer = (layerId: string) => {
  emit('setCurrentLayer', layerId)
}

// 切换展开状态
const toggleLayerExpansion = (layerId: string) => {
  emit('toggleExpansion', layerId)
}

// 处理图层命令
const handleLayerCommand = (command: { action: string; layerId: string }) => {
  const { action, layerId } = command

  switch (action) {
    case 'duplicate':
      emit('duplicateLayer', layerId)
      break
    case 'moveToTop':
      emit('moveLayerToTop', layerId)
      break
    case 'moveUp':
      emit('moveLayerUp', layerId)
      break
    case 'moveDown':
      emit('moveLayerDown', layerId)
      break
    case 'moveToBottom':
      emit('moveLayerToBottom', layerId)
      break
    case 'delete':
      deleteLayer(layerId)
      break
  }
}

// 更新图层透明度
const updateLayerOpacity = (opacity: number) => {
  if (props.currentLayerId) {
    emit('setLayerOpacity', props.currentLayerId, opacity)
  }
}

// 更新图层颜色
const updateLayerColor = (color: string) => {
  if (props.currentLayerId) {
    emit('setLayerColor', props.currentLayerId, color)
  }
}

// 获取图层缩进
const getLayerIndent = (layer: Layer & { _depth?: number }): number => {
  return (layer._depth || 0) * 20
}

// ==================== 拖拽排序方法 ====================

// 开始拖拽
const handleDragStart = (event: DragEvent, layerId: string) => {
  draggingLayerId.value = layerId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', layerId)
  }
}

// 结束拖拽
const handleDragEnd = () => {
  draggingLayerId.value = null
  dragOverLayerId.value = null
}

// 拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 拖拽放置
const handleDrop = (event: DragEvent, targetLayerId: string) => {
  event.preventDefault()
  

  
  if (!draggingLayerId.value || draggingLayerId.value === targetLayerId) {
    return
  }

  const sourceLayerId = draggingLayerId.value
  const sourceLayer = props.layers.find(l => l.id === sourceLayerId)
  const targetLayer = props.layers.find(l => l.id === targetLayerId)
  
  if (!sourceLayer || !targetLayer) {
    return
  }

  // 计算新的顺序
  const newOrder = targetLayer.order

  
  // 移动图层
  emit('moveLayer', sourceLayerId, newOrder, targetLayer.parentId)
  
  // 重置拖拽状态
  draggingLayerId.value = null
  dragOverLayerId.value = null
}
</script>

<style scoped>
.layer-panel {
  width: 280px;
  height: 100%;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.layer-panel-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layer-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.layer-actions {
  display: flex;
  gap: 8px;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.layer-item:hover {
  background-color: #f1f5f9;
}

.layer-item--selected {
  background-color: #dbeafe;
}

.layer-item--hidden {
  opacity: 0.5;
}

.layer-item--locked {
  background-color: #fef2f2;
}

.layer-item--dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.layer-item[draggable="true"] {
  cursor: move;
}

.layer-item[draggable="true"]:hover {
  background-color: #f1f5f9;
}

.layer-expand-btn,
.layer-expand-placeholder {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  cursor: pointer;
}

.layer-expand-placeholder {
  cursor: default;
}

.layer-color-picker {
  margin-right: 8px;
  flex-shrink: 0;
}

.layer-color-picker .el-color-picker {
  width: 20px;
  height: 20px;
}

.layer-color-picker .el-color-picker__trigger {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.layer-thumbnail {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.layer-name {
  flex: 1;
  min-width: 0;
  position: relative;
}

.layer-name-text {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-name-input {
  width: 100%;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 14px;
  outline: none;
  background-color: white;
}

.layer-name-input--error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.layer-name-error {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #ef4444;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 1000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.layer-item:hover .layer-controls {
  opacity: 1;
}

.control-active {
  color: #3b82f6 !important;
}

.layer-properties {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.layer-properties h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.property-item {
  margin-bottom: 16px;
}

.property-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}
</style>
