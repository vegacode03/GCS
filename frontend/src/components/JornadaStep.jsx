import { useState } from 'react'
import { STEP_STATUS } from '../lib/constants'

/**
 * Uma etapa da jornada dentro do painel do cliente.
 * Fases 1-2 = monitoramento (cinza); 3-6 = dono CS (azul).
 */
export default function JornadaStep({ step, anotacoes, onUpdateStatus, onAddAnotacao }) {
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)

  const meta = step.onboarding_steps
  const monitoramento = meta.ordem <= 2
  const concluido = step.status === 'concluido'
  const st = STEP_STATUS[step.status] ?? STEP_STATUS.pendente

  const ciclos = { pendente: 'em_andamento', em_andamento: 'concluido', concluido: 'pendente' }

  const handleAdd = async () => {
    if (!texto.trim()) return
    setSaving(true)
    try {
      await onAddAnotacao(step.id, texto.trim())
      setTexto('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`rounded-lg border p-3 ${
        monitoramento
          ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40'
          : 'border-brand-100 bg-brand-50/40 dark:border-brand-600/30 dark:bg-brand-600/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onUpdateStatus(step.id, ciclos[step.status])}
          title="Clique para avançar o status"
          className={`mt-0.5 text-lg leading-none ${
            concluido ? 'text-health-verde' : 'text-slate-400 hover:text-brand-600'
          }`}
        >
          {st.icon}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {meta.ordem}
            </span>
            <p
              className={`text-sm font-semibold ${
                concluido
                  ? 'text-slate-400 line-through'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {meta.titulo}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                monitoramento
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  : 'bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-200'
              }`}
            >
              {monitoramento ? 'Monitoramento' : 'Dono: CS'}
            </span>
            {meta.descricao && (
              <span className="text-xs text-slate-400">{meta.descricao}</span>
            )}
          </div>

          {/* Anotacoes */}
          <div className="mt-2">
            <div className="flex gap-2">
              <input
                className="input py-1 text-xs"
                placeholder="Adicionar anotação…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={saving || !texto.trim()}
                className="btn-primary px-3 py-1 text-xs"
              >
                {saving ? '…' : 'Salvar'}
              </button>
            </div>

            {anotacoes.length > 0 && (
              <ul className="mt-2 space-y-1">
                {anotacoes.map((a) => (
                  <li
                    key={a.id}
                    className="rounded bg-white px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <p>{a.texto}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(a.criado_em).toLocaleString('pt-BR')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
