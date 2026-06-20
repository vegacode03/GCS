import HealthBadge from './HealthBadge'
import PillStatus from './PillStatus'
import { produtoLabel, tierLabel } from '../lib/constants'

/** Card de um cliente na grade da pagina /clientes. */
export default function ClienteCard({ cliente, onClick }) {
  const total = cliente.etapas_total ?? 0
  const feitas = cliente.etapas_concluidas ?? 0
  const pct = total > 0 ? Math.round((feitas / total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className="card text-left transition hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
            {cliente.nome}
          </p>
          {cliente.empresa && (
            <p className="truncate text-xs text-slate-500">{cliente.empresa}</p>
          )}
        </div>
        <HealthBadge value={cliente.health_score} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-600/15 dark:text-brand-200">
          {produtoLabel(cliente.produto)}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {tierLabel(cliente.tier)}
        </span>
        <PillStatus value={cliente.status} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Jornada</span>
          <span>
            {feitas}/{total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  )
}
