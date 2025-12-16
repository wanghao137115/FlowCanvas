/**
 * 额外的业务流程图模板
 */

import { FlowTemplate } from '../types/template.types'

// 模板4：产品开发流程模板
export const productDevTemplates: FlowTemplate[] = [
  {
    id: 'product-dev-1',
    name: '产品开发流程',
    description: '软件产品开发生命周期',
    previewImage: '/templates/product-dev-1.png',
    category: 'business',
    canvasSize: { width: 800, height: 600 },
    tags: ['产品', '开发', '软件'],
    elements: [
      {
        id: 'requirement-analysis',
        type: 'shape',
        position: { x: 350, y: 50 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '需求分析',
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
        id: 'design-phase',
        type: 'shape',
        position: { x: 340, y: 150 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '设计阶段',
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
        id: 'development',
        type: 'shape',
        position: { x: 340, y: 270 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '开发实现',
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
        id: 'testing',
        type: 'shape',
        position: { x: 340, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'diamond',
          text: '测试验证',
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
        id: 'fix-bug',
        type: 'shape',
        position: { x: 140, y: 510 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '修复bug',
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
        id: 'deploy',
        type: 'shape',
        position: { x: 350, y: 630 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '部署上线',
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
        id: 'arrow-req-design',
        type: 'arrow',
        position: { x: 400, y: 110 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'requirement-analysis',
          targetElementId: 'design-phase',
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
        id: 'arrow-design-dev',
        type: 'arrow',
        position: { x: 400, y: 230 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'design-phase',
          targetElementId: 'development',
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
        id: 'arrow-dev-test',
        type: 'arrow',
        position: { x: 400, y: 350 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'development',
          targetElementId: 'testing',
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
        id: 'arrow-test-fix',
        type: 'arrow',
        position: { x: 340, y: 470 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'testing',
          targetElementId: 'fix-bug',
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
        id: 'arrow-fix-dev',
        type: 'arrow',
        position: { x: 200, y: 550 },
        size: { x: 140, y: -280 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'fix-bug',
          targetElementId: 'development',
          connectionType: 'flow',
          customStartPoint: { x: 0.5, y: 1 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: 140, y: -280 }
          ]
        },
        style: { stroke: '#F44336', strokeWidth: 2 }
      },
      {
        id: 'arrow-test-deploy',
        type: 'arrow',
        position: { x: 460, y: 470 },
        size: { x: -120, y: 160 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'testing',
          targetElementId: 'deploy',
          connectionType: 'flow',
          customStartPoint: { x: 1, y: 0.5 },
          customEndPoint: { x: 0.5, y: 0 },
          points: [
            { x: 0, y: 0 },
            { x: -120, y: 160 }
          ]
        },
        style: { stroke: '#4CAF50', strokeWidth: 2 }
      }
    ]
  }
]

// 模板5：客户服务流程模板
export const customerServiceTemplates: FlowTemplate[] = [
  {
    id: 'customer-service-1',
    name: '客户服务流程',
    description: '客户问题处理服务流程',
    previewImage: '/templates/customer-service-1.png',
    category: 'business',
    canvasSize: { width: 800, height: 600 },
    tags: ['客户', '服务', '问题'],
    elements: [
      {
        id: 'customer-call',
        type: 'shape',
        position: { x: 350, y: 50 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '客户来电',
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
        id: 'record-problem',
        type: 'shape',
        position: { x: 340, y: 150 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '问题记录',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#FFF8E1',
          stroke: '#FFC107',
          strokeWidth: 2
        }
      },
      {
        id: 'first-support',
        type: 'shape',
        position: { x: 340, y: 270 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '一线支持',
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
        id: 'record-solution',
        type: 'shape',
        position: { x: 540, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '记录解决',
          textStyle: {
            fontSize: 14,
            color: '#333333',
            textAlign: 'center'
          }
        },
        style: {
          fill: '#FFF8E1',
          stroke: '#FFC107',
          strokeWidth: 2
        }
      },
      {
        id: 'escalate',
        type: 'shape',
        position: { x: 140, y: 390 },
        size: { x: 120, y: 80 },
        data: {
          shapeType: 'rectangle',
          text: '升级处理',
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
        id: 'close-problem',
        type: 'shape',
        position: { x: 350, y: 510 },
        size: { x: 100, y: 60 },
        data: {
          shapeType: 'rectangle',
          text: '问题关闭',
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
        id: 'arrow-call-record',
        type: 'arrow',
        position: { x: 400, y: 110 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'customer-call',
          targetElementId: 'record-problem',
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
        id: 'arrow-record-support',
        type: 'arrow',
        position: { x: 400, y: 230 },
        size: { x: 0, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'record-problem',
          targetElementId: 'first-support',
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
        id: 'arrow-support-escalate',
        type: 'arrow',
        position: { x: 340, y: 350 },
        size: { x: -200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'first-support',
          targetElementId: 'escalate',
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
        id: 'arrow-support-record',
        type: 'arrow',
        position: { x: 460, y: 350 },
        size: { x: 200, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'first-support',
          targetElementId: 'record-solution',
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
        id: 'arrow-escalate-close',
        type: 'arrow',
        position: { x: 200, y: 470 },
        size: { x: 150, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'escalate',
          targetElementId: 'close-problem',
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
        id: 'arrow-record-close',
        type: 'arrow',
        position: { x: 600, y: 470 },
        size: { x: -150, y: 40 },
        data: {
          arrowType: 'line',
          arrowStyle: { headSize: 8, headAngle: 0.5 },
          isConnectionLine: true,
          sourceElementId: 'record-solution',
          targetElementId: 'close-problem',
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
  }
]

// 合并所有额外模板
export const additionalBusinessTemplates: FlowTemplate[] = [
  ...productDevTemplates,
  ...customerServiceTemplates
]
