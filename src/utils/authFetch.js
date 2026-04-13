const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
let csrfToken = null

function toAbsoluteUrl(url) {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return `${API_BASE}/${url}`
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

  let response = await fetch(toAbsoluteUrl(url), requestInit)

  if (response.status === 403 && isUnsafeMethod) {
    csrfToken = null
    const refreshedToken = await getCsrfToken().catch(() => null)
    if (refreshedToken) {
      const retryHeaders = {
        ...headers,
        'X-CSRF-Token': refreshedToken
      }
      response = await fetch(toAbsoluteUrl(url), {
        ...requestInit,
        headers: retryHeaders
      })
    }
  }

  return response
}
