import { supabase } from '@/lib/supabase'
import {
  CreateDebtInput,
  Debt,
  DebtSide,
  UpdateDebtInput,
  validateCreateDebt,
  validateUpdateDebt,
  normalizeDebtAgent,
} from '@/domain/debt'
import { getUserId } from '@/lib/getUserId'

type DBDebt = {
  id: string
  agente: string
  lado: DebtSide
  saldo_inicial: number | string
  ativa: boolean
  created_at: string
  user_id: string
}

function mapDbDebtToDomain(row: DBDebt): Debt {
  return {
    id: row.id,
    agent: row.agente,
    side: row.lado,
    initialBalance: Number(row.saldo_inicial),
    active: row.ativa,
    createdAt: row.created_at,
    userId: row.user_id,
  }
}

export async function listDebts(): Promise<Debt[]> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('dividas')
    .select('id,agente,lado,saldo_inicial,ativa,created_at,user_id')
    .eq('user_id', userId)
    .eq('ativa', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapDbDebtToDomain)
}

export async function getDebtById(id: string): Promise<Debt> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('dividas')
    .select('id,agente,lado,saldo_inicial,ativa,created_at,user_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Dívida não encontrada')
  }

  return mapDbDebtToDomain(data)
}

export async function createDebt(
  input: CreateDebtInput
): Promise<void> {
  const normalizedAgent = normalizeDebtAgent(input.agent)

  const payload: CreateDebtInput = {
    ...input,
    agent: normalizedAgent,
  }

  validateCreateDebt(payload)

  const userId = await getUserId()

  const { error } = await supabase.from('dividas').insert({
    agente: payload.agent,
    lado: payload.side,
    saldo_inicial: payload.initialBalance,
    user_id: userId,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateDebt(
  id: string,
  input: UpdateDebtInput
): Promise<void> {
  const userId = await getUserId()

  const { data: existing, error: existingError } = await supabase
    .from('dividas')
    .select('id, ativa')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (existingError || !existing) {
    throw new Error('Dívida não encontrada')
  }

  if (!existing.ativa) {
    throw new Error('Não é possível editar dívida inativa')
  }

  const normalizedAgent = normalizeDebtAgent(input.agent)

  const payload: UpdateDebtInput = {
    ...input,
    agent: normalizedAgent,
  }

  validateUpdateDebt(payload)

  const { error, data } = await supabase
    .from('dividas')
    .update({
      agente: payload.agent,
      lado: payload.side,
      saldo_inicial: payload.initialBalance,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('Falha ao atualizar dívida')
  }
}

export async function deactivateDebt(
  id: string
): Promise<void> {
  const userId = await getUserId()

  const { error, data } = await supabase
    .from('dividas')
    .update({ ativa: false })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('Falha ao desativar dívida')
  }
}
