export type DebtSide = 'A_PAGAR' | 'A_RECEBER'

export interface Debt {
  id: string
  agent: string
  side: DebtSide
  initialBalance: number
  active: boolean
  createdAt: string
  userId: string
}

export type CreateDebtInput = {
  agent: string
  side: DebtSide
  initialBalance: number
}

export type UpdateDebtInput = {
  agent: string
  side: DebtSide
  initialBalance: number
}

export function normalizeDebtAgent(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function validateDebtFields(agent: string, side: DebtSide, initialBalance: number): void {
  if (!side) {
    throw new Error('Lado da dívida é obrigatório')
  }

  if (!agent || !agent.trim()) {
    throw new Error('Agente é obrigatório')
  }

  const normalized = normalizeDebtAgent(agent)

  if (agent !== normalized) {
    throw new Error('Agente deve estar normalizado')
  }

  if (!Number.isFinite(initialBalance)) {
    throw new Error('Saldo inicial inválido')
  }

  if (initialBalance < 0) {
    throw new Error('Saldo inicial não pode ser negativo')
  }
}

export function validateCreateDebt(input: CreateDebtInput): void {
  validateDebtFields(input.agent, input.side, input.initialBalance)
}

export function validateUpdateDebt(input: UpdateDebtInput): void {
  validateDebtFields(input.agent, input.side, input.initialBalance)
}
