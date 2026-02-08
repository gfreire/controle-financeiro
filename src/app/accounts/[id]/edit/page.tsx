'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  getAccountById,
  updateAccount,
} from '@/services/accounts.service'
import { Account } from '@/domain/account'
import { accountTypeLabels } from '@/utils/accountTypeUI'

export default function EditAccountPage() {
  const { id } = useParams<{ id: string }>()

  const [account, setAccount] =
    useState<Account | null>(null)
  const [name, setName] = useState('')
  const [initialBalance, setInitialBalance] =
    useState('')
  const [creditLimit, setCreditLimit] =
    useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const acc = await getAccountById(id)
        setAccount(acc)
        setName(acc.name)
        setInitialBalance(
          acc.initialBalance?.toString() ?? ''
        )
        setCreditLimit(
          acc.creditLimit?.toString() ?? ''
        )
      } catch {
        setError('Erro ao carregar conta')
      }
    }

    load()
  }, [id])

  async function handleSave() {
    if (!account) return

    try {
      setLoading(true)

      await updateAccount(account.id, {
        name,
        initialBalance:
          account.type === 'CARTAO_CREDITO'
            ? undefined
            : Number(initialBalance),
        creditLimit:
          account.type === 'CARTAO_CREDITO'
            ? Number(creditLimit)
            : undefined,
      })

      window.location.href = '/accounts'
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao salvar'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!account) {
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

      <h1 className="title">Editar Conta</h1>

      {error && <div className="error field">{error}</div>}

      <div className="field">
        <label>Nome</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Tipo</label>
        <div className="readonly-field">
          {accountTypeLabels[account.type]}
        </div>
      </div>

      {account.type !== 'CARTAO_CREDITO' && (
        <div className="field">
          <label>Saldo inicial</label>
          <input
            className="input"
            type="number"
            value={initialBalance}
            onChange={(e) =>
              setInitialBalance(e.target.value)
            }
          />
        </div>
      )}

      {account.type === 'CARTAO_CREDITO' && (
        <div className="field">
          <label>Limite do cartão</label>
          <input
            className="input"
            type="number"
            value={creditLimit}
            onChange={(e) =>
              setCreditLimit(e.target.value)
            }
          />
        </div>
      )}

      <button
        className="button"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </main>
  )
}