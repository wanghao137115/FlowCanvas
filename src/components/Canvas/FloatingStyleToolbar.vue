<template>
  <div 
    v-if="visible && (selectedElement || selectedElements.length > 0 || isTextEditing)" 
    class="floating-toolbar"
    data-toolbar="true"
    :style="toolbarStyle"
    @mousedown.stop="handleToolbarMouseDown"
    @click.stop="handleToolbarClick"
  >
    <!-- 多选指示器 -->
    <div v-if="isMultiSelect" class="toolbar-group multi-select-indicator">
      <span class="multi-select-text">{{ selectedCount }} 个元素已选中</span>
    </div>

    <!-- 图片专用样式控制 -->
    <template v-if="isImageElement && !isTextEditing">
      <!-- 边框设置 -->
      <div class="toolbar-group">
        <el-select 
          v-model="imageStyles.borderWidth"
          @change="updateImageStyle"
          @click.stop
          @mousedown.stop
          size="small"
          style="width: 80px"
          title="边框宽度"
        >
          <el-option 
            v-for="width in [0, 1, 2, 3, 4, 5, 6, 8, 10]" 
            :key="width"
            :label="width === 0 ? '无' : `${width}px`"
            :value="width"
            @click.stop
            @mousedown.stop
          />
        </el-select>
        
        <el-color-picker 
          v-model="imageStyles.borderColor"
          @change="updateImageStyle"
          @click.stop
          @mousedown.stop
          size="small"
          title="边框颜色"
          :disabled="imageStyles.borderWidth === 0"
        />
        
        <el-select 
          v-model="imageStyles.borderStyle"
          @change="updateImageStyle"
          @click.stop
          @mousedown.stop
          size="small"
          style="width: 80px"
          title="边框样式"
          :disabled="imageStyles.borderWidth === 0"
        >
          <el-option 
            label="实线" 
            value="solid" 
            @click.stop
            @mousedown.stop
          />
          <el-option 
            label="虚线" 
            value="dashed" 
            @click.stop
            @mousedown.stop
          />
          <el-option 
            label="点线" 
            value="dotted" 
            @click.stop
            @mousedown.stop
          />
        </el-select>
      </div>

      <!-- 阴影设置 -->
      <div class="toolbar-group">
        <el-input-number 
          v-model="imageStyles.shadowX"
          @change="updateImageStyle"
          size="small"
          :min="-20"
          :max="20"
          style="width: 60px"
          title="X偏移"
        />
        <el-input-number 
          v-model="imageStyles.shadowY"
          @change="updateImageStyle"
          size="small"
          :min="-20"
          :max="20"
          style="width: 60px"
          title="Y偏移"
        />
        <el-input-number 
          v-model="imageStyles.shadowBlur"
          @change="updateImageStyle"
          size="small"
          :min="0"
          :max="20"
          style="width: 60px"
          title="模糊半径"
        />
        <el-color-picker 
          v-model="imageStyles.shadowColor"
          @change="updateImageStyle"
          @click.stop
          @mousedown.stop
          size="small"
          title="阴影颜色"
        />
      </div>

      <!-- 透明度和圆角 -->
      <div class="toolbar-group">
        <el-slider 
          v-model="imageStyles.opacity"
          @change="updateImageStyle"
          :min="0"
          :max="100"
          style="width: 100px"
          title="透明度"
        />
        <el-input-number 
          v-model="imageStyles.borderRadius"
          @change="updateImageStyle"
          size="small"
          :min="0"
          :max="100"
          style="width: 80px"
          title="圆角半径"
        />
      </div>

      <!-- 滤镜效果 -->
      <div class="toolbar-group">
        <el-select 
          v-model="imageStyles.filter"
          @change="updateImageStyle"
          @click.stop
          @mousedown.stop
          size="small"
          style="width: 100px"
          title="滤镜效果"
        >
          <el-option label="无滤镜" value="none" @click.stop @mousedown.stop />
          <el-option label="灰度" value="grayscale" @click.stop @mousedown.stop />
          <el-option label="复古" value="sepia" @click.stop @mousedown.stop />
          <el-option label="模糊" value="blur" @click.stop @mousedown.stop />
          <el-option label="亮度" value="brightness" @click.stop @mousedown.stop />
        </el-select>
      </div>

      <!-- 裁剪形状选择 -->
      <div class="toolbar-group">
        <el-popover
          placement="top"
          :width="400"
          trigger="click"
          title="选择裁剪形状"
        >
          <template #reference>
            <el-button 
              size="small"
              title="形状裁剪"
            >
              <Icon icon="mdi:shape" />
            </el-button>
          </template>
          <CropShapeSelector
            :selected-shape="imageStyles.cropShape"
            @shape-select="handleCropShapeSelect"
          />
        </el-popover>
      </div>

      <!-- 图片操作按钮 -->
      <div class="toolbar-group">
        <el-button 
          @click="cropImage"
          size="small"
          title="裁剪"
        >
          <Icon icon="mdi:crop" />
        </el-button>
        <el-button 
          @click="deleteElement"
          size="small"
          type="danger"
          title="删除"
        >
          <Icon icon="mdi:delete" />
        </el-button>
      </div>
    </template>
    
    <!-- 图片文字样式控制 -->
    <template v-if="isImageElement && hasTextOverlay && isTextEditing">
      <!-- 字体选择 -->
      <div class="toolbar-group">
        <el-select 
          v-model="imageTextStyles.fontFamily"
          @change="updateImageTextStyle"
          @click.stop="handleFontFamilyClick"
          @mousedown.stop="handleFontFamilyMouseDown"
          @focus.stop="handleFontFamilyClick"
          @blur.stop="handleFontFamilyClick"
          size="small"
          style="width: 120px"
          title="字体"
        >
          <el-option 
            v-for="font in fontFamilies" 
            :key="font.value"
            :label="font.label"
            :value="font.value"
            :style="{ fontFamily: font.value }"
            @click.stop
            @mousedown.stop
          />
        </el-select>
      </div>

      <!-- 字体大小 -->
      <div class="toolbar-group">
        <el-select 
          v-model="imageTextStyles.fontSize"
          @change="updateImageTextStyle"
          @click.stop="handleFontSizeClick"
          @mousedown.stop="handleFontSizeMouseDown"
          @focus.stop="handleFontSizeClick"
          @blur.stop="handleFontSizeClick"
          size="small"
          style="width: 80px"
          title="字体大小"
        >
          <el-option 
            v-for="size in fontSizes" 
            :key="size"
            :label="size"
            :value="size"
            @click.stop
            @mousedown.stop
          />
        </el-select>
      </div>

      <!-- 文本格式 -->
      <div class="toolbar-group">
        <el-button 
          :type="imageTextStyles.fontWeight === 'bold' ? 'primary' : 'default'"
          @click="toggleImageTextBold"
          size="small"
          title="粗体"
        >
          <Icon icon="mdi:format-bold" />
        </el-button>
        <el-button 
          :type="imageTextStyles.fontStyle === 'italic' ? 'primary' : 'default'"
          @click="toggleImageTextItalic"
          size="small"
          title="斜体"
        >
          <Icon icon="mdi:format-italic" />
        </el-button>
      </div>

      <!-- 文本对齐 -->
      <div class="toolbar-group">
        <el-button 
          :type="imageTextStyles.textAlign === 'left' ? 'primary' : 'default'"
          @click="setImageTextAlign('left')"
          size="small"
          title="左对齐"
        >
          <Icon icon="mdi:format-align-left" />
        </el-button>
        <el-button 
          :type="imageTextStyles.textAlign === 'center' ? 'primary' : 'default'"
          @click="setImageTextAlign('center')"
          size="small"
          title="居中对齐"
        >
          <Icon icon="mdi:format-align-center" />
        </el-button>
        <el-button 
          :type="imageTextStyles.textAlign === 'right' ? 'primary' : 'default'"
          @click="setImageTextAlign('right')"
          size="small"
          title="右对齐"
        >
          <Icon icon="mdi:format-align-right" />
        </el-button>
      </div>

      <!-- 文字颜色 -->
      <div class="toolbar-group">
        <el-color-picker 
          v-model="imageTextStyles.color"
          @change="updateImageTextStyle"
          @click.stop="handleColorPickerClick"
          @mousedown.stop="handleColorPickerClick"
          @focus.stop="handleColorPickerClick"
          @blur.stop="handleColorPickerClick"
          size="small"
          title="文字颜色"
        />
      </div>
    </template>

    <!-- 形状文字样式控制 -->
    <template v-if="selectedElement?.type === 'shape' && isShapeTextEditing">
      <!-- 字体选择 -->
      <div class="toolbar-group">
        <el-select 
          v-model="shapeTextStyles.fontFamily"
          @change="updateShapeTextStyle"
          @click.stop="handleFontFamilyClick"
          @mousedown.stop="handleFontFamilyMouseDown"
          @focus.stop="handleFontFamilyClick"
          @blur.stop="handleFontFamilyClick"
          size="small"
          style="width: 120px"
          title="字体"
        >
          <el-option 
            v-for="font in fontFamilies" 
            :key="font.value"
            :label="font.label"
            :value="font.value"
            :style="{ fontFamily: font.value }"
            @click.stop
            @mousedown.stop
          />
        </el-select>
      </div>

      <!-- 字体大小 -->
      <div class="toolbar-group">
        <el-select 
          v-model="shapeTextStyles.fontSize"
          @change="updateShapeTextStyle"
          @click.stop="handleFontSizeClick"
          @mousedown.stop="handleFontSizeMouseDown"
          @focus.stop="handleFontSizeClick"
          @blur.stop="handleFontSizeClick"
          size="small"
          style="width: 80px"
          title="字体大小"
        >
          <el-option 
            v-for="size in fontSizes" 
            :key="size"
            :label="size"
            :value="size"
            @click.stop
            @mousedown.stop
          />
        </el-select>
      </div>

      <!-- 文本格式 -->
      <div class="toolbar-group">
        <el-button 
          :type="shapeTextStyles.fontWeight === 'bold' ? 'primary' : 'default'"
          @click="toggleShapeTextBold"
          size="small"
          title="粗体"
        >
          <Icon icon="mdi:format-bold" />
        </el-button>
        <el-button 
          :type="shapeTextStyles.fontStyle === 'italic' ? 'primary' : 'default'"
          @click="toggleShapeTextItalic"
          size="small"
          title="斜体"
        >
          <Icon icon="mdi:format-italic" />
        </el-button>
        <el-button 
          :type="shapeTextStyles.textDecoration === 'underline' ? 'primary' : 'default'"
          @click="toggleShapeTextUnderline"
          size="small"
          title="下划线"
        >
          <Icon icon="mdi:format-underline" />
        </el-button>
      </div>

      <!-- 文本对齐 -->
      <div class="toolbar-group">
        <el-button 
          :type="shapeTextStyles.textAlign === 'left' ? 'primary' : 'default'"
          @click="setShapeTextAlign('left')"
          size="small"
          title="左对齐"
        >
          <Icon icon="mdi:format-align-left" />
        </el-button>
        <el-button 
          :type="shapeTextStyles.textAlign === 'center' ? 'primary' : 'default'"
          @click="setShapeTextAlign('center')"
          size="small"
          title="居中对齐"
        >
          <Icon icon="mdi:format-align-center" />
        </el-button>
        <el-button 
          :type="shapeTextStyles.textAlign === 'right' ? 'primary' : 'default'"
          @click="setShapeTextAlign('right')"
          size="small"
          title="右对齐"
        >
          <Icon icon="mdi:format-align-right" />
        </el-button>
      </div>

      <!-- 文字颜色 -->
      <div class="toolbar-group">
        <el-color-picker 
          v-model="shapeTextStyles.color"
          @change="updateShapeTextStyle"
          @click.stop="handleColorPickerClick"
          @mousedown.stop="handleColorPickerClick"
          @focus.stop="handleColorPickerClick"
          @blur.stop="handleColorPickerClick"
          size="small"
          title="文字颜色"
        />
      </div>
    </template>

    <!-- 字体选择 -->
    <div v-if="toolbarConfig.fontFamily && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-select 
        v-model="currentStyle.fontFamily"
        @change="updateStyle"
        @click.stop="handleFontFamilyClick"
        @mousedown.stop="handleFontFamilyMouseDown"
        size="small"
        style="width: 120px"
      >
        <el-option 
          v-for="font in fontFamilies" 
          :key="font.value"
          :label="font.label"
          :value="font.value"
          :style="{ fontFamily: font.value }"
          @click.stop
          @mousedown.stop
        />
      </el-select>
    </div>

    <!-- 字体大小 -->
    <div v-if="toolbarConfig.fontSize && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-select 
        v-model="currentStyle.fontSize"
        @change="updateStyle"
        @click.stop="handleFontSizeClick"
        @mousedown.stop="handleFontSizeMouseDown"
        size="small"
        style="width: 80px"
      >
        <el-option 
          v-for="size in fontSizes" 
          :key="size"
          :label="size"
          :value="size"
          @click.stop
          @mousedown.stop
        />
      </el-select>
    </div>

    <!-- 文本格式 -->
    <div v-if="(toolbarConfig.fontWeight || toolbarConfig.fontStyle || toolbarConfig.textDecoration) && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-button 
        v-if="toolbarConfig.fontWeight"
        :type="currentStyle.fontWeight === 'bold' ? 'primary' : 'default'"
        @click="toggleBold"
        size="small"
        title="粗体"
      >
        <Icon icon="mdi:format-bold" />
      </el-button>
      <el-button 
        v-if="toolbarConfig.fontStyle"
        :type="currentStyle.fontStyle === 'italic' ? 'primary' : 'default'"
        @click="toggleItalic"
        size="small"
        title="斜体"
      >
        <Icon icon="mdi:format-italic" />
      </el-button>
      <el-button 
        v-if="toolbarConfig.textDecoration"
        :type="currentStyle.textDecoration === 'underline' ? 'primary' : 'default'"
        @click="toggleUnderline"
        size="small"
        title="下划线"
      >
        <Icon icon="mdi:format-underline" />
      </el-button>
    </div>

    <!-- 文本对齐 -->
    <div v-if="toolbarConfig.textAlign && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-button 
        :type="currentStyle.textAlign === 'left' ? 'primary' : 'default'"
        @click="setTextAlign('left')"
        size="small"
        title="左对齐"
      >
        <Icon icon="mdi:format-align-left" />
      </el-button>
      <el-button 
        :type="currentStyle.textAlign === 'center' ? 'primary' : 'default'"
        @click="setTextAlign('center')"
        size="small"
        title="居中"
      >
        <Icon icon="mdi:format-align-center" />
      </el-button>
      <el-button 
        :type="currentStyle.textAlign === 'right' ? 'primary' : 'default'"
        @click="setTextAlign('right')"
        size="small"
        title="右对齐"
      >
        <Icon icon="mdi:format-align-right" />
      </el-button>
    </div>

    <!-- 颜色选择 -->
    <div v-if="(toolbarConfig.fill || toolbarConfig.stroke || toolbarConfig.textColor) && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <!-- 文本颜色 (仅文本元素显示) -->
      <el-dropdown 
        v-if="toolbarConfig.textColor"
        ref="textColorDropdownRef"
        trigger="click"
        placement="bottom"
        @command="handleTextColorCommand"
      >
        <el-button 
          :style="{ backgroundColor: currentStyle.fill }"
          size="small"
          title="文本颜色"
          class="color-button"
        >
          <Icon icon="mdi:format-color-text" />
        </el-button>
        <template #dropdown>
          <div class="color-dropdown">
            <div class="color-palette">
              <div 
                v-for="color in presetColors" 
                :key="`text-${color}`"
                :class="['color-item', { active: tempTextColor === color }]"
                :style="{ backgroundColor: color }"
                @click="selectTextColor(color)"
                :title="color"
              ></div>
            </div>
            <div class="color-actions">
              <el-button size="small" @click="confirmTextColor">确认</el-button>
              <el-button size="small" @click="cancelTextColor">取消</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>

      <!-- 填充颜色 (非文本元素显示) -->
      <el-dropdown 
        v-if="toolbarConfig.fill"
        ref="fillDropdownRef"
        trigger="click"
        placement="bottom"
        @command="handleFillColorCommand"
      >
        <el-button 
          :style="{ backgroundColor: currentStyle.fill }"
          size="small"
          title="填充颜色"
          class="color-button"
        >
          <Icon icon="mdi:format-color-fill" />
        </el-button>
        <template #dropdown>
          <div class="color-dropdown">
            <div class="color-palette">
              <div 
                v-for="color in presetColors" 
                :key="`fill-${color}`"
                :class="['color-item', { active: tempFillColor === color }]"
                :style="{ backgroundColor: color }"
                @click="selectFillColor(color)"
                :title="color"
              ></div>
            </div>
            <div class="color-actions">
              <el-button size="small" @click="confirmFillColor">确认</el-button>
              <el-button size="small" @click="cancelFillColor">取消</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
      
      <!-- 边框颜色 (非文本元素显示) -->
      <el-dropdown 
        v-if="toolbarConfig.stroke"
        ref="strokeDropdownRef"
        trigger="click"
        placement="bottom"
        @command="handleStrokeColorCommand"
      >
        <el-button 
          :style="{ backgroundColor: currentStyle.stroke }"
          size="small"
          title="边框颜色"
          class="color-button"
        >
          <Icon icon="mdi:format-color-text" />
        </el-button>
        <template #dropdown>
          <div class="color-dropdown">
            <div class="color-palette">
              <div 
                v-for="color in presetColors" 
                :key="`stroke-${color}`"
                :class="['color-item', { active: tempStrokeColor === color }]"
                :style="{ backgroundColor: color }"
                @click="selectStrokeColor(color)"
                :title="color"
              ></div>
            </div>
            <div class="color-actions">
              <el-button size="small" @click="confirmStrokeColor">确认</el-button>
              <el-button size="small" @click="cancelStrokeColor">取消</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>

    <!-- 线条样式 -->
    <div v-if="(toolbarConfig.strokeWidth || toolbarConfig.lineStyle) && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-select 
        v-if="toolbarConfig.strokeWidth"
        v-model="currentStyle.strokeWidth"
        @change="updateStyle"
        @click.stop
        @mousedown.stop
        size="small"
        style="width: 80px"
        title="线条粗细"
      >
        <el-option 
          v-for="width in strokeWidths" 
          :key="width"
          :label="width"
          :value="width"
          @click.stop
          @mousedown.stop
        />
      </el-select>
      <el-select 
        v-if="toolbarConfig.lineStyle"
        v-model="currentStyle.lineStyle"
        @change="updateStyle"
        @click.stop
        @mousedown.stop
        size="small"
        style="width: 100px"
        title="线条样式"
      >
        <el-option 
          v-for="style in lineStyles" 
          :key="style.value"
          :label="style.label"
          :value="style.value"
          @click.stop
          @mousedown.stop
        />
      </el-select>
    </div>

    <!-- 样式刷 -->
    <div v-if="toolbarConfig.styleBrush && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-button 
        :type="styleBrushActive ? 'primary' : 'default'"
        @click="toggleStyleBrush"
        size="small"
        title="样式刷"
      >
        <Icon icon="mdi:format-paint" />
      </el-button>
    </div>

    <!-- 层级操作 -->
    <div v-if="toolbarConfig.layer && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-button 
        @click="bringToFront"
        size="small"
        title="置于顶层"
      >
        <Icon icon="mdi:arrow-up-bold" />
      </el-button>
      <el-button 
        @click="sendToBack"
        size="small"
        title="置于底层"
      >
        <Icon icon="mdi:arrow-down-bold" />
      </el-button>
    </div>

    <!-- 图层操作按钮 -->
    <div v-if="toolbarConfig.layer && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-dropdown @command="handleLayerCommand" trigger="click">
        <el-button size="small" title="图层操作">
          <Icon icon="mdi:layers" />
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="moveToTop">
              <Icon icon="mdi:arrow-up-bold" />
              置顶
            </el-dropdown-item>
            <el-dropdown-item command="moveUp">
              <Icon icon="mdi:arrow-up" />
              上移
            </el-dropdown-item>
            <el-dropdown-item command="moveDown">
              <Icon icon="mdi:arrow-down" />
              下移
            </el-dropdown-item>
            <el-dropdown-item command="moveToBottom">
              <Icon icon="mdi:arrow-down-bold" />
              置底
            </el-dropdown-item>
            <el-dropdown-item divided command="moveToLayer">
              <Icon icon="mdi:layers" />
              移动到图层
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 删除按钮 -->
    <div v-if="toolbarConfig.delete && !isImageElement && !isShapeTextEditing" class="toolbar-group">
      <el-button 
        @click="deleteElement"
        size="small"
        type="danger"
        title="删除"
      >
        <Icon icon="mdi:delete" />
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { ArrowDown } from '@element-plus/icons-vue'
import type { ElementStyle, CanvasElement } from '@/types/canvas.types'
import CropShapeSelector from '../CropShapeSelector.vue'

interface FloatingStyleToolbarProps {
  visible: boolean
  selectedElement: CanvasElement | null
  selectedElements?: CanvasElement[] // 多选状态
  position: { x: number; y: number }
  isEditingText?: boolean
  isTextEditing?: boolean // 图片文字编辑状态
  isShapeTextEditing?: boolean // 形状文字编辑状态
  isImageElement?: boolean // 是否为图片元素
  hasTextOverlay?: boolean // 是否有文字叠加
  toolbarConfig?: {
    fontFamily?: boolean
    fontSize?: boolean
    fontWeight?: boolean
    fontStyle?: boolean
    textDecoration?: boolean
    textAlign?: boolean
    textColor?: boolean
    fill?: boolean
    stroke?: boolean
    strokeWidth?: boolean
    lineStyle?: boolean
    styleBrush?: boolean
    layer?: boolean
    delete?: boolean
  }
}

interface FloatingStyleToolbarEmits {
  (e: 'update:style', style: Partial<ElementStyle>): void
  (e: 'update:image-data', imageData: any): void
  (e: 'delete:element'): void
  (e: 'bring:to-front'): void
  (e: 'send:to-back'): void
  (e: 'open:color-picker', type: 'fill' | 'stroke'): void
  (e: 'toggle:style-brush'): void
  (e: 'layer:moveToTop'): void
  (e: 'layer:moveUp'): void
  (e: 'layer:moveDown'): void
  (e: 'layer:moveToBottom'): void
  (e: 'layer:moveToLayer'): void
  (e: 'update:text-tool-settings', style: Partial<ElementStyle>): void
  (e: 'crop:image', imageId: string): void
  (e: 'crop:image-with-shape', data: { imageId: string, shape: string }): void
  (e: 'update:shape-text-input-style', style: Partial<any>): void
  (e: 'toolbar-interaction'): void
  (e: 'crop:set-shape', shape: string): void
  (e: 'enterTextEditMode'): void
}

const props = withDefaults(defineProps<FloatingStyleToolbarProps>(), {
  selectedElements: () => [],
  toolbarConfig: () => ({
    fontFamily: true,
    fontSize: true,
    fontWeight: true,
    fontStyle: true,
    textDecoration: true,
    textAlign: true,
    textColor: false,
    fill: true,
    stroke: true,
    strokeWidth: true,
    lineStyle: true,
    styleBrush: true,
    layer: true,
    delete: true
  })
})

const emit = defineEmits<FloatingStyleToolbarEmits>()

// 响应式数据
const styleBrushActive = ref(false)
const tempFillColor = ref('#000000')
const tempStrokeColor = ref('#000000')
const tempTextColor = ref('#000000')
const fillDropdownRef = ref()
const strokeDropdownRef = ref()
const textColorDropdownRef = ref()

// 每个元素的临时颜色状态
const elementTempColors = ref<Map<string, { fill: string; stroke: string }>>(new Map())

// 当前样式
const currentStyle = ref<ElementStyle>({
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
})

// 多选状态计算属性
const isMultiSelect = computed(() => props.selectedElements && props.selectedElements.length > 1)
const selectedCount = computed(() => props.selectedElements?.length || 0)

// 图片检测
const isImageElement = computed(() => {
  if (props.selectedElement) {
    return props.selectedElement.type === 'image'
  }
  return false
})

// 检查图片是否有文字叠加
const hasTextOverlay = computed(() => {
  if (!props.selectedElement || props.selectedElement.type !== 'image') {
    return false
  }
  const imageElement = props.selectedElement as any
  return imageElement.data?.overlayText && imageElement.data.overlayText.visible
})

// 图片样式数据
const imageStyles = ref({
  borderWidth: 0,
  borderColor: '#000000',
  borderStyle: 'solid',
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowColor: '#000000',
  opacity: 100,
  borderRadius: 0,
  filter: 'none',
  cropShape: 'rectangle'
})

// 图片文字样式数据
const imageTextStyles = ref({
  fontSize: 48,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold',
  fontStyle: 'normal',
  color: '#ffffff',
  textAlign: 'center' as 'left' | 'center' | 'right'
})

// 形状文字样式数据
const shapeTextStyles = ref({
  fontSize: 16,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  textAlign: 'center' as 'left' | 'center' | 'right',
  textDecoration: 'none' as 'none' | 'underline' | 'line-through'
})

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

const fontSizes = ref([8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72])

const strokeWidths = ref([1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20])

const lineStyles = ref([
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' }
])

// 预设颜色
const presetColors = ref([
  '#FF0000', // 红色
  '#00FF00', // 绿色
  '#0000FF', // 蓝色
  '#FFFF00', // 黄色
  '#FF00FF', // 洋红
  '#00FFFF', // 青色
  '#000000', // 黑色
  '#FFFFFF', // 白色
  '#808080', // 灰色
  '#FFA500', // 橙色
  '#800080', // 紫色
  '#008000', // 深绿
  '#FFC0CB', // 粉色
  '#A52A2A', // 棕色
  '#000080', // 深蓝
  '#808000'  // 橄榄色
])

// 工具栏样式
const toolbarStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
  transform: 'translateX(-50%)' // 水平居中对齐
}))

// 防止循环更新的标志
let isUpdatingStyle = false
let updateTimeout: ReturnType<typeof setTimeout> | null = null
let lastUpdateTime = 0

// 检查是否在编辑文本
function isEditingText(): boolean {
  // 使用传入的 isEditingText prop
  return props.isEditingText || false
}

// 实时更新文本工具设置
function updateTextToolSettings(style: Partial<ElementStyle>) {
  // 这里需要调用画布引擎的方法来更新文本工具的设置
  // 暂时通过emit事件通知父组件
  emit('update:text-tool-settings', style)
}

// 调试函数
function handleFontFamilyClick(event: Event) {
  event.stopPropagation()
  
  // 如果正在文字编辑模式，不要重新进入编辑模式
  if (props.isTextEditing) {
    return
  }
  
  // 只有在非编辑模式下才考虑进入编辑模式
  if (props.isImageElement && props.hasTextOverlay) {
    // 通知父组件进入文字编辑模式
    emit('enterTextEditMode')
  } else {
  }
}

function handleFontFamilyMouseDown(event: Event) {
  event.stopPropagation()
  
  // 如果正在文字编辑模式，不要重新进入编辑模式
  if (props.isTextEditing) {
    return
  }
  
  // 只有在非编辑模式下才考虑进入编辑模式
  if (props.isImageElement && props.hasTextOverlay) {
    // 通知父组件进入文字编辑模式
    emit('enterTextEditMode')
  } else {
  }
}

function handleFontSizeClick(event: Event) {
  event.stopPropagation()
  
  // 如果正在文字编辑模式，不要重新进入编辑模式
  if (props.isTextEditing) {
    return
  }
  
  // 只有在非编辑模式下才考虑进入编辑模式
  if (props.isImageElement && props.hasTextOverlay) {
    // 通知父组件进入文字编辑模式
    emit('enterTextEditMode')
  } else {
  }
}

function handleFontSizeMouseDown(event: Event) {
  event.stopPropagation()
  
  // 如果正在文字编辑模式，不要重新进入编辑模式
  if (props.isTextEditing) {
    return
  }
  
  // 只有在非编辑模式下才考虑进入编辑模式
  if (props.isImageElement && props.hasTextOverlay) {
    // 通知父组件进入文字编辑模式
    emit('enterTextEditMode')
  } else {
  }
}

function handleFontWeightClick(event: Event) {
  event.stopPropagation()
}

function handleColorPickerClick(event: Event) {
  event.stopPropagation()
}

// 更新样式
function updateStyle() {
  const now = Date.now()
  
  // 如果距离上次更新不到 50ms，跳过这次更新
  if (now - lastUpdateTime < 50) {
    return
  }
  
  if (isUpdatingStyle) {
    return
  }
  isUpdatingStyle = true
  lastUpdateTime = now
  
  // 清除之前的超时
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  // 如果正在编辑文本，实时更新文本工具设置
  if (isEditingText()) {
    updateTextToolSettings(currentStyle.value)
  }
  
  emit('update:style', currentStyle.value)
  
  // 使用更长的延迟来确保更新完成
  updateTimeout = setTimeout(() => {
    isUpdatingStyle = false
    updateTimeout = null
  }, 150)
}

// 文本格式切换
function toggleBold() {
  const newStyle = { 
    ...currentStyle.value, 
    fontWeight: currentStyle.value.fontWeight === 'bold' ? 'normal' : 'bold' 
  }
  currentStyle.value = newStyle
  updateStyle()
}

function toggleItalic() {
  const newStyle = { 
    ...currentStyle.value, 
    fontStyle: currentStyle.value.fontStyle === 'italic' ? 'normal' : 'italic' 
  }
  currentStyle.value = newStyle
  updateStyle()
}

function toggleUnderline() {
  const newStyle = { 
    ...currentStyle.value, 
    textDecoration: currentStyle.value.textDecoration === 'underline' ? 'none' : 'underline' 
  }
  currentStyle.value = newStyle
  updateStyle()
}

// 文本对齐
function setTextAlign(align: 'left' | 'center' | 'right') {
  const newStyle = { ...currentStyle.value, textAlign: align }
  currentStyle.value = newStyle
  updateStyle()
}

// 获取当前元素的临时颜色
function getCurrentElementTempColors() {
  if (!props.selectedElement) return { fill: '#000000', stroke: '#000000' }
  
  const elementId = props.selectedElement.id
  if (!elementTempColors.value.has(elementId)) {
    elementTempColors.value.set(elementId, {
      fill: currentStyle.value.fill || '#000000',
      stroke: currentStyle.value.stroke || '#000000'
    })
  }
  return elementTempColors.value.get(elementId)!
}

// 处理填充颜色下拉框命令
function handleFillColorCommand() {
  const tempColors = getCurrentElementTempColors()
  tempFillColor.value = tempColors.fill
}

// 处理边框颜色下拉框命令
function handleStrokeColorCommand() {
  const tempColors = getCurrentElementTempColors()
  tempStrokeColor.value = tempColors.stroke
}

// 选择填充颜色
function selectFillColor(color: string) {
  tempFillColor.value = color
  
  // 创建新的样式对象，避免直接修改响应式对象
  const newStyle = { ...currentStyle.value, fill: color }
  currentStyle.value = newStyle
  updateStyle()
  
  if (props.selectedElement) {
    const elementId = props.selectedElement.id
    if (!elementTempColors.value.has(elementId)) {
      elementTempColors.value.set(elementId, { fill: color, stroke: '#000000' })
    } else {
      elementTempColors.value.get(elementId)!.fill = color
    }
  }
}

// 选择边框颜色
function selectStrokeColor(color: string) {
  tempStrokeColor.value = color
  
  // 创建新的样式对象，避免直接修改响应式对象
  const newStyle = { ...currentStyle.value, stroke: color }
  currentStyle.value = newStyle
  updateStyle()
  
  if (props.selectedElement) {
    const elementId = props.selectedElement.id
    if (!elementTempColors.value.has(elementId)) {
      elementTempColors.value.set(elementId, { fill: '#000000', stroke: color })
    } else {
      elementTempColors.value.get(elementId)!.stroke = color
    }
  }
}

// 确认填充颜色
function confirmFillColor() {
  const newStyle = { ...currentStyle.value, fill: tempFillColor.value }
  currentStyle.value = newStyle
  updateStyle()
  // 关闭下拉框
  if (fillDropdownRef.value) {
    fillDropdownRef.value.handleClose()
  }
}

// 取消填充颜色
function cancelFillColor() {
  tempFillColor.value = currentStyle.value.fill || '#000000'
  // 关闭下拉框
  if (fillDropdownRef.value) {
    fillDropdownRef.value.handleClose()
  }
}

// 确认边框颜色
function confirmStrokeColor() {
  const newStyle = { ...currentStyle.value, stroke: tempStrokeColor.value }
  currentStyle.value = newStyle
  updateStyle()
  // 关闭下拉框
  if (strokeDropdownRef.value) {
    strokeDropdownRef.value.handleClose()
  }
}

// 取消边框颜色
function cancelStrokeColor() {
  tempStrokeColor.value = currentStyle.value.stroke || '#000000'
  // 关闭下拉框
  if (strokeDropdownRef.value) {
    strokeDropdownRef.value.handleClose()
  }
}

// 处理文本颜色下拉框命令
function handleTextColorCommand() {
  tempTextColor.value = currentStyle.value.fill || '#000000'
}

// 选择文本颜色
function selectTextColor(color: string) {
  tempTextColor.value = color
  
  // 创建新的样式对象，避免直接修改响应式对象
  const newStyle = { ...currentStyle.value, fill: color }
  currentStyle.value = newStyle
  updateStyle()
}

// 确认文本颜色
function confirmTextColor() {
  const newStyle = { ...currentStyle.value, fill: tempTextColor.value }
  currentStyle.value = newStyle
  updateStyle()
  // 关闭下拉框
  if (textColorDropdownRef.value) {
    textColorDropdownRef.value.handleClose()
  }
}

// 取消文本颜色
function cancelTextColor() {
  tempTextColor.value = currentStyle.value.fill || '#000000'
  // 关闭下拉框
  if (textColorDropdownRef.value) {
    textColorDropdownRef.value.handleClose()
  }
}

// 样式刷
function toggleStyleBrush() {
  styleBrushActive.value = !styleBrushActive.value
  emit('toggle:style-brush')
}

// 重置样式刷
function resetStyleBrush() {
  styleBrushActive.value = false
}

// 层级操作
function bringToFront() {
  emit('bring:to-front')
}

function sendToBack() {
  emit('send:to-back')
}

// 处理图层命令
function handleLayerCommand(command: string) {
  switch (command) {
    case 'moveToTop':
      emit('layer:moveToTop')
      break
    case 'moveUp':
      emit('layer:moveUp')
      break
    case 'moveDown':
      emit('layer:moveDown')
      break
    case 'moveToBottom':
      emit('layer:moveToBottom')
      break
    case 'moveToLayer':
      emit('layer:moveToLayer')
      break
  }
}

// 删除元素
function deleteElement() {
  emit('delete:element')
}

// 更新图片样式
function updateImageStyle() {
  if (!props.selectedElement) return
  
  // 图片专用样式存储到 data 属性
  const imageDataStyle = {
    border: {
      width: imageStyles.value.borderWidth,
      color: imageStyles.value.borderColor,
      style: imageStyles.value.borderStyle
    },
    shadow: {
      x: imageStyles.value.shadowX,
      y: imageStyles.value.shadowY,
      blur: imageStyles.value.shadowBlur,
      color: imageStyles.value.shadowColor
    },
    borderRadius: imageStyles.value.borderRadius,
    filter: imageStyles.value.filter,
    cropShape: imageStyles.value.cropShape
  }
  
  // 通用样式存储到 style 属性
  const imageStyle = {
    opacity: imageStyles.value.opacity / 100
  }
  
  // 发送图片数据更新事件
  emit('update:image-data', imageDataStyle)
  // 发送样式更新事件
  emit('update:style', imageStyle)
}

// 裁剪图片
function cropImage() {
  if (!props.selectedElement) return
  emit('crop:image', props.selectedElement.id)
}

// 处理裁剪形状选择
function handleCropShapeSelect(shape: string) {
  if (!props.selectedElement || props.selectedElement.type !== 'image') {
    return
  }
  
  // 设置裁剪形状
  imageStyles.value.cropShape = shape
  
  // 直接启动带形状的裁剪
  emit('crop:image-with-shape', { 
    imageId: props.selectedElement.id, 
    shape: shape 
  })
}

// 监听选中元素变化
watch(() => props.selectedElement, (newElement) => {
  if (newElement && newElement.style) {
    // 防止循环更新
    if (isUpdatingStyle) {
      return
    }
    
    currentStyle.value = { ...newElement.style }
    
    // 如果是图片元素，初始化图片样式
    if (newElement.type === 'image') {
      // 从 data 属性读取图片专用样式
      const imageData = newElement.data || {}
      imageStyles.value = {
        borderWidth: imageData.border?.width || 0,
        borderColor: imageData.border?.color || '#000000',
        borderStyle: imageData.border?.style || 'solid',
        shadowX: imageData.shadow?.x || 0,
        shadowY: imageData.shadow?.y || 0,
        shadowBlur: imageData.shadow?.blur || 0,
        shadowColor: imageData.shadow?.color || '#000000',
        opacity: Math.round((newElement.style.opacity || 1) * 100),
        borderRadius: imageData.borderRadius || 0,
        filter: imageData.filter || 'none',
        cropShape: imageData.cropShape || 'rectangle'
      }
    }
    
    // 更新临时颜色为当前元素的颜色
    const tempColors = getCurrentElementTempColors()
    tempFillColor.value = tempColors.fill
    tempStrokeColor.value = tempColors.stroke
  }
}, { immediate: true })

// 图片文字样式更新方法
function updateImageTextStyle() {
  if (!props.selectedElement || props.selectedElement.type !== 'image') return
  
  const imageElement = props.selectedElement as any
  const overlayText = imageElement.data?.overlayText
  
  if (!overlayText) return
  
  // 更新文字样式
  const updatedOverlayText = {
    ...overlayText,
    fontSize: imageTextStyles.value.fontSize,
    fontFamily: imageTextStyles.value.fontFamily,
    fontWeight: imageTextStyles.value.fontWeight,
    fontStyle: imageTextStyles.value.fontStyle,
    color: imageTextStyles.value.color,
    textAlign: imageTextStyles.value.textAlign
  }
  
  // 创建更新后的图片元素数据
  const updatedImageData = {
    ...imageElement.data,
    overlayText: updatedOverlayText
  }
  
  // 发送更新事件
  emit('update:image-data', updatedImageData)
}

// 图片文字粗体切换
function toggleImageTextBold() {
  imageTextStyles.value.fontWeight = imageTextStyles.value.fontWeight === 'bold' ? 'normal' : 'bold'
  updateImageTextStyle()
}

// 图片文字斜体切换
function toggleImageTextItalic() {
  imageTextStyles.value.fontStyle = imageTextStyles.value.fontStyle === 'italic' ? 'normal' : 'italic'
  updateImageTextStyle()
}

// 设置图片文字对齐
function setImageTextAlign(align: 'left' | 'center' | 'right') {
  imageTextStyles.value.textAlign = align
  updateImageTextStyle()
}

// ==================== 形状文字样式控制方法 ====================

// 更新形状文字样式（只更新输入框样式，不更新形状元素）
function updateShapeTextStyle() {
  console.log('🎨 浮动工具栏更新形状文字样式')
  console.log('🎨 选中元素:', props.selectedElement)
  console.log('🎨 形状文字样式:', shapeTextStyles.value)
  
  if (!props.selectedElement || props.selectedElement.type !== 'shape') {
    console.log('🎨 没有选中形状元素，跳过样式更新')
    return
  }
  
  // 构建样式更新对象
  const styleUpdates = {
    fontSize: shapeTextStyles.value.fontSize,
    fontFamily: shapeTextStyles.value.fontFamily,
    fontWeight: shapeTextStyles.value.fontWeight,
    fontStyle: shapeTextStyles.value.fontStyle,
    color: shapeTextStyles.value.color,
    textAlign: shapeTextStyles.value.textAlign,
    textDecoration: shapeTextStyles.value.textDecoration
  }
  
  console.log('🎨 发送样式更新事件:', styleUpdates)
  // 发送更新输入框样式的事件
  emit('update:shape-text-input-style', styleUpdates)
}

// 形状文字粗体切换
function toggleShapeTextBold() {
  shapeTextStyles.value.fontWeight = shapeTextStyles.value.fontWeight === 'bold' ? 'normal' : 'bold'
  updateShapeTextStyle()
}

// 形状文字斜体切换
function toggleShapeTextItalic() {
  shapeTextStyles.value.fontStyle = shapeTextStyles.value.fontStyle === 'italic' ? 'normal' : 'italic'
  updateShapeTextStyle()
}

// 形状文字下划线切换
function toggleShapeTextUnderline() {
  shapeTextStyles.value.textDecoration = shapeTextStyles.value.textDecoration === 'underline' ? 'none' : 'underline'
  updateShapeTextStyle()
}

// 设置形状文字对齐
function setShapeTextAlign(align: 'left' | 'center' | 'right') {
  shapeTextStyles.value.textAlign = align
  updateShapeTextStyle()
}

// 监听选中元素变化，同步文字样式
watch(() => props.selectedElement, (newElement) => {
  if (newElement && newElement.type === 'image') {
    const imageElement = newElement as any
    const overlayText = imageElement.data?.overlayText
    
    if (overlayText) {
      // 同步图片文字样式到工具栏
      imageTextStyles.value = {
        fontSize: overlayText.fontSize || 48,
        fontFamily: overlayText.fontFamily || 'Arial, sans-serif',
        fontWeight: overlayText.fontWeight || 'bold',
        fontStyle: overlayText.fontStyle || 'normal',
        color: overlayText.color || '#ffffff',
        textAlign: overlayText.textAlign || 'center'
      }
    }
  } else if (newElement && newElement.type === 'shape') {
    const shapeElement = newElement as any
    const textStyle = shapeElement.data?.textStyle
    
    if (textStyle) {
      // 同步形状文字样式到工具栏
      shapeTextStyles.value = {
        fontSize: textStyle.fontSize || 16,
        fontFamily: textStyle.fontFamily || 'Arial, sans-serif',
        fontWeight: textStyle.fontWeight || 'normal',
        fontStyle: textStyle.fontStyle || 'normal',
        color: textStyle.color || '#000000',
        textAlign: textStyle.textAlign || 'center',
        textDecoration: textStyle.textDecoration || 'none'
      }
    }
  }
}, { immediate: true })

// 处理浮动工具栏点击事件
function handleToolbarClick(event: MouseEvent) {
  // 完全阻止事件冒泡，防止触发画布点击事件
  event.stopPropagation()
  event.preventDefault()
  
  // 如果正在文字编辑模式，不要退出编辑状态
  if (props.isTextEditing || props.isShapeTextEditing) {
    // 检查是否点击了下拉框（只有下拉框才需要阻止退出编辑状态）
    const target = event.target as HTMLElement
    const isDropdown = target.closest('.el-select') || 
                      target.closest('.el-select-dropdown') ||
                      target.closest('.el-popper')
    
    // 只在形状文字编辑模式下且点击了下拉框时才通知工具栏交互
    if (props.isShapeTextEditing && isDropdown) {
      emit('toolbar-interaction')
    }
    return
  }
  
  // 通知父组件工具栏有交互（非编辑模式）
  emit('toolbar-interaction')
  
  // 如果点击的是图片文字相关的工具栏，确保进入文字编辑状态
  if (props.isImageElement && props.hasTextOverlay) {
    // 通知父组件进入文字编辑模式
    emit('enterTextEditMode')
  } else {
  }
}

// 处理浮动工具栏鼠标按下事件
function handleToolbarMouseDown(event: MouseEvent) {
  
  // 完全阻止事件传播，防止触发画布的点击事件
  event.stopPropagation()
  event.preventDefault()
  
  // 如果正在文字编辑模式，不要退出编辑状态
  if (props.isTextEditing) {
    return
  }
}

// 暴露方法给父组件
defineExpose({
  resetStyleBrush
})
</script>

<style scoped>
.floating-toolbar {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1001; /* 确保在文字输入覆盖层之上 */
  min-width: 200px;
  max-width: 600px;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
  border-right: 1px solid #f0f0f0;
}

.toolbar-group:last-child {
  border-right: none;
}

.color-button {
  width: 32px;
  height: 32px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 确保颜色按钮没有多余的伪元素 */
.color-button::before,
.color-button::after {
  display: none;
}

.color-dropdown {
  padding: 12px;
  min-width: 200px;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.color-item {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.color-item:hover {
  transform: scale(1.1);
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-item.active {
  border-color: #409eff;
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.color-item.active::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}

.color-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.el-button {
  border-radius: 4px;
  transition: all 0.2s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.el-select {
  border-radius: 4px;
}

.el-select .el-input__inner {
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  transition: all 0.2s ease;
}

.el-select .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.el-option {
  padding: 8px 12px;
  font-size: 14px;
}

.el-option:hover {
  background-color: #f5f7fa;
}

.el-option.selected {
  background-color: #409eff;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-toolbar {
    flex-direction: column;
    align-items: stretch;
    min-width: 150px;
  }
  
  .toolbar-group {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding: 4px 0;
    justify-content: center;
  }
  
  .toolbar-group:last-child {
    border-bottom: none;
  }
}

/* 移除动画效果 - 直接显示 */

/* 工具提示样式 - 统一放在按钮上方 */
.el-button[title],
.el-dropdown[title] {
  position: relative;
}

.el-button[title]:hover::after,
.el-dropdown[title]:hover::after {
  content: attr(title);
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1001;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* .el-button[title]:hover::before,
.el-dropdown[title]:hover::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
  z-index: 1001;
  pointer-events: none;
} */

/* 选中状态样式 */
.el-button.is-active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

/* 多选指示器样式 */
.multi-select-indicator {
  background-color: #007ACC;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
}

.multi-select-text {
  white-space: nowrap;
}

/* 危险操作样式 */
.el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.el-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}
</style>