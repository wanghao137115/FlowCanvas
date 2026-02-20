<template>
  <div class="collaboration-panel" v-if="isEnabled && isConnected">
    <!-- 协作状态指示 -->
    <div class="collab-status" :class="{ connected: isConnected }">
      <span class="status-dot"></span>
      <span class="status-text">{{ isConnected ? '已连接' : '未连接' }}</span>
      <span class="user-count" v-if="users.length > 1">
        {{ users.length }} 人在线
      </span>
    </div>

    <!-- 用户列表 -->
    <div class="user-list" v-if="showUserList && users.length > 0">
      <div 
        v-for="user in users" 
        :key="user.id" 
        class="user-item"
        :class="{ local: user.isLocal }"
        :title="user.isLocal ? '这是你' : user.name"
      >
        <div class="user-avatar" :style="{ backgroundColor: user.color }">
          {{ getInitials(user.name) }}
        </div>
        <span class="user-name">{{ user.name }}</span>
        <span class="local-badge" v-if="user.isLocal">你</span>
      </div>
    </div>

    <!-- 协作提示 -->
    <div class="collab-tip" v-if="showTip && users.length === 1">
      <span>打开新标签页开始协作</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { CollaborationUser, CursorState } from '@/types/collaboration.types'
import { getCollaborationManager } from '@/core/collaboration'

interface Props {
  isEnabled?: boolean
  showUserList?: boolean
  showTip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEnabled: true,
  showUserList: true,
  showTip: true
})

// 协作管理器
const collaborationManager = getCollaborationManager()

// 状态
const isConnected = ref(false)
const users = ref<CollaborationUser[]>([])
const cursors = ref<CursorState[]>([])

// 初始化
onMounted(() => {
  // 连接协作
  collaborationManager.connect()
  isConnected.value = collaborationManager.isActive()
  
  // 获取初始用户列表
  users.value = collaborationManager.getUsers()

  // 设置回调
  collaborationManager.setCallbacks({
    onUserListChange: (userList) => {
      users.value = userList
    },
    onUserJoin: (user) => {
      console.log('[Collab UI] 用户加入:', user.name)
    },
    onUserLeave: (userId) => {
      console.log('[Collab UI] 用户离开:', userId)
    },
    onCursorUpdate: (cursorList) => {
      cursors.value = cursorList
    },
    onError: (error) => {
      console.error('[Collab UI] 错误:', error)
    }
  })
})

onUnmounted(() => {
  // 组件卸载时断开连接
  // collaborationManager.disconnect() // 保持连接，多标签页共享
})

// 获取用户首字母
function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

// 暴露方法给父组件
defineExpose({
  collaborationManager,
  users,
  cursors,
  isConnected
})
</script>

<style scoped>
.collaboration-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.collab-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  color: #666;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  transition: background 0.3s;
}

.collab-status.connected .status-dot {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.status-text {
  font-weight: 500;
}

.user-count {
  padding-left: 6px;
  border-left: 1px solid #ddd;
  color: #4ade80;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-item.local {
  background: rgba(74, 222, 128, 0.1);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
}

.user-name {
  font-size: 13px;
  color: #333;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #4ade80;
  color: white;
  border-radius: 10px;
}

.collab-tip {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  font-size: 12px;
  color: #888;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
