'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import { getAccountById } from '@/services/accounts.service'
import { AccountForm } from '@/components/account/AccountForm'
import { Account } from '@/domain/account'

export default function EditAccountPage() {
  const { id } = useParams<{ id: string }>()

  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAccount() {
      try {
        const data = await getAccountById(id)
        setAccount(data)
      } catch {
        setAccount(null)
      } finally {
        setLoading(false)
      }
    }

    loadAccount()
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
      <Link href="/accounts" className="link">
        ← Voltar para Contas
      </Link>

      <h1 className="title">Editar conta</h1>

      {!account ? (
        <p className="error">Conta não encontrada</p>
      ) : (
        <AccountForm
          mode="edit"
          initialData={account}
        />
      )}
    </main>
  )
}