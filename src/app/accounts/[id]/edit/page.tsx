'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  getAccountById,
  updateAccount,
} from '@/services/accounts.service'
import { Account } from '@/domain/account'
import { accountTypeLabels } from '@/utils/accountTypeUI'

export default function EditAccountPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [account, setAccount] = useState<Account | null>(null)
  const [name, setName] = useState('')
  const [creditLimit, setCreditLimit] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAccount() {
      try {
        const data = await getAccountById(id)
        setAccount(data)
        setName(data.name)

        if (data.type === 'CARTAO_CREDITO') {
          setCreditLimit(data.creditLimit ?? 0)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar conta'
        )
      } finally {
        setLoading(false)
      }
    }

    loadAccount()
  }, [id])

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!account) return

    try {
      setError(null)

      await updateAccount(account.id, {
        name,
        creditLimit:
          account.type === 'CARTAO_CREDITO'
            ? creditLimit
            : null,
      })

      router.push('/accounts')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao atualizar conta'
      )
    }
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">Carregando...</p>
      </main>
    )
  }

  if (!account) {
    return (
      <main className="container">
        <p className="error">Conta não encontrada</p>
      </main>
    )
  }

  return (
    <main className="container">
      <Link href="/accounts" className="link">
        ← Voltar para Contas
      </Link>

      <h1 className="title">Editar conta</h1>

      {error && (
        <div className="error field">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nome da conta</label>
          <input
            className="input"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label>Tipo de conta</label>
          <div className="readonly-field">
            {accountTypeLabels[account.type]}
          </div>
        </div>

        {account.type === 'CARTAO_CREDITO' && (
          <div className="field">
            <label>Limite do cartão</label>
            <input
              type="number"
              className="input"
              value={creditLimit ?? 0}
              onChange={(e) =>
                setCreditLimit(
                  Number(e.target.value)
                )
              }
              min={0}
            />
          </div>
        )}

        <button className="button">
          Salvar alterações
        </button>
      </form>
    </main>
  )
}