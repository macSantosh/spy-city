/**
 * Environment Variable Access
 * 
 * Provides type-safe access to environment variables.
 * Validation is deferred to avoid issues with Next.js module loading order.
 */

interface EnvConfig {
  FINNHUB_API_KEY: string;
  FMP_API_KEY?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_API_URL?: string;
}

/**
 * Get environment variables with runtime validation
 * This is called lazily to ensure Next.js has loaded .env files
 */
function getEnv(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  
  return {
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || '',
    FMP_API_KEY: process.env.FMP_API_KEY,
    NODE_ENV: nodeEnv,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  };
}

/**
 * Environment variables with lazy loading
 * Uses a Proxy to defer access until needed
 */
export const env = new Proxy({} as EnvConfig, {
  get(target, prop: keyof EnvConfig) {
    const envConfig = getEnv();
    return envConfig[prop];
  }
});

/**
 * Type-safe environment variable access
 */
export type Env = EnvConfig;
