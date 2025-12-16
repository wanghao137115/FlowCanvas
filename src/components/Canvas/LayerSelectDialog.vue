<template>
  <el-dialog
    :model-value="visible"
    title="移动到图层"
    width="500px"
    :before-close="handleClose"
    @update:model-value="handleVisibleChange"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <div class="layer-select-dialog">
      <!-- 搜索框 -->
      <div class="search-section">
        <el-input
          v-model="searchText"
          placeholder="搜索图层..."
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <Icon icon="mdi:magnify" />
          </template>
        </el-input>
      </div>

      <!-- 图层树 -->
      <div class="layer-tree-section">
        <el-tree
          ref="treeRef"
          :data="filteredLayers"
          :props="treeProps"
          :default-expand-all="true"
          :highlight-current="true"
          :current-node-key="selectedLayerId"
          node-key="id"
          @node-click="handleNodeClick"
          @keydown="handleKeydown"
        >
          <template #default="{ node, data }">
            <div class="layer-node" :class="{ 
              'disabled': data.locked || (!data.visible && !allowHiddenLayers),
              'selected': selectedLayerId === data.id
            }">
              <!-- 缩略图 -->
              <div class="layer-thumbnail">
                <img 
                  v-if="data.thumbnail" 
                  :src="data.thumbnail" 
                  :alt="data.name"
                  class="thumbnail-image"
                />
                <div v-else class="thumbnail-placeholder">
                  <Icon :icon="data.isGroup ? 'mdi:folder' : 'mdi:layers'" />
                </div>
              </div>

              <!-- 图层信息 -->
              <div class="layer-info">
                <div class="layer-name">
                  {{ data.name }}
                  <span v-if="data.isGroup" class="group-badge">分组</span>
                </div>
                <div class="layer-meta">
                  <span class="element-count">{{ data.elementCount }} 个元素</span>
                  <div class="layer-status">
                    <Icon 
                      v-if="!data.visible" 
                      icon="mdi:eye-off" 
                      class="status-icon hidden"
                      title="隐藏"
                    />
                    <Icon 
                      v-if="data.locked" 
                      icon="mdi:lock" 
                      class="status-icon locked"
                      title="锁定"
                    />
                  </div>
                </div>
              </div>

              <!-- 选择指示器 -->
              <div v-if="selectedLayerId === data.id" class="selection-indicator">
                <Icon icon="mdi:check" />
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 提示信息 -->
      <div class="info-section">
        <div class="selected-info">
          <Icon icon="mdi:information" />
          <span>将 {{ selectedElementCount }} 个元素移动到选中图层</span>
        </div>
        <div v-if="selectedLayer && !selectedLayer.visible" class="warning-info">
          <Icon icon="mdi:alert" />
          <span>目标图层当前不可见</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!selectedLayerId || selectedLayer?.locked"
          @click="handleConfirm"
        >
          确认移动
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { Layer } from '@/types/canvas.types'
import { ThumbnailManager } from '@/core/thumbnail/ThumbnailManager'

interface LayerTreeNode extends Layer {
  children?: LayerTreeNode[]
  elementCount: number
  thumbnail?: string
  disabled?: boolean
}

interface Props {
  visible: boolean
  selectedElementIds: string[]
  layers: Layer[]
  elements: any[]
  onConfirm: (targetLayerId: string) => void
  onClose: () => void
}

const props = defineProps<Props>()

// 响应式数据
const searchText = ref('')
const selectedLayerId = ref<string | null>(null)
const treeRef = ref()

// 计算属性
const selectedElementCount = computed(() => props.selectedElementIds.length)

const selectedLayer = computed(() => {
  if (!selectedLayerId.value) return null
  return findLayerById(props.layers, selectedLayerId.value)
})

const filteredLayers = computed(() => {
  if (!searchText.value) {
    return buildLayerTree(props.layers)
  }
  
  const filtered = props.layers.filter(layer => 
    layer.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
  return buildLayerTree(filtered)
})

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 方法
const findLayerById = (layers: Layer[], id: string): Layer | null => {
  for (const layer of layers) {
    if (layer.id === id) return layer
    if (layer.children && layer.children.length > 0) {
      const found = findLayerById(layer.children as Layer[], id)
      if (found) return found
    }
  }
  return null
}

const buildLayerTree = (layers: Layer[]): LayerTreeNode[] => {
  return layers.map(layer => {
    const layerElements = props.elements.filter(el => el.layer === layer.id)
    const elementCount = layerElements.length
    
    // 生成缩略图
    const thumbnail = generateThumbnail(layer, layerElements)
    
    const node: LayerTreeNode = {
      ...layer,
      elementCount,
      thumbnail,
      disabled: layer.locked || (!layer.visible && !allowHiddenLayers.value),
      children: layer.children && layer.children.length > 0 
        ? buildLayerTree(layer.children as Layer[])
        : undefined
    }
    
    return node
  })
}

const generateThumbnail = (layer: Layer, elements: any[]): string | undefined => {
  try {
    const thumbnailManager = ThumbnailManager.getInstance()
    return thumbnailManager.getThumbnail(layer, elements)
  } catch (error) {
    console.warn('生成图层缩略图失败:', error)
    return undefined
  }
}

const allowHiddenLayers = ref(true) // 允许选择隐藏图层

const handleSearch = () => {
  // 搜索时重置选择
  selectedLayerId.value = null
}

const handleNodeClick = (data: LayerTreeNode) => {
  if (data.disabled) {
    ElMessage.warning(data.locked ? '无法选择锁定的图层' : '无法选择隐藏的图层')
    return
  }
  
  selectedLayerId.value = data.id
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && selectedLayerId.value) {
    handleConfirm()
  }
}

const handleConfirm = () => {
  if (!selectedLayerId.value) {
    ElMessage.warning('请选择一个图层')
    return
  }
  
  const targetLayer = selectedLayer.value
  if (targetLayer?.locked) {
    ElMessage.error('无法移动到锁定的图层')
    return
  }
  
  try {
    props.onConfirm(selectedLayerId.value)
    ElMessage.success(`已将 ${selectedElementCount.value} 个元素移动到 ${targetLayer?.name}`)
    handleClose()
  } catch (error) {
    ElMessage.error('移动失败，请重试')
    console.error('移动元素到图层失败:', error)
  }
}

const handleClose = () => {
  props.onClose()
}

const handleVisibleChange = (value: boolean) => {
  if (!value) {
    props.onClose()
  }
}

const handleOpened = () => {
  // 对话框打开时的初始化
  searchText.value = ''
  selectedLayerId.value = null
  nextTick(() => {
    // 聚焦到搜索框
    const searchInput = document.querySelector('.layer-select-dialog .el-input__inner') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  })
}

const handleClosed = () => {
  // 对话框关闭时的清理
  searchText.value = ''
  selectedLayerId.value = null
}

// 监听可见性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    handleOpened()
  }
})
</script>

<style scoped>
.layer-select-dialog {
  max-height: 500px;
}

.search-section {
  margin-bottom: 16px;
}

.layer-tree-section {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.layer-node {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.layer-node:hover:not(.disabled) {
  background-color: #f5f7fa;
}

.layer-node.selected {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.layer-node.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.layer-thumbnail {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  flex-shrink: 0;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  color: #909399;
}

.layer-info {
  flex: 1;
  min-width: 0;
}

.layer-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-badge {
  font-size: 12px;
  padding: 2px 6px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 2px;
}

.layer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.element-count {
  font-size: 12px;
}

.layer-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-icon {
  font-size: 14px;
}

.status-icon.hidden {
  color: #f56c6c;
}

.status-icon.locked {
  color: #e6a23c;
}

.selection-indicator {
  color: #1890ff;
  font-size: 16px;
}

.info-section {
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.warning-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6a23c;
  font-size: 14px;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 树形组件样式覆盖 */
:deep(.el-tree-node__content) {
  height: auto;
  padding: 0;
}

:deep(.el-tree-node__expand-icon) {
  margin-right: 8px;
}

:deep(.el-tree-node__label) {
  width: 100%;
}
</style>
