'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  listAccounts,
  testAccountImpact
} from '@/services/accounts.service'
import {
  listCategories,
  listSubcategories,
  createCategoryWithOptionalSubcategory
} from '@/services/categories.service'
import { createTransaction, updateTransaction } from '@/services/transactions.service'
import { Account } from '@/domain/account'
import { Category, Subcategory } from '@/domain/category'
import { normalizeText } from '@/utils/normalize'
import { formatCurrency } from '@/utils/formatCurrency'

type TransactionKind = 'ENTRADA' | 'SAIDA'
type PaymentMethod =
  | 'DINHEIRO'
  | 'CONTA_CORRENTE'
  | 'CARTAO_CREDITO'

export type TransactionFormData = {
  id?: string
  type: TransactionKind
  date: string
  amount: number
  description?: string
  originAccountId?: string
  destinationAccountId?: string
  paymentMethod?: PaymentMethod
  categoryId?: string | null
  subcategoryId?: string | null
  installments?: number
  firstInstallmentMonth?: string
  parcelValues?: number[]
}

type Props = {
  mode: 'create' | 'edit'
  transactionId?: string
  initialData?: TransactionFormData
}

export default function TransactionForm({
  mode,
  transactionId,
  initialData
}: Props) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const today = new Date().toISOString().slice(0, 10)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])

  useEffect(() => {
    listAccounts().then(setAccounts)
    listCategories().then(setCategories)
    listSubcategories().then(setSubcategories)
  }, [])

  useEffect(() => {
    async function loadTransaction() {
      if (mode === 'edit' && transactionId && !initialData) {
        const { getTransactionById } = await import('@/services/transactions.service')
        const data = await getTransactionById(transactionId)

        if (!data) return

        setDate(data.date)
        setKind(data.type)
        setPaymentMethod((data.paymentMethod ?? '') as PaymentMethod | '')
        setAccountId(
          data.originAccountId ?? data.destinationAccountId ?? ''
        )
        setDescription(data.description ?? '')
        setAmount(String(data.amount))
        setCategory(data.categoryId ?? '')
        setSubcategory(data.subcategoryId ?? '')

        if (data.installments) {
          setInstallments(String(data.installments))
        }

        if (data.firstInstallmentMonth) {
          setFirstInstallmentMonth(data.firstInstallmentMonth)
        }

        if (data.parcelValues) {
          setParcelValues(data.parcelValues.map((v: number) => v.toFixed(2)))
        }
      }
    }

    loadTransaction()
  }, [mode, transactionId, initialData])

  const [date, setDate] = useState(initialData?.date ?? today)
  const [kind, setKind] = useState<TransactionKind>(initialData?.type ?? 'SAIDA')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(initialData?.paymentMethod ?? '')
  const [accountId, setAccountId] = useState(
    initialData?.originAccountId ?? initialData?.destinationAccountId ?? ''
  )
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '')

  const [category, setCategory] = useState(initialData?.categoryId ?? '')
  const [subcategory, setSubcategory] = useState(initialData?.subcategoryId ?? '')
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isNewSubcategory, setIsNewSubcategory] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')

  const [installments, setInstallments] = useState(
    initialData?.installments ? String(initialData.installments) : '1'
  )

  const [firstInstallmentMonth, setFirstInstallmentMonth] = useState(
    initialData?.firstInstallmentMonth ??
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  )

  const [parcelValues, setParcelValues] = useState<string[]>(
    initialData?.parcelValues
      ? initialData.parcelValues.map((v) => v.toFixed(2))
      : []
  )

  const [success, setSuccess] = useState(false)
  const [limitError, setLimitError] = useState<string | null>(null)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const filteredAccounts = useMemo(() => {
    if (!paymentMethod) return []
    return accounts.filter((a) => a.type === paymentMethod)
  }, [accounts, paymentMethod])

  function regenerateParcels(totalStr: string, qtyStr: string) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!accountId || !amount) return

    if (kind === 'SAIDA' && !paymentMethod) return

    setLimitError(null)

    const numericAmount = Number(amount)
    const impact = await testAccountImpact(
      accountId,
      numericAmount,
      isEdit && transactionId
        ? { excludeMovimentacaoId: transactionId }
        : undefined
    )

    if (kind === 'SAIDA') {
      if (impact.type === 'DINHEIRO' && impact.willExceed) {
        setLimitError(`Saldo insuficiente. Disponível: ${formatCurrency(impact.available)}`)
        return
      }

      if (impact.type === 'CARTAO_CREDITO' && impact.willExceed) {
        setLimitError(`Limite insuficiente. Disponível: ${formatCurrency(impact.available)}`)
        return
      }

      if (impact.type === 'CONTA_CORRENTE' && impact.willExceed && !pendingSubmit) {
        setLimitError(`Atenção: saldo ficará negativo. Disponível atual: ${formatCurrency(impact.available)}`)
        setPendingSubmit(true)
        return
      }
    }

    const normalizedDescription = normalizeText(description) ?? undefined

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

    // Explicit discriminated union branching for CreateTransactionInput
    if (kind === 'ENTRADA') {
      const incomeInput = {
        type: 'ENTRADA' as const,
        date,
        amount: numericAmount,
        description: normalizedDescription,
        destinationAccountId: accountId,
        categoryId: finalCategoryId
      }

      if (isEdit && initialData?.id) {
        await updateTransaction({ id: initialData.id, ...incomeInput })
      } else {
        await createTransaction(incomeInput)
      }
    } else {
      // SAIDA
      if (paymentMethod === 'CARTAO_CREDITO') {
        const creditInput = {
          type: 'SAIDA' as const,
          paymentMethod: 'CARTAO_CREDITO' as const,
          date,
          amount: numericAmount,
          description: normalizedDescription,
          originAccountId: accountId,
          categoryId: finalCategoryId,
          subcategoryId: finalSubcategoryId,
          installments: Number(installments),
          firstInstallmentMonth,
          parcelValues: parcelValues.map((v) => Number(v))
        }

        if (isEdit && initialData?.id) {
          await updateTransaction({ id: initialData.id, ...creditInput })
        } else {
          await createTransaction(creditInput)
        }
      } else {
        const debitInput = {
          type: 'SAIDA' as const,
          paymentMethod: paymentMethod as 'DINHEIRO' | 'CONTA_CORRENTE',
          date,
          amount: numericAmount,
          description: normalizedDescription,
          originAccountId: accountId,
          categoryId: finalCategoryId,
          subcategoryId: finalSubcategoryId
        }

        if (isEdit && initialData?.id) {
          await updateTransaction({ id: initialData.id, ...debitInput })
        } else {
          await createTransaction(debitInput)
        }
      }
    }

    setSuccess(true)

    setTimeout(() => {
      router.push('/transactions')
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="container">
      {success && (
        <div className="success-overlay">
          <div className="success-box">
            {isEdit
              ? 'Transação atualizada com sucesso'
              : 'Registro salvo com sucesso'}
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

      <h1 className="title">
        {isEdit ? 'Editar transação' : 'Nova transação'}
      </h1>

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
        <label>Tipo</label>
        <select
          className="select"
          value={kind}
          onChange={(e) => setKind(e.target.value as TransactionKind)}
        >
          <option value="SAIDA">Saída</option>
          <option value="ENTRADA">Entrada</option>
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
            if (next !== 'CARTAO_CREDITO') setParcelValues([])
          }}
        >
          <option value="">Selecione</option>
          <option value="DINHEIRO">Dinheiro</option>
          <option value="CONTA_CORRENTE">Débito / Pix</option>
          {kind === 'SAIDA' && (
            <option value="CARTAO_CREDITO">Cartão de crédito</option>
          )}
        </select>
      </div>

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
          <option value="">Selecione</option>
          {categories
            .filter((c) => c.type === kind)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          <option value="__NEW__">-- Nova Categoria --</option>
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
            value={isNewSubcategory ? '__NEW__' : subcategory}
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
            <option value="">Selecione</option>
            {!isNewCategory &&
              subcategories
                .filter((s) => s.categoryId === category)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            <option value="__NEW__">-- Nova Subcategoria --</option>
          </select>

          {isNewSubcategory && (
            <input
              className="input"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
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
          onChange={(e) => setDescription(e.target.value)}
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

      {paymentMethod === 'CARTAO_CREDITO' && (
        <>
          <div className="field">
            <label>Número de parcelas</label>
            <input
              className="input"
              type="number"
              min={1}
              value={installments}
              onChange={(e) => {
                const nextInstallments = e.target.value
                setInstallments(nextInstallments)
                regenerateParcels(amount, nextInstallments)
              }}
            />
          </div>

          <div className="field">
            <label>Mês da primeira parcela</label>
            <input
              className="input"
              type="month"
              value={firstInstallmentMonth}
              onChange={(e) => setFirstInstallmentMonth(e.target.value)}
            />
          </div>

          {parcelValues.length > 0 && (
            <div className="field">
              <label>Parcelas</label>
              {parcelValues.map((value, i) => (
                <div key={i} className="parcel-row">
                  <input
                    className="input"
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const next = [...parcelValues]
                      next[i] = e.target.value
                      setParcelValues(next)

                      const total = next.reduce((acc, v) => {
                        const num = Number(v)
                        return acc + (isNaN(num) ? 0 : num)
                      }, 0)

                      setAmount(total ? total.toFixed(2) : '')
                    }}
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
          !accountId ||
          !amount ||
          (kind === 'SAIDA' && !paymentMethod)
        }
      >
        {isEdit ? 'Atualizar' : 'Salvar'}
      </button>
    </form>
  )
}