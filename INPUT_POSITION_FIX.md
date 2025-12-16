# 形状文字输入框位置居中修复

## 问题描述
形状文字输入框的位置没有正确居中显示在形状元素的中心位置。

## 问题原因
1. **坐标计算不准确**：之前的代码使用固定的偏移量（-100px, -20px），没有考虑输入框的实际尺寸
2. **缺少居中计算**：没有正确计算输入框相对于形状中心的居中位置
3. **视口变化未处理**：当用户缩放或平移画布时，输入框位置不会更新

## 修复方案

### 1. 改进坐标计算逻辑
```typescript
// 设置输入框位置（在形状中心）
const shapeCenter = {
  x: shapeElement.position.x + shapeElement.size.x / 2,
  y: shapeElement.position.y + shapeElement.size.y / 2
}

const screenPos = this.viewportManager.getCoordinateTransformer().virtualToScreen(shapeCenter)

// 输入框尺寸
const inputWidth = 200
const inputHeight = 40

// 计算居中位置
const inputLeft = screenPos.x - inputWidth / 2
const inputTop = screenPos.y - inputHeight / 2
```

### 2. 添加位置更新方法
```typescript
updateShapeTextInputPosition(): void {
  if (!this.isEditingShapeText || !this.editingShapeElement || !this.shapeTextInput) {
    return
  }

  const shapeElement = this.editingShapeElement
  const shapeCenter = {
    x: shapeElement.position.x + shapeElement.size.x / 2,
    y: shapeElement.position.y + shapeElement.size.y / 2
  }
  
  const screenPos = this.viewportManager.getCoordinateTransformer().virtualToScreen(shapeCenter)
  
  // 输入框尺寸
  const inputWidth = 200
  const inputHeight = 40
  
  // 计算居中位置
  const inputLeft = screenPos.x - inputWidth / 2
  const inputTop = screenPos.y - inputHeight / 2
  
  this.shapeTextInput.style.left = `${inputLeft}px`
  this.shapeTextInput.style.top = `${inputTop}px`
}
```

### 3. 视口变化时自动更新位置
在 `syncViewport` 方法中添加输入框位置更新：
```typescript
// 更新输入框位置（如果正在编辑形状文字）
this.updateShapeTextInputPosition()
```

## 修复效果

### ✅ 修复前
- 输入框位置固定偏移，不居中
- 缩放或平移时位置不正确
- 不同形状尺寸下位置不准确

### ✅ 修复后
- 输入框精确居中在形状中心
- 支持视口缩放和平移
- 适应不同形状尺寸
- 实时位置更新

## 调试信息

添加了详细的位置计算调试信息：
```typescript
console.log('📍 输入框位置计算:', {
  shapeCenter,
  screenPos,
  inputLeft,
  inputTop,
  inputWidth,
  inputHeight
})
```

## 测试建议

1. **基本居中测试**
   - 创建不同尺寸的形状（小矩形、大圆形等）
   - 双击进入文字编辑模式
   - 验证输入框是否居中显示

2. **视口变化测试**
   - 在编辑模式下缩放画布
   - 在编辑模式下平移画布
   - 验证输入框是否跟随形状移动

3. **不同形状测试**
   - 测试矩形、圆形、三角形等不同形状
   - 验证输入框在各种形状下都能正确居中

现在输入框应该能够精确居中显示在形状元素的中心位置了！
