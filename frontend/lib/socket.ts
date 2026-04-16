import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const STORAGE_KEY = 'perfil_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : 'http://localhost:3001';
    
    const sessionId = getOrCreateSessionId();
    
    console.log('Criando nova conexão socket:', socketUrl, 'sessionId:', sessionId);
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      query: { sessionId }
    });

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

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSessionId = (): string => {
  return getOrCreateSessionId();
};

export const clearSession = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('perfil_session_id');
  }
};
