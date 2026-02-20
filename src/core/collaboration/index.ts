// 协作系统导出入口

// 类型定义
export * from '@/types/collaboration.types'

// 核心类
export { CollaborationManager, getCollaborationManager, destroyCollaborationManager } from './CollaborationManager'
export type { CollaborationCallbacks } from './CollaborationManager'

export { UserManager } from './UserManager'

export { CursorManager } from './CursorManager'
export type { CursorRenderConfig } from './CursorManager'
