import { useState } from 'react'
import { PRODUTOS, TIERS } from '../lib/constants'

const VAZIO = {
  nome: '',
  empresa: '',
  email: '',
  whatsapp: '',
  produto: 'pix_ip',
  tier: 'small',
}

/** Modal com o formulario de cadastro de cliente. */
export default function NovoClienteModal({ onClose, onCreate }) {
  const [form, setForm] = useState(VAZIO)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErro('O nome é obrigatório.')
      return
    }
    setSaving(true)
    setErro('')
    try {
      await onCreate(form)
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao criar cliente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Novo cliente
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nome *</label>
            <input className="input" value={form.nome} onChange={set('nome')} autoFocus />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Empresa</label>
            <input className="input" value={form.empresa} onChange={set('empresa')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">E-mail</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                WhatsApp
              </label>
              <input className="input" value={form.whatsapp} onChange={set('whatsapp')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Produto</label>
              <select className="input" value={form.produto} onChange={set('produto')}>
                {PRODUTOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tier</label>
              <select className="input" value={form.tier} onChange={set('tier')}>
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {erro && <p className="text-xs text-red-600">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Criando…' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
