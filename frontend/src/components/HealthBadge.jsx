import { HEALTH_DOT, HEALTH_ACAO, healthLabel } from '../lib/constants'

/**
 * Indicador de health score: bolinha colorida + rotulo opcional.
 * Mostra a acao recomendada no title (tooltip nativo).
 */
export default function HealthBadge({ value = 'verde', showLabel = false }) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={`${healthLabel(value)} — ${HEALTH_ACAO[value] ?? ''}`}
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${HEALTH_DOT[value] ?? 'bg-slate-400'}`}
      />
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {healthLabel(value)}
        </span>
      )}
    </span>
  )
}
