import { useState } from 'react'
import { api } from '../lib/api'
import { TASK_TIPO_CLASSES, tipoLabel, hojeLocal } from '../lib/constants'

const fmtData = (iso) => {
  if (!iso) return null
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}

/** Linha de uma tarefa: checkbox + texto + tags + anotações expansíveis. */
export default function TarefaItem({ tarefa, onToggle, onDelete, onChanged }) {
  const [aberto, setAberto] = useState(false)
  const [notas, setNotas] = useState(null)
  const [novaNota, setNovaNota] = useState('')
  const [salvando, setSalvando] = useState(false)

  const concluida = tarefa.status === 'concluido'
  const atrasada =
    !concluida && tarefa.deadline && tarefa.deadline.slice(0, 10) < hojeLocal()
  const cliente = tarefa.clients

  const toggleNotas = async () => {
    const novoEstado = !aberto
    setAberto(novoEstado)
    if (novoEstado && notas === null) {
      try {
        setNotas(await api.get(`/tarefas/${tarefa.id}/notas`))
      } catch {
        setNotas([])
      }
    }
  }

  const adicionarNota = async (e) => {
    e.preventDefault()
    if (!novaNota.trim()) return
    setSalvando(true)
    try {
      const criada = await api.post(`/tarefas/${tarefa.id}/notas`, {
        texto: novaNota.trim(),
      })
      setNotas([criada, ...(notas ?? [])])
      setNovaNota('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5 transition dark:border-slate-800">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={concluida}
          onChange={() => onToggle(tarefa)}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-medium ${
                concluida
                  ? 'text-slate-400 line-through dark:text-slate-600'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {tarefa.prioridade === 'urgente' && !concluida && (
                <span className="mr-1 text-red-500" title="Urgente">
                  ●
                </span>
              )}
              {tarefa.titulo}
            </p>
            <button
              onClick={() => onDelete(tarefa)}
              className="shrink-0 text-xs text-slate-300 hover:text-red-500"
              title="Remover tarefa"
            >
              ✕
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                TASK_TIPO_CLASSES[tarefa.tipo] ?? TASK_TIPO_CLASSES.avulsa
              }`}
            >
              {tipoLabel(tarefa.tipo)}
            </span>
            {cliente && (
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-600/15 dark:text-brand-200">
                {cliente.nome}
              </span>
            )}
            {tarefa.deadline && (
              <span
                className={`text-[11px] font-medium ${
                  atrasada ? 'text-red-600' : 'text-slate-400'
                }`}
              >
                {atrasada ? '⚠ ' : ''}
                {fmtData(tarefa.deadline)}
              </span>
            )}
            <button
              onClick={toggleNotas}
              className="text-[11px] text-slate-400 hover:text-brand-600"
            >
              {aberto ? 'ocultar notas' : 'notas'}
            </button>
          </div>

          {aberto && (
            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <form onSubmit={adicionarNota} className="flex gap-2">
                <input
                  className="input py-1 text-xs"
                  placeholder="Adicionar anotação…"
                  value={novaNota}
                  onChange={(e) => setNovaNota(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={salvando || !novaNota.trim()}
                  className="btn-primary px-3 py-1 text-xs"
                >
                  +
                </button>
              </form>

              {notas === null ? (
                <p className="mt-2 text-xs text-slate-400">Carregando…</p>
              ) : notas.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">Nenhuma anotação ainda.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {notas.map((n) => (
                    <li
                      key={n.id}
                      className="text-xs text-slate-600 dark:text-slate-300"
                    >
                      <span className="text-slate-300 dark:text-slate-600">•</span>{' '}
                      {n.texto}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
