export type TransactionType =
  | 'ENTRADA'
  | 'SAIDA'
  | 'TRANSFERENCIA'

export type Transaction = {
  id: string
  type: TransactionType

  // Contas
  originAccountId: string | null
  destinationAccountId: string | null

  // Valor e dados
  amount: number
  description: string | null
  date: string

  // Categoria (opcional)
  categoryId: string | null
  subcategoryId: string | null

  createdAt: string
}

/**
 * Input para criar movimentação
 */
export type CreateTransactionInput = {
  type: TransactionType

  originAccountId?: string | null
  destinationAccountId?: string | null

  amount: number
  description?: string
  date: string

  categoryId?: string | null
  subcategoryId?: string | null
}

/**
 * Regras de negócio da movimentação
 */
export function validateCreateTransaction(
  input: CreateTransactionInput
) {
  if (!input.type) {
    throw new Error('Tipo da movimentação é obrigatório')
  }

  if (!input.date) {
    throw new Error('Data é obrigatória')
  }

  if (input.amount <= 0) {
    throw new Error('Valor deve ser maior que zero')
  }

  if (input.type === 'ENTRADA') {
    if (!input.destinationAccountId) {
      throw new Error('Conta de destino é obrigatória')
    }

    if (input.originAccountId) {
      throw new Error('Entrada não pode ter conta de origem')
    }
  }

  if (input.type === 'SAIDA') {
    if (!input.originAccountId) {
      throw new Error('Conta de origem é obrigatória')
    }

    if (input.destinationAccountId) {
      throw new Error('Saída não pode ter conta de destino')
    }
  }

  if (input.type === 'TRANSFERENCIA') {
    if (!input.originAccountId || !input.destinationAccountId) {
      throw new Error('Transferência exige conta de origem e destino')
    }

    if (input.originAccountId === input.destinationAccountId) {
      throw new Error('Contas de origem e destino devem ser diferentes')
    }
  }
}