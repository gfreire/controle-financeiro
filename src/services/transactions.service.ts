import { supabase } from '@/lib/supabase'
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  validateCreateTransaction,
  validateUpdateTransaction,
} from '@/domain/transaction'
import { TimelineItem } from '@/domain/transaction'
import Decimal from 'decimal.js'
import { normalizeText } from '@/utils/normalize'

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
    descricao: normalizeText(input.description),
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
    descricao: normalizeText(input.description),
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
    descricao: normalizeText(input.description),
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
  input: Extract<
    CreateTransactionInput,
    { type: 'SAIDA'; paymentMethod: 'CARTAO_CREDITO' }
  >
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
    parcelValues,
  } = input

  if (!installments || installments < 1) {
    throw new Error('Número de parcelas inválido')
  }

  if (!firstInstallmentMonth) {
    throw new Error('Mês da primeira parcela obrigatório')
  }

  if (!parcelValues || parcelValues.length !== installments) {
    throw new Error('Parcelas inválidas')
  }

  const totalFromParcels = parcelValues.reduce(
    (sum: Decimal, v) => sum.plus(new Decimal(v)),
    new Decimal(0)
  )

  if (!totalFromParcels.equals(new Decimal(amount))) {
    throw new Error(
      'Soma das parcelas diferente do valor total'
    )
  }

  /* 1️⃣ Cria registro principal da compra */
  const { data: purchase, error: purchaseError } =
    await supabase
      .from('compras_cartao')
      .insert({
        conta_cartao_id: originAccountId,
        data_compra: date,
        descricao: normalizeText(description) ?? '',
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

  /* 2️⃣ Gera parcelas usando valores vindos do FORM */
  const [year, month] = firstInstallmentMonth
    .split('-')
    .map(Number)

  const parcels = parcelValues.map((value, index) => {
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
      valor: value,
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

/* =========================
   TIMELINE (VIEW)
========================= */

type DBTimelineRow = {
  id: string
  type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA'
  description: string | null
  amount: number | string
  date: string
  competence: string | null

  origin_account_name: string | null
  origin_account_type: string | null

  destination_account_name: string | null
  destination_account_type: string | null

  category_name: string | null
  subcategory_name: string | null

  installments: number | null
}

function mapTimelineRow(row: DBTimelineRow): TimelineItem {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: new Decimal(row.amount ?? 0).toDecimalPlaces(2).toNumber(),
    date: row.date,
    competence: row.competence,
    originAccountName: row.origin_account_name,
    originAccountType: row.origin_account_type,
    destinationAccountName: row.destination_account_name,
    destinationAccountType: row.destination_account_type,
    categoryName: row.category_name,
    subcategoryName: row.subcategory_name,
    installments: row.installments,
  }
}

export async function listTimeline(): Promise<TimelineItem[]> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('vw_timeline')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) {
    throw new Error('Erro ao carregar timeline')
  }

  return (data ?? []).map(mapTimelineRow)
}

/* =========================
   DELETE TRANSACTION
========================= */

export async function getTransactionById(id: string) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  // 1️⃣ Try movimentacoes first
  const { data: mov } = await supabase
    .from('movimentacoes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (mov) {
    return {
      id: mov.id,
      type: mov.tipo,
      date: mov.data,
      amount: Number(mov.valor),
      description: mov.descricao ?? undefined,
      originAccountId: mov.conta_origem_id ?? undefined,
      destinationAccountId: mov.conta_destino_id ?? undefined,
      categoryId: mov.categoria_id ?? undefined,
      subcategoryId: mov.subcategoria_id ?? undefined,
      paymentMethod:
        mov.tipo === 'SAIDA' ? 'DINHEIRO' : undefined,
    }
  }

  // 2️⃣ Try compras_cartao
  const { data: purchase } = await supabase
    .from('compras_cartao')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (purchase) {
    const { data: parcelas } = await supabase
      .from('parcelas_cartao')
      .select('*')
      .eq('compra_cartao_id', id)
      .eq('user_id', userId)
      .order('competencia', { ascending: true })

    return {
      id: purchase.id,
      type: 'SAIDA',
      date: purchase.data_compra,
      amount: Number(purchase.valor_total),
      description: purchase.descricao ?? undefined,
      originAccountId: purchase.conta_cartao_id,
      categoryId: purchase.categoria_id ?? undefined,
      subcategoryId: purchase.subcategoria_id ?? undefined,
      paymentMethod: 'CARTAO_CREDITO',
      installments: purchase.numero_parcelas,
      firstInstallmentMonth:
        parcelas && parcelas.length > 0
          ? parcelas[0].competencia.slice(0, 7)
          : undefined,
      parcelValues: parcelas
        ? parcelas.map((p) => Number(p.valor))
        : [],
    }
  }

  throw new Error('Transação não encontrada')
}

export async function updateTransaction(
  input: UpdateTransactionInput
): Promise<void> {
  validateUpdateTransaction(input)

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const { id, type } = input

  if (type === 'ENTRADA') {
    const { error } = await supabase
      .from('movimentacoes')
      .update({
        valor: input.amount,
        data: input.date,
        descricao: normalizeText(input.description),
        conta_destino_id: input.destinationAccountId,
        categoria_id: input.categoryId ?? null,
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error('Erro ao atualizar entrada')
    return
  }

  if (type === 'SAIDA' && input.paymentMethod !== 'CARTAO_CREDITO') {
    const { error } = await supabase
      .from('movimentacoes')
      .update({
        valor: input.amount,
        data: input.date,
        descricao: normalizeText(input.description),
        conta_origem_id: input.originAccountId,
        categoria_id: input.categoryId ?? null,
        subcategoria_id: input.subcategoryId ?? null,
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error('Erro ao atualizar saída')
    return
  }

  if (type === 'SAIDA' && input.paymentMethod === 'CARTAO_CREDITO') {
    const {
      amount,
      date,
      description,
      originAccountId,
      categoryId,
      subcategoryId,
      installments,
      firstInstallmentMonth,
      parcelValues,
    } = input

    const { error: updateError } = await supabase
      .from('compras_cartao')
      .update({
        valor_total: amount,
        data_compra: date,
        descricao: normalizeText(description) ?? '',
        numero_parcelas: installments,
        conta_cartao_id: originAccountId,
        categoria_id: categoryId ?? null,
        subcategoria_id: subcategoryId ?? null,
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Erro ao atualizar compra no cartão')
    }

    await supabase
      .from('parcelas_cartao')
      .delete()
      .eq('compra_cartao_id', id)
      .eq('user_id', userId)

    if (
      installments &&
      installments > 0 &&
      firstInstallmentMonth &&
      parcelValues
    ) {
      const [year, month] = firstInstallmentMonth
        .split('-')
        .map(Number)

      const parcels = parcelValues.map((value, index) => {
        const competence = new Date(
          year,
          month - 1 + index,
          1
        )

        const formatted = `${competence.getFullYear()}-${String(
          competence.getMonth() + 1
        ).padStart(2, '0')}-01`

        return {
          compra_cartao_id: id,
          competencia: formatted,
          valor: value,
          user_id: userId,
        }
      })

      const { error: parcelError } = await supabase
        .from('parcelas_cartao')
        .insert(parcels)

      if (parcelError) {
        throw new Error('Erro ao atualizar parcelas')
      }
    }

    return
  }

  if (type === 'TRANSFERENCIA') {
    const { error } = await supabase
      .from('movimentacoes')
      .update({
        valor: input.amount,
        data: input.date,
        descricao: normalizeText(input.description),
        conta_origem_id: input.originAccountId,
        conta_destino_id: input.destinationAccountId,
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error('Erro ao atualizar transferência')
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Usuário não autenticado')

  // 1️⃣ Try delete from movimentacoes
  const { data: mov, error: movError } = await supabase
    .from('movimentacoes')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (movError) {
    throw new Error('Erro ao verificar movimentação')
  }

  if (mov) {
    const { error } = await supabase
      .from('movimentacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error('Erro ao deletar movimentação')
    }

    return
  }

  // 2️⃣ Try delete from compras_cartao
  const { data: purchase, error: purchaseError } = await supabase
    .from('compras_cartao')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (purchaseError) {
    throw new Error('Erro ao verificar compra no cartão')
  }

  if (purchase) {
    // delete parcelas first
    const { error: parcelError } = await supabase
      .from('parcelas_cartao')
      .delete()
      .eq('compra_cartao_id', id)
      .eq('user_id', userId)

    if (parcelError) {
      throw new Error('Erro ao deletar parcelas')
    }

    const { error: purchaseDeleteError } = await supabase
      .from('compras_cartao')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (purchaseDeleteError) {
      throw new Error('Erro ao deletar compra no cartão')
    }

    return
  }

  throw new Error('Registro não encontrado para exclusão')
}