# WebSocket 实时通信

## 概述

FlowCanvas 支持通过 WebSocket 实现跨设备实时协作。目前提供两种传输层实现：

| 传输方式 | 适用场景 | 依赖 |
|---------|---------|------|
| BroadcastChannel | 同浏览器多标签页 | 无（浏览器原生） |
| PartyKit | 跨设备、跨浏览器协作 | `partysocket` |

## 目录结构

```
src/core/collaboration/
├── CollaborationManager.ts    # 协作主管理器（传输层抽象）
├── BroadcastChannelAdapter.ts # BroadcastChannel 适配器
├── PartyKitAdapter.ts         # PartyKit 适配器
├── WebSocketAdapter.ts         # WebSocket 适配器（通用）
├── UserManager.ts              # 协作用户管理
└── CursorManager.ts            # 光标同步
```

## 架构设计

```
┌─────────────────────────────────────────────────┐
│              CollaborationManager                │
│              (业务逻辑层)                         │
│  - 用户管理                                        │
│  - 操作记录                                        │
│  - 冲突处理                                        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│              传输层适配器                          │
├─────────────┬─────────────┬─────────────────────┤
│ Broadcast   │ PartyKit    │ WebSocket           │
│ Channel     │ Adapter     │ Adapter             │
│ (本地)      │ (云服务)     │ (自建服务器)         │
└─────────────┴─────────────┴─────────────────────┘
```

## 适配器接口

所有传输层适配器需实现统一接口：

```typescript
export interface TransportAdapter {
  /** 连接状态 */
  isConnected(): boolean

  /** 连接到传输服务 */
  connect(): Promise<void>

  /** 断开连接 */
  disconnect(): void

  /** 发送消息 */
  send(message: CollaborationMessage): void

  /** 设置消息接收回调 */
  onMessage(handler: (message: CollaborationMessage) => void): void

  /** 设置连接状态变化回调 */
  onStatusChange(handler: (connected: boolean) => void): void
}
```

## PartyKit 适配器

### 安装依赖

```bash
npm install partysocket
```

### 前端适配器

```typescript
// src/core/collaboration/PartyKitAdapter.ts
import PartySocket from 'partysocket'
import type { CollaborationMessage } from '@/types/collaboration.types'
import type { TransportAdapter } from './TransportAdapter'

export class PartyKitAdapter implements TransportAdapter {
  private socket: PartySocket | null = null
  private messageHandler: ((msg: CollaborationMessage) => void) | null = null
  private statusHandler: ((connected: boolean) => void) | null = null
  private _isConnected: boolean = false

  constructor(
    private room: string,
    private host: string = 'localhost:1999'
  ) {}

  isConnected(): boolean {
    return this._isConnected
  }

  async connect(): Promise<void> {
    this.socket = new PartySocket({
      host: this.host,
      room: this.room
    })

    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data as string) as CollaborationMessage
      this.messageHandler?.(message)
    })

    this.socket.addEventListener('open', () => {
      this._isConnected = true
      this.statusHandler?.(true)
    })

    this.socket.addEventListener('close', () => {
      this._isConnected = false
      this.statusHandler?.(false)
    })
  }

  send(message: CollaborationMessage): void {
    this.socket?.send(JSON.stringify(message))
  }

  onMessage(handler: (message: CollaborationMessage) => void): void {
    this.messageHandler = handler
  }

  onStatusChange(handler: (connected: boolean) => void): void {
    this.statusHandler = handler
  }

  disconnect(): void {
    this.socket?.close()
    this.socket = null
    this._isConnected = false
  }
}
```

### 服务端实现

创建 `party/index.ts`：

```typescript
// party/index.ts
import type { Party, Connection } from 'partykit/server'

interface User {
  id: string
  name: string
  color: string
}

export default class FlowCanvasParty implements Party {
  users: Map<string, User> = new Map()

  constructor(readonly room: Party) {}

  async onConnect(conn: Connection) {
    console.log('[Party] 用户连接:', conn.id)
  }

  async onMessage(message: string, sender: Connection) {
    const data = JSON.parse(message)
    
    switch (data.type) {
      case 'user-join':
        this.users.set(sender.id, data.payload)
        this.room.broadcast(JSON.stringify({
          type: 'user-list',
          payload: Array.from(this.users.values())
        }))
        break

      case 'cursor':
        // 广播光标给其他用户
        this.room.broadcast(JSON.stringify(data), [sender.id])
        break

      case 'operation':
        // 广播操作给其他用户
        this.room.broadcast(JSON.stringify(data), [sender.id])
        break

      case 'sync-request':
        // 响应同步请求
        sender.send(JSON.stringify({
          type: 'sync-response',
          payload: { users: Array.from(this.users.values()) }
        }))
        break
    }
  }

  async onClose(conn: Connection) {
    this.users.delete(conn.id)
    this.room.broadcast(JSON.stringify({
      type: 'user-leave',
      payload: { id: conn.id }
    }))
  }
}
```

### PartyKit 配置

创建 `partykit.json`：

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "flowcanvas",
  "main": "party/index.ts"
}
```

## 通用 WebSocket 适配器

适用于自建 WebSocket 服务器的场景：

```typescript
// src/core/collaboration/WebSocketAdapter.ts
export class WebSocketAdapter implements TransportAdapter {
  private socket: WebSocket | null = null
  private messageHandler: ((msg: CollaborationMessage) => void) | null = null
  private statusHandler: ((connected: boolean) => void) | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private _isConnected: boolean = false

  constructor(
    private url: string,
    private protocols?: string | string[]
  ) {}

  isConnected(): boolean {
    return this._isConnected && this.socket?.readyState === WebSocket.OPEN
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url, this.protocols)

        this.socket.addEventListener('open', () => {
          this._isConnected = true
          this.reconnectAttempts = 0
          this.statusHandler?.(true)
          resolve()
        })

        this.socket.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data) as CollaborationMessage
            this.messageHandler?.(message)
          } catch (e) {
            console.error('[WebSocket] 消息解析失败:', e)
          }
        })

        this.socket.addEventListener('close', () => {
          this._isConnected = false
          this.statusHandler?.(false)
          this.attemptReconnect()
        })

        this.socket.addEventListener('error', (error) => {
          console.error('[WebSocket] 连接错误:', error)
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`[WebSocket] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect().catch(() => {})
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  send(message: CollaborationMessage): void {
    if (this.isConnected()) {
      this.socket?.send(JSON.stringify(message))
    }
  }

  onMessage(handler: (message: CollaborationMessage) => void): void {
    this.messageHandler = handler
  }

  onStatusChange(handler: (connected: boolean) => void): void {
    this.statusHandler = handler
  }

  disconnect(): void {
    this.maxReconnectAttempts = 0 // 阻止重连
    this.socket?.close()
    this.socket = null
    this._isConnected = false
  }
}
```

## 选择传输层

在 `CollaborationManager` 中切换传输层：

```typescript
// src/core/collaboration/CollaborationManager.ts

export class CollaborationManager {
  private adapter: TransportAdapter

  constructor(
    settings: Partial<CollaborationSettings> = {},
    userName?: string,
    transportType: 'broadcast' | 'partykit' | 'websocket' = 'broadcast'
  ) {
    // 根据类型选择适配器
    switch (transportType) {
      case 'partykit':
        this.adapter = new PartyKitAdapter(settings.channelName || 'flowcanvas')
        break
      case 'websocket':
        this.adapter = new WebSocketAdapter('wss://your-server.com/collab')
        break
      default:
        this.adapter = new BroadcastChannelAdapter(settings.channelName || 'flowcanvas')
    }
    
    // 设置适配器回调
    this.adapter.onMessage(this.handleMessage.bind(this))
    this.adapter.onStatusChange((connected) => {
      this.isConnected = connected
    })
  }
}
```

## 部署

### PartyKit 部署

```bash
# 安装 PartyKit CLI
npm install -g partykit

# 部署
partykit deploy
```

部署后更新前端配置：

```typescript
const adapter = new PartyKitAdapter('flowcanvas', 'flowcanvas.username.partykit.dev')
```

## 消息压缩

对于大量操作同步，可启用消息压缩：

```typescript
import { compress, decompress } from 'lz-string'

// 发送时压缩
this.socket.send(compress(JSON.stringify(message)))

// 接收时解压
const message = JSON.parse(decompress(event.data))
```

## 关键文件

| 文件 | 说明 |
|------|------|
| `src/core/collaboration/PartyKitAdapter.ts` | PartyKit 传输适配器 |
| `src/core/collaboration/WebSocketAdapter.ts` | 通用 WebSocket 适配器 |
| `src/core/collaboration/BroadcastChannelAdapter.ts` | BroadcastChannel 适配器 |
| `party/index.ts` | PartyKit 服务端 |
| `partykit.json` | PartyKit 配置 |

## 相关文档

- [协作系统](./collaboration.md) - 协作业务逻辑
- [cursor.md](../cursor.md) - 项目规范
