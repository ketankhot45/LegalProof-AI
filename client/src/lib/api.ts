export class ApiError extends Error {
  public status?: number;
  public data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/**
 * A robust wrapper around fetch that safely handles non-JSON responses
 * (like AI Studio iframe cookie-check HTML intercepts) without crashing.
 */
export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!isJson) {
    // Handle infrastructure-level HTML intercepts (e.g. 302 redirects for iframe cookie checks)
    if (contentType && contentType.includes('text/html')) {
      console.warn(`[API] Received HTML response from ${url}. This is typically caused by iframe third-party cookie restrictions or an API routing error.`);
      throw new ApiError('Unable to connect to the server. Please try again or open the application in a new tab.', res.status);
    }
    
    // Generic fallback for other unexpected content types
    throw new ApiError('Received an invalid response format from the server.', res.status);
  }

  const data = await res.json();

  if (!res.ok) {
    // Preserve the original API error messages and payload for components to handle
    throw new ApiError(data.error || 'Request failed', res.status, data);
  }

  return { res, data };
}
