import { supabase } from '@/lib/supabase'
import {
  Account,
  AccountType,
  CreateAccountInput,
  UpdateAccountInput,
  validateCreateAccount,
  validateUpdateAccount,
} from '@/domain/account'

/* =========================
   INTERNAL DB TYPE
========================= */

type DBAccount = {
  id: string
  nome: string
  tipo_conta: AccountType
  saldo_inicial: number | null
  limite_total: number | null
  ativa: boolean
  created_at: string
}

/* =========================
   USER CONTEXT
========================= */

async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Usuário não autenticado')
  }

  return user.id
}

/* =========================
   MAPPER
========================= */

function mapDbAccountToDomain(row: DBAccount): Account {
  return {
    id: row.id,
    name: row.nome,
    type: row.tipo_conta,
    initialBalance: row.saldo_inicial,
    creditLimit: row.limite_total,
    active: row.ativa,
    createdAt: row.created_at,
  }
}

/* =========================
   SERVICES
========================= */

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('ativa', true)
    .order('nome')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapDbAccountToDomain)
}

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

  return mapDbAccountToDomain(data)
}

export async function createAccount(
  input: CreateAccountInput
): Promise<void> {
  validateCreateAccount(input)

  const userId = await getUserId()

  const { name, type, initialBalance, creditLimit } =
    input

  const { error } = await supabase
    .from('contas')
    .insert({
      nome: name,
      tipo_conta: type,
      saldo_inicial:
        type === 'CARTAO_CREDITO'
          ? null
          : initialBalance ?? 0,
      limite_total:
        type === 'CARTAO_CREDITO'
          ? creditLimit!
          : null,
      user_id: userId,
    })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateAccount(
  id: string,
  input: UpdateAccountInput
): Promise<void> {
  validateUpdateAccount(input)

  const userId = await getUserId()

  const { name, creditLimit } = input

  const { error } = await supabase
    .from('contas')
    .update({
      nome: name,
      limite_total: creditLimit ?? null,
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function disableAccount(
  id: string
): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase
    .from('contas')
    .update({ ativa: false })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}