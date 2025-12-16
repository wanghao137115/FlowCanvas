# 双击形状文字编辑问题修复

## 问题描述
双击形状元素后，输入框会出现一下然后瞬间消失，无法正常进行文字编辑。

## 问题原因分析

### 1. 事件处理冲突
双击检测后，代码会继续执行其他逻辑，包括：
- 选择工具的处理
- 画布重新渲染
- 其他鼠标事件处理

### 2. 渲染干扰
`requestRender()` 和 `render()` 方法在编辑过程中被频繁调用，导致输入框被清除。

### 3. 事件冒泡
输入框的事件没有完全阻止冒泡，导致画布事件干扰输入框。

## 修复方案

### 1. 添加返回语句
在双击检测后添加 `return` 语句，阻止继续执行其他逻辑：

```typescript
if (isDoubleClick && clickedElement.type === 'text') {
  // 双击文本元素，触发文本编辑
  const textTool = this.toolManager.getTool(ToolType.TEXT) as any
  if (textTool) {
    textTool.onMouseDown(toolEvent)
  }
  return // 阻止继续执行其他逻辑
} else if (isDoubleClick && clickedElement.type === 'shape') {
  // 双击形状元素，触发形状文字编辑
  this.startShapeTextEdit(clickedElement, toolEvent)
  return // 阻止继续执行其他逻辑
}
```

### 2. 条件渲染
在编辑形状文字时跳过重新渲染：

```typescript
// 重新渲染（如果不在编辑形状文字模式）
if (!this.isEditingShapeText) {
  this.render()
}
```

### 3. 修改 requestRender 方法
在 `requestRender()` 方法中添加编辑状态检查：

```typescript
requestRender(): void {
  // 如果正在编辑形状文字，跳过渲染以避免干扰输入框
  if (this.isEditingShapeText) {
    return
  }
  
  // ... 其他渲染逻辑
}
```

### 4. 增强事件处理
为输入框添加更多事件阻止：

```typescript
// 鼠标按下事件（阻止事件冒泡）
input.addEventListener('mousedown', (e) => {
  e.stopPropagation()
})

// 鼠标抬起事件（阻止事件冒泡）
input.addEventListener('mouseup', (e) => {
  e.stopPropagation()
})
```

### 5. 调整失去焦点延迟
增加失去焦点的延迟时间，避免意外结束编辑：

```typescript
input.addEventListener('blur', () => {
  setTimeout(() => {
    if (this.isEditingShapeText && this.editingShapeElement === shapeElement) {
      finishEdit()
    }
  }, 200) // 增加延迟时间
})
```

## 修复效果

修复后的功能特点：
- ✅ 双击形状元素后输入框稳定显示
- ✅ 输入框不会被意外清除
- ✅ 支持正常的文字输入和编辑
- ✅ 按Enter键或点击空白处正常完成编辑
- ✅ 编辑过程中不会干扰其他画布操作

## 测试建议

1. 双击各种形状元素（矩形、圆形、三角形等）
2. 验证输入框是否稳定显示
3. 测试文字输入功能
4. 测试编辑完成的各种方式（Enter键、点击空白处、失去焦点）
5. 测试编辑过程中其他画布操作是否正常
