// Rotulos e estilos compartilhados das telas de Clientes e Jornada (Fase 2).

export const PRODUTOS = [
  { value: 'pix_ip', label: 'Pix IP' },
  { value: 'sub', label: 'Sub' },
  { value: 'paghub', label: 'Paghub' },
  { value: 'pix_ip+paghub', label: 'Pix IP + Paghub' },
]

export const TIERS = [
  { value: 'small', label: 'Small' },
  { value: 'middle', label: 'Middle' },
  { value: 'large', label: 'Large' },
  { value: 'key', label: 'Key' },
]

export const STATUS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'integracao', label: 'Integração' },
  { value: 'aguardando_golive', label: 'Aguardando go-live' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'em_risco', label: 'Em risco' },
  { value: 'inativo', label: 'Inativo' },
]

export const HEALTH = [
  { value: 'verde', label: 'Verde' },
  { value: 'amarelo', label: 'Amarelo' },
  { value: 'vermelho', label: 'Vermelho' },
  { value: 'preto', label: 'Preto' },
]

const labelFrom = (list) => (value) =>
  list.find((i) => i.value === value)?.label ?? value

export const produtoLabel = labelFrom(PRODUTOS)
export const tierLabel = labelFrom(TIERS)
export const statusLabel = labelFrom(STATUS)
export const healthLabel = labelFrom(HEALTH)

// Classes Tailwind por status (pill colorido) — funciona em dark mode.
export const STATUS_CLASSES = {
  onboarding: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  integracao: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  aguardando_golive:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  operacional: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  em_risco: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  inativo: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

// Cor de fundo do health score (bolinha / badge).
export const HEALTH_DOT = {
  verde: 'bg-health-verde',
  amarelo: 'bg-health-amarelo',
  vermelho: 'bg-health-vermelho',
  preto: 'bg-health-preto',
}

// Acao recomendada por health score (tooltip / legenda).
export const HEALTH_ACAO = {
  verde: 'Manter cadência normal',
  amarelo: 'Agendar check-in adicional',
  vermelho: 'Ativar playbook de retenção',
  preto: 'Ação imediata + notificar coordenador',
}

// Ordenacao de urgencia da carteira: preto > vermelho > amarelo > verde
export const HEALTH_PESO = { preto: 0, vermelho: 1, amarelo: 2, verde: 3 }

export const STEP_STATUS = {
  pendente: { label: 'Pendente', icon: '○' },
  em_andamento: { label: 'Em andamento', icon: '◐' },
  concluido: { label: 'Concluído', icon: '●' },
}
