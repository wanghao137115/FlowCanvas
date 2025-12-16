/**
 * 模板相关类型定义
 */

export interface TemplateElement {
  id: string
  type: 'shape' | 'text' | 'line' | 'arrow'
  position: { x: number; y: number }
  size: { x: number; y: number }
  data: any
  style?: any
}

export interface FlowTemplate {
  id: string
  name: string
  description: string
  previewImage: string
  category: 'flowchart' | 'mindmap' | 'diagram' | 'process' | 'business'
  elements: TemplateElement[]
  canvasSize: { width: number; height: number }
  tags: string[]
}

export interface TemplateCategory {
  id: string
  name: string
  icon: string
  templates: FlowTemplate[]
}

export interface TemplateLibrary {
  categories: TemplateCategory[]
  featured: FlowTemplate[]
  recent: FlowTemplate[]
}
