/**
 * 流程图模板数据
 */

import { FlowTemplate, TemplateCategory, TemplateLibrary } from '../types/template.types'
import { additionalBusinessTemplates } from './additionalTemplates'

// 基础流程图模板
export const basicFlowTemplates: FlowTemplate[] = [
  {
    id: 'basic-flow-1',
    name: '简单流程图',
    description: '包含开始、处理、判断、结束的基本流程',
    previewImage: '/templates/basic-flow-1.png',
    category: 'flowchart',
    canvasSize: { width: 800, height: 600 },
    tags: ['基础', '流程', '简单'],
    elements: [
      {
        id: 'start-1',
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
      {
        id: 'process-1',
        type: 'shape',
        position: { x: 340, y: 150 },  // 调整x坐标使垂直居中对齐 (400 - 120/2 = 340)
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
      {
        id: 'decision-1',
        type: 'shape',
        position: { x: 340, y: 270 },  // 调整x坐标使垂直居中对齐 (400 - 120/2 = 340)
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '是否成功？',
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
      {
        id: 'end-1',
        type: 'shape',
        position: { x: 350, y: 390 },
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
      {
        id: 'arrow-1',
        type: 'arrow',
        position: { x: 400, y: 110 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'start-1',
          targetElementId: 'process-1',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },  // 开始形状的底部中心
          customEndPoint: { x: 0.5, y: 0 }   // 处理形状的顶部中心
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-2',
        type: 'arrow',
        position: { x: 400, y: 230 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'process-1',
          targetElementId: 'decision-1',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },  // 处理形状的底部中心
          customEndPoint: { x: 0.5, y: 0 }   // 判断形状的顶部中心
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-3',
        type: 'arrow',
        position: { x: 400, y: 350 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'decision-1',
          targetElementId: 'end-1',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },  // 判断形状的底部中心
          customEndPoint: { x: 0.5, y: 0 }   // 结束形状的顶部中心
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      }
    ]
  },
  {
    id: 'basic-flow-2',
    name: '决策流程图',
    description: '包含多个决策分支的复杂流程',
    previewImage: '/templates/basic-flow-2.png',
    category: 'flowchart',
    canvasSize: { width: 1000, height: 700 },
    tags: ['决策', '分支', '复杂'],
    elements: [
      {
        id: 'start-2',
        type: 'shape',
        position: { x: 400, y: 50 },
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
      {
        id: 'process-2',
        type: 'shape',
        position: { x: 390, y: 150 },  // 调整x坐标使垂直居中对齐 (450 - 120/2 = 390)
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
      {
        id: 'decision-2',
        type: 'shape',
        position: { x: 390, y: 270 },  // 调整x坐标使垂直居中对齐 (450 - 120/2 = 390)
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
      {
        id: 'process-yes',
        type: 'shape',
        position: { x: 140, y: 390 },  // 调整x坐标使垂直居中对齐 (200 - 120/2 = 140)
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
      {
        id: 'process-no',
        type: 'shape',
        position: { x: 540, y: 390 },  // 调整x坐标使垂直居中对齐 (600 - 120/2 = 540)
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
      {
        id: 'end-2',
        type: 'shape',
        position: { x: 400, y: 510 },
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
          fill: '#E8F5E8',
          stroke: '#4CAF50',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-start',
        type: 'arrow',
        position: { x: 450, y: 110 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'start-2',
          targetElementId: 'process-2',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-process',
        type: 'arrow',
        position: { x: 450, y: 230 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'process-2',
          targetElementId: 'decision-2',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-yes',
        type: 'arrow',
        position: { x: 390, y: 350 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'decision-2',
          targetElementId: 'process-yes',
          connectionType: 'flow',
          customStartPoint: { x: 0, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: {
          stroke: '#4CAF50',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-no',
        type: 'arrow',
        position: { x: 510, y: 350 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'decision-2',
          targetElementId: 'process-no',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: {
          stroke: '#F44336',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-end-yes',
        type: 'arrow',
        position: { x: 200, y: 470 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'process-yes',
          targetElementId: 'end-2',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-end-no',
        type: 'arrow',
        position: { x: 600, y: 470 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'process-no',
          targetElementId: 'end-2',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'arrow-loop',
        type: 'arrow',
        position: { x: 600, y: 430 },
        size: { x: -460, y: -40 },
        data: {
          arrowType: 'line',
          arrowStyle: {
            headSize: 8,
            headAngle: 0.5
          },
          isConnectionLine: true,
          sourceElementId: 'process-no',
          targetElementId: 'process-2',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: {
          stroke: '#F44336',
          strokeWidth: 2
        }
      }
    ]
  }
]

// 思维导图模板
export const mindmapTemplates: FlowTemplate[] = [
  {
    id: 'mindmap-1',
    name: '中心思维导图',
    description: '以中心主题为核心的思维导图',
    previewImage: '/templates/mindmap-1.png',
    category: 'mindmap',
    canvasSize: { width: 800, height: 600 },
    tags: ['思维导图', '中心', '分支'],
    elements: [
      {
        id: 'center-1',
        type: 'shape',
        position: { x: 350, y: 250 },
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
      {
        id: 'branch-1',
        type: 'shape',
        position: { x: 200, y: 150 },
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
      {
        id: 'branch-2',
        type: 'shape',
        position: { x: 500, y: 150 },
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
      {
        id: 'branch-3',
        type: 'shape',
        position: { x: 200, y: 350 },
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
      {
        id: 'branch-4',
        type: 'shape',
        position: { x: 500, y: 350 },
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
      {
        id: 'line-1',
        type: 'line',
        position: { x: 350, y: 300 },
        size: { x: -150, y: -150 },
        data: {
          isConnectionLine: true,
          sourceElementId: 'center-1',
          targetElementId: 'branch-1',
          connectionType: 'flow',
          customStartPoint: { x: 0, y: 0.5 },
          customEndPoint: { x: 1, y: 0.5 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'line-2',
        type: 'line',
        position: { x: 350, y: 300 },
        size: { x: 150, y: -150 },
        data: {
          isConnectionLine: true,
          sourceElementId: 'center-1',
          targetElementId: 'branch-2',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0, y: 0.5 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'line-3',
        type: 'line',
        position: { x: 350, y: 300 },
        size: { x: -150, y: 150 },
        data: {
          isConnectionLine: true,
          sourceElementId: 'center-1',
          targetElementId: 'branch-3',
          connectionType: 'flow',
          customStartPoint: { x: 0, y: 0.5 },
          customEndPoint: { x: 1, y: 0.5 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      },
      {
        id: 'line-4',
        type: 'line',
        position: { x: 350, y: 300 },
        size: { x: 150, y: 150 },
        data: {
          isConnectionLine: true,
          sourceElementId: 'center-1',
          targetElementId: 'branch-4',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0, y: 0.5 }
        },
        style: {
          stroke: '#666666',
          strokeWidth: 2
        }
      }
    ]
  }
]

// 业务流程图模板
export const businessFlowTemplates: FlowTemplate[] = [
  // 模板1：基础业务流程模板
  {
    id: 'business-flow-1',
    name: '基础业务流程',
    description: '适用于标准业务处理流程',
    previewImage: '/templates/business-flow-1.png',
    category: 'business',
    canvasSize: { width: 800, height: 600 },
    tags: ['业务', '流程', '标准'],
    elements: [
      {
        id: 'start-business',
        type: 'shape',
        position: { x: 350, y: 50 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
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
          strokeWidth: 2,
          borderRadius: 10
        }
      },
      {
        id: 'input-order',
        type: 'shape',
        position: { x: 340, y: 150 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '输入订单',
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
      {
        id: 'check-inventory',
        type: 'shape',
        position: { x: 340, y: 270 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '库存检查',
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
      {
        id: 'purchase-supply',
        type: 'shape',
        position: { x: 140, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '采购补货',
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
      {
        id: 'process-order',
        type: 'shape',
        position: { x: 540, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '处理订单',
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
      {
        id: 'end-business',
        type: 'shape',
        position: { x: 350, y: 510 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '结束',
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
          strokeWidth: 2,
          borderRadius: 10
        }
      },
      // 连接线
      {
        id: 'arrow-start-input',
        type: 'arrow',
        position: { x: 400, y: 110 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'start-business',
          targetElementId: 'input-order',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      },
      {
        id: 'arrow-input-check',
        type: 'arrow',
        position: { x: 400, y: 230 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'input-order',
          targetElementId: 'check-inventory',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      },
      {
        id: 'arrow-check-purchase',
        type: 'arrow',
        position: { x: 340, y: 350 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'check-inventory',
          targetElementId: 'purchase-supply',
          connectionType: 'flow',
          customStartPoint: { x: 0, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: -200, y: 40 }
          ]
        },
        style: { stroke: '#F44336', strokeWidth: 2 }
      },
      {
        id: 'arrow-check-process',
        type: 'arrow',
        position: { x: 460, y: 350 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'check-inventory',
          targetElementId: 'process-order',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 200, y: 40 }
          ]
        },
        style: { stroke: '#4CAF50', strokeWidth: 2 }
      },
      {
        id: 'arrow-purchase-end',
        type: 'arrow',
        position: { x: 200, y: 470 },
        size: { x: 150, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'purchase-supply',
          targetElementId: 'end-business',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 150, y: 40 }
          ]
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      },
      {
        id: 'arrow-process-end',
        type: 'arrow',
        position: { x: 600, y: 470 },
        size: { x: -150, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'process-order',
          targetElementId: 'end-business',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: -150, y: 40 }
          ]
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      }
    ]
  },
  // 模板2：系统登录流程模板
  {
    id: 'login-flow-1',
    name: '系统登录流程',
    description: '用户登录验证流程',
    previewImage: '/templates/login-flow-1.png',
    category: 'business',
    canvasSize: { width: 900, height: 700 },
    tags: ['登录', '验证', '权限'],
    elements: [
      {
        id: 'access-system',
        type: 'shape',
        position: { x: 400, y: 50 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '访问系统',
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
          strokeWidth: 2,
          borderRadius: 10
        }
      },
      {
        id: 'input-credentials',
        type: 'shape',
        position: { x: 390, y: 150 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '输入账号密码',
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
      {
        id: 'verify-credentials',
        type: 'shape',
        position: { x: 390, y: 270 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '验证凭证',
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
      {
        id: 'show-error',
        type: 'shape',
        position: { x: 140, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '显示错误',
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
      {
        id: 're-input',
        type: 'shape',
        position: { x: 140, y: 510 },
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
      {
        id: 'check-permission',
        type: 'shape',
        position: { x: 640, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '权限检查',
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
      {
        id: 'no-permission',
        type: 'shape',
        position: { x: 640, y: 510 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '提示权限不足',
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
      {
        id: 'enter-system',
        type: 'shape',
        position: { x: 400, y: 630 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '进入系统',
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
          strokeWidth: 2,
          borderRadius: 10
        }
      },
      // 连接线
      {
        id: 'arrow-access-input',
        type: 'arrow',
        position: { x: 450, y: 110 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'access-system',
          targetElementId: 'input-credentials',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      },
      {
        id: 'arrow-input-verify',
        type: 'arrow',
        position: { x: 450, y: 230 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'input-credentials',
          targetElementId: 'verify-credentials',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      },
      {
        id: 'arrow-verify-error',
        type: 'arrow',
        position: { x: 390, y: 350 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'verify-credentials',
          targetElementId: 'show-error',
          connectionType: 'flow',
          customStartPoint: { x: 0, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: { stroke: '#F44336', strokeWidth: 2 }
      },
      {
        id: 'arrow-error-reinput',
        type: 'arrow',
        position: { x: 200, y: 470 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'show-error',
          targetElementId: 're-input',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: { stroke: '#F44336', strokeWidth: 2 }
      },
      {
        id: 'arrow-reinput-input',
        type: 'arrow',
        position: { x: 200, y: 590 },
        size: { x: 190, y: -40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 're-input',
          targetElementId: 'input-credentials',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 }
        },
        style: { stroke: '#F44336', strokeWidth: 2 }
      },
      {
        id: 'arrow-verify-permission',
        type: 'arrow',
        position: { x: 510, y: 350 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'verify-credentials',
          targetElementId: 'check-permission',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 200, y: 40 }
          ]
        },
        style: { stroke: '#4CAF50', strokeWidth: 2 }
      },
      {
        id: 'arrow-permission-no',
        type: 'arrow',
        position: { x: 700, y: 470 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'check-permission',
          targetElementId: 'no-permission',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: { stroke: '#F44336', strokeWidth: 2 }
      },
      {
        id: 'arrow-permission-enter',
        type: 'arrow',
        position: { x: 640, y: 590 },
        size: { x: -240, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'check-permission',
          targetElementId: 'enter-system',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: -240, y: 40 }
          ]
        },
        style: { stroke: '#4CAF50', strokeWidth: 2 }
      }
    ]
  },
  // 模板3：请假审批流程模板
  {
    id: 'leave-approval-1',
    name: '请假审批流程',
    description: '企业请假申请审批流程',
    previewImage: '/templates/leave-approval-1.png',
    category: 'business',
    canvasSize: { width: 800, height: 600 },
    tags: ['请假', '审批', '企业'],
    elements: [
      {
        id: 'submit-leave',
        type: 'shape',
        position: { x: 350, y: 50 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '提交请假申请',
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
          strokeWidth: 2,
          borderRadius: 10
        }
      },
      {
        id: 'manager-approval',
        type: 'shape',
        position: { x: 340, y: 150 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '部门经理审批',
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
      {
        id: 'notify-applicant',
        type: 'shape',
        position: { x: 140, y: 270 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '通知申请人',
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
      {
        id: 'hr-record',
        type: 'shape',
        position: { x: 540, y: 270 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: 'HR备案',
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
      {
        id: 'check-days',
        type: 'shape',
        position: { x: 540, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '超过3天?',
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
      {
        id: 'ceo-approval',
        type: 'shape',
        position: { x: 340, y: 510 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '总经理审批',
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
      {
        id: 'process-end',
        type: 'shape',
        position: { x: 350, y: 630 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '流程结束',
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
          strokeWidth: 2,
          borderRadius: 10
        }
      },
      // 连接线
      {
        id: 'arrow-submit-manager',
        type: 'arrow',
        position: { x: 400, y: 110 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'submit-leave',
          targetElementId: 'manager-approval',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      },
      {
        id: 'arrow-manager-notify',
        type: 'arrow',
        position: { x: 340, y: 230 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'manager-approval',
          targetElementId: 'notify-applicant',
          connectionType: 'flow',
          customStartPoint: { x: 0, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: -200, y: 40 }
          ]
        },
        style: { stroke: '#F44336', strokeWidth: 2 }
      },
      {
        id: 'arrow-manager-hr',
        type: 'arrow',
        position: { x: 460, y: 230 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'manager-approval',
          targetElementId: 'hr-record',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 200, y: 40 }
          ]
        },
        style: { stroke: '#4CAF50', strokeWidth: 2 }
      },
      {
        id: 'arrow-hr-check',
        type: 'arrow',
        position: { x: 600, y: 350 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'hr-record',
          targetElementId: 'check-days',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      },
      {
        id: 'arrow-check-ceo',
        type: 'arrow',
        position: { x: 540, y: 470 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'check-days',
          targetElementId: 'ceo-approval',
          connectionType: 'flow',
          customStartPoint: { x: 0, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: -200, y: 40 }
          ]
        },
        style: { stroke: '#FF9800', strokeWidth: 2 }
      },
      {
        id: 'arrow-check-end',
        type: 'arrow',
        position: { x: 600, y: 470 },
        size: { x: -250, y: 160 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'check-days',
          targetElementId: 'process-end',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: -250, y: 160 }
          ]
        },
        style: { stroke: '#4CAF50', strokeWidth: 2 }
      },
      {
        id: 'arrow-ceo-end',
        type: 'arrow',
        position: { x: 400, y: 590 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'ceo-approval',
          targetElementId: 'process-end',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 40 }
          ]
        },
        style: { stroke: '#666666', strokeWidth: 2 }
      }
    ]
  },
  // 添加额外的业务流程图模板
  ...additionalBusinessTemplates
]

// 模板分类
export const templateCategories: TemplateCategory[] = [
  {
    id: 'flowchart',
    name: '流程图',
    icon: 'flow-chart',
    templates: basicFlowTemplates
  },
  {
    id: 'mindmap',
    name: '思维导图',
    icon: 'mind-map',
    templates: mindmapTemplates
  },
  {
    id: 'diagram',
    name: '图表',
    icon: 'chart',
    templates: []
  },
  {
    id: 'process',
    name: '流程',
    icon: 'process',
    templates: []
  },
  {
    id: 'business',
    name: '业务流程图',
    icon: 'business',
    templates: businessFlowTemplates
  }
]

// 模板库
export const templateLibrary: TemplateLibrary = {
  categories: templateCategories,
  featured: [...basicFlowTemplates, ...mindmapTemplates, ...businessFlowTemplates],
  recent: []
}
