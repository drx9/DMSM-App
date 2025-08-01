import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://dmsm-app-production-a35d.up.railway.app';
let socket: Socket | null = null;

export function connectSocket(token?: string) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: token ? { token } : undefined,
    });
    
    // Add connection event listeners
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
}

export function joinRoom(room: string) {
  console.log(`[Socket] Joining room: ${room}`);
  if (socket) {
    socket.emit('join', room);
    console.log(`[Socket] Join event emitted for room: ${room}`);
  } else {
    console.error('[Socket] Cannot join room: socket not initialized');
  }
}

export function leaveRoom(room: string) {
  socket?.emit('leave', room);
}

export function onSocketEvent(event: string, handler: (...args: any[]) => void) {
  socket?.on(event, handler);
}

export function offSocketEvent(event: string, handler: (...args: any[]) => void) {
  socket?.off(event, handler);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
} 

// Default export for Expo Router
export default {
  connectSocket,
  joinRoom,
  leaveRoom,
  onSocketEvent,
  offSocketEvent,
  disconnectSocket
}; 