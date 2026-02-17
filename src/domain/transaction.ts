export type TransactionType =
  | 'ENTRADA'
  | 'SAIDA'
  | 'TRANSFERENCIA'

export type PaymentMethod =
  | 'DINHEIRO'
  | 'CONTA_CORRENTE'
  | 'CARTAO_CREDITO'

/* =========================
   BASE TRANSACTION (DOMAIN)
========================= */

export type Transaction = {
  id: string
  type: TransactionType

  originAccountId: string | null
  destinationAccountId: string | null

  amount: number
  description: string | null
  date: string

  categoryId: string | null
  subcategoryId: string | null

  createdAt: string
}

/* =========================
   CREATE INPUT
========================= */

export type CreateTransactionInput =
  | CreateIncomeInput
  | CreateExpenseInput
  | CreateTransferInput

type BaseInput = {
  type: TransactionType
  amount: number
  date: string
  description?: string
  categoryId?: string | null
  subcategoryId?: string | null
}

export type CreateIncomeInput = BaseInput & {
  type: 'ENTRADA'
  destinationAccountId: string
}

export type CreateExpenseInput = BaseInput & {
  type: 'SAIDA'
  paymentMethod: PaymentMethod
  originAccountId: string

  installments?: number
  firstInstallmentMonth?: string
}

export type CreateTransferInput = BaseInput & {
  type: 'TRANSFERENCIA'
  originAccountId: string
  destinationAccountId: string
}

/* =========================
   VALIDATION
========================= */

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
  }

  if (input.type === 'SAIDA') {
    if (!input.originAccountId) {
      throw new Error('Conta de origem é obrigatória')
    }

    if (input.paymentMethod === 'CARTAO_CREDITO') {
      if (!input.installments || input.installments <= 0) {
        throw new Error('Número de parcelas inválido')
      }

      if (!input.firstInstallmentMonth) {
        throw new Error('Mês da primeira parcela é obrigatório')
      }
    }
  }

  if (input.type === 'TRANSFERENCIA') {
    if (!input.originAccountId || !input.destinationAccountId) {
      throw new Error('Transferência exige conta de origem e destino')
    }

    if (input.originAccountId === input.destinationAccountId) {
      throw new Error('Contas devem ser diferentes')
    }
  }
}