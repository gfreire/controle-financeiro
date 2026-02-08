import { supabase } from '@/lib/supabase'
import {
  Account,
  AccountType,
  CreateAccountInput,
  validateCreateAccount,
  validateUpdateAccount,
} from '@/domain/account'

/* =========================
   DB TYPE
========================= */

type DbAccountRow = {
  id: string
  nome: string
  tipo_conta: string
  saldo_inicial: number | null
  limite_total: number | null
  ativa: boolean
  created_at: string
}

/* =========================
   MAPPER
========================= */

function mapDbAccountToDomain(
  row: DbAccountRow
): Account {
  return {
    id: row.id,
    name: row.nome,
    type: row.tipo_conta as AccountType,
    initialBalance: row.saldo_inicial,
    creditLimit: row.limite_total,
    active: row.ativa,
    createdAt: row.created_at,
  }
}

/* =========================
   LIST
========================= */

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('ativa', true)

  if (error) {
    throw new Error('Erro ao carregar contas')
  }

  return (data as DbAccountRow[]).map(
    mapDbAccountToDomain
  )
}

/* =========================
   GET BY ID
========================= */

export async function getAccountById(
  id: string
): Promise<Account> {
  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error('Conta não encontrada')
  }

  return mapDbAccountToDomain(
    data as DbAccountRow
  )
}

/* =========================
   CREATE
========================= */

export async function createAccount(
  input: CreateAccountInput
): Promise<void> {
  validateCreateAccount(input)

  const { error } = await supabase
    .from('contas')
    .insert({
      nome: input.name,
      tipo_conta: input.type,
      saldo_inicial:
        input.type === 'CARTAO_CREDITO'
          ? null
          : input.initialBalance ?? 0,
      limite_total:
        input.type === 'CARTAO_CREDITO'
          ? input.creditLimit
          : null,
      ativa: true,
    })

  if (error) {
    throw new Error('Erro ao criar conta')
  }
}

/* =========================
   UPDATE
========================= */

export async function updateAccount(
  id: string,
  input: Partial<CreateAccountInput>
): Promise<void> {
  validateUpdateAccount(input)

  const payload: Partial<DbAccountRow> = {}

  if (input.name !== undefined) {
    payload.nome = input.name
  }

  if (input.initialBalance !== undefined) {
    payload.saldo_inicial = input.initialBalance
  }

  if (input.creditLimit !== undefined) {
    payload.limite_total = input.creditLimit
  }

  const { error } = await supabase
    .from('contas')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw new Error('Erro ao atualizar conta')
  }
}

/* =========================
   DISABLE (LOGICAL DELETE)
========================= */

export async function disableAccount(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('contas')
    .update({ ativa: false })
    .eq('id', id)

  if (error) {
    throw new Error('Erro ao desativar conta')
  }
}