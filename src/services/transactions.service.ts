import { supabase } from '@/lib/supabase'
import {
  CreateTransactionInput,
  validateCreateTransaction,
} from '@/domain/transaction'

/**
 * Cria uma movimentação financeira
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<void> {
  validateCreateTransaction(input)

  const { error } = await supabase
    .from('movimentacoes')
    .insert({
      conta_origem_id: input.accountId,
      tipo: input.type,
      valor: input.amount,
      descricao: input.description ?? null,
      data: input.date,
    })

  if (error) {
    throw new Error('Erro ao criar movimentação')
  }
}