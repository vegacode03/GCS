import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Wrapper de fetch para o backend FastAPI.
 * Injeta automaticamente o JWT do Supabase no header Authorization.
 */
async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const token = session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    let detail
    try {
      detail = (await res.json()).detail
    } catch {
      detail = res.statusText
    }
    throw new Error(detail || `Erro ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  health: () => request('/health'),
}
