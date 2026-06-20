import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Topbar({ title }) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="btn-ghost px-2"
          title="Alternar tema"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className="text-right">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {user?.email ?? 'Usuário'}
          </p>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-brand-600"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
