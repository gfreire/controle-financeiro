'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { listTimeline, deleteTransaction } from '@/services/transactions.service'
import { TimelineItem } from '@/domain/transaction'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  formatDate,
  formatMonthLabel,
  getInstallmentRange,
} from '@/utils/dateFormat'

export default function TransactionsPage() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await listTimeline()
        setItems(data)
      } catch {
        setError('Erro ao carregar movimentações')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function confirmDelete() {
    if (!deleteId) return

    try {
      await deleteTransaction(deleteId)
      setItems((prev) => prev.filter((item) => item.id !== deleteId))
    } catch {
      alert('Erro ao deletar movimentação')
    } finally {
      setDeleteId(null)
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineItem[]>()

    for (const item of items) {
      const key = item.competence ?? '0000-00'

      if (!map.has(key)) {
        map.set(key, [])
      }

      map.get(key)!.push(item)
    }

    return Array.from(map.entries()).sort(
      (a, b) => (a[0] < b[0] ? 1 : -1)
    )
  }, [items])

  return (
    <main className="container">
      <Link href="/" className="link">
        ← Voltar para Dashboard
      </Link>

      <div className="header-row">
        <h1 className="title">Movimentações</h1>

        <Link href="/transactions/new" className="button secondary">
          Nova movimentação
        </Link>
      </div>

      {loading && <p className="muted">Carregando...</p>}
      {error && <div className="error field">{error}</div>}

      {!loading && items.length === 0 && (
        <p className="empty-state">
          Nenhuma movimentação registrada
        </p>
      )}

      <div className="list">
        {grouped.map(([month, monthItems]) => (
          <div key={month} className="month-group">
            <div className="month-label">
              {formatMonthLabel(month)}
            </div>

            {monthItems.map((t) => {
              const cardClass =
                t.type === 'ENTRADA'
                  ? 'card card-income'
                  : t.type === 'SAIDA'
                  ? 'card card-expense'
                  : 'card card-transfer'

              return (
                <div key={t.id} className={cardClass}>
                  <div className="card-main">
                    {t.type !== 'TRANSFERENCIA' ? (
                      <>
                        <div className="transaction-title">
                          <strong>
                            {t.description || 'Sem descrição'}
                          </strong>
                        </div>

                        {t.categoryName && (
                          <div className="transaction-category">
                            {t.type === 'SAIDA' && t.subcategoryName
                              ? `${t.categoryName}/${t.subcategoryName}`
                              : t.categoryName}
                          </div>
                        )}

                        <div className="transaction-account">
                          {t.type === 'ENTRADA'
                            ? t.destinationAccountName
                            : t.originAccountName}
                        </div>

                        <div className="transaction-footer">
                          <div className="transaction-footer-left">
                            <span>
                              {formatDate(t.date)}
                            </span>

                            {t.installments && (
                              <div className="transaction-installment-range">
                                {t.competence &&
                                  getInstallmentRange(
                                    t.competence,
                                    t.installments
                                  )}
                              </div>
                            )}
                          </div>

                          <div className="transaction-footer-right">
                            <span className="transaction-amount">
                              {formatCurrency(t.amount)}
                              {t.installments &&
                                ` (${t.installments}x)`}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="transaction-title">
                          <strong>Transferência</strong>
                        </div>

                        <div className="transaction-account">
                          {t.originAccountName} →{' '}
                          {t.destinationAccountName}
                        </div>

                        <div className="transaction-footer">
                          <div className="transaction-footer-left">
                            <span>
                              {formatDate(t.date)}
                            </span>
                          </div>

                          <div className="transaction-footer-right">
                            <span className="transaction-amount">
                              {formatCurrency(t.amount)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="card-actions">
                    <Link
                      href={`/transactions/${t.id}/edit`}
                      className="link"
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      className="link danger"
                      onClick={() => setDeleteId(t.id)}
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="overlay overlay-centered">
          <div className="modal">
            <h2>Confirmar exclusão</h2>
            <p>
              Tem certeza que deseja deletar esta movimentação?
            </p>

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setDeleteId(null)}
              >
                Cancelar
              </button>

              <button
                className="button danger"
                onClick={confirmDelete}
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}