import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// SOCKET_URL must be the bare host — NOT the /api/v1 REST prefix.
// e.g. VITE_SOCKET_URL=http://localhost:3005
// The namespace '/support' is appended by socket.io-client automatically.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3005';

// Singleton — one socket for the whole app lifetime.
let globalSocket: Socket | null = null;

function getOrCreateSocket(): Socket {
  if (globalSocket && (globalSocket.connected || globalSocket.active)) {
    return globalSocket;
  }

  console.log('[Socket] Creating new connection to', `${SOCKET_URL}/support`);
  globalSocket = io(`${SOCKET_URL}/support`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return globalSocket;
}

export const useSocket = () => {
  const socketRef = useRef<Socket>(getOrCreateSocket());
  const [isConnected, setIsConnected] = useState(() => socketRef.current.connected);

  useEffect(() => {
    const socket = socketRef.current;

    // Sync state in case it connected between render and effect
    if (socket.connected && !socket.active) {
      setIsConnected(true);
    }

    const onConnect = () => {
      console.log('[Socket] Connected ✓', socket.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.warn('[Socket] Disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // If already connected when the hook mounts, set state immediately
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
};
