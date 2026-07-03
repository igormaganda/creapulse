import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket) => {
  console.log(`[realtime] connected: ${socket.id}`)

  socket.on('join', (data: { userId?: string; tenantId?: string; conversationId?: string }) => {
    const { userId, tenantId, conversationId } = data
    if (userId) socket.join(`user:${userId}`)
    if (tenantId) socket.join(`tenant:${tenantId}`)
    if (conversationId) socket.join(`conversation:${conversationId}`)
    console.log(`[realtime] ${socket.id} joined rooms: user=${userId} tenant=${tenantId} conv=${conversationId}`)
  })

  // Relay message:new to conversation room (room = conversation id)
  socket.on('message:new', (payload: { conversationId: string; message: unknown }) => {
    io.to(`conversation:${payload.conversationId}`).emit('message:new', payload.message)
  })

  // Relay notification:new to user room
  socket.on('notification:new', (payload: { userId: string; notification: unknown }) => {
    io.to(`user:${payload.userId}`).emit('notification:new', payload.notification)
  })

  // Relay dashboard:update to tenant room
  socket.on('dashboard:update', (payload: { tenantId: string; data: unknown }) => {
    io.to(`tenant:${payload.tenantId}`).emit('dashboard:update', payload.data)
  })

  socket.on('disconnect', () => {
    console.log(`[realtime] disconnected: ${socket.id}`)
  })
})

const PORT = 3004
httpServer.listen(PORT, () => {
  console.log(`[realtime] Socket.IO server running on port ${PORT}`)
})

process.on('SIGTERM', () => { httpServer.close(() => process.exit(0)) })
process.on('SIGINT', () => { httpServer.close(() => process.exit(0)) })