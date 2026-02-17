import { supabase } from '@/lib/supabase'
import {
  CreateTransactionInput,
  validateCreateTransaction,
} from '@/domain/transaction'

export async function createTransaction(
  input: CreateTransactionInput
): Promise<void> {
  validateCreateTransaction(input)

  if (input.type === 'TRANSFERENCIA') {
    return createTransfer(input)
  }

  if (input.type === 'ENTRADA') {
    return createIncome(input)
  }

  if (input.type === 'SAIDA') {
    if (input.paymentMethod === 'CARTAO_CREDITO') {
      return createCardPurchase(input)
    }

    return createCashExpense(input)
  }

  throw new Error('Tipo inválido')
}

/* =========================
   ENTRADA
========================= */

async function createIncome(
  input: Extract<CreateTransactionInput, { type: 'ENTRADA' }>
) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const { error } = await supabase.from('movimentacoes').insert({
    tipo: 'ENTRADA',
    valor: input.amount,
    data: input.date,
    descricao: input.description ?? null,
    conta_destino_id: input.destinationAccountId,
    conta_origem_id: null,
    categoria_id: input.categoryId ?? null,
    subcategoria_id: null,
    user_id: userId,
  })

  if (error) throw new Error('Erro ao criar entrada')
}

/* =========================
   SAÍDA DINHEIRO / CONTA
========================= */

async function createCashExpense(
  input: Extract<CreateTransactionInput, { type: 'SAIDA' }>
) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const { error } = await supabase.from('movimentacoes').insert({
    tipo: 'SAIDA',
    valor: input.amount,
    data: input.date,
    descricao: input.description ?? null,
    conta_origem_id: input.originAccountId,
    conta_destino_id: null,
    categoria_id: input.categoryId ?? null,
    subcategoria_id: input.subcategoryId ?? null,
    user_id: userId,
  })

  if (error) throw new Error('Erro ao criar saída')
}

/* =========================
   TRANSFERÊNCIA
========================= */

async function createTransfer(
  input: Extract<CreateTransactionInput, { type: 'TRANSFERENCIA' }>
) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const { error } = await supabase.from('movimentacoes').insert({
    tipo: 'TRANSFERENCIA',
    valor: input.amount,
    data: input.date,
    descricao: input.description ?? null,
    conta_origem_id: input.originAccountId,
    conta_destino_id: input.destinationAccountId,
    categoria_id: null,
    subcategoria_id: null,
    user_id: userId,
  })

  if (error) throw new Error('Erro ao criar transferência')
}

/* =========================
   CARTÃO PARCELADO
========================= */

async function createCardPurchase(
  input: Extract<CreateTransactionInput, { type: 'SAIDA' }>
) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const {
    amount,
    date,
    description,
    originAccountId,
    categoryId,
    subcategoryId,
    installments,
    firstInstallmentMonth,
  } = input

  const { data: purchase, error: purchaseError } =
    await supabase
      .from('compras_cartao')
      .insert({
        conta_cartao_id: originAccountId,
        data_compra: date,
        descricao: description ?? '',
        valor_total: amount,
        numero_parcelas: installments,
        categoria_id: categoryId ?? null,
        subcategoria_id: subcategoryId ?? null,
        user_id: userId,
      })
      .select()
      .single()

  if (purchaseError || !purchase) {
    throw new Error('Erro ao criar compra no cartão')
  }

  const installmentValue = Number(
    (amount / (installments ?? 1)).toFixed(2)
  )

  const [year, month] = firstInstallmentMonth!
    .split('-')
    .map(Number)

  const parcels = Array.from({
    length: installments ?? 1,
  }).map((_, index) => {
    const competence = new Date(
      year,
      month - 1 + index,
      1
    )

    const formatted = `${competence.getFullYear()}-${String(
      competence.getMonth() + 1
    ).padStart(2, '0')}-01`

    return {
      compra_cartao_id: purchase.id,
      competencia: formatted,
      valor: installmentValue,
      user_id: userId,
    }
  })

  const { error: parcelError } = await supabase
    .from('parcelas_cartao')
    .insert(parcels)

  if (parcelError) {
    throw new Error('Erro ao gerar parcelas')
  }
}