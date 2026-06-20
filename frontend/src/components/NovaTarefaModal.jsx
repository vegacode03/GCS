import { useState } from 'react'
import { TASK_TIPOS, PRIORIDADES } from '../lib/constants'

const VAZIO = {
  titulo: '',
  descricao: '',
  client_id: '',
  tipo: 'avulsa',
  prioridade: 'normal',
  deadline: '',
}

/** Modal com o formulário de criação de tarefa. */
export default function NovaTarefaModal({ clientes = [], onClose, onCreate }) {
  const [form, setForm] = useState(VAZIO)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) {
      setErro('O título é obrigatório.')
      return
    }
    setSaving(true)
    setErro('')
    try {
      // Campos vazios viram null/omitidos para o backend
      await onCreate({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        client_id: form.client_id || null,
        tipo: form.tipo,
        prioridade: form.prioridade,
        deadline: form.deadline || null,
      })
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao criar tarefa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Nova tarefa
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Título *</label>
            <input className="input" value={form.titulo} onChange={set('titulo')} autoFocus />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Descrição</label>
            <textarea
              className="input min-h-[64px] resize-y"
              value={form.descricao}
              onChange={set('descricao')}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Cliente (opcional)
            </label>
            <select className="input" value={form.client_id} onChange={set('client_id')}>
              <option value="">— Sem cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                  {c.empresa ? ` · ${c.empresa}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tipo</label>
              <select className="input" value={form.tipo} onChange={set('tipo')}>
                {TASK_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Prioridade</label>
              <select className="input" value={form.prioridade} onChange={set('prioridade')}>
                {PRIORIDADES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Deadline</label>
            <input
              type="date"
              className="input"
              value={form.deadline}
              onChange={set('deadline')}
            />
          </div>

          {erro && <p className="text-xs text-red-600">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Criando…' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
