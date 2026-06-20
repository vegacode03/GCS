/** Card de métrica do topo da Home. */
export default function MetricCard({ label, value, sub, icon, alerta = false }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p
        className={`mt-1 text-2xl font-bold ${
          alerta && value > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
