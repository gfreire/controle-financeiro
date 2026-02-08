export type AccountType =
  | 'DINHEIRO'
  | 'CONTA_CORRENTE'
  | 'CARTAO_CREDITO'

export type Account = {
  id: string
  name: string
  type: AccountType

  initialBalance: number | null
  creditLimit: number | null

  active: boolean
  createdAt: string
}

export type CreateAccountInput = {
  name: string
  type: AccountType
  initialBalance?: number | null
  creditLimit?: number | null
}

/* =========================
   VALIDATIONS
========================= */

export function validateCreateAccount(
  input: CreateAccountInput
): void {
  if (!input.name || input.name.trim().length < 2) {
    throw new Error('Nome da conta é obrigatório')
  }

  if (input.type === 'CARTAO_CREDITO') {
    if (
      input.creditLimit === null ||
      input.creditLimit === undefined ||
      input.creditLimit <= 0
    ) {
      throw new Error(
        'Cartão de crédito exige limite maior que zero'
      )
    }

    if (
      input.initialBalance !== null &&
      input.initialBalance !== undefined
    ) {
      throw new Error(
        'Cartão de crédito não pode ter saldo inicial'
      )
    }
  } else {
    if (
      input.initialBalance === null ||
      input.initialBalance === undefined ||
      input.initialBalance < 0
    ) {
      throw new Error(
        'Saldo inicial deve ser zero ou maior'
      )
    }

    if (
      input.creditLimit !== null &&
      input.creditLimit !== undefined
    ) {
      throw new Error(
        'Somente cartão pode ter limite'
      )
    }
  }
}

export function validateUpdateAccount(
  input: Partial<CreateAccountInput>
): void {
  if (
    input.initialBalance !== undefined &&
    input.initialBalance !== null &&
    input.initialBalance < 0
  ) {
    throw new Error(
      'Saldo não pode ser negativo'
    )
  }

  if (
    input.creditLimit !== undefined &&
    input.creditLimit !== null &&
    input.creditLimit <= 0
  ) {
    throw new Error(
      'Limite deve ser maior que zero'
    )
  }
}