import { STATUS_CLASSES, statusLabel } from '../lib/constants'

/** Pill colorido com o status do cliente. */
export default function PillStatus({ value }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_CLASSES[value] ?? STATUS_CLASSES.inativo
      }`}
    >
      {statusLabel(value)}
    </span>
  )
}
