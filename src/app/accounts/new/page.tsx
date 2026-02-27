'use client'

import Link from 'next/link'
import { AccountForm } from '@/components/account/AccountForm'

export default function NewAccountPage() {
  return (
    <main className="container">
      <Link href="/accounts" className="link">
        ← Voltar para Contas
      </Link>

      <h1 className="title">Nova Conta</h1>

      <AccountForm mode="create" />
    </main>
  )
}