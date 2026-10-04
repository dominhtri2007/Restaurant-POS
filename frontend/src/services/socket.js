import io from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.REACT_APP_SOCKET_URL) {
    return window.__ENV__.REACT_APP_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      const backendPort = process.env.REACT_APP_BACKEND_PORT || 5000;
      return `${protocol}//${hostname}:${backendPort}`;
    }
  }
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.REACT_APP_API_URL) {
    return window.__ENV__.REACT_APP_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      const backendPort = process.env.REACT_APP_BACKEND_PORT || 5000;
      return `${protocol}//${hostname}:${backendPort}/api`;
    }
  }
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
socket.on('connect', () => {
  console.log('[Socket] Connected to server:', socket.id);
});
socket.on('connect_error', (error) => {
  console.warn('[Socket] Connect error:', error.message);
});
socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});
