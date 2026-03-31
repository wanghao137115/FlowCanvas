# 协作系统

## 概述
协作系统支持多用户实时协同编辑，包括用户管理、光标同步、操作同步。

## 核心组件

| 文件 | 职责 |
|------|------|
| `CollaborationManager.ts` | 协作主管理器 |
| `UserManager.ts` | 协作用户管理 |
| `CursorManager.ts` | 光标同步 |
| `CollaborationPanel.vue` | 用户列表 UI |

## 用户结构

```typescript
interface CollaborationUser {
  id: string
  name: string
  color: string              // 用户标识色
  avatar?: string
  cursor: Vector2 | null     // 当前光标位置
  lastActive: number         // 最后活跃时间
  isLocal: boolean           // 是否是本地用户
}
```

## 光标状态

```typescript
interface CursorState {
  position: Vector2
  color: string
  userId: string
  userName: string
  lastUpdate: number
}
```

## 操作类型

```typescript
type OperationType = 
  | 'add-element'
  | 'delete-element'
  | 'update-element'
  | 'move-element'
  | 'resize-element'
  | 'rotate-element'
  | 'add-layer'
  | 'delete-layer'
  | 'update-layer'
  | 'clear-canvas'
```

## 操作结构

```typescript
interface Operation {
  id: string
  type: OperationType
  elementId?: string
  layerId?: string
  data: any
  previousData?: any        // 用于撤销
  userId: string
  timestamp: number
}
```

## 事件类型

```typescript
type CollaborationEventType = 
  | 'user-join'           // 用户加入
  | 'user-leave'          // 用户离开
  | 'user-list'           // 用户列表更新
  | 'operation'           // 操作同步
  | 'cursor'              // 光标移动
  | 'sync-request'        // 同步请求
  | 'sync-response'       // 同步响应
```

## 消息结构

```typescript
interface CollaborationMessage {
  type: CollaborationEventType
  userId: string
  timestamp: number
  payload: any
}
```

## 协作流程

### 1. 用户加入
```
用户打开协作
       ↓
发送 'user-join' 消息
       ↓
服务器广播用户列表
       ↓
更新本地用户状态
```

### 2. 光标同步
```
本地用户移动鼠标
       ↓
发送 'cursor' 消息 (节流 50ms)
       ↓
其他用户收到消息
       ↓
更新远程用户光标显示
```

### 3. 操作同步
```
本地用户操作
       ↓
执行操作并记录
       ↓
发送 'operation' 消息
       ↓
其他用户收到并执行
       ↓
更新画布状态
```

## 配置

```typescript
interface CollaborationSettings {
  enabled: boolean
  channelName: string      // 协作频道
  userName: string
  showCursors: boolean    // 显示其他用户光标
  cursorFollowDelay: number
  showUserList: boolean   // 显示用户列表
}
```

## WebSocket 消息示例

```json
// 用户加入
{
  "type": "user-join",
  "userId": "user_123",
  "timestamp": 1712000000000,
  "payload": {
    "name": "张三",
    "color": "#3b82f6"
  }
}

// 光标移动
{
  "type": "cursor",
  "userId": "user_123",
  "timestamp": 1712000000100,
  "payload": {
    "position": { "x": 100, "y": 200 }
  }
}

// 操作同步
{
  "type": "operation",
  "userId": "user_123",
  "timestamp": 1712000000200,
  "payload": {
    "id": "op_456",
    "type": "add-element",
    "elementId": "elem_789",
    "data": { /* 元素数据 */ }
  }
}
```

## 关键文件
- `src/types/collaboration.types.ts` - 类型定义
- `src/core/collaboration/CollaborationManager.ts`
- `src/core/collaboration/UserManager.ts`
- `src/core/collaboration/CursorManager.ts`
- `src/components/Collaboration/CollaborationPanel.vue`
