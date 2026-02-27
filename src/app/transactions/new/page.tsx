'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { listAccounts, testAccountImpact } from '@/services/accounts.service'
import { 
  listCategories, 
  listSubcategories,
  createCategoryWithOptionalSubcategory
} from '@/services/categories.service'
import { createTransaction } from '@/services/transactions.service'
import { Account } from '@/domain/account'
import { Category, Subcategory } from '@/domain/category'
import { normalizeText } from '@/utils/normalize'
import { formatCurrency } from '@/utils/formatCurrency'

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
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isNewSubcategory, setIsNewSubcategory] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [installments, setInstallments] =
    useState('1')
  const [firstInstallmentMonth, setFirstInstallmentMonth] =
    useState(() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`
    })

  const [parcelValues, setParcelValues] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [limitError, setLimitError] = useState<string | null>(null)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  function resetForm() {
    setDate(today)
    setKind('SAIDA')
    setPaymentMethod('')
    setAccountId('')
    setDescription('')
    setAmount('')
    setCategory('')
    setSubcategory('')
    setIsNewCategory(false)
    setNewCategoryName('')
    setIsNewSubcategory(false)
    setNewSubcategoryName('')
    setInstallments('1')
    setParcelValues([])
    setFirstInstallmentMonth(() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`
    })
  }

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

    const qty = Number(installments)
    if (!qty || qty <= 0) return []

    const [year, month] = firstInstallmentMonth
      .split('-')
      .map(Number)

    return parcelValues.map((value, index) => {
      const d = new Date(year, month - 1 + index, 1)

      const ym = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`

      return {
        month: ym,
        value,
        edited: true,
      }
    })
  }, [parcelValues, installments, firstInstallmentMonth, paymentMethod])

  function updateParcelValue(index: number, value: string) {
    setParcelValues((prev) => {
      const next = [...prev]
      next[index] = value

      // recalcula total baseado nas parcelas editadas
      const total = next.reduce((acc, v) => {
        const num = Number(v)
        return acc + (isNaN(num) ? 0 : num)
      }, 0)

      // atualiza o valor total para refletir as parcelas
      setAmount(total ? total.toFixed(2) : '')

      return next
    })
  }

  function regenerateParcels(
    totalStr: string,
    qtyStr: string
  ) {
    const total = Number(totalStr)
    const qty = Number(qtyStr)

    if (!total || !qty || qty <= 0) {
      setParcelValues([])
      return
    }

    const totalCents = Math.round(total * 100)
    const base = Math.floor(totalCents / qty)
    const remainder = totalCents - base * qty

    const next = Array.from({ length: qty }).map((_, i) => {
      const cents = i === 0 ? base + remainder : base
      return (cents / 100).toFixed(2)
    })

    setParcelValues(next)
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!paymentMethod || !accountId || !amount)
      return

    setLimitError(null)

    const numericAmount = Number(amount)

    // ===== LIMIT VALIDATION =====
    const impact = await testAccountImpact(
      accountId,
      numericAmount
    )

    if (kind === 'SAIDA') {
      if (impact.type === 'DINHEIRO' && impact.willExceed) {
        setLimitError(
          `Saldo insuficiente. Disponível: ${formatCurrency(impact.available)}`
        )
        return
      }

      if (
        impact.type === 'CARTAO_CREDITO' &&
        impact.willExceed
      ) {
        setLimitError(
          `Limite insuficiente. Disponível: ${formatCurrency(impact.available)}`
        )
        return
      }

      if (
        impact.type === 'CONTA_CORRENTE' &&
        impact.willExceed &&
        !pendingSubmit
      ) {
        setLimitError(
          `Atenção: saldo ficará negativo. Disponível atual: ${formatCurrency(impact.available)}`
        )
        setPendingSubmit(true)
        return
      }
    }

    let finalCategoryId: string | null = category || null
    let finalSubcategoryId: string | null = subcategory || null

    if (isNewCategory) {
      const created = await createCategoryWithOptionalSubcategory({
        name: normalizeText(newCategoryName) ?? '',
        type: kind,
        subcategoryName:
          kind === 'SAIDA' && normalizeText(newSubcategoryName)
            ? normalizeText(newSubcategoryName) ?? undefined
            : undefined,
      })

      finalCategoryId = created.categoryId
      finalSubcategoryId = created.subcategoryId ?? null
    } else if (
      isNewSubcategory &&
      kind === 'SAIDA' &&
      category
    ) {
      const created = await createCategoryWithOptionalSubcategory({
        name: '',
        type: kind,
        subcategoryName:
          normalizeText(newSubcategoryName) ?? undefined,
        parentCategoryId: category,
      })

      finalSubcategoryId = created.subcategoryId ?? null
    }

    const normalizedDescription = normalizeText(description) ?? undefined

    if (kind === 'ENTRADA') {
      await createTransaction({
        type: 'ENTRADA',
        date,
        amount: numericAmount,
        description: normalizedDescription,
        destinationAccountId: accountId,
        categoryId: finalCategoryId,
      })
    }

    if (kind === 'SAIDA') {
      if (paymentMethod === 'CARTAO_CREDITO') {
        await createTransaction({
          type: 'SAIDA',
          date,
          amount: numericAmount,
          description: normalizedDescription,
          originAccountId: accountId,
          paymentMethod: 'CARTAO_CREDITO',
          categoryId: finalCategoryId,
          subcategoryId: finalSubcategoryId,
          installments: Number(installments),
          firstInstallmentMonth,
          parcelValues: parcelValues.map((v) => Number(v)),
        })
      } else {
        await createTransaction({
          type: 'SAIDA',
          date,
          amount: numericAmount,
          description: normalizedDescription,
          originAccountId: accountId,
          paymentMethod:
            paymentMethod as 'DINHEIRO' | 'CONTA_CORRENTE',
          categoryId: finalCategoryId,
          subcategoryId: finalSubcategoryId,
        })
      }
    }

    setPendingSubmit(false)
    resetForm()
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
    }, 2000)
  }

  return (
    <main className="container">
      {success && (
        <div className="success-overlay">
          <div className="success-box">
            Registro salvo com sucesso
          </div>
        </div>
      )}
      {limitError && (
        <div className="success-overlay">
          <div className="success-box">
            <p>{limitError}</p>
            {pendingSubmit ? (
              <div className="overlay-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => handleSubmit({ preventDefault: () => {} } as unknown as React.FormEvent)}
                >
                  Confirmar mesmo assim
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setLimitError(null)
                    setPendingSubmit(false)
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="overlay-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => setLimitError(null)}
                >
                  Ok
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
            onChange={(e) => {
              const next = e.target.value as PaymentMethod
              setPaymentMethod(next)

              if (next !== 'CARTAO_CREDITO') {
                setParcelValues([])
              }
            }}
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
            value={isNewCategory ? '__NEW__' : category}
            onChange={(e) => {
              const value = e.target.value

              if (value === '__NEW__') {
                setIsNewCategory(true)
                setCategory('')
                setIsNewSubcategory(false)
                setSubcategory('')
              } else {
                setIsNewCategory(false)
                setCategory(value)
                setIsNewSubcategory(false)
                setSubcategory('')
              }
            }}
          >
            <option value="">
              Selecione
            </option>
            {categories
              .filter((c) => c.type === kind)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            <option value="__NEW__">
              -- Nova Categoria --
            </option>
          </select>
        </div>

        {isNewCategory && (
          <div className="field">
            <label>Nome da nova categoria</label>
            <input
              className="input"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
        )}

        {kind === 'SAIDA' && (category || isNewCategory) && (
          <div className="field">
            <label>Subcategoria</label>

            <select
              className="select"
              value={
                isNewSubcategory
                  ? '__NEW__'
                  : subcategory
              }
              onChange={(e) => {
                const value = e.target.value

                if (value === '__NEW__') {
                  setIsNewSubcategory(true)
                  setSubcategory('')
                } else {
                  setIsNewSubcategory(false)
                  setSubcategory(value)
                }
              }}
            >
              <option value="">
                Selecione
              </option>

              {!isNewCategory &&
                subcategories
                  .filter((s) => s.categoryId === category)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}

              <option value="__NEW__">
                -- Nova Subcategoria --
              </option>
            </select>

            {isNewSubcategory && (
              <input
                className="input"
                value={newSubcategoryName}
                onChange={(e) =>
                  setNewSubcategoryName(e.target.value)
                }
                placeholder="Nome da nova subcategoria"
              />
            )}
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
            onChange={(e) => {
              const nextAmount = e.target.value
              setAmount(nextAmount)

              if (paymentMethod === 'CARTAO_CREDITO') {
                regenerateParcels(nextAmount, installments)
              }
            }}
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
                onChange={(e) => {
                  const nextInstallments = e.target.value
                  setInstallments(nextInstallments)

                  if (paymentMethod === 'CARTAO_CREDITO') {
                    regenerateParcels(amount, nextInstallments)
                  }
                }}
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