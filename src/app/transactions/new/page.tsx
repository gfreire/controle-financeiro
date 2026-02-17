'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { listAccounts } from '@/services/accounts.service'
import { listCategories, listSubcategories } from '@/services/categories.service'
import { createTransaction } from '@/services/transactions.service'
import { Account } from '@/domain/account'
import { Category, Subcategory } from '@/domain/category'

type TransactionKind = 'ENTRADA' | 'SAIDA'
type PaymentMethod =
  | 'DINHEIRO'
  | 'CONTA_CORRENTE'
  | 'CARTAO_CREDITO'

type Parcel = {
  month: string
  value: string
  edited?: boolean
}

export default function NewTransactionPage() {
  const today = new Date().toISOString().slice(0, 10)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] =
    useState<Subcategory[]>([])

  useEffect(() => {
    listAccounts().then(setAccounts)
    listCategories().then(setCategories)
    listSubcategories().then(setSubcategories)
  }, [])

  const [date, setDate] = useState(today)
  const [kind, setKind] =
    useState<TransactionKind>('SAIDA')
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | ''>('')
  const [accountId, setAccountId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [installments, setInstallments] =
    useState('1')
  const [firstInstallmentMonth, setFirstInstallmentMonth] =
    useState(() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`
    })

  const [parcelOverrides, setParcelOverrides] =
    useState<Record<number, { value: string }>>({})

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

  const parcels = useMemo<Parcel[]>(() => {
    if (paymentMethod !== 'CARTAO_CREDITO') return []

    const total = Number(amount)
    const qty = Number(installments)

    if (!total || !qty || qty <= 0) return []

    const baseValue = +(total / qty).toFixed(2)
    const [year, month] = firstInstallmentMonth
      .split('-')
      .map(Number)

    const next: Parcel[] = []

    for (let i = 0; i < qty; i++) {
      const d = new Date(year, month - 1 + i, 1)

      const ym = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`

      const override = parcelOverrides[i]

      next.push({
        month: ym,
        value: override
          ? override.value
          : baseValue.toFixed(2),
        edited: Boolean(override),
      })
    }

    return next
  }, [
    amount,
    installments,
    firstInstallmentMonth,
    paymentMethod,
    parcelOverrides,
  ])

  function updateParcelValue(
    index: number,
    value: string
  ) {
    setParcelOverrides((prev) => ({
      ...prev,
      [index]: { value },
    }))
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!paymentMethod || !accountId || !amount)
      return

    if (kind === 'ENTRADA') {
      await createTransaction({
        type: 'ENTRADA',
        date,
        amount: Number(amount),
        description,
        destinationAccountId: accountId,
        categoryId: category || null,
      })
    }

    if (kind === 'SAIDA') {
      await createTransaction({
        type: 'SAIDA',
        date,
        amount: Number(amount),
        description,
        originAccountId: accountId,
        paymentMethod,
        categoryId: category || null,
        subcategoryId: subcategory || null,
        installments:
          paymentMethod === 'CARTAO_CREDITO'
            ? Number(installments)
            : undefined,
        firstInstallmentMonth:
          paymentMethod === 'CARTAO_CREDITO'
            ? firstInstallmentMonth
            : undefined,
      })
    }

    setDescription('')
    setAmount('')
  }

  return (
    <main className="container">
      <form onSubmit={handleSubmit}>
        <Link
          href="/transactions"
          className="link"
        >
          ← Voltar
        </Link>

        <h1 className="title">
          Nova transação
        </h1>

        <div className="field">
          <label>Data</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Tipo</label>
          <select
            className="select"
            value={kind}
            onChange={(e) =>
              setKind(
                e.target
                  .value as TransactionKind
              )
            }
          >
            <option value="SAIDA">
              Saída
            </option>
            <option value="ENTRADA">
              Entrada
            </option>
          </select>
        </div>

        <div className="field">
          <label>Forma</label>
          <select
            className="select"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target
                  .value as PaymentMethod
              )
            }
          >
            <option value="">
              Selecione
            </option>
            <option value="DINHEIRO">
              Dinheiro
            </option>
            <option value="CONTA_CORRENTE">
              Débito / Pix
            </option>
            {kind === 'SAIDA' && (
              <option value="CARTAO_CREDITO">
                Cartão de crédito
              </option>
            )}
          </select>
        </div>

        {paymentMethod && (
          <div className="field">
            <label>Conta</label>
            <select
              className="select"
              value={accountId}
              onChange={(e) =>
                setAccountId(
                  e.target.value
                )
              }
            >
              <option value="">
                Selecione
              </option>
              {filteredAccounts.map((a) => (
                <option
                  key={a.id}
                  value={a.id}
                >
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Categoria</label>
          <select
            className="select"
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >
            <option value="">
              Selecione
            </option>
            {categories
              .filter(
                (c) => c.type === kind
              )
              .map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        {kind === 'SAIDA' &&
          category && (
            <div className="field">
              <label>
                Subcategoria
              </label>
              <select
                className="select"
                value={subcategory}
                onChange={(e) =>
                  setSubcategory(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Selecione
                </option>
                {subcategories
                  .filter(
                    (s) =>
                      s.categoryId ===
                      category
                  )
                  .map((s) => (
                    <option
                      key={s.id}
                      value={s.id}
                    >
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

        <div className="field">
          <label>Descrição</label>
          <input
            className="input"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />
        </div>

        <div className="field">
          <label>Valor</label>
          <input
            className="input"
            type="number"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
          />
        </div>

        {paymentMethod ===
          'CARTAO_CREDITO' && (
          <>
            <div className="field">
              <label>
                Número de parcelas
              </label>
              <input
                className="input"
                type="number"
                min={1}
                value={installments}
                onChange={(e) =>
                  setInstallments(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Mês da primeira
                parcela
              </label>
              <input
                className="input"
                type="month"
                value={
                  firstInstallmentMonth
                }
                onChange={(e) =>
                  setFirstInstallmentMonth(
                    e.target.value
                  )
                }
              />
            </div>

            {parcels.length > 0 && (
              <div className="field">
                <label>Parcelas</label>

                {parcels.map((p, i) => (
                  <div key={i} className="parcel-row">
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
          </>
        )}

        <button
          type="submit"
          className="button"
          disabled={
            !paymentMethod ||
            !accountId ||
            !amount
          }
        >
          Salvar
        </button>
      </form>
    </main>
  )
}