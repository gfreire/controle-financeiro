'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { listTimeline } from '@/services/transactions.service'
import { TimelineItem } from '@/domain/transaction'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

function formatMonthLabel(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

function getInstallmentRange(competence: string, installments: number) {
  const [year, month] = competence.split('-').map(Number)

  const start = new Date(year, month - 1, 1)

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })

  const startLabel = formatter.format(start).replace('.', '')

  // Se for apenas 1 parcela, exibe somente o mês inicial
  if (installments === 1) {
    return startLabel
  }

  const end = new Date(year, month - 1 + installments - 1, 1)
  const endLabel = formatter.format(end).replace('.', '')

  return `${startLabel}-${endLabel}`
}

export default function TransactionsPage() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </main>
  )
}