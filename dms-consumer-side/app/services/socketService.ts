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
  }
  return socket;
}

export function joinRoom(room: string) {
  socket?.emit('join', room);
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