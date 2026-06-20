import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import TarefaItem from '../components/TarefaItem'
import NovaTarefaModal from '../components/NovaTarefaModal'
import HealthBadge from '../components/HealthBadge'
import PillStatus from '../components/PillStatus'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { HEALTH_PESO, produtoLabel, tierLabel, hojeLocal } from '../lib/constants'

const ABAS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [aba, setAba] = useState('hoje')
  const [tarefas, setTarefas] = useState([])
  const [clientes, setClientes] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [loadingTarefas, setLoadingTarefas] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [erro, setErro] = useState('')

  const ref = hojeLocal()

  const carregarTarefas = async (qual = aba) => {
    setLoadingTarefas(true)
    try {
      setTarefas(await api.get(`/tarefas/${qual}?ref=${ref}`))
      setErro('')
    } catch (e) {
      setErro(e.message || 'Erro ao carregar tarefas.')
    } finally {
      setLoadingTarefas(false)
    }
  }

  const carregarPainel = async () => {
    try {
      const [m, cs] = await Promise.all([
        api.get(`/dashboard/metricas?ref=${ref}`),
        api.get('/clientes'),
      ])
      setMetricas(m)
      setClientes(cs)
    } catch {
      /* silencioso — os cards mostram traço enquanto não há dados */
    }
  }

  // Mount: gera alertas automáticos e depois carrega tudo
  useEffect(() => {
    ;(async () => {
      try {
        await api.post('/tarefas/gerar-alertas')
      } catch {
        /* não bloqueia o carregamento */
      }
      await Promise.all([carregarTarefas('hoje'), carregarPainel()])
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trocarAba = (nova) => {
    setAba(nova)
    carregarTarefas(nova)
  }

  const criarTarefa = async (form) => {
    await api.post('/tarefas', form)
    await Promise.all([carregarTarefas(), carregarPainel()])
  }

  const alternarTarefa = async (tarefa) => {
    const novo = tarefa.status === 'concluido' ? 'pendente' : 'concluido'
    // Atualização otimista
    setTarefas((ts) =>
      ts.map((t) => (t.id === tarefa.id ? { ...t, status: novo } : t)),
    )
    try {
      await api.patch(`/tarefas/${tarefa.id}`, { status: novo })
      carregarPainel()
    } catch {
      carregarTarefas()
    }
  }

  const removerTarefa = async (tarefa) => {
    setTarefas((ts) => ts.filter((t) => t.id !== tarefa.id))
    try {
      await api.del(`/tarefas/${tarefa.id}`)
      carregarPainel()
    } catch {
      carregarTarefas()
    }
  }

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const carteira = [...clientes].sort(
    (a, b) => HEALTH_PESO[a.health_score] - HEALTH_PESO[b.health_score],
  )
  const th = metricas?.tarefas_hoje

  return (
    <Layout title="Home">
      <div className="mx-auto max-w-6xl">
        {/* Saudação */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {saudacao}, {user?.email?.split('@')[0]} 👋
          </h2>
          <p className="mt-0.5 text-sm capitalize text-slate-500">{dataHoje}</p>
        </div>

        {/* Métricas */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Clientes ativos"
            value={metricas?.clientes_ativos ?? '—'}
            icon="👥"
          />
          <MetricCard
            label="Tarefas hoje"
            value={th ? `${th.concluidas}/${th.total}` : '—'}
            sub="concluídas / total"
            icon="✅"
          />
          <MetricCard
            label="Clientes em risco"
            value={metricas?.clientes_em_risco ?? '—'}
            sub="health vermelho ou preto"
            icon="⚠️"
            alerta
          />
          <MetricCard
            label="Onboarding calls"
            value={metricas?.proximas_onboarding_calls ?? '—'}
            sub="próximas / pendentes"
            icon="📞"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna esquerda — tarefas */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {ABAS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => trocarAba(a.value)}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                      aba === a.value
                        ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setModalAberto(true)} className="btn-primary">
                + Nova tarefa
              </button>
            </div>

            {loadingTarefas ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : erro ? (
              <div className="card text-sm text-red-600">{erro}</div>
            ) : tarefas.length === 0 ? (
              <div className="card flex flex-col items-center py-10 text-center">
                <p className="text-4xl">🗒️</p>
                <p className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
                  Nenhuma tarefa neste período
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Crie uma tarefa para organizar sua rotina.
                </p>
                <button onClick={() => setModalAberto(true)} className="btn-primary mt-4">
                  + Nova tarefa
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tarefas.map((t) => (
                  <TarefaItem
                    key={t.id}
                    tarefa={t}
                    onToggle={alternarTarefa}
                    onDelete={removerTarefa}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Coluna direita — carteira por urgência */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Carteira · ação pendente
            </h3>
            {carteira.length === 0 ? (
              <div className="card text-sm text-slate-500">
                Nenhum cliente cadastrado ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {carteira.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate('/clientes')}
                    className="card w-full text-left transition hover:border-brand-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {c.nome}
                      </p>
                      <HealthBadge value={c.health_score} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-600/15 dark:text-brand-200">
                        {produtoLabel(c.produto)}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {tierLabel(c.tier)}
                      </span>
                      <PillStatus value={c.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalAberto && (
        <NovaTarefaModal
          clientes={clientes}
          onClose={() => setModalAberto(false)}
          onCreate={criarTarefa}
        />
      )}
    </Layout>
  )
}
