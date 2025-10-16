import { Injectable } from '@angular/core';
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from './api-config';
import type {
  ApiResponse,
  RegistrationData,
  CreateRegistrationRequest,
  CreateRegistrationResponse,
  BatchSyncRequest,
  BatchSyncResponse,
  RegistrationStats,
  ApiError,
} from './api.interfaces';

/**
 * Registration API Service
 * Handles all HTTP communication with the server for registrations
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationApiService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
  }

  /**
   * Create a single registration
   */
  async createRegistration(data: CreateRegistrationRequest): Promise<CreateRegistrationResponse> {
    const response = await this.fetchWithRetry<ApiResponse<CreateRegistrationResponse>>(
      API_ENDPOINTS.registrations,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.success || !response.data) {
      throw this.createError(HTTP_STATUS.BAD_REQUEST, response.error || 'Failed to create registration');
    }

    return response.data;
  }

  /**
   * Batch sync registrations (for offline sync)
   */
  async batchSync(registrations: CreateRegistrationRequest[]): Promise<BatchSyncResponse> {
    const request: BatchSyncRequest = { registrations };

    const response = await this.fetchWithRetry<BatchSyncResponse>(
      API_ENDPOINTS.registrationsBatch,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    if (!response.success) {
      throw this.createError(HTTP_STATUS.BAD_REQUEST, 'Batch sync failed');
    }

    return response;
  }

  /**
   * Get a single registration by ID
   */
  async getRegistration(id: string): Promise<RegistrationData> {
    const response = await this.fetchWithRetry<ApiResponse<RegistrationData>>(
      API_ENDPOINTS.registrationById(id),
      {
        method: 'GET',
      }
    );

    if (!response.success || !response.data) {
      throw this.createError(HTTP_STATUS.NOT_FOUND, response.error || 'Registration not found');
    }

    return response.data;
  }

  /**
   * Get all registrations for the current user
   */
  async getAllRegistrations(filters?: { status?: string; limit?: number }): Promise<RegistrationData[]> {
    let url = API_ENDPOINTS.registrations;

    // Add query parameters
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await this.fetchWithRetry<ApiResponse<RegistrationData[]>>(
      url,
      {
        method: 'GET',
      }
    );

    if (!response.success || !response.data) {
      throw this.createError(HTTP_STATUS.INTERNAL_SERVER_ERROR, response.error || 'Failed to fetch registrations');
    }

    return response.data;
  }

  /**
   * Update a registration
   */
  async updateRegistration(id: string, data: Partial<RegistrationData>): Promise<void> {
    const response = await this.fetchWithRetry<ApiResponse>(
      API_ENDPOINTS.registrationById(id),
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw this.createError(HTTP_STATUS.BAD_REQUEST, response.error || 'Failed to update registration');
    }
  }

  /**
   * Delete a registration
   */
  async deleteRegistration(id: string): Promise<void> {
    const response = await this.fetchWithRetry<ApiResponse>(
      API_ENDPOINTS.registrationById(id),
      {
        method: 'DELETE',
      }
    );

    if (!response.success) {
      throw this.createError(HTTP_STATUS.BAD_REQUEST, response.error || 'Failed to delete registration');
    }
  }

  /**
   * Get registration statistics
   */
  async getStats(): Promise<RegistrationStats> {
    const response = await this.fetchWithRetry<ApiResponse<RegistrationStats>>(
      API_ENDPOINTS.registrationsStats,
      {
        method: 'GET',
      }
    );

    if (!response.success || !response.data) {
      throw this.createError(HTTP_STATUS.INTERNAL_SERVER_ERROR, response.error || 'Failed to fetch statistics');
    }

    return response.data;
  }

  /**
   * Fetch with automatic retry and exponential backoff
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers,
        },
        credentials: 'same-origin', // Include cookies
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different status codes
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        // Session expired, redirect to login
        window.location.href = '/login/sign-in';
        throw this.createError(HTTP_STATUS.UNAUTHORIZED, 'Session expired');
      }

      if (response.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        // Rate limited, retry after delay
        if (retryCount < API_CONFIG.retry.attempts) {
          const delay = this.calculateRetryDelay(retryCount);
          await this.sleep(delay);
          return this.fetchWithRetry(url, options, retryCount + 1);
        }
        throw this.createError(HTTP_STATUS.TOO_MANY_REQUESTS, 'Rate limit exceeded');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createError(response.status, errorData.error || 'Request failed', errorData.errors);
      }

      return await response.json();
    } catch (error: any) {
      // Retry on network errors
      if (this.isRetryableError(error) && retryCount < API_CONFIG.retry.attempts) {
        const delay = this.calculateRetryDelay(retryCount);
        console.log(`Retrying request (attempt ${retryCount + 1}/${API_CONFIG.retry.attempts}) after ${delay}ms`);
        await this.sleep(delay);
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors, timeouts, and server errors are retryable
    return (
      error.name === 'AbortError' ||
      error.name === 'NetworkError' ||
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      (error.status >= 500 && error.status < 600)
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = API_CONFIG.retry.delay * Math.pow(API_CONFIG.retry.backoffMultiplier, retryCount);
    return Math.min(delay, API_CONFIG.retry.maxDelay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create standardized API error
   */
  private createError(status: number, message: string, errors?: any[]): ApiError {
    return {
      status,
      message,
      errors,
    };
  }
}
