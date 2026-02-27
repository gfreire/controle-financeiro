'use client'

import { useParams } from 'next/navigation'
import TransactionForm from '@/components/transactions/TransactionForm'

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <main className="container">
        Transação não encontrada
      </main>
    )
  }

  return (
    <TransactionForm
      mode="edit"
      transactionId={id}
    />
  )
}