'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { TransactionType } from '@/domain/transaction'

export default function EditTransactionPage({
  params,
}: {
  params: { id: string }
}) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('movimentacoes')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Movimentação não encontrada')
          return
        }

        setAmount(String(data.valor))
        setDate(data.data)
        setDescription(data.descricao ?? '')
        setLoading(false)
      })
  }, [params.id])

  async function handleSave() {
    try {
      await supabase
        .from('movimentacoes')
        .update({
          valor: Number(amount),
          data: date,
          descricao: description,
        })
        .eq('id', params.id)

      window.location.href = '/transactions'
    } catch {
      alert('Erro ao salvar')
    }
  }

  if (loading) {
    return <main className="container">Carregando...</main>
  }

  if (error) {
    return <main className="container">{error}</main>
  }

  return (
    <main className="container">
      <Link href="/transactions" className="link">
        ← Voltar
      </Link>

      <h1 className="title">Editar movimentação</h1>

      <div className="field">
        <label>Valor</label>
        <input
          className="input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Data</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Descrição</label>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button className="button" onClick={handleSave}>
        Salvar alterações
      </button>
    </main>
  )
}