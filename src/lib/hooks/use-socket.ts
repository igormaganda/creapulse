'use client'
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const userIdRef = useRef<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (socketInstance) return // singleton

    // Get userId from localStorage auth store
    try {
      const stored = localStorage.getItem('creapulse-auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        userIdRef.current = parsed?.state?.user?.id || ''
      }
    } catch {}

    socketInstance = io('/?XTransformPort=3004', { reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 2000 })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      if (userIdRef.current) {
        socketInstance!.emit('join', { userId: userIdRef.current, tenantId: '' })
      }
    })
    socketInstance.on('disconnect', () => setIsConnected(false))

    return () => { socketInstance?.disconnect(); socketInstance = null }
  }, [])

  return { socket: socketInstance, isConnected }
}