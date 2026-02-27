import { supabase } from '@/lib/supabase'
import Decimal from 'decimal.js'
import {
  Account,
  AccountType,
  CreateAccountInput,
  UpdateAccountInput,
  validateCreateAccount,
  validateUpdateAccount,
} from '@/domain/account'
import { normalizeText } from '@/utils/normalize'

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

type ValorRow = {
  valor: string | number | null
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
  const userId = await getUserId()

  const { data: accountsData, error } = await supabase
    .from('contas')
    .select('*')
    .eq('ativa', true)
    .eq('user_id', userId)
    .order('nome')

  if (error) {
    throw new Error(error.message)
  }

  const accounts = (accountsData ?? []).map(mapDbAccountToDomain)

  // Calcular saldos dinamicamente
  for (const account of accounts) {
    if (account.type === 'CARTAO_CREDITO') {
      // Soma das parcelas do cartão (não pagas) via join com compras_cartao
      const { data: parcelas } = await supabase
        .from('parcelas_cartao')
        .select('valor, compras_cartao!inner(conta_cartao_id)')
        .eq('compras_cartao.conta_cartao_id', account.id)
        .eq('compras_cartao.user_id', userId)

      const usedRaw = (parcelas ?? []).reduce(
        (sum: Decimal, p: ValorRow) =>
          sum.plus(new Decimal(p.valor ?? 0)),
        new Decimal(0)
      )

      const used = usedRaw.toDecimalPlaces(2)

      const totalLimit = new Decimal(account.creditLimit ?? 0)

      account.availableLimit = totalLimit
        .minus(used)
        .toDecimalPlaces(2)
        .toNumber()

      account.currentBalance = used.toNumber()
    } else {
      // Entradas
      const { data: entradas } = await supabase
        .from('movimentacoes')
        .select('valor')
        .eq('conta_destino_id', account.id)
        .eq('user_id', userId)
        .eq('tipo', 'ENTRADA')

      // Saídas
      const { data: saidas } = await supabase
        .from('movimentacoes')
        .select('valor')
        .eq('conta_origem_id', account.id)
        .eq('user_id', userId)
        .eq('tipo', 'SAIDA')

      // Transferências saída
      const { data: transfSaida } = await supabase
        .from('movimentacoes')
        .select('valor')
        .eq('conta_origem_id', account.id)
        .eq('user_id', userId)
        .eq('tipo', 'TRANSFERENCIA')

      // Transferências entrada
      const { data: transfEntrada } = await supabase
        .from('movimentacoes')
        .select('valor')
        .eq('conta_destino_id', account.id)
        .eq('user_id', userId)
        .eq('tipo', 'TRANSFERENCIA')

      const totalEntradas = (entradas ?? []).reduce(
        (sum: Decimal, m: ValorRow) =>
          sum.plus(new Decimal(m.valor ?? 0)),
        new Decimal(0)
      )

      const totalSaidas = (saidas ?? []).reduce(
        (sum: Decimal, m: ValorRow) =>
          sum.plus(new Decimal(m.valor ?? 0)),
        new Decimal(0)
      )

      const totalTransfSaida = (transfSaida ?? []).reduce(
        (sum: Decimal, m: ValorRow) =>
          sum.plus(new Decimal(m.valor ?? 0)),
        new Decimal(0)
      )

      const totalTransfEntrada = (transfEntrada ?? []).reduce(
        (sum: Decimal, m: ValorRow) =>
          sum.plus(new Decimal(m.valor ?? 0)),
        new Decimal(0)
      )

      const saldoInicial = new Decimal(
        account.initialBalance ?? 0
      )

      const saldoCalculado = saldoInicial
        .plus(totalEntradas)
        .minus(totalSaidas)
        .minus(totalTransfSaida)
        .plus(totalTransfEntrada)

      account.currentBalance = saldoCalculado
        .toDecimalPlaces(2)
        .toNumber()
    }
  }

  return accounts
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

  const { name, type, initialBalance, creditLimit } = input

  const normalizedName = normalizeText(name)

  const { error } = await supabase
    .from('contas')
    .insert({
      nome: normalizedName,
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

  const normalizedName = normalizeText(name)

  const { error } = await supabase
    .from('contas')
    .update({
      nome: normalizedName,
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