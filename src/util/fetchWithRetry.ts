/**
 * Fetch with exponential backoff retry for temporary server errors (503, 502, 504)
 * 
 * @param url - URL to fetch
 * @param retries - Number of retry attempts (default: 3)
 * @param backoff - Initial backoff delay in ms (default: 1000)
 * @returns Response object
 * 
 * @example
 * const response = await fetchWithRetry('/api/quotes?symbols=AAPL');
 * if (response.ok) {
 *   const data = await response.json();
 * }
 */
export async function fetchWithRetry(
  url: string,
  retries = 3,
  backoff = 1000
): Promise<Response> {
  try {
    const response = await fetch(url);
    
    // Retry on temporary server errors (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
    if ([502, 503, 504].includes(response.status) && retries > 0) {
      console.warn(
        `Server error ${response.status} for ${url}, retrying in ${backoff}ms... (${retries} retries left)`
      );
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, retries - 1, backoff * 2); // Exponential backoff
    }
    
    return response;
  } catch (error) {
    // Network error (DNS failure, connection refused, etc.) - retry if retries left
    if (retries > 0) {
      console.warn(
        `Network error for ${url}, retrying in ${backoff}ms... (${retries} retries left)`,
        error
      );
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, retries - 1, backoff * 2);
    }
    throw error;
  }
}
