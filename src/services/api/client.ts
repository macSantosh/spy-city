/**
 * Base API Client
 * 
 * Centralized fetch wrapper with retry logic, timeouts, and error handling.
 */

import { API_CONFIG } from '@/config';
import { logger } from '@/utils/logger';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Fetch with automatic retries and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = API_CONFIG.retries
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // If successful or non-retryable error, return
    if (response.ok || response.status < 500) {
      return response;
    }
    
    // Retry on 5xx errors
    if (retries > 0) {
      logger.warn(`Request failed with ${response.status}, retrying...`, {
        data: { url, retriesLeft: retries },
      });
      
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry on network errors
    if (retries > 0 && error instanceof Error) {
      logger.warn(`Request failed: ${error.message}, retrying...`, {
        data: { url, retriesLeft: retries },
      });
      
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
}

/**
 * Make a GET request
 */
export async function get<T = any>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`GET request failed: ${url}`, new Error(errorText), {
        data: { status: response.status },
      });
      
      throw new ApiClientError(
        `HTTP ${response.status}: ${errorText}`,
        response.status
      );
    }
    
    return await response.json();
    
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    logger.error(`GET request error: ${url}`, error);
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Make a POST request
 */
export async function post<T = any>(
  url: string,
  body?: any,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`POST request failed: ${url}`, new Error(errorText), {
        data: { status: response.status },
      });
      
      throw new ApiClientError(
        `HTTP ${response.status}: ${errorText}`,
        response.status
      );
    }
    
    return await response.json();
    
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    logger.error(`POST request error: ${url}`, error);
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'NETWORK_ERROR'
    );
  }
}
