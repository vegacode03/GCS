import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import ClienteCard from '../components/ClienteCard'
import NovoClienteModal from '../components/NovoClienteModal'
import JornadaPanel from '../components/JornadaPanel'
import { api } from '../lib/api'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteAberto, setClienteAberto] = useState(null)

  const carregar = async () => {
    try {
      setClientes(await api.get('/clientes'))
      setErro('')
    } catch (e) {
      setErro(e.message || 'Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const criar = async (form) => {
    await api.post('/clientes', form)
    await carregar()
  }

  return (
    <Layout title="Clientes">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Carteira de clientes
            </h2>
            <p className="text-sm text-slate-500">
              {clientes.length} cliente{clientes.length === 1 ? '' : 's'} em
              acompanhamento
            </p>
          </div>
          <button onClick={() => setModalAberto(true)} className="btn-primary">
            + Novo cliente
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : erro ? (
          <div className="card text-sm text-red-600">{erro}</div>
        ) : clientes.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
              Nenhum cliente ainda
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre seu primeiro cliente para começar a acompanhar a jornada.
            </p>
            <button
              onClick={() => setModalAberto(true)}
              className="btn-primary mt-4"
            >
              + Novo cliente
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clientes.map((c) => (
              <ClienteCard
                key={c.id}
                cliente={c}
                onClick={() => setClienteAberto(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <NovoClienteModal onClose={() => setModalAberto(false)} onCreate={criar} />
      )}

      {clienteAberto && (
        <JornadaPanel
          clienteId={clienteAberto}
          onClose={() => setClienteAberto(null)}
          onChanged={carregar}
        />
      )}
    </Layout>
  )
}
