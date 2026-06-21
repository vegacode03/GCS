import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { produtoLabel, tierLabel, statusLabel } from './constants'

const BRAND = [37, 99, 235] // brand-600 aproximado
const SLATE = [100, 116, 139]

/**
 * Gera e baixa o PDF do relatório a partir dos dados do período,
 * do resumo do gestor (editável) e do nome do CSM.
 */
export function gerarRelatorioPDF({ dados, resumo, csm }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const M = 14
  const larguraUtil = doc.internal.pageSize.getWidth() - M * 2
  let y = 18

  // Cabeçalho
  doc.setFillColor(...BRAND)
  doc.roundedRect(M, y - 6, 9, 9, 1.5, 1.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('G', M + 4.5, y, { align: 'center', baseline: 'middle' })

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(16)
  doc.text('GCS — Relatório de Customer Success', M + 13, y - 1)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...SLATE)
  doc.text(`Período: ${dados.periodo.label}`, M + 13, y + 4)

  y += 12
  doc.setDrawColor(226, 232, 240)
  doc.line(M, y, M + larguraUtil, y)
  y += 8

  // Cards de métricas (4 colunas)
  const cards = [
    ['Onboardados', String(dados.onboardados)],
    ['Em andamento', String(dados.em_andamento)],
    ['Taxa de conclusão', `${dados.taxa_conclusao_onboarding}%`],
    [
      'Tempo médio',
      dados.tempo_medio_onboarding_dias != null
        ? `${dados.tempo_medio_onboarding_dias} d`
        : '—',
    ],
  ]
  const gap = 4
  const cardW = (larguraUtil - gap * 3) / 4
  cards.forEach(([label, valor], i) => {
    const x = M + i * (cardW + gap)
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, cardW, 20, 2, 2, 'FD')
    doc.setFontSize(8)
    doc.setTextColor(...SLATE)
    doc.text(label, x + 3, y + 6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(15, 23, 42)
    doc.text(valor, x + 3, y + 15)
    doc.setFont('helvetica', 'normal')
  })
  y += 26

  // Linha-resumo secundária
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text(
    `Total de clientes: ${dados.total_clientes}   ·   QBRs no período: ${dados.qbrs_realizados}   ·   Incidentes: ${dados.incidentes_caderno}`,
    M,
    y,
  )
  y += 6

  // Tabela de jornada por cliente
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Cliente', 'Produto', 'Tier', 'Status', 'Progresso']],
    body: dados.jornada.map((c) => [
      c.nome,
      produtoLabel(c.produto),
      tierLabel(c.tier),
      statusLabel(c.status),
      `${c.etapas_concluidas}/${c.etapas_total}  (${c.progresso}%)`,
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })
  y = doc.lastAutoTable.finalY + 10

  // Resumo do gestor (quebra de página se necessário)
  const pageH = doc.internal.pageSize.getHeight()
  if (y > pageH - 40) {
    doc.addPage()
    y = 18
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('Resumo para o gestor', M, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  const linhas = doc.splitTextToSize(resumo?.trim() || '—', larguraUtil)
  doc.text(linhas, M, y)

  // Rodapé em todas as páginas
  const geradoEm = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(...SLATE)
    doc.text(`Gerado em ${geradoEm} · ${csm}`, M, pageH - 8)
    doc.text(`${p}/${totalPaginas}`, doc.internal.pageSize.getWidth() - M, pageH - 8, {
      align: 'right',
    })
  }

  const nomeArquivo = `relatorio-gcs-${dados.periodo.inicio}.pdf`
  doc.save(nomeArquivo)
}
