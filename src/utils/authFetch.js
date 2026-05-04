import { apiCache, CACHE_TTL } from './apiCache'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
let csrfToken = null

// Map to track in-flight requests for deduplication
const inflightRequests = new Map()

function toAbsoluteUrl(url) {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return `${API_BASE}/${url}`
}

/**
 * Create a unique key for deduplication based on request details
 */
function createRequestKey(url, method, body) {
  const bodyStr = body ? JSON.stringify(body) : ''
  return `${method}:${url}:${bodyStr}`
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken

  const res = await fetch(`${API_BASE}/api/csrf-token`, {
    method: 'GET',
    credentials: 'include'
  })

  if (!res.ok) {
    throw new Error(`CSRF token fetch failed: ${res.status}`)
  }

  const data = await res.json().catch(() => ({}))
  csrfToken = data?.csrfToken || res.headers.get('x-csrf-token') || null
  return csrfToken
}

export async function authFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const isUnsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const skipCache = options.skipCache === true
  const skipDedup = options.skipDedup === true
  
  const absoluteUrl = toAbsoluteUrl(url)
  
  // Try to get from cache for GET requests
  if (method === 'GET' && !skipCache) {
    const cached = apiCache.get(absoluteUrl)
    if (cached) {
      // Return cached response (clone it if it's a Response object)
      if (cached instanceof Response) {
        return cached.clone()
      }
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // Check for in-flight request deduplication (for GET requests)
  if (method === 'GET' && !skipDedup) {
    const requestKey = createRequestKey(absoluteUrl, method, null)
    if (inflightRequests.has(requestKey)) {
      return inflightRequests.get(requestKey)
    }
  }

  const token = localStorage.getItem('accessToken')
  const headers = {
    ...(options.headers || {})
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  if (isUnsafeMethod && !headers['X-CSRF-Token']) {
    const tokenValue = await getCsrfToken()
    if (tokenValue) {
      headers['X-CSRF-Token'] = tokenValue
    }
  }

  const requestInit = {
    credentials: 'include',
    ...options,
    headers
  }

  // Create the request promise for deduplication
  const requestPromise = (async () => {
    let response = await fetch(absoluteUrl, requestInit)

    if (response.status === 403 && isUnsafeMethod) {
      csrfToken = null
      const refreshedToken = await getCsrfToken().catch(() => null)
      if (refreshedToken) {
        const retryHeaders = {
          ...headers,
          'X-CSRF-Token': refreshedToken
        }
        response = await fetch(absoluteUrl, {
          ...requestInit,
          headers: retryHeaders
        })
      }
    }

    // Cache successful GET responses
    if (method === 'GET' && response.ok && !skipCache) {
      const cacheTtl = options.cacheTtl || CACHE_TTL.MEDIUM
      
      // Clone response for caching (since response body can only be read once)
      const responseToCache = response.clone()
      
      try {
        const data = await responseToCache.json()
        apiCache.set(absoluteUrl, data, cacheTtl)
      } catch {
        // If response is not JSON, cache the whole response
        apiCache.set(absoluteUrl, response.clone(), cacheTtl)
      }
    }

    return response
  })()

  // Store the promise for GET requests (for deduplication)
  if (method === 'GET' && !skipDedup) {
    const requestKey = createRequestKey(absoluteUrl, method, null)
    inflightRequests.set(requestKey, requestPromise)
    
    // Clean up after request completes
    requestPromise.finally(() => {
      inflightRequests.delete(requestKey)
    })
  }

  return requestPromise
}
