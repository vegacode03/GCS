import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp, session } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Se ja estiver logado, manda pra home
  useEffect(() => {
    if (session) navigate('/home', { replace: true })
  }, [session, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/home', { replace: true })
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setInfo('Conta criada! Você já pode entrar.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Falha na autenticação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            G
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            GCS
          </h1>
          <p className="text-sm text-slate-500">Guia do Customer Success</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              E-mail
            </label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@pagsmile.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Senha
            </label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40">
              {info}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading
              ? 'Aguarde…'
              : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
          </button>

          <p className="text-center text-sm text-slate-500">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
                setInfo('')
              }}
              className="font-medium text-brand-600 hover:underline"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
