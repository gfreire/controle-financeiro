'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createAccount } from '@/services/accounts.service'
import { AccountType } from '@/domain/account'
import { accountTypeLabels } from '@/utils/accountTypeUI'

export default function NewAccountPage() {
  const [name, setName] = useState('')
  const [type, setType] =
    useState<AccountType>('DINHEIRO')
  const [initialBalance, setInitialBalance] =
    useState('0')
  const [creditLimit, setCreditLimit] =
    useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    try {
      setError(null)
      setLoading(true)

      await createAccount({
        name,
        type,
        initialBalance:
          type === 'CARTAO_CREDITO'
            ? null
            : Number(initialBalance),
        creditLimit:
          type === 'CARTAO_CREDITO'
            ? Number(creditLimit)
            : null,
      })

      window.location.href = '/accounts'
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao criar conta'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <Link href="/accounts" className="link">
        ← Voltar para Contas
      </Link>

      <h1 className="title">Nova Conta</h1>

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
        <select
          className="select"
          value={type}
          onChange={(e) =>
            setType(e.target.value as AccountType)
          }
        >
          {Object.entries(accountTypeLabels).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      {type !== 'CARTAO_CREDITO' && (
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

      {type === 'CARTAO_CREDITO' && (
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
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Criar conta'}
      </button>
    </main>
  )
}