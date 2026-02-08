'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Transaction } from '@/domain/transaction'

export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadTransactions() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .order('data', { ascending: false })

      if (error) throw error

      setItems(
        data.map((row) => ({
          id: row.id,
          accountId: row.conta_origem_id,
          type: row.tipo,
          amount: row.valor,
          description: row.descricao,
          date: row.data,
          createdAt: row.created_at,
        }))
      )
    } catch {
      setError('Erro ao carregar movimentações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

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
        <p className="muted">Nenhuma movimentação registrada</p>
      )}

      <div className="list">
        {items.map((t) => (
          <div key={t.id} className="card">
            <div className="card-main">
              <strong>
                {t.type} — R$ {t.amount}
              </strong>

              <span className="muted">
                {t.description || 'Sem descrição'} • {t.date}
              </span>
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
        ))}
      </div>
    </main>
  )
}