import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import PillStatus from '../components/PillStatus'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { produtoLabel, tierLabel, hojeLocal } from '../lib/constants'

const PERIODOS = [
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'personalizado', label: 'Personalizado' },
]

/** Monta o texto-base do resumo do gestor a partir das métricas. */
function resumoPadrao(d) {
  const tempo =
    d.tempo_medio_onboarding_dias != null
      ? `${d.tempo_medio_onboarding_dias} dias em média`
      : 'sem onboardings concluídos no período'
  return (
    `No período de ${d.periodo.label}, a carteira somou ${d.total_clientes} ` +
    `cliente(s) gerenciado(s), dos quais ${d.onboardados} concluíram o onboarding ` +
    `(taxa de conclusão de ${d.taxa_conclusao_onboarding}%) e ${d.em_andamento} ` +
    `seguem em andamento. O tempo de onboarding ficou em ${tempo}. ` +
    `Foram realizados ${d.qbrs_realizados} QBR(s) e registrados ` +
    `${d.incidentes_caderno} incidente(s). ` +
    `Próximos passos: priorizar os clientes com menor progresso e os marcados em risco.`
  )
}

export default function Relatorio() {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState('mes_atual')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [resumo, setResumo] = useState('')
  const resumoEditado = useRef(false)

  const csm = user?.email?.split('@')[0] ?? 'CSM'

  const carregar = async (p = periodo) => {
    if (p === 'personalizado' && (!dataInicio || !dataFim)) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ periodo: p, ref: hojeLocal() })
      if (p === 'personalizado') {
        params.set('data_inicio', dataInicio)
        params.set('data_fim', dataFim)
      }
      const d = await api.get(`/relatorio?${params.toString()}`)
      setDados(d)
      setErro('')
      if (!resumoEditado.current) setResumo(resumoPadrao(d))
    } catch (e) {
      setErro(e.message || 'Erro ao carregar o relatório.')
    } finally {
      setLoading(false)
    }
  }

  // Carrega ao montar e quando troca para mês atual / trimestre
  useEffect(() => {
    if (periodo !== 'personalizado') carregar(periodo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  const trocarPeriodo = (p) => {
    resumoEditado.current = false
    setPeriodo(p)
  }

  const [exportando, setExportando] = useState(false)
  const exportar = async () => {
    if (!dados) return
    setExportando(true)
    try {
      const { gerarRelatorioPDF } = await import('../lib/pdf')
      gerarRelatorioPDF({ dados, resumo, csm })
    } finally {
      setExportando(false)
    }
  }

  const statusEntries = dados ? Object.entries(dados.clientes_por_status) : []

  return (
    <Layout title="Relatório">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho + filtro */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Relatório do período
            </h2>
            <p className="text-sm text-slate-500">
              {dados ? dados.periodo.label : 'Selecione o período'}
            </p>
          </div>
          <button
            onClick={exportar}
            disabled={!dados || exportando}
            className="btn-primary"
          >
            {exportando ? 'Gerando…' : '⬇ Exportar PDF'}
          </button>
        </div>

        {/* Seletor de período */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                onClick={() => trocarPeriodo(p.value)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                  periodo === p.value
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="input w-auto"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <span className="text-slate-400">→</span>
              <input
                type="date"
                className="input w-auto"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
              <button
                onClick={() => {
                  resumoEditado.current = false
                  carregar('personalizado')
                }}
                className="btn-ghost"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : erro ? (
          <div className="card text-sm text-red-600">{erro}</div>
        ) : !dados ? (
          <div className="card text-sm text-slate-500">
            Escolha um período para gerar o relatório.
          </div>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Onboardados" value={dados.onboardados} icon="🎓" />
              <MetricCard label="Em andamento" value={dados.em_andamento} icon="⏳" />
              <MetricCard
                label="Taxa de conclusão"
                value={`${dados.taxa_conclusao_onboarding}%`}
                icon="✅"
              />
              <MetricCard
                label="Tempo médio onboarding"
                value={
                  dados.tempo_medio_onboarding_dias != null
                    ? `${dados.tempo_medio_onboarding_dias}d`
                    : '—'
                }
                icon="⏱️"
              />
            </div>

            {/* Resumo secundário */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>
                Total de clientes:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {dados.total_clientes}
                </strong>
              </span>
              <span>
                QBRs no período:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {dados.qbrs_realizados}
                </strong>
              </span>
              <span>
                Incidentes:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {dados.incidentes_caderno}
                </strong>
              </span>
              {statusEntries.length > 0 && (
                <span className="flex flex-wrap items-center gap-1.5">
                  {statusEntries.map(([s, n]) => (
                    <span key={s} className="inline-flex items-center gap-1">
                      <PillStatus value={s} />
                      <span className="text-xs">{n}</span>
                    </span>
                  ))}
                </span>
              )}
            </div>

            {/* Tabela de jornada por cliente */}
            <div className="card mt-6 overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Produto</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.jornada.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Nenhum cliente no período.
                      </td>
                    </tr>
                  ) : (
                    dados.jornada.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {c.nome}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {produtoLabel(c.produto)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {tierLabel(c.tier)}
                        </td>
                        <td className="px-4 py-3">
                          <PillStatus value={c.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className="h-full rounded-full bg-brand-600"
                                style={{ width: `${c.progresso}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">
                              {c.etapas_concluidas}/{c.etapas_total}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumo para o gestor */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Resumo para o gestor
                </h3>
                <button
                  onClick={() => {
                    resumoEditado.current = false
                    setResumo(resumoPadrao(dados))
                  }}
                  className="text-xs text-slate-400 hover:text-brand-600"
                >
                  regenerar
                </button>
              </div>
              <textarea
                className="input min-h-[120px] resize-y leading-relaxed"
                value={resumo}
                onChange={(e) => {
                  resumoEditado.current = true
                  setResumo(e.target.value)
                }}
              />
              <p className="mt-1 text-xs text-slate-400">
                Texto pré-preenchido com os dados do período — edite livremente antes de
                exportar.
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
