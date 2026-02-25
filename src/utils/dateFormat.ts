export function formatDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

export function formatMonthLabel(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  const d = new Date(year, month - 1, 1)

  return d.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

export function getInstallmentRange(
  competence: string,
  installments: number
) {
  const [year, month] = competence.split('-').map(Number)

  const start = new Date(year, month - 1, 1)

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })

  const startLabel = formatter.format(start).replace('.', '')

  if (installments === 1) {
    return startLabel
  }

  const end = new Date(year, month - 1 + installments - 1, 1)
  const endLabel = formatter.format(end).replace('.', '')

  return `${startLabel}-${endLabel}`
}