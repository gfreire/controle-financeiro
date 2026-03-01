'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  deactivateDebt,
  listDebts,
} from '@/services/debts.service'
import { Debt } from '@/domain/debt'
import { formatCurrency } from '@/utils/formatCurrency'

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [debtToDeactivate, setDebtToDeactivate] =
    useState<Debt | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  async function loadDebts() {
    try {
      setLoading(true)
      const data = await listDebts()
      setDebts(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar dívidas'
      )
    } finally {
      setLoading(false)
    }
  }

  async function confirmDeactivate() {
    if (!debtToDeactivate) return

    try {
      setDeactivating(true)
      await deactivateDebt(debtToDeactivate.id)
      setDebtToDeactivate(null)
      await loadDebts()
    } catch {
      alert('Erro ao desativar dívida')
    } finally {
      setDeactivating(false)
    }
  }

  useEffect(() => {
    loadDebts()
  }, [])

  return (
    <main className="container">
      <Link href="/" className="link">
        ← Voltar para Dashboard
      </Link>

      <div className="header-row">
        <h1 className="title">Dívidas</h1>

        <Link href="/debts/new" className="button secondary">
          Nova dívida
        </Link>
      </div>

      {loading && <p className="muted">Carregando...</p>}

      {error && <div className="error field">{error}</div>}

      {!loading && debts.length === 0 && (
        <div className="empty-state">
          <strong>Nenhuma dívida ativa</strong>
          <span>Cadastre sua primeira dívida para começar</span>
        </div>
      )}

      <div className="list">
        {debts.map((debt) => (
          <div key={debt.id} className="card">
            <div className="card-main">
              <div className="card-title">
                <strong>{debt.agent}</strong>
              </div>

              <span className="muted">
                {debt.side === 'A_PAGAR' ? 'A pagar' : 'A receber'}
              </span>

              <span className="muted">
                {formatCurrency(debt.initialBalance)}
              </span>
            </div>

            <div className="card-actions">
              <Link href={`/debts/${debt.id}/edit`} className="link">
                Editar
              </Link>

              <button
                type="button"
                className="link danger"
                onClick={() => setDebtToDeactivate(debt)}
              >
                Desativar
              </button>
            </div>
          </div>
        ))}
      </div>

      {debtToDeactivate && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Desativar dívida</h3>

            <p className="modal-text">
              Tem certeza que deseja desativar a dívida de{' '}
              <strong>{debtToDeactivate.agent}</strong>?
            </p>

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setDebtToDeactivate(null)}
                disabled={deactivating}
              >
                Cancelar
              </button>

              <button
                className="button danger"
                onClick={confirmDeactivate}
                disabled={deactivating}
              >
                {deactivating ? 'Desativando...' : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
