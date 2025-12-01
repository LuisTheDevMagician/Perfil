// Socket.io singleton para compartilhar a mesma conexão entre páginas
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : 'http://localhost:3000';
    
    console.log('Criando nova conexão socket:', socketUrl);
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    // Log de conexão
    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Erro de conexão:', error);
    });
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
