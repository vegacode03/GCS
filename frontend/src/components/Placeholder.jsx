import Layout from './Layout'

export default function Placeholder({ title, fase }) {
  return (
    <Layout title={title}>
      <div className="flex h-full items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-4xl">🚧</p>
          <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Esta tela será implementada na {fase}.
          </p>
        </div>
      </div>
    </Layout>
  )
}
