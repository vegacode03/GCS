import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Retorna um access_token válido, renovando a sessão se ela já expirou
 * ou está prestes a expirar (margem de 60s). Evita enviar token velho
 * ao backend (que responderia 401 "Token inválido ou expirado").
 */
async function getValidToken() {
  let {
    data: { session },
  } = await supabase.auth.getSession()

  const agora = Math.floor(Date.now() / 1000)
  const expirando = session?.expires_at && session.expires_at - agora < 60

  if (!session || expirando) {
    const { data, error } = await supabase.auth.refreshSession()
    if (!error && data?.session) session = data.session
  }

  return session?.access_token
}

/**
 * Wrapper de fetch para o backend FastAPI.
 * Injeta o JWT do Supabase e, em caso de 401, tenta renovar a sessão
 * e repetir a chamada uma vez antes de desistir.
 */
async function request(path, { method = 'GET', body, headers = {} } = {}, _retry = false) {
  const token = await getValidToken()

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  // Token expirou no servidor: renova e tenta de novo (uma vez só).
  if (res.status === 401 && !_retry) {
    const { data, error } = await supabase.auth.refreshSession()
    if (!error && data?.session) {
      return request(path, { method, body, headers }, true)
    }
    // Refresh falhou → sessão realmente inválida: volta pro login.
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') window.location.assign('/login')
    throw new Error('Sessão expirada. Faça login novamente.')
  }

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
