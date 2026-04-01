/**
 * FlowCanvas WebSocket 服务器
 * 支持多房间、多用户实时协作
 */

import { WebSocketServer } from 'ws'

const PORT = 8081

// 存储所有房间
const rooms = new Map()

/**
 * 获取或创建房间
 */
function getOrCreateRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      name: roomName,
      users: new Map(),
      state: {}
    })
    console.log(`[Server] 创建新房间: ${roomName}`)
  }
  return rooms.get(roomName)
}

/**
 * 广播消息给房间内所有用户
 */
function broadcastToRoom(room, message, excludeId) {
  const data = JSON.stringify(message)
  
  room.users.forEach((client, id) => {
    if (id !== excludeId && client.ws.readyState === 1) {
      try {
        client.ws.send(data)
      } catch (e) {
        console.error(`[Server] 发送给用户 ${id} 失败:`, e)
      }
    }
  })
}

/**
 * 发送消息给指定用户
 */
function sendToUser(ws, message) {
  if (ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(message))
    } catch (e) {
      console.error('[Server] 发送消息失败:', e)
    }
  }
}

/**
 * 获取房间用户列表
 */
function getRoomUserList(room) {
  const users = []
  room.users.forEach((client) => {
    users.push(client.user)
  })
  return users
}

/**
 * 生成随机颜色
 */
function generateColor() {
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffc107', '#ff9800', '#ff5722', '#795548'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ port: PORT })

console.log(`[Server] FlowCanvas WebSocket 服务器启动，监听端口 ${PORT}`)

wss.on('connection', (ws, req) => {
  // 从 URL 获取房间名
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const roomName = url.searchParams.get('room') || 'default'
  const userId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

  console.log(`[Server] 新连接: ${userId}, 房间: ${roomName}`)

  // 获取或创建房间
  const room = getOrCreateRoom(roomName)
  
  // 添加用户到房间
  room.users.set(userId, {
    ws,
    user: { id: userId, name: 'Anonymous', color: generateColor() }
  })

  // 发送欢迎消息
  sendToUser(ws, {
    type: 'welcome',
    userId: 'server',
    timestamp: Date.now(),
    payload: {
      userId,
      roomName,
      users: getRoomUserList(room)
    }
  })

  // 广播用户加入
  broadcastToRoom(room, {
    type: 'user-join',
    userId,
    timestamp: Date.now(),
    payload: room.users.get(userId)?.user
  }, userId)

  // 处理消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      
      // 忽略心跳
      if (message.type === 'ping') {
        return
      }

      console.log(`[Server] 消息 [${message.type}] from ${userId}`)

      switch (message.type) {
        case 'user-info':
          // 更新用户信息
          const client = room.users.get(userId)
          if (client) {
            client.user = {
              ...client.user,
              ...message.payload
            }
            // 广播用户信息更新
            broadcastToRoom(room, {
              type: 'user-list',
              userId: 'server',
              timestamp: Date.now(),
              payload: getRoomUserList(room)
            })
          }
          break

        case 'cursor':
          // 更新用户光标位置
          const cursorClient = room.users.get(userId)
          if (cursorClient) {
            cursorClient.user.cursor = message.payload.position
            // 广播光标给其他用户
            broadcastToRoom(room, message, userId)
          }
          break

        case 'operation':
          // 广播操作给其他用户
          broadcastToRoom(room, message, userId)
          break

        case 'sync-request':
          // 响应同步请求
          sendToUser(ws, {
            type: 'sync-response',
            userId: 'server',
            timestamp: Date.now(),
            payload: {
              users: getRoomUserList(room),
              state: room.state
            }
          })
          break

        case 'user-join':
          // 处理用户加入（可能包含用户信息）
          if (message.payload) {
            const joinClient = room.users.get(userId)
            if (joinClient) {
              joinClient.user = { ...joinClient.user, ...message.payload }
            }
          }
          break

        default:
          // 广播其他消息
          broadcastToRoom(room, message, userId)
      }
    } catch (e) {
      console.error('[Server] 消息解析失败:', e)
    }
  })

  // 处理断开
  ws.on('close', () => {
    console.log(`[Server] 用户断开: ${userId}`)
    
    const room = rooms.get(roomName)
    if (room) {
      room.users.delete(userId)
      
      // 广播用户离开
      broadcastToRoom(room, {
        type: 'user-leave',
        userId,
        timestamp: Date.now(),
        payload: { id: userId }
      })

      // 如果房间空了，可以选择删除房间
      if (room.users.size === 0) {
        console.log(`[Server] 房间 ${roomName} 已清空`)
        // 保持房间一段时间后删除
        setTimeout(() => {
          if (rooms.has(roomName) && rooms.get(roomName).users.size === 0) {
            rooms.delete(roomName)
            console.log(`[Server] 删除空房间: ${roomName}`)
          }
        }, 60000) // 1分钟后删除
      }
    }
  })

  // 处理错误
  ws.on('error', (error) => {
    console.error(`[Server] WebSocket 错误 (${userId}):`, error)
  })
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[Server] 正在关闭...')
  
  wss.clients.forEach((client) => {
    client.close(1000, 'Server shutdown')
  })
  
  wss.close(() => {
    console.log('[Server] 已关闭')
    process.exit(0)
  })
})

console.log('[Server] 输入 Ctrl+C 停止服务器')
