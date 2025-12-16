<template>
  <div class="whiteboard-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <el-button-group>
          <el-button 
            :type="currentTool === 'select' ? 'primary' : 'default'"
            @click="setTool('select')"
            :icon="Pointer"
            title="选择工具 (V)"
          >
            选择 (V)
          </el-button>
          <el-dropdown 
            @command="handlePenStyleChange" 
            trigger="click"
            placement="bottom-start"
            :hide-on-click="true"
          >
          <el-button 
            :type="currentTool === 'pen' ? 'primary' : 'default'"
            @click="setTool('pen')"
            :icon="EditPen"
            title="画笔工具 (P)"
          >
              画笔 (P) <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="solid" :class="{ 'is-active': currentPenStyle === 'solid' }">
                  <Icon icon="mdi:minus" class="dropdown-icon" />
                  实线
                </el-dropdown-item>
                <el-dropdown-item command="dashed" :class="{ 'is-active': currentPenStyle === 'dashed' }">
                  <Icon icon="mdi:minus" class="dropdown-icon" />
                  虚线
                </el-dropdown-item>
                <el-dropdown-item command="dotted" :class="{ 'is-active': currentPenStyle === 'dotted' }">
                  <Icon icon="mdi:dots-horizontal" class="dropdown-icon" />
                  点线
                </el-dropdown-item>
                <el-dropdown-item command="dash-dot" :class="{ 'is-active': currentPenStyle === 'dash-dot' }">
                  <Icon icon="mdi:minus" class="dropdown-icon" />
                  点划线
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown 
            @command="handleShapeTypeChange" 
            trigger="click"
            placement="bottom-start"
            :hide-on-click="true"
          >
          <el-button 
            :type="currentTool === 'shape' ? 'primary' : 'default'"
            @click="setTool('shape')"
            :icon="Grid"
            title="形状工具 (R)"
          >
              形状 (R) <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rectangle" :class="{ 'is-active': currentShapeType === 'rectangle' }">
                  <Icon icon="mdi:rectangle" class="dropdown-icon" />
                  矩形
                </el-dropdown-item>
                <el-dropdown-item command="circle" :class="{ 'is-active': currentShapeType === 'circle' }">
                  <Icon icon="mdi:circle" class="dropdown-icon" />
                  圆形
                </el-dropdown-item>
                <el-dropdown-item command="triangle" :class="{ 'is-active': currentShapeType === 'triangle' }">
                  <Icon icon="mdi:triangle" class="dropdown-icon" />
                  三角形
                </el-dropdown-item>
                <el-dropdown-item command="ellipse" :class="{ 'is-active': currentShapeType === 'ellipse' }">
                  <Icon icon="mdi:ellipse" class="dropdown-icon" />
                  椭圆
                </el-dropdown-item>
                <el-dropdown-item command="diamond" :class="{ 'is-active': currentShapeType === 'diamond' }">
                  <Icon icon="mdi:diamond" class="dropdown-icon" />
                  菱形
                </el-dropdown-item>
                <el-dropdown-item command="star" :class="{ 'is-active': currentShapeType === 'star' }">
                  <Icon icon="mdi:star" class="dropdown-icon" />
                  星形
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button 
            :type="currentTool === 'text' ? 'primary' : 'default'"
            @click="setTool('text')"
            :icon="Document"
            title="文本工具 (T)"
          >
            文本 (T)
          </el-button>
          <el-dropdown 
            @command="handleArrowTypeChange" 
            trigger="click"
            placement="bottom-start"
            :hide-on-click="true"
          >
            <el-button 
              :type="currentTool === 'arrow' ? 'primary' : 'default'"
              @click="setTool('arrow')"
              :icon="ArrowRight"
              title="箭头工具 (A)"
            >
              箭头 (A) <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="line" :class="{ 'is-active': currentArrowType === 'line' }">
                  <Icon icon="mdi:arrow-right" class="dropdown-icon" />
                  直线箭头
                </el-dropdown-item>
                <el-dropdown-item command="curve" :class="{ 'is-active': currentArrowType === 'curve' }">
                  <Icon icon="mdi:arrow-right-bold" class="dropdown-icon" />
                  曲线箭头
                </el-dropdown-item>
                <el-dropdown-item command="bidirectional" :class="{ 'is-active': currentArrowType === 'bidirectional' }">
                  <Icon icon="mdi:arrow-left-right" class="dropdown-icon" />
                  双向箭头
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown 
            @command="handleLineTypeChange"
            trigger="click"
            placement="bottom-start"
            :hide-on-click="true"
          >
            <el-button 
              :type="currentTool === 'line' ? 'primary' : 'default'"
              @click="setTool('line')"
              :icon="Minus"
              title="线条工具 (L)"
            >
              线条 (L) <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="straight" :class="{ 'is-active': currentLineType === 'straight' }">
                  <Icon icon="mdi:minus" class="dropdown-icon" />
                  直线
                </el-dropdown-item>
                <el-dropdown-item command="curve" :class="{ 'is-active': currentLineType === 'curve' }">
                  <Icon icon="mdi:chart-line" class="dropdown-icon" />
                  曲线
                </el-dropdown-item>
                <el-dropdown-item command="free" :class="{ 'is-active': currentLineType === 'free' }">
                  <Icon icon="mdi:draw" class="dropdown-icon" />
                  自由线条
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button 
            :type="currentTool === 'image' ? 'primary' : 'default'"
            @click="setTool('image')"
            :icon="Picture"
            title="图片工具 (I)"
          >
            图片 (I)
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-section">
        <el-button-group>
          <el-button 
            @click="handleUndo" 
            :disabled="!canUndo" 
            :icon="RefreshLeft"
            :title="`撤销 (canUndo: ${canUndo}, disabled: ${!canUndo})`"
          >
            撤销
          </el-button>
          <el-button 
            @click="handleRedo" 
            :disabled="!canRedo" 
            :icon="RefreshRight"
            :title="`重做 (canRedo: ${canRedo}, disabled: ${!canRedo})`"
          >
            重做
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-section">
        <el-button-group>
          <el-button @click="handleCopy" :disabled="selectedElements.length === 0" :icon="CopyDocument">复制</el-button>
          <el-button @click="handlePaste" :disabled="!canPaste" :icon="DocumentCopy">粘贴</el-button>
        </el-button-group>
      </div>

      <div class="toolbar-section">
        <el-button @click="clearCanvas" type="danger">清空画布</el-button>
        <el-button @click="showHelp" :icon="QuestionFilled" title="显示帮助">帮助</el-button>
      </div>

      <div class="toolbar-section">
        <el-button 
          :type="smartGuidesEnabled ? 'primary' : 'default'"
          @click="toggleSmartGuides"
          title="智能参考线"
        >
          {{ smartGuidesEnabled ? '参考线: 开' : '参考线: 关' }}
        </el-button>
        
        <el-button 
          type="default"
          @click="showTemplateModal = true"
          title="模板"
        >
          <Icon icon="mdi:file-document-multiple" />
          模板
        </el-button>
        
        <el-button 
          type="default"
          @click="showExportDialog = true"
          title="导出"
        >
          <Icon icon="mdi:download" />
          导出
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="whiteboard-main">
      <!-- 左侧内容区域 -->
      <div class="whiteboard-content">
        <!-- 画布区域 -->
        <div class="canvas-container" ref="canvasContainer">
          <canvas 
            ref="canvasRef" 
            class="whiteboard-canvas"
          ></canvas>
          
          <!-- 裁剪遮罩 -->
          <div 
            v-if="isCropping" 
            class="crop-overlay"
            @mousedown="handleCropOverlayMouseDown"
          >
            <!-- 裁剪框 -->
            <div 
            class="crop-frame"
            :class="`crop-frame-${cropShape}`"
            :style="getCropFrameStyle()"
            @mousedown="handleCropFrameMouseDown"
          >
            <!-- 裁剪控制点 -->
              <div class="crop-handle crop-handle-nw" data-handle="nw" @mousedown="(event) => handleCropHandleMouseDown(event, 'nw')"></div>
              <div class="crop-handle crop-handle-ne" data-handle="ne" @mousedown="(event) => handleCropHandleMouseDown(event, 'ne')"></div>
              <div class="crop-handle crop-handle-sw" data-handle="sw" @mousedown="(event) => handleCropHandleMouseDown(event, 'sw')"></div>
              <div class="crop-handle crop-handle-se" data-handle="se" @mousedown="(event) => handleCropHandleMouseDown(event, 'se')"></div>
              <div class="crop-handle crop-handle-n" data-handle="n" @mousedown="(event) => handleCropHandleMouseDown(event, 'n')"></div>
              <div class="crop-handle crop-handle-s" data-handle="s" @mousedown="(event) => handleCropHandleMouseDown(event, 's')"></div>
              <div class="crop-handle crop-handle-w" data-handle="w" @mousedown="(event) => handleCropHandleMouseDown(event, 'w')"></div>
              <div class="crop-handle crop-handle-e" data-handle="e" @mousedown="(event) => handleCropHandleMouseDown(event, 'e')"></div>
            </div>
          </div>

          <!-- 图片文字输入覆盖层 -->
          <div 
            v-if="isImageTextInput" 
            class="image-text-input-overlay"
            @mousedown="confirmImageTextInput"
          >
            <!-- 文字输入框 -->
            <div 
              class="image-text-input-container"
              :style="getImageTextInputStyle()"
              @mousedown="handleImageTextInputClick"
            >
              <input
                ref="imageTextInputRef"
                v-model="imageTextInputData.text"
                type="text"
                class="image-text-input"
                placeholder="输入文字..."
                @keydown="handleImageTextInputKeydown"
                @blur="handleImageTextInputBlur"
              />
            </div>
          </div>
      
      <!-- 浮动样式工具栏 -->
      <FloatingStyleToolbar
        ref="floatingToolbarRef"
        :visible="showFloatingToolbar && (selectedElements.length > 0 || isTextEditing || isShapeTextEditing)"
        :selected-element="selectedElement"
        :selected-elements="selectedElements"
        :position="floatingToolbarPosition"
        :tool-type="currentTool as ToolbarToolType"
        :is-editing-text="isEditingText"
        :is-text-editing="isTextEditing"
        :is-shape-text-editing="isShapeTextEditing"
        :is-image-element="selectedElement?.type === 'image'"
        :has-text-overlay="selectedElement?.type === 'image' && selectedElement?.textOverlay"
        :toolbar-config="getToolbarConfig()"
        @update:style="updateElementStyle"
        @update:image-data="updateImageData"
        @style-brush="activateStyleBrush"
        @bring-to-front="bringElementToFront"
        @send-to-back="sendElementToBack"
        @delete:element="deleteSelectedElement"
        @toggle:style-brush="toggleStyleBrush"
        @layer:moveToTop="handleLayerMoveToTop"
        @layer:moveUp="handleLayerMoveUp"
        @layer:moveDown="handleLayerMoveDown"
        @layer:moveToBottom="handleLayerMoveToBottom"
        @layer:moveToLayer="handleLayerMoveToLayer"
        @update:text-tool-settings="updateTextToolSettings"
        @crop:image="handleImageCrop"
        @crop:image-with-shape="handleImageCropWithShape"
        @crop:set-shape="handleCropShapeSet"
        @enterTextEditMode="handleEnterTextEditMode"
        @update:shape-text-input-style="updateShapeTextInputStyle"
        @toolbar-interaction="handleToolbarInteraction"
      />
      
        </div>
      
      <!-- 样式面板 -->
<!--      <StylePanel 
        v-model="currentStyle"
        @update:modelValue="updateCurrentStyle"
      /> -->

    <!-- 状态栏 -->
    <div class="status-bar">
      <span>缩放: {{ Math.round(viewport.scale * 100) }}%</span>
      <span>元素数量: {{ elements.length }}</span>
      <span>选中: {{ selectedElementIds.length }}</span>
      <span>工具: {{ getToolName(currentTool) }}</span>
      <span>视口偏移: ({{ Math.round(viewport.offset.x) }}, {{ Math.round(viewport.offset.y) }})</span>
    </div>
      </div>

    <!-- 缩略图导航 -->
    <MiniMap :visible="true" :width="200" :height="150" />

    <!-- 图层选择对话框 -->
    <LayerSelectDialog
      :visible="showLayerSelectDialog"
      :selected-element-ids="selectedElementIds"
      :layers="layers"
      :elements="elements"
      @confirm="handleLayerSelectConfirm"
      @close="handleLayerSelectClose"
    />

    <!-- 导出对话框 -->
    <el-dialog v-model="showExportDialog" title="导出画布" width="500px">
      <div class="export-dialog-content">
        <el-form :model="exportOptions" label-width="100px">
          <el-form-item label="导出范围">
            <el-radio-group v-model="exportOptions.scope">
              <el-radio label="all">全部元素</el-radio>
              <el-radio label="selected" :disabled="selectedElements.length === 0">选中元素</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportOptions.format">
              <el-radio label="png">PNG</el-radio>
              <el-radio label="jpg">JPG</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item v-if="exportOptions.format === 'jpg'" label="图片质量">
            <el-slider
              v-model="exportOptions.quality"
              :min="0.1"
              :max="1"
              :step="0.1"
              :format-tooltip="(val) => Math.round(val * 100) + '%'"
            />
            <span style="margin-left: 10px;">{{ Math.round(exportOptions.quality * 100) }}%</span>
          </el-form-item>
          
          <el-form-item label="背景颜色">
            <el-color-picker v-model="exportOptions.backgroundColor" />
            <el-input 
              v-model="exportOptions.backgroundColor" 
              style="width: 150px; margin-left: 10px;"
              placeholder="#ffffff"
            />
          </el-form-item>
          
          <el-form-item label="文件名">
            <el-input 
              v-model="exportOptions.filename" 
              placeholder="请输入文件名（不含扩展名）"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExport" :loading="isExporting">导出</el-button>
      </template>
    </el-dialog>

    <!-- 帮助对话框 -->
    <el-dialog v-model="helpVisible" title="操作帮助" width="600px">
      <div class="help-content">
        <h3>快捷键</h3>
        <ul>
          <li><kbd>V</kbd> - 选择工具</li>
          <li><kbd>P</kbd> - 画笔工具</li>
          <li><kbd>R</kbd> - 形状工具</li>
          <li><kbd>T</kbd> - 文本工具</li>
          <li><kbd>A</kbd> - 箭头工具</li>
          <li><kbd>L</kbd> - 线条工具</li>
          <li><kbd>E</kbd> - 橡皮擦工具</li>
          <li><kbd>Ctrl + +</kbd> - 放大</li>
          <li><kbd>Ctrl + -</kbd> - 缩小</li>
          <li><kbd>Ctrl + 0</kbd> - 重置缩放</li>
          <li><kbd>Delete</kbd> - 删除选中元素</li>
          <li><kbd>Ctrl + A</kbd> - 全选</li>
          <li><kbd>Escape</kbd> - 取消当前操作</li>
        </ul>

        <h3>操作提示</h3>
        <ul>
          <li>按住 <kbd>Shift</kbd> 绘制圆形或正方形</li>
          <li>按住 <kbd>Shift + Enter</kbd> 在文本中换行</li>
          <li>拖拽空白区域进行框选</li>
          <li>双击元素进行编辑</li>
          <li>使用鼠标滚轮缩放画布</li>
          <li>拖拽画布进行平移</li>
        </ul>

        <h3>手势操作</h3>
        <ul>
          <li>双指缩放 - 放大/缩小画布</li>
          <li>双指旋转 - 旋转画布（如果支持）</li>
          <li>单指拖拽 - 平移画布</li>
        </ul>
      </div>
    </el-dialog>

      <!-- 图层面板 -->
      <LayerPanel
        v-if="showLayerPanel"
        :layers="layers"
        :current-layer-id="currentLayerId"
        :elements="elements.value"
        @create-layer="handleCreateLayer"
        @create-group="handleCreateGroup"
        @delete-layer="handleDeleteLayer"
        @duplicate-layer="handleDuplicateLayer"
        @rename-layer="handleRenameLayer"
        @start-rename="handleStartRename"
        @finish-rename="handleFinishRename"
        @cancel-rename="handleCancelRename"
        @set-layer-color="handleSetLayerColor"
        @toggle-visibility="handleToggleVisibility"
        @toggle-lock="handleToggleLock"
      @set-current-layer="handleSetCurrentLayer"
      @move-layer="handleMoveLayer"
      @move-layer-to-top="handleMoveLayerToTop"
      @move-layer-to-bottom="handleMoveLayerToBottom"
      @move-layer-up="handleMoveLayerUp"
      @move-layer-down="handleMoveLayerDown"
      @set-layer-opacity="handleSetLayerOpacity"
      @toggle-expansion="handleToggleExpansion"
      />

      <!-- 图片选择弹窗 -->
      <ImageSelectorModal
        :is-open="showImageSelector"
        :canvas-engine="canvasEngine"
        @close="handleImageSelectorClose"
        @image-select="handleImageSelect"
      />

    </div>
    
    <!-- 模板选择弹窗 -->
    <TemplateSelectorModal
      :visible="showTemplateModal"
      @close="showTemplateModal = false"
      @select="handleTemplateSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, toRefs, watch, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'
import { CanvasEngine } from '@/core/canvas/CanvasEngine'
import LayerPanel from '@/components/LayerPanel/LayerPanel.vue'
import { ThumbnailManager } from '@/core/thumbnail/ThumbnailManager'
import { QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ElementType, ToolType, ElementStyle } from '@/types/canvas.types'
import { ToolType as ToolbarToolType } from '@/types/toolbar.types'
import { 
  Pointer, 
  EditPen, 
  Grid, 
  Document, 
  ArrowRight,
  ArrowDown,
  Minus,
  RefreshLeft, 
  RefreshRight,
  CopyDocument,
  DocumentCopy,
  Picture
} from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import StylePanel from './StylePanel.vue'
import FloatingStyleToolbar from './FloatingStyleToolbar.vue'
import LayerSelectDialog from './LayerSelectDialog.vue'
import MiniMap from './MiniMap.vue'
import ImageSelectorModal from '../ImageSelectorModal.vue'
import TemplateSelectorModal from '../TemplateSelectorModal.vue'
import { FlowTemplate } from '@/types/template.types'

// 组件引用
const canvasRef = ref<HTMLCanvasElement>()
const floatingToolbarRef = ref<InstanceType<typeof FloatingStyleToolbar>>()
const canvasContainer = ref<HTMLElement>()

// 当前工具类型状态
const currentArrowType = ref('line')
const currentLineType = ref('straight')
const currentShapeType = ref('rectangle')
const currentPenStyle = ref('solid')

// 浮动工具栏状态
const showFloatingToolbar = ref(false)
const selectedElement = ref<any>(null)
const selectedElements = ref<any[]>([]) // 多选状态
const floatingToolbarPosition = ref({ x: 0, y: 0 })
const isDrawing = ref(false) // 标记是否正在绘制
const isTextEditing = ref(false) // 标记是否正在编辑文字
const isShapeTextEditing = ref(false) // 标记是否正在编辑形状文字

// 图层状态
const showLayerPanel = ref(true) // 显示图层面板
const layers = ref<any[]>([])
const currentLayerId = ref<string | null>(null)

// 智能参考线状态
const smartGuidesEnabled = ref(true) // 智能参考线是否启用

// 模板相关状态
const showTemplateModal = ref(false) // 显示模板选择弹窗

// 图层选择对话框状态
const showLayerSelectDialog = ref(false)

// 导出对话框状态
const showExportDialog = ref(false)
const isExporting = ref(false)
const exportOptions = reactive({
  scope: 'all',
  format: 'png',
  quality: 0.92,
  backgroundColor: '#ffffff',
  filename: 'canvas-export'
})

// 颜色和样式状态
const currentFillColor = ref('#ffffff')
const currentStrokeColor = ref('#000000')
const currentTextColor = ref('#000000')
const currentStyle = reactive({
  strokeWidth: 2,
  lineStyle: 'solid',
  lineCap: 'round',
  fill: '#ffffff',
  fillEnabled: true,
  fillType: 'solid',
  gradientDirection: 'horizontal',
  fontSize: 16,
  fontFamily: 'Arial',
  textAlign: 'left',
  textDecoration: 'none'
})

// 状态管理
const canvasStore = useCanvasStore()

// 使用toRefs确保响应性
const { 
  viewport,
  selectedElementIds,
  canUndo,
  canRedo,
  currentTool
} = toRefs(canvasStore)

// 直接使用canvasStore.elements确保响应性
const elements = canvasStore.elements

// 函数方法直接从store获取
const {
  setCurrentTool,
  updateViewport,
  zoomTo,
  resetViewport,
  clearElements,
  undo,
  redo,
  createTestElement
} = canvasStore

// 画布引擎
let canvasEngine: CanvasEngine | null = null

// 帮助对话框状态
const helpVisible = ref(false)

// 图片工具状态
const showImageSelector = ref(false)

// 防抖函数
const debounce = (func: Function, delay: number) => {
  let timeoutId: number
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// 计算属性
const canPaste = computed(() => {
  return canvasEngine ? canvasEngine.canPaste() : false
})

// 检查是否选中了图片元素
const isImageSelected = computed(() => {
  return selectedElement.value && selectedElement.value.type === 'image'
})

// 监听elements变化


// 初始化画布
onMounted(async () => {
  await nextTick()
  
  if (canvasRef.value && canvasContainer.value) {
    // 先设置画布尺寸
    updateCanvasSize()
    
    // 创建画布引擎
    canvasEngine = new CanvasEngine(canvasRef.value, {
      gridSize: 20,
      gridVisible: true,
      rulersVisible: true,
      backgroundColor: '#f8f9fa'
    })
    
    // 获取实际的画布尺寸
    const rect = canvasContainer.value.getBoundingClientRect()
    
    // 确保传递正确的视口数据，使用实际的画布尺寸
    const viewportData = {
      width: rect.width,
      height: rect.height,
      offset: viewport.offset || { x: 0, y: 0 },
      scale: viewport.scale || 1
    }
    canvasEngine.syncViewport(viewportData)
    
    // 设置智能参考线初始状态
    canvasEngine.setSmartGuidesEnabled(smartGuidesEnabled.value)
    
    // 设置工具变化回调
    canvasEngine.getToolManager().setOnToolChange((toolType: any) => {
      // 同步更新Vue组件的工具状态
      setCurrentTool(toolType)
    })
    
    // 设置绘制状态变化回调
    const debouncedDrawingStateChange = debounce((drawing: boolean) => {
      isDrawing.value = drawing
    }, 16) // 约60fps的更新频率
    
    canvasEngine.setOnDrawingStateChange(debouncedDrawingStateChange)
    
    // 设置元素创建回调
    canvasEngine.setOnElementCreated((element: any) => {
      // 自动选择新创建的元素并显示浮动工具栏
      selectElement(element)
    })

    // 设置样式刷重置回调
    canvasEngine.setOnStyleBrushReset(() => {
      resetStyleBrush()
    })

    // 设置浮动工具栏回调
    canvasEngine.setOnFloatingToolbarCallbacks(
      () => {
        // 隐藏浮动工具栏
        showFloatingToolbar.value = false
      },
      (element: any) => {
        // 显示浮动工具栏
        selectedElement.value = element
        selectedElements.value = [element]
        showFloatingToolbar.value = true
      }
    )

    // 设置图层变化回调
    canvasEngine.setOnLayersChange((newLayers: any[]) => {
      layers.value = newLayers
    })
    
    // 设置画布扩展回调
    canvasEngine.setOnCanvasExpansion((bounds: any) => {
      // 画布扩展时的处理逻辑
      // console.log('画布已扩展:', bounds)
      // 可以在这里添加UI提示或其他处理逻辑
    })

    // 设置当前图层变化回调
    canvasEngine.setOnCurrentLayerChange((layerId: string | null) => {
      currentLayerId.value = layerId
    })

    // 设置形状文字编辑状态变化回调
    canvasEngine.setOnShapeTextEditStateChange((isEditing: boolean, element?: any) => {
      isShapeTextEditing.value = isEditing
      
      if (isEditing && element) {
        // 进入形状文字编辑模式时，选中该元素并显示浮动工具栏
        selectedElement.value = element
        selectedElements.value = [element]
        showFloatingToolbar.value = true
        updateFloatingToolbarPosition([element])
      } else {
        // 退出编辑模式时，清除选中状态
        selectedElement.value = null
        selectedElements.value = []
        showFloatingToolbar.value = false
      }
    })

    // 设置选择变化回调
    const debouncedSelectionChange = debounce((elements: any[]) => {
      selectedElements.value = elements
        
        if (elements.length > 0) {
          selectedElement.value = elements[0] // 选择第一个元素作为主要选择
          
          // 只有在非内部更新时才显示浮动工具栏
          if (!canvasEngine?.isInternalUpdate) {
            showFloatingToolbar.value = true
          }
        
        // 计算浮动工具栏位置
        updateFloatingToolbarPosition(elements)
        
        // 更新 canvasStore 的 selectedElementIds
        const elementIds = elements.map(el => el.id)
        canvasStore.selectedElementIds = elementIds
        
        // 同步到 CanvasEngine
        if (canvasEngine) {
          canvasEngine.setSelectedElementIds(elementIds)
        }
        } else {
          selectedElement.value = null
          selectedElements.value = []
          showFloatingToolbar.value = false
          
          // 清空 canvasStore 的 selectedElementIds
          canvasStore.selectedElementIds = []
          
          // 同步到 CanvasEngine
          if (canvasEngine) {
            canvasEngine.setSelectedElementIds([])
          }
        }
    }, 16) // 约60fps的更新频率
    
    canvasEngine.setOnSelectionChange(debouncedSelectionChange)
    
    // 设置浮动工具栏可见性变化回调
    canvasEngine.setOnFloatingToolbarVisibilityChange((visible: boolean) => {
      showFloatingToolbar.value = visible
      
      // 当显示浮动工具栏时，重新计算位置
      if (visible && selectedElements.value.length > 0) {
        updateFloatingToolbarPosition(selectedElements.value)
      }
    })

    // 设置图层变化回调
    canvasEngine.setOnLayersChange((layersList: any[]) => {
      layers.value = layersList
    })

    // 设置当前图层变化回调
    canvasEngine.setOnCurrentLayerChange((layerId: string | null) => {
      currentLayerId.value = layerId
    })

    // 初始化图层状态
    layers.value = canvasEngine.getAllLayers()
    currentLayerId.value = canvasEngine.getCurrentLayer()?.id || null
    
    // 添加元素选择监听
    setupElementSelectionListener()
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateCanvasSize)
    
    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown)
    
    // 初始渲染画布，确保画布可见
    canvasEngine.render()
    
    // 延迟再次渲染，确保网格和标尺正确显示
    setTimeout(() => {
      if (canvasEngine) {
        canvasEngine.render()
      }
    }, 100)
    
    // 监听canvasStore的变化，同步到CanvasEngine
    // 只监听数组长度变化，避免深度监听导致的无限循环
    let lastElementsLength = 0
    let lastSelectedIdsLength = 0
    
    watch(() => elements.value?.length ?? 0, (newLength) => {
      if (canvasEngine && !canvasEngine.isInternalUpdate && newLength !== lastElementsLength) {
        lastElementsLength = newLength
        canvasEngine.syncState(elements.value || [], selectedElementIds.value || [])
      }
    })
    
    watch(() => selectedElementIds.value?.length ?? 0, (newLength) => {
      if (canvasEngine && !canvasEngine.isInternalUpdate && newLength !== lastSelectedIdsLength) {
        lastSelectedIdsLength = newLength
        canvasEngine.syncState(elements.value || [], selectedElementIds.value || [])
      }
    })
    
    // 监控撤销和重做按钮的禁用状态
    watch(() => canUndo.value, (newValue, oldValue) => {
      console.log('🔍 [撤销按钮状态] canUndo:', { 
        value: newValue, 
        disabled: !newValue,
        oldValue: oldValue 
      })
    }, { immediate: true })
    
    watch(() => canRedo.value, (newValue, oldValue) => {
      console.log('🔍 [重做按钮状态] canRedo:', { 
        value: newValue, 
        disabled: !newValue,
        oldValue: oldValue 
      })
    }, { immediate: true })
    
    // 注释掉自动添加测试元素，避免页面刷新时出现测试矩形
    // addTestElements()
  }
})

// 清理资源
onUnmounted(() => {
  if (canvasEngine) {
    canvasEngine.destroy()
  }
  window.removeEventListener('resize', updateCanvasSize)
  window.removeEventListener('keydown', handleKeyDown)
})

// 更新画布尺寸
const updateCanvasSize = () => {
  if (canvasContainer.value && canvasRef.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    
    // 设置画布的实际像素尺寸
    canvasRef.value.width = rect.width
    canvasRef.value.height = rect.height
    
    // 设置画布的CSS尺寸
    canvasRef.value.style.width = rect.width + 'px'
    canvasRef.value.style.height = rect.height + 'px'
    
    // 更新视口尺寸
    updateViewport({
      width: rect.width,
      height: rect.height
    })
    
    // 通知画布引擎更新尺寸
    if (canvasEngine) {
      canvasEngine.getRenderer().updateCanvasSize()
      // 同步视口状态
      canvasEngine.syncViewport(viewport)
      // 确保画布重新渲染
      canvasEngine.render()
    }
  }
}

// 设置元素选择监听
const setupElementSelectionListener = () => {
  if (!canvasEngine) return
  
  // 监听画布点击事件
  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('click', handleCanvasClick)
    canvas.addEventListener('dblclick', handleCanvasDoubleClick)
  }
}

// 更新浮动工具栏位置
const updateFloatingToolbarPosition = (elements: any[]) => {
  if (elements.length === 0) return
  
  // 计算浮动工具栏位置（在元素正上方100px处水平居中）
  if (elements.length === 1) {
    // 单选时显示在元素正上方100px处水平居中
    const element = elements[0]
    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect && canvasEngine) {
      // 获取视口管理器来计算正确的屏幕坐标
      const viewportManager = canvasEngine.getViewportManager()
      const coordinateTransformer = viewportManager.getCoordinateTransformer()
      
      // 计算形状的中心位置（虚拟坐标）
      const centerX = element.position.x + element.size.x / 2
      const centerY = element.position.y + element.size.y / 2
      
      // 将虚拟坐标转换为屏幕坐标
      const screenCenter = coordinateTransformer.virtualToScreen({ x: centerX, y: centerY })
      
      // 计算形状的顶部位置，然后向上偏移100px
      const shapeTop = element.position.y
      const shapeTopScreen = coordinateTransformer.virtualToScreen({ x: centerX, y: shapeTop })
      
      floatingToolbarPosition.value = {
        x: screenCenter.x, // 设置为中心点，组件会自动居中
        y: shapeTopScreen.y - 100 // 在形状顶部上方100px
      }
    }
  } else {
    // 多选时显示在包围框上方100px处水平居中
    // 计算所有选中元素的边界
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    elements.forEach(element => {
      const { position, size } = element
      minX = Math.min(minX, position.x)
      minY = Math.min(minY, position.y)
      maxX = Math.max(maxX, position.x + size.x)
      maxY = Math.max(maxY, position.y + size.y)
    })
    
    // 计算包围框的中心位置（虚拟坐标）
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const topY = minY
    
    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect && canvasEngine) {
      // 获取视口管理器来计算正确的屏幕坐标
      const viewportManager = canvasEngine.getViewportManager()
      const coordinateTransformer = viewportManager.getCoordinateTransformer()
      
      // 将虚拟坐标转换为屏幕坐标
      const screenCenter = coordinateTransformer.virtualToScreen({ x: centerX, y: centerY })
      const shapeTopScreen = coordinateTransformer.virtualToScreen({ x: centerX, y: topY })
      
      floatingToolbarPosition.value = {
        x: screenCenter.x, // 设置为中心点，组件会自动居中
        y: shapeTopScreen.y - 100 // 在包围框顶部上方100px
      }
    }
  }
}

// 选择元素
const selectElement = (element: any) => {
  selectedElement.value = element
  selectedElements.value = [element] // 设置selectedElements数组
  showFloatingToolbar.value = true

  // 同步选择状态到 CanvasEngine
  if (canvasEngine) {
    canvasEngine.setSelectedElementIds([element.id])
  }

  // 计算浮动工具栏位置
  updateFloatingToolbarPosition([element])
}

// 取消选择元素
const deselectElement = () => {
  selectedElement.value = null
  selectedElements.value = []
  showFloatingToolbar.value = false
}

// 重置样式刷状态
const resetStyleBrush = () => {
  if (floatingToolbarRef.value) {
    floatingToolbarRef.value.resetStyleBrush()
  }
  // 清除元素选择状态
  deselectElement()
  // 不切换工具，保持格式刷工具激活状态
}

// 包装撤销和重做函数，添加调试信息
const handleUndo = () => {
  console.log('🔄 [撤销按钮点击]', { 
    canUndo: canUndo.value, 
    disabled: !canUndo.value,
    historyManager: canvasStore.historyManager 
  })
  return undo()
}

const handleRedo = () => {
  console.log('🔄 [重做按钮点击]', { 
    canRedo: canRedo.value, 
    disabled: !canRedo.value,
    historyManager: canvasStore.historyManager 
  })
  return redo()
}

// 处理复制操作
const handleCopy = () => {
  if (canvasEngine) {
    canvasEngine.copySelectedElements()
  }
}

// 处理粘贴操作
const handlePaste = () => {
  if (canvasEngine) {
    canvasEngine.pasteElements()
  }
}

// 导出处理函数
const handleExport = async () => {
  if (!canvasEngine) {
    ElMessage.error('画布未初始化')
    return
  }

  try {
    isExporting.value = true

    // 确定要导出的元素
    let elementsToExport: any[] | undefined
    if (exportOptions.scope === 'selected' && selectedElements.value.length > 0) {
      elementsToExport = selectedElements.value
    }

    // 调用导出方法
    await canvasEngine.exportAndDownload(
      exportOptions.filename || 'canvas-export',
      elementsToExport,
      exportOptions.format as 'png' | 'jpg',
      exportOptions.quality,
      exportOptions.backgroundColor
    )

    ElMessage.success('导出成功！')
    showExportDialog.value = false
  } catch (error: any) {
    console.error('导出失败:', error)
    ElMessage.error(error.message || '导出失败，请稍后重试')
  } finally {
    isExporting.value = false
  }
}

// ==================== 图片工具方法 ====================

// 处理图片选择弹窗关闭
const handleImageSelectorClose = () => {
  showImageSelector.value = false
  // 切换回选择工具
  setTool('select')
}

// 处理图片选择
const handleImageSelect = (imageElement: any) => {
  if (canvasEngine) {
    // 将图片元素添加到画布
    canvasEngine.addElement(imageElement)
    showImageSelector.value = false
    // 切换回选择工具
    setTool('select')
  }
}



// ==================== 图层管理方法 ====================

// 创建图层
const handleCreateLayer = (name?: string, parentId?: string) => {
  if (canvasEngine) {
    try {
      const layerId = canvasEngine.createLayer(name, parentId)
      // 刷新图层列表
      layers.value = canvasEngine.getAllLayers()
    } catch (error) {
      console.error('❌ 创建图层失败', error)
    }
  }
}

// 创建分组
const handleCreateGroup = (name?: string, parentId?: string) => {
  if (canvasEngine) {
    try {
      const groupId = canvasEngine.createGroup(name, parentId)
      // 刷新图层列表
      layers.value = canvasEngine.getAllLayers()
    } catch (error) {
      console.error('❌ 创建分组失败', error)
    }
  }
}

// 复制图层
const handleDuplicateLayer = (layerId: string) => {
  if (canvasEngine) {
    try {
      canvasEngine.duplicateLayer(layerId)
      
      // 刷新图层列表和元素列表
      layers.value = canvasEngine.getAllLayers()
      elements.value = canvasEngine.getAllElements()
      
      // 强制更新缩略图 - 使用更直接的方法
      nextTick(() => {
        // 清除所有缩略图缓存，强制重新生成
        const thumbnailManager = ThumbnailManager.getInstance()
        thumbnailManager.clearAllCache()
        
        // 强制重新渲染图层面板
        const layerPanel = document.querySelector('.layer-panel')
        if (layerPanel) {
          // 触发图层面板重新渲染
          const event = new CustomEvent('forceUpdateThumbnails')
          layerPanel.dispatchEvent(event)
        }
      })
    } catch (error) {
      console.error('❌ 复制图层失败', error)
    }
  }
}

// 删除图层
const handleDeleteLayer = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.deleteLayer(layerId)
  }
}

// 重命名图层
const handleRenameLayer = (layerId: string, newName: string) => {
  if (canvasEngine) {
    canvasEngine.renameLayer(layerId, newName)
  }
}

// 开始重命名图层
const handleStartRename = (layerId: string, originalName: string) => {
  if (canvasEngine) {
    canvasEngine.startRenameLayer(layerId, originalName)
  }
}

// 完成重命名图层
const handleFinishRename = (layerId: string, newName: string) => {
  if (canvasEngine) {
    canvasEngine.finishRenameLayer(layerId, newName)
  }
}

// 取消重命名图层
const handleCancelRename = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.cancelRenameLayer(layerId)
  }
}

// 设置图层颜色
const handleSetLayerColor = (layerId: string, color: string) => {
  if (canvasEngine) {
    canvasEngine.setLayerColor(layerId, color)
  }
}

// 切换图层可见性
const handleToggleVisibility = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.toggleLayerVisibility(layerId)
  }
}

// 切换图层锁定状态
const handleToggleLock = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.toggleLayerLock(layerId)
  }
}

// 设置当前图层
const handleSetCurrentLayer = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.setCurrentLayer(layerId)
  }
}

// 移动图层
const handleMoveLayer = (layerId: string, newOrder: number, parentId?: string) => {
  if (canvasEngine) {
    canvasEngine.moveLayerToPosition(layerId, newOrder, parentId)
  }
}

// 将图层移到最顶层
const handleMoveLayerToTop = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.moveLayerToTop(layerId)
  }
}

// 将图层移到最底层
const handleMoveLayerToBottom = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.moveLayerToBottom(layerId)
  }
}

// 将图层上移一层
const handleMoveLayerUp = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.moveLayerUp(layerId)
  }
}

// 将图层下移一层
const handleMoveLayerDown = (layerId: string) => {
  if (canvasEngine) {
    canvasEngine.moveLayerDown(layerId)
  }
}

// 设置图层透明度
const handleSetLayerOpacity = (layerId: string, opacity: number) => {
  if (canvasEngine) {
    canvasEngine.setLayerOpacity(layerId, opacity)
  }
}


// 切换图层展开状态
const handleToggleExpansion = (layerId: string) => {
  if (canvasEngine) {
    const layer = canvasEngine.getLayer(layerId)
    if (layer) {
      layer.expanded = !layer.expanded
    }
  }
}

// ==================== 浮动工具栏图层操作 ====================

// 将选中元素移到最顶层
const handleLayerMoveToTop = () => {
  if (canvasEngine && selectedElements.value.length > 0) {
    selectedElements.value.forEach(element => {
      const layer = canvasEngine.getLayer(element.layer.toString())
      if (layer) {
        canvasEngine.moveLayerToTop(layer.id)
      }
    })
  }
}

// 将选中元素上移一层
const handleLayerMoveUp = () => {
  if (canvasEngine && selectedElements.value.length > 0) {
    selectedElements.value.forEach(element => {
      const layer = canvasEngine.getLayer(element.layer.toString())
      if (layer) {
        canvasEngine.moveLayerUp(layer.id)
      }
    })
  }
}

// 将选中元素下移一层
const handleLayerMoveDown = () => {
  if (canvasEngine && selectedElements.value.length > 0) {
    selectedElements.value.forEach(element => {
      const layer = canvasEngine.getLayer(element.layer.toString())
      if (layer) {
        canvasEngine.moveLayerDown(layer.id)
      }
    })
  }
}

// 将选中元素移到最底层
const handleLayerMoveToBottom = () => {
  if (canvasEngine && selectedElements.value.length > 0) {
    selectedElements.value.forEach(element => {
      const layer = canvasEngine.getLayer(element.layer.toString())
      if (layer) {
        canvasEngine.moveLayerToBottom(layer.id)
      }
    })
  }
}

// 将选中元素移动到指定图层
const handleLayerMoveToLayer = () => {
  if (selectedElements.value.length === 0) {
    ElMessage.warning('请先选择要移动的元素')
    return
  }
  showLayerSelectDialog.value = true
}

// 处理图层选择对话框确认
const handleLayerSelectConfirm = (targetLayerId: string) => {
  if (!canvasEngine) return
  
  try {
    // 获取选中元素的ID列表
    const elementIds = selectedElements.value.map(element => element.id)
    
    // 批量移动选中的元素到目标图层
    canvasEngine.moveMultipleElementsToLayer(elementIds, targetLayerId)
    
    // 移动后保持元素选中状态
    // 这里不需要额外操作，因为元素已经移动但ID不变
    
    ElMessage.success(`已将 ${selectedElements.value.length} 个元素移动到目标图层`)
  } catch (error) {
    console.error('移动元素到图层失败:', error)
    ElMessage.error('移动失败，请重试')
  }
}

// 处理图层选择对话框关闭
const handleLayerSelectClose = () => {
  showLayerSelectDialog.value = false
}

// 更新形状文字输入框样式
const updateShapeTextInputStyle = (styleUpdates: any) => {
  if (canvasEngine) {
    canvasEngine.updateShapeTextInputStyle(styleUpdates)
  }
}

// 处理工具栏交互
const handleToolbarInteraction = () => {
  lastToolbarInteraction = Date.now()
  
  // 通知CanvasEngine有工具栏交互
  if (canvasEngine) {
    canvasEngine.markToolbarInteraction()
  }
}

// 防抖工具函数已在上方定义，此处删除重复声明

// 节流工具函数
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 记录最后一次工具栏交互时间
let lastToolbarInteraction = 0

// 处理画布点击事件
const handleCanvasClick = (event: MouseEvent) => {
  
  // 检查是否刚刚有工具栏交互（100ms内）
  const now = Date.now()
  if (now - lastToolbarInteraction < 100) {
    return
  }
  
  if (!canvasEngine) {
    return
  }
  
  // 如果正在绘制，跳过元素选择
  if (isDrawing.value) {
    return
  }
  
  // 检查是否点击了浮动工具栏或其子元素
  const target = event.target as HTMLElement
  
  // 改进的检测逻辑：检查多个可能的标识
  const isToolbarClick = target && (
    target.closest('.floating-toolbar') || 
    target.classList.contains('floating-toolbar') ||
    target.closest('[data-toolbar]') ||
    // 检查是否点击了Element Plus组件（这些组件通常在工具栏内）
    target.closest('.el-button') ||
    target.closest('.el-input') ||
    target.closest('.el-select') ||
    target.closest('.el-color-picker') ||
    target.closest('.el-dropdown') ||
    target.closest('.el-popper') || // 下拉框的弹出层
    target.closest('.el-select-dropdown') || // 选择器下拉框
    target.closest('.el-color-picker__panel') || // 颜色选择器面板
    // 检查是否点击了工具栏组
    target.closest('.toolbar-group') ||
    // 检查是否点击了浮动工具栏的引用元素
    (floatingToolbarRef.value && floatingToolbarRef.value.$el && floatingToolbarRef.value.$el.contains(target)) ||
    // 新增：检查是否点击了任何在工具栏容器内的元素
    (target.closest('.floating-style-toolbar') || target.closest('[data-floating-toolbar]'))
  );
  
  
  if (isToolbarClick) {
    return
  }
  
  
  // 如果正在图片文字输入模式，点击空白区域确认输入
  if (isImageTextInput.value) {
    confirmImageTextInput()
    return
  }
  
  // 如果正在文字编辑模式，点击空白区域确认编辑
  if (isTextEditing.value) {
    confirmImageTextEdit()
    return
  }
  
  // 如果是选择工具，让SelectTool处理点击事件
  if (currentTool.value === 'select') {
    return // 不在这里处理，让SelectTool处理
  }
  
  // 获取点击位置
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) {
    return
  }
  
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  
  const viewportManager = canvasEngine.getViewportManager()
  const coordinateTransformer = viewportManager.getCoordinateTransformer()
  const virtualPoint = coordinateTransformer.screenToVirtual({ x: clickX, y: clickY })
  const targetElement = canvasEngine.getElementAtPositionPublic(virtualPoint)
  
  if (targetElement) {
    selectElement(targetElement)
    return
  }
  
  // 点击空白区域，取消选择
  deselectElement()
}

// 处理画布双击事件
const handleCanvasDoubleClick = (event: MouseEvent) => {
  if (!canvasEngine) {
    return
  }
  
  // 获取点击位置
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) {
    return
  }
  
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  
  const viewportManager = canvasEngine.getViewportManager()
  const coordinateTransformer = viewportManager.getCoordinateTransformer()
  const virtualPoint = coordinateTransformer.screenToVirtual({ x: clickX, y: clickY })
  const targetElement = canvasEngine.getElementAtPositionPublic(virtualPoint)
  
  if (targetElement) {
    if (targetElement.type === 'image') {
      if (isPointInTextOverlay({ x: clickX, y: clickY }, targetElement)) {
        startImageTextEdit(targetElement)
        return
      } else {
        startImageTextInput(targetElement)
        return
      }
    }
    
    selectElement(targetElement)
    return
  }
  
  // 双击空白区域，取消选择
  deselectElement()
}

// 图层快捷键处理
const handleLayerShortcuts = (event: KeyboardEvent, key: string): boolean => {
  if (!canvasEngine) return false
  
  // 获取当前图层和图层列表
  const currentLayerId = canvasEngine.getCurrentLayerId()
  const allLayers = canvasEngine.getAllLayers()
  const topLevelLayers = allLayers.filter(layer => !layer.parentId)
  
  // 数字键1-9：切换对应位置的图层
  if (key >= '1' && key <= '9') {
    const layerIndex = parseInt(key) - 1
    if (layerIndex < topLevelLayers.length) {
      const targetLayer = topLevelLayers[layerIndex]
      canvasEngine.setCurrentLayer(targetLayer.id)
      showToast(`切换到图层: ${targetLayer.name}`, 'success')
      return true
    }
    return false
  }
  
  // H键：切换当前图层的可见性
  if (key === 'h') {
    if (currentLayerId) {
      const currentLayer = allLayers.find(l => l.id === currentLayerId)
      if (currentLayer) {
        canvasEngine.toggleLayerVisibility(currentLayerId)
        const action = currentLayer.visible ? '隐藏' : '显示'
        showToast(`${action}图层: ${currentLayer.name}`, 'info')
        return true
      }
    } else if (topLevelLayers.length > 0) {
      // 没有选中图层时，自动选中第一个可见图层
      const firstVisibleLayer = topLevelLayers.find(l => l.visible)
      if (firstVisibleLayer) {
        canvasEngine.setCurrentLayer(firstVisibleLayer.id)
        showToast(`自动选中图层: ${firstVisibleLayer.name}`, 'info')
      }
    }
    return true
  }
  
  // L键：切换当前图层的锁定状态
  if (key === 'l') {
    if (currentLayerId) {
      const currentLayer = allLayers.find(l => l.id === currentLayerId)
      if (currentLayer) {
        canvasEngine.toggleLayerLock(currentLayerId)
        const action = currentLayer.locked ? '解锁' : '锁定'
        showToast(`${action}图层: ${currentLayer.name}`, 'info')
        return true
      }
    } else if (topLevelLayers.length > 0) {
      // 没有选中图层时，自动选中第一个可见图层
      const firstVisibleLayer = topLevelLayers.find(l => l.visible)
      if (firstVisibleLayer) {
        canvasEngine.setCurrentLayer(firstVisibleLayer.id)
        showToast(`自动选中图层: ${firstVisibleLayer.name}`, 'info')
      }
    }
    return true
  }
  
  // ↑↓键：移动图层位置
  if (key === 'arrowup') {
    if (currentLayerId) {
      const currentLayer = allLayers.find(l => l.id === currentLayerId)
      if (currentLayer) {
        canvasEngine.moveLayerUp(currentLayerId)
        showToast(`上移图层: ${currentLayer.name}`, 'info')
        return true
      }
    } else if (topLevelLayers.length > 0) {
      // 没有选中图层时，自动选中第一个可见图层
      const firstVisibleLayer = topLevelLayers.find(l => l.visible)
      if (firstVisibleLayer) {
        canvasEngine.setCurrentLayer(firstVisibleLayer.id)
        showToast(`自动选中图层: ${firstVisibleLayer.name}`, 'info')
      }
    }
    return true
  }
  
  if (key === 'arrowdown') {
    if (currentLayerId) {
      const currentLayer = allLayers.find(l => l.id === currentLayerId)
      if (currentLayer) {
        canvasEngine.moveLayerDown(currentLayerId)
        showToast(`下移图层: ${currentLayer.name}`, 'info')
        return true
      }
    } else if (topLevelLayers.length > 0) {
      // 没有选中图层时，自动选中第一个可见图层
      const firstVisibleLayer = topLevelLayers.find(l => l.visible)
      if (firstVisibleLayer) {
        canvasEngine.setCurrentLayer(firstVisibleLayer.id)
        showToast(`自动选中图层: ${firstVisibleLayer.name}`, 'info')
      }
    }
    return true
  }
  
  // Ctrl+↑/↓：将图层置顶/置底
  if (event.ctrlKey || event.metaKey) {
    if (key === 'arrowup') {
      if (currentLayerId) {
        const currentLayer = allLayers.find(l => l.id === currentLayerId)
        if (currentLayer) {
          canvasEngine.moveLayerToTop(currentLayerId)
          showToast(`置顶图层: ${currentLayer.name}`, 'info')
          return true
        }
      }
      return true
    }
    
    if (key === 'arrowdown') {
      if (currentLayerId) {
        const currentLayer = allLayers.find(l => l.id === currentLayerId)
        if (currentLayer) {
          canvasEngine.moveLayerToBottom(currentLayerId)
          showToast(`置底图层: ${currentLayer.name}`, 'info')
          return true
        }
      }
      return true
    }
  }
  
  // ?键：显示快捷键帮助
  if (key === '?') {
    showShortcutHelp()
    return true
  }
  
  return false
}

// 显示提示信息
const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration: number = 2000) => {
  switch (type) {
    case 'success':
      ElMessage.success(message)
      break
    case 'info':
      ElMessage.info(message)
      break
    case 'warning':
      ElMessage.warning(message)
      break
    case 'error':
      ElMessage.error(message)
      break
    default:
      ElMessage.info(message)
  }
}

// 显示快捷键帮助
const showShortcutHelp = () => {
  const helpText = `
图层操作快捷键：
• 数字键 1-9：切换到对应位置的图层
• H 键：切换当前图层的可见性
• L 键：切换当前图层的锁定状态
• ↑↓ 键：上移/下移当前图层
• Ctrl+↑/↓：将图层置顶/置底
• ? 键：显示此帮助信息
  `.trim()
  
  showToast(helpText, 'info', 5000)
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 忽略在输入框中的按键
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }
  
  const key = event.key.toLowerCase()
  
  // 如果当前是文本工具且正在编辑，优先处理文本输入
  if (canvasEngine && canvasEngine.getCurrentTool() === 'text') {
    const toolEvent = {
      type: 'keydown' as const,
      position: { x: 0, y: 0 },
      originalEvent: event,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      key: event.key
    }
    
    // 将键盘事件传递给CanvasEngine
    canvasEngine.handleKeyDown(event)
    return
  }
  
  // 图层操作快捷键（优先处理）
  if (handleLayerShortcuts(event, key)) {
    return
  }
  
  // 工具切换快捷键
  switch (key) {
    case 'v':
      setTool('select')
      break
    case 'p':
      setTool('pen')
      break
    case 'r':
      setTool('shape')
      break
    case 't':
      setTool('text')
      break
    case 'a':
      setTool('arrow')
      break
    case 'l':
      setTool('line')
      break
    case 'e':
      setTool('eraser')
      break
    case 'escape':
      // 取消当前操作
      if (canvasEngine) {
        canvasEngine.cancelCurrentOperation()
      }
      break
    case 'delete':
    case 'backspace':
      // 删除选中元素
      if (canvasEngine) {
        canvasEngine.deleteSelectedElements()
      }
      break
  }
  
  // 缩放快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (key) {
      case '=':
      case '+':
        event.preventDefault()
        zoomIn()
        break
      case '-':
        event.preventDefault()
        zoomOut()
        break
      case '0':
        event.preventDefault()
        resetZoom()
        break
      case 'a':
        event.preventDefault()
        // 全选
        if (canvasEngine) {
          canvasEngine.selectAllElements()
        }
        break
      case 'z':
        event.preventDefault()
        // 撤销
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        break
      case 'y':
        event.preventDefault()
        // 重做
        redo()
        break
      case 'c':
        event.preventDefault()
        // 复制
        handleCopy()
        break
      case 'v':
        event.preventDefault()
        // 粘贴 - 阻止鼠标事件处理，避免触发Ctrl+点击逻辑
        handlePaste()
        return // 直接返回，不继续处理其他事件
    }
  }
}

// 工具操作
const setTool = (tool: string) => {
  setCurrentTool(tool as any)
  
  // 更新画布引擎的工具
  if (canvasEngine) {
    canvasEngine.setCurrentTool(tool as any)
  }
  
  // 同步工具类型状态
  if (tool === 'arrow') {
    // 确保箭头工具使用当前选择的类型
    if (canvasEngine) {
      const arrowTool = canvasEngine.getToolManager().getTool('arrow') as any
      if (arrowTool) {
        arrowTool.setArrowType(currentArrowType.value)
      }
    }
  } else if (tool === 'line') {
    // 确保线条工具使用当前选择的类型
    if (canvasEngine) {
      const lineTool = canvasEngine.getToolManager().getTool('line') as any
      if (lineTool) {
        lineTool.setLineType(currentLineType.value)
      }
    }
  } else if (tool === 'shape') {
    // 确保形状工具使用当前选择的类型
    if (canvasEngine) {
      const shapeTool = canvasEngine.getToolManager().getTool('shape') as any
      if (shapeTool) {
        shapeTool.setShapeType(currentShapeType.value)
      }
    }
  } else if (tool === 'pen') {
    // 确保画笔工具使用当前选择的样式
    if (canvasEngine) {
      const penTool = canvasEngine.getToolManager().getTool('pen') as any
      if (penTool) {
        penTool.setLineStyle(currentPenStyle.value as any)
      }
    }
  } else if (tool === 'image') {
    // 图片工具 - 显示图片选择弹窗
    showImageSelector.value = true
  }
  
  // 更新画布光标样式
  if (canvasRef.value) {
    switch (tool) {
      case 'select':
        canvasRef.value.style.cursor = 'default'
        break
      case 'pen':
        canvasRef.value.style.cursor = 'crosshair'
        break
      case 'shape':
        canvasRef.value.style.cursor = 'crosshair'
        break
      case 'text':
        canvasRef.value.style.cursor = 'text'
        break
      case 'arrow':
        canvasRef.value.style.cursor = 'crosshair'
        break
      case 'line':
        canvasRef.value.style.cursor = 'crosshair'
        break
      case 'eraser':
        canvasRef.value.style.cursor = 'grab'
        break
      default:
        canvasRef.value.style.cursor = 'default'
    }
  }
}

const getToolName = (tool: string) => {
  const toolNames: Record<string, string> = {
    select: '选择',
    pen: '画笔',
    shape: '形状',
    text: '文本',
    arrow: '箭头',
    line: '线条',
    eraser: '橡皮擦'
  }
  return toolNames[tool] || tool
}

// 处理箭头类型切换
const handleArrowTypeChange = (command: string) => {
  currentArrowType.value = command
  
  // 如果当前工具是箭头工具，立即应用新类型
  if (currentTool.value === 'arrow' && canvasEngine) {
    const arrowTool = canvasEngine.getToolManager().getTool('arrow') as any
    if (arrowTool) {
      switch (command) {
        case 'line':
          arrowTool.setArrowType('line')
          break
        case 'curve':
          arrowTool.setArrowType('curve')
          break
        case 'bidirectional':
          arrowTool.setArrowType('bidirectional')
          break
      }
    }
  }
}

// 处理线条类型切换
const handleLineTypeChange = (command: string) => {
  currentLineType.value = command
  
  // 如果当前工具是线条工具，立即应用新类型
  if (currentTool.value === 'line' && canvasEngine) {
    const lineTool = canvasEngine.getToolManager().getTool('line') as any
    if (lineTool) {
      switch (command) {
        case 'straight':
          lineTool.setLineType('straight')
          break
        case 'curve':
          lineTool.setLineType('curve')
          break
        case 'free':
          lineTool.setLineType('free')
          break
      }
    }
  }
}

// 处理形状类型切换
const handleShapeTypeChange = (command: string) => {
  currentShapeType.value = command
  
  // 如果当前工具是形状工具，立即应用新类型
  if (currentTool.value === 'shape' && canvasEngine) {
    const shapeTool = canvasEngine.getToolManager().getTool('shape') as any
    if (shapeTool) {
      switch (command) {
        case 'rectangle':
          shapeTool.setShapeType('rectangle')
          break
        case 'circle':
          shapeTool.setShapeType('circle')
          break
        case 'triangle':
          shapeTool.setShapeType('triangle')
          break
        case 'ellipse':
          shapeTool.setShapeType('ellipse')
          break
        case 'diamond':
          shapeTool.setShapeType('diamond')
          break
        case 'star':
          shapeTool.setShapeType('star')
          break
      }
    }
  }
}

// 处理画笔样式切换
const handlePenStyleChange = (command: string) => {
  currentPenStyle.value = command
  
  // 如果当前工具是画笔工具，立即应用新样式
  if (currentTool.value === 'pen' && canvasEngine) {
    const penTool = canvasEngine.getToolManager().getTool('pen') as any
    if (penTool) {
      penTool.setLineStyle(command as any)
    }
  }
}

// 颜色更新方法
const updateFillColor = (color: string) => {
  currentFillColor.value = color
  currentStyle.fill = color
  // 通知画布引擎更新当前样式
  if (canvasEngine) {
    canvasEngine.updateCurrentStyle({ fill: color })
  }
}

const updateStrokeColor = (color: string) => {
  currentStrokeColor.value = color
  currentStyle.stroke = color
  // 通知画布引擎更新当前样式
  if (canvasEngine) {
    canvasEngine.updateCurrentStyle({ stroke: color })
  }
}

const updateTextColor = (color: string) => {
  currentTextColor.value = color
  currentStyle.fill = color
  // 通知画布引擎更新当前样式
  if (canvasEngine) {
    canvasEngine.updateCurrentStyle({ fill: color })
  }
}

// 样式更新方法
const updateCurrentStyle = (style: any) => {
  Object.assign(currentStyle, style)
  // 通知画布引擎更新当前样式
  if (canvasEngine) {
    // 同步选中元素ID到画布引擎
    canvasEngine.setSelectedElementIds(selectedElementIds.value)
    canvasEngine.updateCurrentStyle(style)
  }
}

// 颜色选择器功能已集成到浮动工具栏中

// 浮动工具栏事件处理
const updateElementStyle = (style: any) => {
  if (canvasEngine) {
    // 获取所有选中元素的ID
    let elementIds: string[] = []
    
    // 优先使用selectedElements（多选情况）
    if (selectedElements.value && selectedElements.value.length > 0) {
      elementIds = selectedElements.value.map(el => el.id)
    } else if (selectedElement.value && selectedElement.value.id) {
      // 单选情况
      elementIds = [selectedElement.value.id]
    } else if (Array.isArray(selectedElementIds.value) && selectedElementIds.value.length > 0) {
      // 从store获取选中元素ID
      elementIds = selectedElementIds.value
    }
    
    if (elementIds.length > 0) {
      canvasEngine.setSelectedElementIds(elementIds)
      canvasEngine.updateCurrentStyle(style)
      // updateCurrentStyle 内部已经调用了 render()，不需要重复调用
      
      // 更新本地状态以保持同步
      selectedElements.value.forEach(element => {
        if (elementIds.includes(element.id)) {
          element.style = { ...element.style, ...style }
        }
      })
      
      if (selectedElement.value && elementIds.includes(selectedElement.value.id)) {
        selectedElement.value.style = { ...selectedElement.value.style, ...style }
      }
    }
  }
}

// 更新图片数据
const updateImageData = (imageData: any) => {
  if (canvasEngine) {
    // 获取所有选中元素的ID
    let elementIds: string[] = []
    
    // 优先使用selectedElements（多选情况）
    if (selectedElements.value && selectedElements.value.length > 0) {
      elementIds = selectedElements.value.map(el => el.id)
    } else if (selectedElement.value && selectedElement.value.id) {
      // 单选情况
      elementIds = [selectedElement.value.id]
    } else if (Array.isArray(selectedElementIds.value) && selectedElementIds.value.length > 0) {
      // 从store获取选中元素ID
      elementIds = selectedElementIds.value
    }
    
    if (elementIds.length > 0) {
      canvasEngine.setSelectedElementIds(elementIds)
      
      // 更新图片元素的data属性
      elementIds.forEach(elementId => {
        const element = canvasEngine.getElement(elementId)
        
        if (element && element.type === 'image') {
          // 更新图片数据
          if (imageData.border) {
            element.data.border = imageData.border
          }
          if (imageData.shadow) {
            element.data.shadow = imageData.shadow
          }
          if (imageData.borderRadius !== undefined) {
            element.data.borderRadius = imageData.borderRadius
          }
          if (imageData.filter !== undefined) {
            element.data.filter = imageData.filter
          }
          if (imageData.overlayText !== undefined) {
            element.data.overlayText = imageData.overlayText
          }
          
          // 通知画布引擎元素已更新
          canvasEngine.updateElement(element)
          
          // 更新本地状态
          selectedElements.value.forEach(el => {
            if (el.id === elementId) {
              el.data = { ...el.data, ...imageData }
            }
          })
          
          if (selectedElement.value && selectedElement.value.id === elementId) {
            selectedElement.value.data = { ...selectedElement.value.data, ...imageData }
          }
        }
      })
    }
  }
}

const activateStyleBrush = (elementId: string) => {
  if (canvasEngine) {
    canvasEngine.activateStyleBrush(elementId)
  }
}

const bringElementToFront = (elementId: string) => {
  if (canvasEngine) {
    canvasEngine.bringElementToFront(elementId)
  }
}

const sendElementToBack = (elementId: string) => {
  if (canvasEngine) {
    canvasEngine.sendElementToBack(elementId)
  }
}

// 删除选中的元素
const deleteSelectedElement = () => {
  if (canvasEngine) {
    canvasEngine.deleteSelectedElements()
  }
}

// 切换样式刷
const toggleStyleBrush = () => {
  if (canvasEngine) {
    canvasEngine.toggleStyleBrush()
  }
}

// 缩放操作
const zoomIn = () => {
  if (canvasEngine) {
    const currentScale = canvasEngine.getViewportManager().getViewport().scale
    const newScale = Math.min(5, currentScale + 0.1)
    canvasEngine.getViewportManager().zoom(newScale)
    // 同步更新store状态
    zoomTo(newScale)
  }
}

const zoomOut = () => {
  if (canvasEngine) {
    const currentScale = canvasEngine.getViewportManager().getViewport().scale
    const newScale = Math.max(0.1, currentScale - 0.1)
    canvasEngine.getViewportManager().zoom(newScale)
    // 同步更新store状态
    zoomTo(newScale)
  }
}

const resetZoom = () => {
  if (canvasEngine) {
    canvasEngine.resetViewport()
    // 同步更新store状态
    resetViewport()
  }
}

// 测试功能
const addTestElement = () => {
  const element = createTestElement(ElementType.SHAPE, {
    x: Math.random() * 500,
    y: Math.random() * 300
  })
  
  if (canvasEngine) {
    canvasEngine.addElement(element)
  }
}

const addTestElements = () => {
  // 添加一些测试元素
  for (let i = 0; i < 3; i++) {
    const element = createTestElement(ElementType.SHAPE, {
      x: 100 + i * 150,
      y: 100 + i * 50
    })
    
    if (canvasEngine) {
      canvasEngine.addElement(element)
    }
  }
}

const clearCanvas = () => {
  clearElements()
  if (canvasEngine) {
    canvasEngine.clearElements()
  }
}

// 显示帮助
const showHelp = () => {
  helpVisible.value = true
}

// 切换智能参考线
const toggleSmartGuides = () => {
  smartGuidesEnabled.value = !smartGuidesEnabled.value
  if (canvasEngine) {
    canvasEngine.setSmartGuidesEnabled(smartGuidesEnabled.value)
  }
}

// 处理模板选择
const handleTemplateSelect = (template: FlowTemplate) => {
  if (canvasEngine) {
    try {
      // 添加模板到画布
      canvasEngine.addTemplate(template.id)
      ElMessage.success(`已添加模板: ${template.name}`)
    } catch (error) {
      console.error('添加模板失败:', error)
      ElMessage.error('添加模板失败，请重试')
    }
  }
}

// 检查是否在编辑文本
const isEditingText = computed(() => {
  if (canvasEngine) {
    const textTool = canvasEngine.getToolManager().getTool('text') as any as any
    if (textTool && textTool.isEditing) {
      return textTool.isEditing()
    }
  }
  return false
})

// 获取工具栏配置
const getToolbarConfig = () => {
  if (!selectedElement.value) {
    return {
      fill: true,
      stroke: true,
      strokeWidth: true,
      lineStyle: true,
      styleBrush: true,
      layer: true,
      delete: true
    }
  }

  const elementType = selectedElement.value.type
  
  // 文本元素配置
  if (elementType === 'text') {
    return {
      fontFamily: true,
      fontSize: true,
      fontWeight: true,
      fontStyle: true,
      textDecoration: true,
      textAlign: true,
      textColor: true,  // 文本颜色
      styleBrush: true,
      layer: true,
      delete: true
    }
  }
  
  // 其他元素配置
  return {
    fill: true,
    stroke: true,
    strokeWidth: true,
    lineStyle: true,
    styleBrush: true,
    layer: true,
    delete: true
  }
}

// 更新文本工具设置（实时更新）
const updateTextToolSettings = (style: Partial<ElementStyle>) => {
  if (canvasEngine) {
    // 获取文本工具并更新其设置
    const textTool = canvasEngine.getToolManager().getTool('text') as any
    if (textTool && textTool.setTextSettings) {
      // 将样式转换为文本工具设置
      const textSettings: any = {}
      
      if (style.fontSize !== undefined) {
        textSettings.fontSize = style.fontSize
      }
      if (style.fontFamily !== undefined) {
        textSettings.fontFamily = style.fontFamily
      }
      if (style.textAlign !== undefined) {
        textSettings.textAlign = style.textAlign
      }
      if (style.textDecoration !== undefined) {
        textSettings.textDecoration = style.textDecoration
      }
      if (style.fontWeight !== undefined) {
        textSettings.fontWeight = style.fontWeight
      }
      if (style.fontStyle !== undefined) {
        textSettings.fontStyle = style.fontStyle
      }
      
      textTool.setTextSettings(textSettings)
      
      // 检查文本工具是否正在编辑
      const isEditing = textTool.isEditing && textTool.isEditing()
      
      if (isEditing) {
        // 请求重新渲染
        canvasEngine.requestRender()
      }
    }
  }
}

// ==================== 图片文字输入功能 ====================

// 启动图片文字输入模式
const startImageTextInput = (imageElement: any) => {
  if (!canvasEngine) return
  
  
  // 设置文字输入状态
  isImageTextInput.value = true
  imageTextInputData.value = {
    imageId: imageElement.id,
    text: '',
    position: {
      x: imageElement.position.x + imageElement.size.x / 2,
      y: imageElement.position.y + imageElement.size.y / 2
    },
    size: {
      x: imageElement.size.x,
      y: imageElement.size.y
    }
  }
  
  
  // 选择图片元素
  selectElement(imageElement)
  
  // 延迟聚焦输入框
  nextTick(() => {
    if (imageTextInputRef.value) {
      imageTextInputRef.value.focus()
      
    }
  })
}

// 处理输入框失去焦点事件
const handleImageTextInputBlur = () => {
  
  // 检查是否刚刚有工具栏交互（200ms内，给更多时间）
  const now = Date.now()
  if (now - lastToolbarInteraction < 200) {
    return
  }
  
  confirmImageTextInput()
}

// 确认图片文字输入
const confirmImageTextInput = async () => {
  
  // 防止重复调用
  if (!isImageTextInput.value) {
    return
  }
  
  // 检查输入框的实际值
  const inputValue = imageTextInputRef.value?.value || ''
  const dataValue = imageTextInputData.value.text || ''
  
  if (!canvasEngine || (!inputValue.trim() && !dataValue.trim())) {
    cancelImageTextInput()
    return
  }
  
  // 如果输入框有值但数据绑定没有，手动同步
  if (inputValue && !dataValue) {
    imageTextInputData.value.text = inputValue
  }
  
  // 获取图片元素
  const imageElement = canvasEngine.getElement(imageTextInputData.value.imageId)
  if (!imageElement || imageElement.type !== 'image') {
    cancelImageTextInput()
    return
  }
  
  const finalText = imageTextInputData.value.text || inputValue
  
  try {
    // 导入图片合成工具
    const { ImageComposer } = await import('@/core/utils/ImageComposer')
    
    // 检查是否已有文字叠加（编辑模式）
    const existingOverlay = imageElement.data.overlayText
    let updatedImageElement
    
    if (existingOverlay) {
      // 编辑现有文字
      updatedImageElement = ImageComposer.updateTextOverlay(
        imageElement as any, // 类型转换
        finalText,
        {
          fontSize: existingOverlay.fontSize,
          fontFamily: existingOverlay.fontFamily,
          fontWeight: existingOverlay.fontWeight,
          fontStyle: existingOverlay.fontStyle,
          color: existingOverlay.color,
          textAlign: existingOverlay.textAlign,
          position: existingOverlay.position
        }
      )
    } else {
      // 添加新文字
      updatedImageElement = ImageComposer.addTextOverlay(
        imageElement as any, // 类型转换
        finalText,
        {
          fontSize: 48,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          fontStyle: 'normal',
          color: '#ffffff',
          textAlign: 'center',
          position: { x: 0.5, y: 0.5 } // 图片中心
        }
      )
    }
    
    // 更新画布中的图片元素
    canvasEngine.updateElement(updatedImageElement)
    
    
    // 触发重新渲染
    canvasEngine.render()
    
  } catch (error) {
    console.error('❌ 图片文字叠加失败:', error)
    ElMessage.error('文字叠加失败，请重试')
  }
  
  // 取消文字输入模式
  cancelImageTextInput()
  isTextEditing.value = false // 重置文字编辑状态
}

// 确认图片文字编辑
const confirmImageTextEdit = async () => {
  
  // 防止重复调用
  if (!isTextEditing.value) {
    return
  }
  
  // 检查输入框的实际值
  const inputValue = imageTextInputRef.value?.value || ''
  const dataValue = imageTextInputData.value.text || ''
  
  if (!canvasEngine) {
    cancelImageTextInput()
    return
  }
  
  // 如果输入框有值但数据绑定没有，手动同步
  if (inputValue && !dataValue) {
    imageTextInputData.value.text = inputValue
  }
  
  // 获取图片元素
  const imageElement = canvasEngine.getElement(imageTextInputData.value.imageId)
  if (!imageElement || imageElement.type !== 'image') {
    cancelImageTextInput()
    return
  }
  
  const finalText = imageTextInputData.value.text || inputValue
  
  try {
    // 导入图片合成工具
    const { ImageComposer } = await import('@/core/utils/ImageComposer')
    
    // 获取现有的文字叠加样式
    const existingOverlay = imageElement.data.overlayText
    if (!existingOverlay) {
      cancelImageTextInput()
      return
    }
    
    // 更新文字内容，保持原有样式
    const updatedImageElement = ImageComposer.updateTextOverlay(
      imageElement as any, // 类型转换
      finalText,
      {
        fontSize: existingOverlay.fontSize,
        fontFamily: existingOverlay.fontFamily,
        fontWeight: existingOverlay.fontWeight,
        fontStyle: existingOverlay.fontStyle,
        color: existingOverlay.color,
        textAlign: existingOverlay.textAlign,
        position: existingOverlay.position
      }
    )
    
    // 更新画布中的图片元素
    canvasEngine.updateElement(updatedImageElement)
    
    
    // 触发重新渲染
    canvasEngine.render()
    
  } catch (error) {
    console.error('❌ 文字编辑失败:', error)
    ElMessage.error('文字编辑失败，请重试')
  }
  
  // 取消文字编辑模式
  cancelImageTextInput()
}

// 取消图片文字输入
const cancelImageTextInput = () => {
  isImageTextInput.value = false
  isTextEditing.value = false // 重置文字编辑状态
  imageTextInputData.value = {
    imageId: '',
    text: '',
    position: { x: 0, y: 0 },
    size: { x: 0, y: 0 }
  }
}

// 处理图片文字输入框的键盘事件
const handleImageTextInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    confirmImageTextInput()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelImageTextInput()
  }
}

// 处理图片文字输入框的点击事件（阻止事件冒泡）
const handleImageTextInputClick = (event: MouseEvent) => {
  event.stopPropagation()
}

// 获取图片文字输入框样式
const getImageTextInputStyle = () => {
  if (!canvasEngine) return {}
  
  // 获取视口管理器来计算正确的屏幕坐标
  const viewportManager = canvasEngine.getViewportManager()
  const coordinateTransformer = viewportManager.getCoordinateTransformer()
  
  // 将虚拟坐标转换为屏幕坐标
  const screenPosition = coordinateTransformer.virtualToScreen({
    x: imageTextInputData.value.position.x,
    y: imageTextInputData.value.position.y
  })
  
  return {
    left: screenPosition.x + 'px',
    top: screenPosition.y + 'px',
    transform: 'translate(-50%, -50%)'
  }
}

// 检查点击是否在文字叠加区域内
const isPointInTextOverlay = (point: { x: number; y: number }, element: any): boolean => {
  if (element.type !== 'image' || !element.data.overlayText || !element.data.overlayText.visible) {
    return false
  }

  const overlayText = element.data.overlayText
  const { position, size } = element
  const { scale, offset } = viewport.value

  // 计算图片在画布上的位置
  const imageX = (position.x + offset.x) * scale
  const imageY = (position.y + offset.y) * scale
  const imageWidth = size.x * scale
  const imageHeight = size.y * scale

  // 计算文字在画布上的位置
  const textX = imageX + imageWidth * overlayText.position.x
  const textY = imageY + imageHeight * overlayText.position.y

  // 估算文字区域大小（这里简化处理，实际应该测量文字的实际尺寸）
  const fontSize = overlayText.fontSize * scale
  const textWidth = overlayText.text.length * fontSize * 0.6 // 粗略估算
  const textHeight = fontSize

  // 检查点击是否在文字区域内
  const textLeft = textX - textWidth / 2
  const textRight = textX + textWidth / 2
  const textTop = textY - textHeight / 2
  const textBottom = textY + textHeight / 2

  return point.x >= textLeft && point.x <= textRight && 
         point.y >= textTop && point.y <= textBottom
}

// 启动图片文字编辑模式
const startImageTextEdit = (imageElement: any) => {
  if (!canvasEngine) return
  
  
  const overlayText = imageElement.data.overlayText
  if (!overlayText) {
    startImageTextInput(imageElement)
    return
  }
  
  // 设置文字编辑状态
  isImageTextInput.value = true
  isTextEditing.value = true // 标记正在编辑文字
  imageTextInputData.value = {
    imageId: imageElement.id,
    text: overlayText.text,
    position: {
      x: imageElement.position.x + imageElement.size.x * overlayText.position.x,
      y: imageElement.position.y + imageElement.size.y * overlayText.position.y
    },
    size: imageElement.size
  }
  
  // 选择图片元素
  selectElement(imageElement)
  
  // 延迟聚焦输入框
  nextTick(() => {
    if (imageTextInputRef.value) {
      imageTextInputRef.value.focus()
      imageTextInputRef.value.select() // 选中所有文字
    }
  })
}

// ==================== 裁剪功能 ====================

// 裁剪状态管理
const isCropping = ref(false)
const cropControls = ref({
  x: 0,
  y: 0,
  width: 200,
  height: 200
})
const cropImageId = ref('')
const cropStartPos = ref({ x: 0, y: 0 })
const cropHandle = ref('')
const cropPreviewUrl = ref('')
const cropShape = ref('rectangle') // 裁剪框形状

// 图片文字输入状态管理
const isImageTextInput = ref(false)
const imageTextInputData = ref({
  imageId: '',
  text: '',
  position: { x: 0, y: 0 },
  size: { x: 0, y: 0 }
})
const imageTextInputRef = ref<HTMLInputElement>()

// 图片压缩配置
const compressionConfig = ref({
  quality: 0.8,        // 压缩质量 (0-1)
  maxWidth: 1920,      // 最大宽度
  maxHeight: 1080,     // 最大高度
  enableCompression: true  // 是否启用压缩
})

// 图片压缩函数
const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.8, maxWidth: number = 1920, maxHeight: number = 1080): string => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.toDataURL()
  
  // 计算压缩后的尺寸
  let { width, height } = canvas
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width *= ratio
    height *= ratio
  }
  
  // 创建压缩画布
  const compressedCanvas = document.createElement('canvas')
  compressedCanvas.width = width
  compressedCanvas.height = height
  const compressedCtx = compressedCanvas.getContext('2d')
  
  if (compressedCtx) {
    compressedCtx.drawImage(canvas, 0, 0, width, height)
  }
  
  return compressedCanvas.toDataURL('image/jpeg', quality)
}

// 转换为blob格式的函数
const convertToBlob = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    return blob
  } catch (error) {
    return null
  }
}

// 生成短链接的函数（模拟）
const generateShortUrl = (imageUrl: string): string => {
  // 这里可以集成真实的短链接服务
  const shortId = Math.random().toString(36).substring(2, 8)
  return `short://${shortId}`
}

// 生成裁剪预览图片
const generateCropPreview = async () => {
  if (!cropImageId.value || !canvasEngine) return
  
  const imageElement = canvasEngine.getElement(cropImageId.value)
  if (!imageElement || imageElement.type !== 'image') return
  
  try {
    // 创建临时canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 设置canvas尺寸为裁剪区域尺寸
    canvas.width = cropControls.value.width
    canvas.height = cropControls.value.height
    
    // 加载原始图片
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // 计算裁剪参数
          const offsetX = cropControls.value.x - imageElement.position.x
          const offsetY = cropControls.value.y - imageElement.position.y
          
          const sourceX = Math.max(0, offsetX * (img.width / imageElement.size.x))
          const sourceY = Math.max(0, offsetY * (img.height / imageElement.size.y))
          
          const sourceWidth = Math.min(
            cropControls.value.width * (img.width / imageElement.size.x),
            img.width - sourceX
          )
          const sourceHeight = Math.min(
            cropControls.value.height * (img.height / imageElement.size.y),
            img.height - sourceY
          )
          
          // 如果有裁剪形状，先创建裁剪路径
          if (cropShape.value && cropShape.value !== 'rectangle') {
            ctx.save()
            createCropShapePath(ctx, 0, 0, cropControls.value.width, cropControls.value.height, cropShape.value)
            ctx.clip()
          }
          
          // 绘制裁剪区域
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, cropControls.value.width, cropControls.value.height
          )
          
          // 如果有裁剪形状，恢复上下文
          if (cropShape.value && cropShape.value !== 'rectangle') {
            ctx.restore()
          }
          
          // 生成预览URL
          cropPreviewUrl.value = canvas.toDataURL('image/png')
          resolve(true)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = imageElement.data.src
    })
  } catch (error) {
    // 生成裁剪预览时出错
  }
}

// 处理图片裁剪
const handleImageCrop = (imageId: string) => {
  if (!canvasEngine) return
  
  // 获取图片元素
  const imageElement = canvasEngine.getElement(imageId)
  if (!imageElement || imageElement.type !== 'image') {
    return
  }
  
  // 设置裁剪状态
  isCropping.value = true
  cropImageId.value = imageId
  
  // 初始化裁剪框位置和大小（基于图片元素）
  cropControls.value = {
    x: imageElement.position.x,
    y: imageElement.position.y,
    width: imageElement.size.x,
    height: imageElement.size.y
  }
  
  // 重置裁剪形状为矩形
  cropShape.value = 'rectangle'
  
  // 生成初始预览
  generateCropPreview()
}

// 处理带形状的图片裁剪
const handleImageCropWithShape = (data: { imageId: string, shape: string }) => {
  if (!canvasEngine) return
  
  // 获取图片元素
  const imageElement = canvasEngine.getElement(data.imageId)
  if (!imageElement || imageElement.type !== 'image') {
    return
  }
  
  // 设置裁剪状态
  isCropping.value = true
  cropImageId.value = data.imageId
  
  // 初始化裁剪框位置和大小（基于图片元素）
  cropControls.value = {
    x: imageElement.position.x,
    y: imageElement.position.y,
    width: imageElement.size.x,
    height: imageElement.size.y
  }
  
  // 设置指定的裁剪形状
  cropShape.value = data.shape
  
  // 生成初始预览
  generateCropPreview()
}

// 处理裁剪形状设置
const handleCropShapeSet = (shape: string) => {
  if (!isCropping.value) return
  
  cropShape.value = shape
  // 重新生成预览以应用新的裁剪形状
  generateCropPreview()
}

// 处理进入文字编辑模式
const handleEnterTextEditMode = () => {
  
  if (!selectedElement.value || selectedElement.value.type !== 'image') {
    return
  }
  
  const imageElement = selectedElement.value
  
  // 启动文字编辑模式
  startImageTextEdit(imageElement)
}

// 获取裁剪框样式
const getCropFrameStyle = () => {
  const baseStyle = {
    left: cropControls.value.x + 'px',
    top: cropControls.value.y + 'px',
    width: cropControls.value.width + 'px',
    height: cropControls.value.height + 'px',
    backgroundImage: cropPreviewUrl.value ? `url(${cropPreviewUrl.value})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
  
  // 根据裁剪形状添加特殊样式
  if (cropShape.value === 'circle') {
    baseStyle.borderRadius = '50%'
  } else if (cropShape.value === 'ellipse') {
    baseStyle.borderRadius = '50%'
  } else if (cropShape.value === 'rounded') {
    baseStyle.borderRadius = '20px'
  }
  
  return baseStyle
}

// 创建裁剪形状路径
const createCropShapePath = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, shape: string) => {
  const centerX = x + width / 2
  const centerY = y + height / 2
  const radius = Math.min(width, height) / 2
  
  ctx.beginPath()
  
  switch (shape) {
    case 'circle':
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      break
      
    case 'ellipse':
      ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, 2 * Math.PI)
      break
      
    case 'triangle':
      ctx.moveTo(centerX, y)
      ctx.lineTo(x, y + height)
      ctx.lineTo(x + width, y + height)
      break
      
    case 'diamond':
      ctx.moveTo(centerX, y)
      ctx.lineTo(x + width, centerY)
      ctx.lineTo(centerX, y + height)
      ctx.lineTo(x, centerY)
      break
      
    case 'hexagon':
      createPolygonPath(ctx, centerX, centerY, radius, 6)
      break
      
    case 'octagon':
      createPolygonPath(ctx, centerX, centerY, radius, 8)
      break
      
    case 'pentagon':
      createPolygonPath(ctx, centerX, centerY, radius, 5)
      break
      
    case 'heart':
      createHeartPath(ctx, centerX, centerY, radius)
      break
      
    case 'star':
      createStarPath(ctx, centerX, centerY, radius)
      break
      
    case 'cloud':
      createCloudPath(ctx, x, y, width, height)
      break
      
    case 'flower':
      createFlowerPath(ctx, centerX, centerY, radius)
      break
      
    case 'egg':
      ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, 2 * Math.PI)
      break
      
    case 'parallelogram':
      ctx.moveTo(x + width * 0.2, y)
      ctx.lineTo(x + width, y)
      ctx.lineTo(x + width * 0.8, y + height)
      ctx.lineTo(x, y + height)
      break
      
    case 'squircle':
      createSquirclePath(ctx, x, y, width, height)
      break
      
    case 'stadium':
      createStadiumPath(ctx, x, y, width, height)
      break
      
    case 'clover':
      createCloverPath(ctx, centerX, centerY, radius)
      break
      
    case 'wave':
      createWavePath(ctx, x, y, width, height)
      break
      
    case 'blob':
      ctx.ellipse(centerX, centerY, radius, radius * 1.2, 0, 0, 2 * Math.PI)
      break
      
    default:
      // 默认矩形
      ctx.rect(x, y, width, height)
  }
  
  ctx.closePath()
}

// 创建多边形路径
const createPolygonPath = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, sides: number) => {
  const angle = (2 * Math.PI) / sides
  
  for (let i = 0; i < sides; i++) {
    const x = centerX + radius * Math.cos(i * angle - Math.PI / 2)
    const y = centerY + radius * Math.sin(i * angle - Math.PI / 2)
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
}

// 创建心形路径
const createHeartPath = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
  const topCurveHeight = radius * 0.3
  ctx.moveTo(centerX, centerY + topCurveHeight)
  ctx.bezierCurveTo(centerX, centerY, centerX - radius, centerY, centerX - radius, centerY + topCurveHeight)
  ctx.bezierCurveTo(centerX - radius, centerY + (radius + topCurveHeight) / 2, centerX, centerY + (radius + topCurveHeight) / 2, centerX, centerY + radius)
  ctx.bezierCurveTo(centerX, centerY + (radius + topCurveHeight) / 2, centerX + radius, centerY + (radius + topCurveHeight) / 2, centerX + radius, centerY + topCurveHeight)
  ctx.bezierCurveTo(centerX + radius, centerY, centerX, centerY, centerX, centerY + topCurveHeight)
}

// 创建星形路径
const createStarPath = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
  const outerRadius = radius
  const innerRadius = radius * 0.4
  const spikes = 5
  const step = Math.PI / spikes
  
  for (let i = 0; i < 2 * spikes; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const x = centerX + r * Math.cos(i * step - Math.PI / 2)
    const y = centerY + r * Math.sin(i * step - Math.PI / 2)
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
}

// 创建云朵路径
const createCloudPath = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  const centerX = x + width / 2
  const centerY = y + height / 2
  const radius = Math.min(width, height) / 3
  
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.arc(centerX - radius * 0.5, centerY - radius * 0.3, radius * 0.6, 0, 2 * Math.PI)
  ctx.arc(centerX + radius * 0.5, centerY - radius * 0.3, radius * 0.6, 0, 2 * Math.PI)
}

// 创建花朵路径
const createFlowerPath = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
  const petals = 5
  const petalRadius = radius * 0.6
  const centerRadius = radius * 0.3
  
  // 绘制花瓣
  for (let i = 0; i < petals; i++) {
    const angle = (2 * Math.PI * i) / petals
    const petalX = centerX + Math.cos(angle) * radius * 0.3
    const petalY = centerY + Math.sin(angle) * radius * 0.3
    ctx.arc(petalX, petalY, petalRadius, 0, 2 * Math.PI)
  }
  
  // 绘制中心
  ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI)
}

// 创建超圆角路径
const createSquirclePath = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  const radius = Math.min(width, height) * 0.2
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
}

// 创建体育场形路径
const createStadiumPath = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  const radius = height / 2
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2)
  ctx.lineTo(x + radius, y + height)
  ctx.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2)
}

// 创建四叶草路径
const createCloverPath = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
  const leafRadius = radius * 0.4
  
  // 四个叶子
  ctx.arc(centerX, centerY - radius * 0.3, leafRadius, 0, 2 * Math.PI)
  ctx.arc(centerX + radius * 0.3, centerY, leafRadius, 0, 2 * Math.PI)
  ctx.arc(centerX, centerY + radius * 0.3, leafRadius, 0, 2 * Math.PI)
  ctx.arc(centerX - radius * 0.3, centerY, leafRadius, 0, 2 * Math.PI)
  
  // 中心
  ctx.arc(centerX, centerY, radius * 0.2, 0, 2 * Math.PI)
}

// 创建波浪路径
const createWavePath = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  const waveHeight = height * 0.3
  const waveLength = width / 4
  
  ctx.moveTo(x, y + height / 2)
  
  for (let i = 0; i <= 4; i++) {
    const waveX = x + i * waveLength
    const waveY = y + height / 2 + Math.sin(i * Math.PI) * waveHeight
    ctx.quadraticCurveTo(waveX - waveLength / 2, waveY, waveX, waveY)
  }
  
  ctx.lineTo(x + width, y + height)
  ctx.lineTo(x, y + height)
}

// 处理裁剪遮罩点击（点击空白区域完成裁剪）
const handleCropOverlayMouseDown = (event: MouseEvent) => {
  // 如果点击的是遮罩本身（不是裁剪框），则完成裁剪
  if (event.target === event.currentTarget) {
    finishCrop()
  }
}

// 处理裁剪框拖拽开始
const handleCropFrameMouseDown = (event: MouseEvent) => {
  event.preventDefault()
  cropStartPos.value = { x: event.clientX, y: event.clientY }
  cropHandle.value = 'move'
  
  const handleMouseMove = throttle((e: MouseEvent) => {
    const deltaX = e.clientX - cropStartPos.value.x
    const deltaY = e.clientY - cropStartPos.value.y
    
    cropControls.value.x += deltaX
    cropControls.value.y += deltaY
    
    cropStartPos.value = { x: e.clientX, y: e.clientY }
    
    // 更新预览
    generateCropPreview()
  }, 16) // 60fps
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    // 拖动结束时生成图片地址
    generateCropImageUrl()
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 处理裁剪控制点拖拽
const handleCropHandleMouseDown = (event: MouseEvent, handle: string) => {
  event.preventDefault()
  event.stopPropagation()
  
  cropStartPos.value = { x: event.clientX, y: event.clientY }
  cropHandle.value = handle
  
  const handleMouseMove = throttle((e: MouseEvent) => {
    const deltaX = e.clientX - cropStartPos.value.x
    const deltaY = e.clientY - cropStartPos.value.y
    
    switch (handle) {
      case 'nw':
        cropControls.value.x += deltaX
        cropControls.value.y += deltaY
        cropControls.value.width -= deltaX
        cropControls.value.height -= deltaY
        break
      case 'ne':
        cropControls.value.y += deltaY
        cropControls.value.width += deltaX
        cropControls.value.height -= deltaY
        break
      case 'sw':
        cropControls.value.x += deltaX
        cropControls.value.width -= deltaX
        cropControls.value.height += deltaY
        break
      case 'se':
        cropControls.value.width += deltaX
        cropControls.value.height += deltaY
        break
      case 'n':
        cropControls.value.y += deltaY
        cropControls.value.height -= deltaY
        break
      case 's':
        cropControls.value.height += deltaY
        break
      case 'w':
        cropControls.value.x += deltaX
        cropControls.value.width -= deltaX
        break
      case 'e':
        cropControls.value.width += deltaX
        break
    }
    
    // 确保最小尺寸
    if (cropControls.value.width < 20) cropControls.value.width = 20
    if (cropControls.value.height < 20) cropControls.value.height = 20
    
    cropStartPos.value = { x: e.clientX, y: e.clientY }
    
    // 更新预览
    generateCropPreview()
  }, 16) // 60fps
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    // 拖动结束时生成图片地址
    generateCropImageUrl()
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 处理裁剪遮罩点击
const handleCropOverlayClick = () => {
  // 点击空白区域完成裁剪
  finishCrop()
}

// 生成裁剪图片地址
const generateCropImageUrl = async () => {
  if (!canvasEngine || !cropImageId.value) return null
  
  try {
    // 获取原始图片元素
    const imageElement = canvasEngine.getElement(cropImageId.value)
    if (!imageElement || imageElement.type !== 'image') {
      console.error('未找到图片元素')
      return null
    }
    
    // 创建canvas来生成裁剪后的图片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    // 设置canvas尺寸为裁剪区域尺寸
    canvas.width = cropControls.value.width
    canvas.height = cropControls.value.height
    
    // 加载原始图片
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // 计算裁剪参数 - 修复坐标计算逻辑
          // 裁剪框相对于图片元素的偏移量
          const offsetX = cropControls.value.x - imageElement.position.x
          const offsetY = cropControls.value.y - imageElement.position.y
          
          // 将偏移量转换为图片坐标系
          const sourceX = Math.max(0, offsetX * (img.width / imageElement.size.x))
          const sourceY = Math.max(0, offsetY * (img.height / imageElement.size.y))
          
          // 计算裁剪区域在图片中的实际尺寸
          const sourceWidth = Math.min(
            cropControls.value.width * (img.width / imageElement.size.x),
            img.width - sourceX
          )
          const sourceHeight = Math.min(
            cropControls.value.height * (img.height / imageElement.size.y),
            img.height - sourceY
          )
          
          // 如果有裁剪形状，先创建裁剪路径
          if (cropShape.value && cropShape.value !== 'rectangle') {
            ctx.save()
            createCropShapePath(ctx, 0, 0, cropControls.value.width, cropControls.value.height, cropShape.value)
            ctx.clip()
          }
          
          // 绘制裁剪后的图片
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, cropControls.value.width, cropControls.value.height
          )
          
          // 如果有裁剪形状，恢复上下文
          if (cropShape.value && cropShape.value !== 'rectangle') {
            ctx.restore()
          }
          
          // 生成图片地址
          const imageUrl = canvas.toDataURL('image/png')
          resolve(imageUrl)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = imageElement.data?.src || ''
    })
    
  } catch (error) {
    return null
  }
}

// 完成裁剪 - 简化版本
const finishCrop = async () => {
  if (!canvasEngine || !cropImageId.value) {
    return
  }
  
  try {
    // 获取原始图片元素
    const imageElement = canvasEngine.getElement(cropImageId.value)
    if (!imageElement || imageElement.type !== 'image') {
      return
    }
    
    // 生成裁剪后的图片URL
    const croppedImageUrl = await generateCropImageUrl()
    if (!croppedImageUrl) {
      return
    }
    
    // 创建更新后的元素
    const updatedElement = {
      ...imageElement,
      data: {
        ...imageElement.data,
        src: croppedImageUrl,
        originalWidth: cropControls.value.width,
        originalHeight: cropControls.value.height,
        isCropped: true,
        cropShape: cropShape.value !== 'rectangle' ? cropShape.value : undefined
      },
      position: {
        x: cropControls.value.x,
        y: cropControls.value.y
      },
      size: {
        x: cropControls.value.width,
        y: cropControls.value.height
      }
    }
    
    // 获取当前的ImageElement实例
    const imageElementInstance = canvasEngine.getElement(cropImageId.value) as any
    
    // 直接更新ImageElement实例的数据，而不是替换整个元素
    if (imageElementInstance && typeof imageElementInstance.updateData === 'function') {
      // 更新图片数据
      imageElementInstance.updateData(updatedElement.data)
      
      // 更新位置和尺寸
      imageElementInstance.position = updatedElement.position
      imageElementInstance.size = updatedElement.size
      imageElementInstance.updatedAt = Date.now()
      
      // 重置加载状态，强制重新加载新图片
      if (typeof imageElementInstance.resetImageLoading === 'function') {
        imageElementInstance.resetImageLoading()
      }
      
      // 触发重新渲染
      canvasEngine.render()
    }
    
  } catch (error) {
    // 裁剪操作失败
  } finally {
    // 清理裁剪状态
    isCropping.value = false
    cropImageId.value = ''
    cropHandle.value = ''
    cropPreviewUrl.value = ''
    cropShape.value = 'rectangle'
  }
}
</script>

<style scoped>
.whiteboard-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.whiteboard-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.whiteboard-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  width: 100%;
  min-height: 400px;
}

.whiteboard-canvas {
  display: block;
  cursor: crosshair;
  background: white;
  width: 100%;
  height: 100%;
}

.whiteboard-canvas:focus {
  outline: none;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
}

.status-bar span {
  white-space: nowrap;
}

.help-content {
  line-height: 1.6;
}

.help-content h3 {
  margin: 16px 0 8px 0;
  color: #333;
  font-size: 16px;
}

.help-content ul {
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.help-content li {
  margin: 4px 0;
}

.help-content kbd {
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
  color: #333;
}

/* 导出对话框样式 */
.export-dialog-content {
  padding: 10px 0;
}

.export-dialog-content .el-form-item {
  margin-bottom: 20px;
}

/* Iconify图标样式 */
.dropdown-icon {
  margin-right: 8px;
  font-size: 16px;
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
}

/* 移除所有按钮的圆角 */
.el-button,
.el-button-group .el-button {
  border-radius: 0 !important;
}

/* 颜色下拉菜单样式 */
.color-dropdown-content {
  padding: 16px;
  min-width: 300px;
}

.color-section {
  margin-bottom: 16px;
}

.color-section:last-child {
  margin-bottom: 0;
}

.color-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.el-button-group .el-button:first-child {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

.el-button-group .el-button:last-child {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

/* 下拉菜单样式优化 */
.el-dropdown-menu__item.is-active {
  background-color: #409eff;
  color: white;
}

.el-dropdown-menu__item.is-active .el-icon {
  color: white;
}

.el-dropdown-menu__item .el-icon {
  margin-right: 8px;
  color: #606266;
}

.el-dropdown-menu__item:hover .el-icon {
  color: #409eff;
}

/* ==================== 图片文字输入功能样式 ==================== */

.image-text-input-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  z-index: 999; /* 确保在浮动工具栏之下 */
}

.image-text-input-container {
  position: absolute;
  z-index: 1002;
  pointer-events: auto;
}

.image-text-input {
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #409eff;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  text-align: center;
  min-width: 120px;
  max-width: 200px;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
}

.image-text-input::placeholder {
  color: #999;
  font-weight: normal;
}

.image-text-input:focus {
  border-color: #66b1ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

/* ==================== 裁剪功能样式 ==================== */

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.crop-frame {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.1);
  cursor: move;
  box-sizing: border-box;
  overflow: hidden;
}

/* 不同形状的裁剪框样式 */
.crop-frame-circle {
  border-radius: 50%;
}

.crop-frame-ellipse {
  border-radius: 50%;
}

.crop-frame-rounded {
  border-radius: 20px;
}

.crop-frame-triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.crop-frame-diamond {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

.crop-frame-hexagon {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}

.crop-frame-octagon {
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
}

.crop-frame-pentagon {
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
}

.crop-frame-heart {
  clip-path: path('M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z');
}

.crop-frame-star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.crop-frame-cloud {
  clip-path: path('M24,16c0-4.4-3.6-8-8-8c-1.2,0-2.3,0.3-3.3,0.8C11.8,6.3,9.1,4,6,4C2.7,4,0,6.7,0,10c0,1.2,0.3,2.3,0.8,3.3C0.3,14.2,0,15.3,0,16.5C0,20.1,2.9,23,6.5,23H24c2.2,0,4-1.8,4-4S26.2,16,24,16z');
}

.crop-frame-flower {
  clip-path: path('M12,2c0,0,3,4,3,8s-3,8-3,8s-3-4-3-8S12,2,12,2z M12,2c0,0-3,4-3,8s3,8,3,8s3-4,3-8S12,2,12,2z M12,2c0,0,0,3,0,7s0,7,0,7s0-4,0-7S12,2,12,2z M12,2c0,0,0,-3,0,-7s0,-7,0,-7s0,4,0,7S12,2,12,2z');
}

.crop-frame-egg {
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
}

.crop-frame-parallelogram {
  clip-path: polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%);
}

.crop-frame-squircle {
  border-radius: 25%;
}

.crop-frame-stadium {
  border-radius: 50px;
}

.crop-frame-clover {
  clip-path: path('M12,2c0,0,3,4,3,8s-3,8-3,8s-3-4-3-8S12,2,12,2z M12,2c0,0-3,4-3,8s3,8,3,8s3-4,3-8S12,2,12,2z M12,2c0,0,0,3,0,7s0,7,0,7s0-4,0-7S12,2,12,2z M12,2c0,0,0,-3,0,-7s0,-7,0,-7s0,4,0,7S12,2,12,2z');
}

.crop-frame-wave {
  clip-path: path('M0,50 Q25,0 50,50 T100,50 V100 H0 Z');
}

.crop-frame-blob {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
}

.crop-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  border-radius: 50%;
  cursor: pointer;
}

.crop-handle-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.crop-handle-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.crop-handle-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.crop-handle-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.crop-handle-n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.crop-handle-s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.crop-handle-w {
  top: 50%;
  left: -4px;
  transform: translateY(-50%);
  cursor: w-resize;
}

.crop-handle-e {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.crop-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
}

.hint-text {
  white-space: nowrap;
}
</style>