/**
 * 简化的模板数据
 * 专注于基本功能，避免复杂的连接逻辑
 */

import { FlowTemplate, TemplateCategory, TemplateLibrary } from '../types/template.types'

// 简单流程图模板
export const simpleFlowTemplates: FlowTemplate[] = [
  {
    id: 'simple-flow-1',
    name: '简单流程图',
    description: '包含开始、处理、结束的基本流程',
    previewImage: '/templates/simple-flow-1.png',
    category: 'flowchart',
    canvasSize: { width: 600, height: 400 },
    tags: ['基础', '流程', '简单'],
    elements: [
      // 开始节点
      {
        id: 'start-1',
        type: 'shape',
        position: { x: 250, y: 50 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'ellipse',
          text: '开始',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#E8F5E8',
          stroke: '#4CAF50',
          strokeWidth: 2
        }
      },
      // 处理节点
      {
        id: 'process-1',
        type: 'shape',
        position: { x: 240, y: 150 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '处理数据',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#E3F2FD',
          stroke: '#2196F3',
          strokeWidth: 2
        }
      },
      // 结束节点
      {
        id: 'end-1',
        type: 'shape',
        position: { x: 250, y: 270 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'ellipse',
          text: '结束',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#FFEBEE',
          stroke: '#F44336',
          strokeWidth: 2
        }
      },
      // 箭头1：开始 -> 处理
      {
        id: 'arrow-1',
        type: 'arrow',
        position: { x: 300, y: 110 },
        size: { x: 1, y: 40 }, // ✅ 确保最小尺寸
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },    // 起点（相对于箭头位置）
            { x: 0, y: 40 }    // 终点（相对于箭头位置）
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      // 箭头2：处理 -> 结束
      {
        id: 'arrow-2',
        type: 'arrow',
        position: { x: 300, y: 230 },
        size: { x: 1, y: 40 }, // ✅ 确保最小尺寸
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },    // 起点（相对于箭头位置）
            { x: 0, y: 40 }    // 终点（相对于箭头位置）
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      }
    ]
  },
  {
    id: 'simple-flow-2',
    name: '决策流程图',
    description: '包含决策分支的简单流程',
    previewImage: '/templates/simple-flow-2.png',
    category: 'flowchart',
    canvasSize: { width: 800, height: 500 },
    tags: ['决策', '分支', '简单'],
    elements: [
      // 开始节点
      {
        id: 'start-2',
        type: 'shape',
        position: { x: 350, y: 50 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'ellipse',
          text: '开始',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#E8F5E8',
          stroke: '#4CAF50',
          strokeWidth: 2
        }
      },
      // 处理节点
      {
        id: 'process-2',
        type: 'shape',
        position: { x: 340, y: 150 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '输入数据',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#E3F2FD',
          stroke: '#2196F3',
          strokeWidth: 2
        }
      },
      // 决策节点
      {
        id: 'decision-2',
        type: 'shape',
        position: { x: 340, y: 270 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '数据有效？',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#FFF3E0',
          stroke: '#FF9800',
          strokeWidth: 2
        }
      },
      // 是分支
      {
        id: 'process-yes',
        type: 'shape',
        position: { x: 140, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '处理数据',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#E3F2FD',
          stroke: '#2196F3',
          strokeWidth: 2
        }
      },
      // 否分支
      {
        id: 'process-no',
        type: 'shape',
        position: { x: 540, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '重新输入',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#FFEBEE',
          stroke: '#F44336',
          strokeWidth: 2
        }
      },
      // 箭头1：开始 -> 处理
      {
        id: 'arrow-start',
        type: 'arrow',
        position: { x: 400, y: 110 },
        size: { x: 1, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      // 箭头2：处理 -> 决策
      {
        id: 'arrow-process',
        type: 'arrow',
        position: { x: 400, y: 230 },
        size: { x: 1, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      // 箭头3：决策 -> 是
      {
        id: 'arrow-yes',
        type: 'arrow',
        position: { x: 340, y: 350 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: -200, y: 40 }
          ]
        },
        style: {
          stroke: '#4CAF50',
          strokeWidth: 2
        }
      },
      // 箭头4：决策 -> 否
      {
        id: 'arrow-no',
        type: 'arrow',
        position: { x: 460, y: 350 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: 200, y: 40 }
          ]
        },
        style: {
          stroke: '#F44336',
          strokeWidth: 2
        }
      }
    ]
  }
]

// 简单思维导图模板
export const simpleMindmapTemplates: FlowTemplate[] = [
  {
    id: 'simple-mindmap-1',
    name: '中心思维导图',
    description: '以中心主题为核心的简单思维导图',
    previewImage: '/templates/simple-mindmap-1.png',
    category: 'mindmap',
    canvasSize: { width: 600, height: 400 },
    tags: ['思维导图', '中心', '分支'],
    elements: [
      // 中心节点
      {
        id: 'center-1',
        type: 'shape',
        position: { x: 250, y: 150 },
        size: { x: 100, y: 100 },
        data: {
          shapeType: 'ellipse',
          text: '中心主题',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#FFE0B2',
          stroke: '#FF9800',
          strokeWidth: 3
        }
      },
      // 分支1
      {
        id: 'branch-1',
        type: 'shape',
        position: { x: 100, y: 50 },
        size: { x: 80, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '分支1',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#E8F5E8',
          stroke: '#4CAF50',
          strokeWidth: 2
        }
      },
      // 分支2
      {
        id: 'branch-2',
        type: 'shape',
        position: { x: 420, y: 50 },
        size: { x: 80, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '分支2',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#E3F2FD',
          stroke: '#2196F3',
          strokeWidth: 2
        }
      },
      // 分支3
      {
        id: 'branch-3',
        type: 'shape',
        position: { x: 100, y: 250 },
        size: { x: 80, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '分支3',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#F3E5F5',
          stroke: '#9C27B0',
          strokeWidth: 2
        }
      },
      // 分支4
      {
        id: 'branch-4',
        type: 'shape',
        position: { x: 420, y: 250 },
        size: { x: 80, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '分支4',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#FFF3E0',
          stroke: '#FF9800',
          strokeWidth: 2
        }
      },
      // 连接线1：中心 -> 分支1
      {
        id: 'line-1',
        type: 'arrow',
        position: { x: 250, y: 200 },
        size: { x: 150, y: 100 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: -150, y: -100 }
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      // 连接线2：中心 -> 分支2
      {
        id: 'line-2',
        type: 'arrow',
        position: { x: 350, y: 200 },
        size: { x: 150, y: 100 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: 150, y: -100 }
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      // 连接线3：中心 -> 分支3
      {
        id: 'line-3',
        type: 'arrow',
        position: { x: 250, y: 250 },
        size: { x: 150, y: 100 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: -150, y: 100 }
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      // 连接线4：中心 -> 分支4
      {
        id: 'line-4',
        type: 'arrow',
        position: { x: 350, y: 250 },
        size: { x: 150, y: 100 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          points: [
            { x: 0, y: 0 },
            { x: 150, y: 100 }
          ]
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      }
    ]
  }
]

// 简单模板分类
export const simpleTemplateCategories: TemplateCategory[] = [
  {
    id: 'simple-flowchart',
    name: '简单流程图',
    icon: 'flow-chart',
    templates: simpleFlowTemplates
  },
  {
    id: 'simple-mindmap',
    name: '简单思维导图',
    icon: 'mind-map',
    templates: simpleMindmapTemplates
  }
]

// 简单模板库
export const simpleTemplateLibrary: TemplateLibrary = {
  categories: simpleTemplateCategories,
  featured: [...simpleFlowTemplates, ...simpleMindmapTemplates],
  recent: []
}
