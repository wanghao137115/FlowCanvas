// 协作系统导出入口

// 类型定义
export * from '@/types/collaboration.types'

// 核心类
export { CollaborationManager, getCollaborationManager, destroyCollaborationManager } from './CollaborationManager'
export type { CollaborationCallbacks } from './CollaborationManager'

// 传输层
export { WebSocketAdapter } from './WebSocketAdapter'
export type { TransportAdapter, TransportConfig, TransportType } from './TransportAdapter'

export { UserManager } from './UserManager'

export { CursorManager } from './CursorManager'
export type { CursorRenderConfig } from './CursorManager'
