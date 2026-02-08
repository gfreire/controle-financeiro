import { AccountType } from '@/domain/account'

/**
 * Labels exibidos na UI
 */
export const accountTypeLabels: Record<
  AccountType,
  string
> = {
  DINHEIRO: 'Dinheiro',
  CONTA_CORRENTE: 'Conta corrente',
  CARTAO_CREDITO: 'Cartão de crédito',
}

/**
 * Badges curtos para listagem / mobile
 */
export const accountTypeBadges: Record<
  AccountType,
  string
> = {
  DINHEIRO: '$$',
  CONTA_CORRENTE: 'CC',
  CARTAO_CREDITO: 'CARD',
}