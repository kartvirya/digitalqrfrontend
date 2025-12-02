// Environment variables for the application
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// API configuration
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Feature flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === 'true';

// App configuration
export const APP_NAME = 'Digital QR';
export const APP_VERSION = '1.0.0';
