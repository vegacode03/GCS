import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import JornadaStep from './JornadaStep'
import HealthBadge from './HealthBadge'
import { PRODUTOS, TIERS, STATUS, HEALTH, produtoLabel } from '../lib/constants'

/**
 * Painel lateral (drawer) com a jornada completa de um cliente.
 * Permite editar status/health/tier/produto, arquivar e gerir etapas.
 */
export default function JornadaPanel({ clienteId, onClose, onChanged }) {
  const [cliente, setCliente] = useState(null)
  const [etapas, setEtapas] = useState([])
  const [anotacoes, setAnotacoes] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    const [c, j, a] = await Promise.all([
      api.get(`/clientes/${clienteId}`),
      api.get(`/clientes/${clienteId}/jornada`),
      api.get(`/clientes/${clienteId}/anotacoes`),
    ])
    setCliente(c)
    setEtapas(j)
    setAnotacoes(a)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    carregar().catch(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  const patchCliente = async (changes) => {
    const atualizado = await api.patch(`/clientes/${clienteId}`, changes)
    setCliente(atualizado)
    onChanged?.()
  }

  const updateStep = async (stepId, novoStatus) => {
    await api.patch(`/clientes/${clienteId}/jornada/${stepId}`, { status: novoStatus })
    const j = await api.get(`/clientes/${clienteId}/jornada`)
    setEtapas(j)
    onChanged?.()
  }

  const addAnotacao = async (stepId, texto) => {
    const nova = await api.post(`/clientes/${clienteId}/anotacoes`, {
      client_step_id: stepId,
      texto,
    })
    setAnotacoes((prev) => [nova, ...prev])
  }

  const arquivar = async () => {
    if (!confirm('Arquivar este cliente? Ele sai da lista de ativos.')) return
    await api.del(`/clientes/${clienteId}`)
    onChanged?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-lg flex-col bg-slate-50 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecalho */}
        <header className="flex items-start justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          {loading || !cliente ? (
            <p className="text-sm text-slate-500">Carregando…</p>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <HealthBadge value={cliente.health_score} />
                <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {cliente.nome}
                </h2>
              </div>
              {cliente.empresa && (
                <p className="text-xs text-slate-500">{cliente.empresa}</p>
              )}
              <p className="mt-0.5 text-xs text-slate-400">
                {produtoLabel(cliente.produto)}
              </p>
            </div>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </header>

        {/* Controles do cliente */}
        {cliente && (
          <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
            <Campo label="Status">
              <select
                className="input py-1 text-xs"
                value={cliente.status}
                onChange={(e) => patchCliente({ status: e.target.value })}
              >
                {STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Health score">
              <select
                className="input py-1 text-xs"
                value={cliente.health_score}
                onChange={(e) => patchCliente({ health_score: e.target.value })}
              >
                {HEALTH.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Tier">
              <select
                className="input py-1 text-xs"
                value={cliente.tier}
                onChange={(e) => patchCliente({ tier: e.target.value })}
              >
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Produto">
              <select
                className="input py-1 text-xs"
                value={cliente.produto}
                onChange={(e) => patchCliente({ produto: e.target.value })}
              >
                {PRODUTOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        )}

        {/* Jornada */}
        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Jornada de onboarding
          </h3>
          {loading ? (
            <p className="text-sm text-slate-500">Carregando etapas…</p>
          ) : (
            etapas.map((step) => (
              <JornadaStep
                key={step.id}
                step={step}
                anotacoes={anotacoes.filter((a) => a.client_step_id === step.id)}
                onUpdateStatus={updateStep}
                onAddAnotacao={addAnotacao}
              />
            ))
          )}
        </div>

        {/* Rodape */}
        <footer className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <button
            onClick={arquivar}
            className="text-xs font-medium text-red-600 hover:text-red-700"
          >
            Arquivar cliente
          </button>
        </footer>
      </aside>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}
