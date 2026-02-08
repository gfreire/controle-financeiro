export type TransactionType =
  | 'ENTRADA'
  | 'SAIDA'
  | 'TRANSFERENCIA'
  | 'AJUSTE'

export type Transaction = {
  id: string
  accountId: string
  type: TransactionType
  amount: number
  description: string | null
  date: string
  createdAt: string
}

/**
 * Input para criar movimentação
 */
export type CreateTransactionInput = {
  accountId: string
  type: TransactionType
  amount: number
  description?: string
  date: string
}

/**
 * Regras de negócio da movimentação
 */
export function validateCreateTransaction(
  input: CreateTransactionInput
) {
  if (!input.accountId) {
    throw new Error('Conta é obrigatória')
  }

  if (!input.type) {
    throw new Error('Tipo da movimentação é obrigatório')
  }

  if (input.amount <= 0) {
    throw new Error('Valor deve ser maior que zero')
  }

  if (!input.date) {
    throw new Error('Data é obrigatória')
  }
}