export function formatCurrency(
  value: number | null | undefined
): string {
  const numericValue = Number(value ?? 0)

  if (Number.isNaN(numericValue)) {
    return 'R$ 0,00'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}