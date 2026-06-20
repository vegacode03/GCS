import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/relatorio', label: 'Relatório', icon: '📊' },
  { to: '/guia', label: 'Guia da API', icon: '📚' },
  { to: '/caderno', label: 'Caderno', icon: '📓' },
]

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
          G
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            GCS
          </p>
          <p className="text-xs text-slate-500">Customer Success</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-100'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-400">
        Pagsmile IP · v0.1
      </div>
    </aside>
  )
}
