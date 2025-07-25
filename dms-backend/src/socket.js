// dms-backend/src/socket.js
const { Server } = require('socket.io');

let io;
const rooms = {};

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    // Join rooms by role, user, order, etc.
    socket.on('join', (room) => {
      socket.join(room);
      if (!rooms[room]) rooms[room] = new Set();
      rooms[room].add(socket.id);
    });
    socket.on('leave', (room) => {
      socket.leave(room);
      if (rooms[room]) rooms[room].delete(socket.id);
    });
    socket.on('disconnect', () => {
      Object.keys(rooms).forEach((room) => rooms[room].delete(socket.id));
    });
  });
}

function emitToRoom(room, event, data) {
  if (io) io.to(room).emit(event, data);
}

function emitToUser(userId, event, data) {
  emitToRoom(`user_${userId}`, event, data);
}

function emitToOrder(orderId, event, data) {
  emitToRoom(`order_${orderId}`, event, data);
}

function emitToRole(role, event, data) {
  emitToRoom(`role_${role}`, event, data);
}

module.exports = {
  initSocket,
  emitToRoom,
  emitToUser,
  emitToOrder,
  emitToRole,
}; 