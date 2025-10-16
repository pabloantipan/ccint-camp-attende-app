import { environment } from '@environments/environment';

/**
 * API Configuration
 */

export const API_CONFIG = {
  // Base URL - points to backend API Cloud Run instance
  // In development: http://localhost:8080
  // In production: https://api-xxx.run.app (your backend Cloud Run URL)
  baseUrl: environment.apiUrl,

  // Request timeout in milliseconds
  timeout: 30000, // 30 seconds

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // Initial delay in ms
    backoffMultiplier: 2, // Exponential backoff
    maxDelay: 10000, // Max delay between retries
  },

  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Registration endpoints
  registrations: '/api/registrations',
  registrationsBatch: '/api/registrations/batch',
  registrationById: (id: string) => `/api/registrations/${id}`,
  registrationsStats: '/api/registrations/stats',

  // Session endpoints
  sessionLogin: '/api/session/login',
  sessionLogout: '/api/session/logout',
  sessionVerify: '/api/session/verify',

  // Constants endpoints
  constantsLocations: '/api/constants/locations',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
