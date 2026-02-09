'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listAccounts, disableAccount } from '@/services/accounts.service'
import { Account } from '@/domain/account'
import { accountTypeBadges } from '@/utils/accountTypeUI'

const accountTypeOrder: Record<string, number> = {
  DINHEIRO: 1,
  CONTA_CORRENTE: 2,
  CARTAO_CREDITO: 3,
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // modal
  const [accountToDisable, setAccountToDisable] =
    useState<Account | null>(null)
  const [disabling, setDisabling] = useState(false)

  async function loadAccounts() {
    try {
      setLoading(true)
      const data = await listAccounts()
      setAccounts(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar contas'
      )
    } finally {
      setLoading(false)
    }
  }

  async function confirmDisable() {
    if (!accountToDisable) return

    try {
      setDisabling(true)
      await disableAccount(accountToDisable.id)
      setAccountToDisable(null)
      await loadAccounts()
    } catch {
      alert('Erro ao desativar conta')
    } finally {
      setDisabling(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const sortedAccounts = [...accounts].sort((a, b) => {
    const typeDiff =
      accountTypeOrder[a.type] -
      accountTypeOrder[b.type]

    if (typeDiff !== 0) return typeDiff
    return a.name.localeCompare(b.name)
  })

  return (
    <main className="container">
      <Link href="/" className="link">
        ← Voltar para Dashboard
      </Link>

      <div className="header-row">
        <h1 className="title">Contas</h1>

        <Link
          href="/accounts/new"
          className="button secondary"
        >
          Nova conta
        </Link>
      </div>

      {loading && <p className="muted">Carregando...</p>}

      {error && (
        <div className="error field">{error}</div>
      )}

      {!loading && sortedAccounts.length === 0 && (
        <p className="muted">
          Nenhuma conta cadastrada
        </p>
      )}

      <div className="list">
        {sortedAccounts.map((account) => (
          <div key={account.id} className="card">
            <div className="card-main">
              <div className="card-title">
                <span className="badge">
                  {accountTypeBadges[account.type]}
                </span>
                <strong>{account.name}</strong>
              </div>

              <span className="muted">
                {account.type === 'CARTAO_CREDITO'
                  ? `Limite: R$ ${account.creditLimit}`
                  : `Saldo: R$ ${account.initialBalance}`}
              </span>
            </div>

            <div className="card-actions">
              <Link
                href={`/accounts/${account.id}/edit`}
                className="link"
              >
                Editar
              </Link>

              <button
                type="button"
                className="link danger"
                onClick={() =>
                  setAccountToDisable(account)
                }
              >
                Desativar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
          MODAL DE CONFIRMAÇÃO
         ========================= */}
      {accountToDisable && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">
              Desativar conta
            </h3>

            <p className="modal-text">
              Tem certeza que deseja desativar a conta{' '}
              <strong>
                {accountToDisable.name}
              </strong>
              ?
            </p>

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() =>
                  setAccountToDisable(null)
                }
                disabled={disabling}
              >
                Cancelar
              </button>

              <button
                className="button danger"
                onClick={confirmDisable}
                disabled={disabling}
              >
                {disabling
                  ? 'Desativando...'
                  : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}