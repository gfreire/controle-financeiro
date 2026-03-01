'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getDebtById } from '@/services/debts.service'
import DebtForm from '@/components/debts/DebtForm'
import { Debt } from '@/domain/debt'

export default function EditDebtPage() {
  const { id } = useParams<{ id: string }>()

  const [debt, setDebt] = useState<Debt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDebt() {
      try {
        const data = await getDebtById(id)
        setDebt(data)
      } catch {
        setDebt(null)
      } finally {
        setLoading(false)
      }
    }

    loadDebt()
  }, [id])

  if (loading) {
    return (
      <main className="container">
        <p className="muted">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="container">
      <Link href="/debts" className="link">
        ← Voltar para Dívidas
      </Link>

      <h1 className="title">Editar dívida</h1>

      {!debt ? (
        <p className="error">Dívida não encontrada</p>
      ) : (
        <DebtForm mode="edit" initialData={debt} />
      )}
    </main>
  )
}
