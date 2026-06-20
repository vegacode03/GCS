import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Home() {
  const { user } = useAuth()
  const [backendStatus, setBackendStatus] = useState('checando…')

  useEffect(() => {
    api
      .health()
      .then((res) => setBackendStatus(res?.status === 'ok' ? 'online' : 'erro'))
      .catch(() => setBackendStatus('offline'))
  }, [])

  const hora = new Date().getHours()
  const saudacao =
    hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <Layout title="Home">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {saudacao}, {user?.email?.split('@')[0]} 👋
        </h2>
        <p className="mt-1 text-slate-500">
          Bem-vindo ao GCS. O setup da Fase 1 está concluído.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card">
            <p className="text-sm text-slate-500">Status do backend</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-green-500'
                    : backendStatus === 'checando…'
                      ? 'bg-amber-400'
                      : 'bg-red-500'
                }`}
              />
              {backendStatus}
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-slate-500">Próximos passos</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Fase 2 — Clientes e Jornada de Onboarding
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
