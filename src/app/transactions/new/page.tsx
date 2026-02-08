'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { listAccounts } from '@/services/accounts.service'
import { Account } from '@/domain/account'

type TransactionKind = 'AJUSTE' | 'ENTRADA' | 'SAIDA'
type PaymentMethod = 'DINHEIRO' | 'CONTA_CORRENTE' | 'CARTAO_CREDITO'

type Parcel = {
  month: string
  value: string
  edited?: boolean
}

export default function NewTransactionPage() {
  /* =====================
     BASE
  ===================== */

  const today = new Date().toISOString().slice(0, 10)
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    listAccounts().then(setAccounts)
  }, [])

  /* =====================
     STATE PRINCIPAL
  ===================== */

  const [date, setDate] = useState(today)
  const [kind, setKind] = useState<TransactionKind>('SAIDA')
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | ''>('')

  const [accountId, setAccountId] = useState('')

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  /* =====================
     CATEGORIA (SAÍDA)
  ===================== */

  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')

  /* =====================
     CARTÃO
  ===================== */

  const [installments, setInstallments] = useState('1')
  const [firstInstallmentMonth, setFirstInstallmentMonth] =
    useState(() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`
    })

  const [parcels, setParcels] = useState<Parcel[]>([])

  /* =====================
     FILTRO DE CONTAS
  ===================== */

  const filteredAccounts = useMemo(() => {
    if (!paymentMethod) return []

    return accounts.filter((a) => {
      if (paymentMethod === 'DINHEIRO')
        return a.type === 'DINHEIRO'
      if (paymentMethod === 'CONTA_CORRENTE')
        return a.type === 'CONTA_CORRENTE'
      if (paymentMethod === 'CARTAO_CREDITO')
        return a.type === 'CARTAO_CREDITO'
      return false
    })
  }, [accounts, paymentMethod])

  /* =====================
     AUTO-SELEÇÃO DE CONTA
  ===================== */

  useEffect(() => {
    if (filteredAccounts.length === 1) {
      setAccountId(filteredAccounts[0].id)
    } else {
      setAccountId('')
    }
  }, [filteredAccounts])

  /* =====================
     GERAR PARCELAS AUTOMÁTICO
  ===================== */

  useEffect(() => {
    if (paymentMethod !== 'CARTAO_CREDITO') {
      setParcels([])
      return
    }

    const total = Number(amount)
    const qty = Number(installments)

    if (!total || !qty || qty <= 0) return

    const baseValue = +(total / qty).toFixed(2)
    const [year, month] = firstInstallmentMonth
      .split('-')
      .map(Number)

    setParcels((prev) => {
      const next: Parcel[] = []

      for (let i = 0; i < qty; i++) {
        const d = new Date(year, month - 1 + i, 1)
        const ym = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, '0')}`

        const existing = prev[i]

        next.push({
          month: ym,
          value:
            existing?.edited === true
              ? existing.value
              : baseValue.toFixed(2),
          edited: existing?.edited,
        })
      }

      return next
    })
  }, [amount, installments, firstInstallmentMonth, paymentMethod])

  function updateParcelValue(index: number, value: string) {
    setParcels((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, value, edited: true }
          : p
      )
    )
  }

  /* =====================
     RESET POR TIPO
  ===================== */

  useEffect(() => {
    setPaymentMethod('')
    setAccountId('')
    setParcels([])
    setCategory('')
    setSubcategory('')
  }, [kind])

  return (
    <main className="container">
      <Link href="/transactions" className="link">
        ← Voltar
      </Link>

      <h1 className="title">Nova transação</h1>

      {/* DATA */}
      <div className="field">
        <label>Data</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* TIPO */}
      <div className="field">
        <label>Tipo</label>
        <select
          className="select"
          value={kind}
          onChange={(e) =>
            setKind(e.target.value as TransactionKind)
          }
        >
          <option value="SAIDA">Saída</option>
          <option value="ENTRADA">Entrada</option>
          <option value="AJUSTE">Ajuste</option>
        </select>
      </div>

      {/* FORMA DE PAGAMENTO */}
      {kind === 'SAIDA' && (
        <div className="field">
          <label>Forma de pagamento</label>
          <select
            className="select"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target.value as PaymentMethod
              )
            }
          >
            <option value="">Selecione</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CONTA_CORRENTE">
              Débito / Pix
            </option>
            <option value="CARTAO_CREDITO">
              Cartão de crédito
            </option>
          </select>
        </div>
      )}

      {/* CONTA */}
      {paymentMethod && (
        <div className="field">
          <label>Conta</label>
          <select
            className="select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Selecione</option>
            {filteredAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* CATEGORIA */}
      {kind === 'SAIDA' && (
        <>
          <div className="field">
            <label>Categoria</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Subcategoria</label>
            <input
              className="input"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            />
          </div>
        </>
      )}

      {/* DESCRIÇÃO */}
      <div className="field">
        <label>Descrição</label>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* VALOR */}
      <div className="field">
        <label>Valor total</label>
        <input
          className="input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* PARCELAS */}
      {paymentMethod === 'CARTAO_CREDITO' &&
        parcels.length > 0 && (
          <div className="field">
            <label>Parcelas</label>

            {parcels.map((p, i) => (
              <div
                key={i}
                className="field"
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                <div className="readonly-field">
                  {p.month}
                </div>

                <input
                  className="input"
                  type="number"
                  value={p.value}
                  onChange={(e) =>
                    updateParcelValue(
                      i,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}

      <button className="button" disabled>
        Salvar (em breve)
      </button>
    </main>
  )
}