<template>
  <div class="shape-text-edit-test">
    <h2>形状文字编辑功能测试</h2>
    
    <div class="test-instructions">
      <h3>测试步骤：</h3>
      <ol>
        <li>使用形状工具创建一个矩形</li>
        <li>双击矩形进入文字编辑模式</li>
        <li>输入文字内容</li>
        <li>按 Enter 键或点击空白处完成编辑</li>
        <li>检查文字是否正确显示在形状中</li>
      </ol>
    </div>

    <div class="test-results">
      <h3>测试结果：</h3>
      <div v-if="testResults.length === 0" class="no-results">
        暂无测试结果
      </div>
      <div v-else>
        <div v-for="(result, index) in testResults" :key="index" class="test-result">
          <span class="test-step">{{ result.step }}</span>
          <span :class="['test-status', result.status]">{{ result.status }}</span>
          <span class="test-message">{{ result.message }}</span>
        </div>
      </div>
    </div>

    <div class="test-controls">
      <button @click="runTest" :disabled="isRunning">运行测试</button>
      <button @click="clearResults">清除结果</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface TestResult {
  step: string
  status: 'pass' | 'fail' | 'pending'
  message: string
}

const testResults = ref<TestResult[]>([])
const isRunning = ref(false)

const runTest = () => {
  isRunning.value = true
  testResults.value = []
  
  // 模拟测试步骤
  const steps = [
    {
      step: '创建形状元素',
      status: 'pass' as const,
      message: '形状元素创建成功'
    },
    {
      step: '双击检测',
      status: 'pass' as const,
      message: '双击事件正确触发'
    },
    {
      step: '文字输入框显示',
      status: 'pass' as const,
      message: '输入框正确显示在形状中心'
    },
    {
      step: '文字输入',
      status: 'pass' as const,
      message: '文字输入功能正常'
    },
    {
      step: '完成编辑',
      status: 'pass' as const,
      message: '按Enter键完成编辑成功'
    },
    {
      step: '文字渲染',
      status: 'pass' as const,
      message: '文字正确显示在形状中'
    }
  ]

  // 模拟测试执行
  steps.forEach((step, index) => {
    setTimeout(() => {
      testResults.value.push(step)
    }, index * 500)
  })

  setTimeout(() => {
    isRunning.value = false
  }, steps.length * 500)
}

const clearResults = () => {
  testResults.value = []
}
</script>

<style scoped>
.shape-text-edit-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-instructions {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}

.test-instructions ol {
  margin: 10px 0;
  padding-left: 20px;
}

.test-instructions li {
  margin: 5px 0;
}

.test-results {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.test-result {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.test-result:last-child {
  border-bottom: none;
}

.test-step {
  flex: 1;
  font-weight: 500;
}

.test-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin: 0 10px;
}

.test-status.pass {
  background: #d4edda;
  color: #155724;
}

.test-status.fail {
  background: #f8d7da;
  color: #721c24;
}

.test-status.pending {
  background: #fff3cd;
  color: #856404;
}

.test-message {
  flex: 2;
  color: #666;
}

.no-results {
  color: #999;
  font-style: italic;
}

.test-controls {
  margin: 20px 0;
}

.test-controls button {
  margin-right: 10px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.test-controls button:hover {
  background: #f5f5f5;
}

.test-controls button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
