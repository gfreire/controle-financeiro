'use client'

import Link from 'next/link'
import DebtForm from '@/components/debts/DebtForm'

export default function NewDebtPage() {
  return (
    <main className="container">
      <Link href="/debts" className="link">
        ← Voltar para Dívidas
      </Link>

      <h1 className="title">Nova dívida</h1>

      <DebtForm mode="create" />
    </main>
  )
}
