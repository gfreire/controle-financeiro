import { supabase } from '@/lib/supabase'
import {
  CreateTransactionInput,
  validateCreateTransaction,
} from '@/domain/transaction'

/**
 * Cria uma movimentação financeira
 * Regras:
 * - ENTRADA → conta_destino_id obrigatória
 * - SAIDA → conta_origem_id obrigatória
 * - TRANSFERENCIA → ambas obrigatórias
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<void> {
  validateCreateTransaction(input)

  const {
    type,
    amount,
    date,
    description,
    originAccountId,
    destinationAccountId,
    categoryId,
    subcategoryId,
  } = input

  const { error } = await supabase
    .from('movimentacoes')
    .insert({
      tipo: type,
      valor: amount,
      data: date,
      descricao: description ?? null,
      conta_origem_id: originAccountId,
      conta_destino_id: destinationAccountId,
      categoria_id: categoryId,
      subcategoria_id: subcategoryId,
    })

  if (error) {
    throw new Error('Erro ao criar movimentação')
  }
}