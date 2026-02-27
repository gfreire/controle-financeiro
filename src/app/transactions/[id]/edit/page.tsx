'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  listCategories, 
  listSubcategories, 
  createCategoryWithOptionalSubcategory,
  createSubcategoryForExistingCategory
} from '@/services/categories.service'
import { Category, Subcategory } from '@/domain/category'
import { normalizeText } from '@/utils/normalize'
import { testAccountImpact } from '@/services/accounts.service'
import { formatCurrency } from '@/utils/formatCurrency'

export default function EditTransactionPage() {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [isNewSubcategory, setIsNewSubcategory] = useState(false)
  const [type, setType] = useState<'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA'>('SAIDA')
  const [isCardPurchase, setIsCardPurchase] = useState(false)
  const [installments, setInstallments] = useState<number | null>(null)
  const [firstInstallmentMonth, setFirstInstallmentMonth] = useState('')
  const [parcelValues, setParcelValues] = useState<string[]>([])
  const [limitMessage, setLimitMessage] = useState<string | null>(null)

  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    listCategories().then(setCategories)
    listSubcategories().then(setSubcategories)

    // 1️⃣ tenta carregar como movimentação normal
    supabase
      .from('movimentacoes')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (data && !error) {
          setAmount(String(data.valor))
          setDate(data.data)
          setDescription(data.descricao ?? '')
          setType(data.tipo)
          setCategoryId(data.categoria_id ?? '')
          setSubcategoryId(data.subcategoria_id ?? '')
          setIsCardPurchase(false)
          setLoading(false)
          return
        }

        // 2️⃣ se não for movimentação, tenta como compra de cartão
        const { data: cardData, error: cardError } = await supabase
          .from('compras_cartao')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (cardData && !cardError) {
          setAmount(String(cardData.valor_total))
          setDate(cardData.data_compra)
          setDescription(cardData.descricao ?? '')
          setType('SAIDA')
          setCategoryId(cardData.categoria_id ?? '')
          setSubcategoryId(cardData.subcategoria_id ?? '')
          setInstallments(cardData.numero_parcelas)

          // carregar parcelas
          const { data: parcelas } = await supabase
            .from('parcelas_cartao')
            .select('*')
            .eq('compra_cartao_id', id)
            .order('competencia', { ascending: true })

          if (parcelas && parcelas.length > 0) {
            setFirstInstallmentMonth(
              parcelas[0].competencia.slice(0, 7)
            )
            setParcelValues(parcelas.map((p) => String(p.valor)))
          }

          setIsCardPurchase(true)
          setLoading(false)
          return
        }

        setError('Transação não encontrada')
        setLoading(false)
      })
  }, [id])

  async function handleSave() {
    try {
      const normalizedDescription = normalizeText(description) ?? ''
      const normalizedNewCategory = normalizeText(newCategoryName)
      const normalizedNewSubcategory = normalizeText(newSubcategoryName)

      let finalCategoryId: string | null = categoryId || null
      let finalSubcategoryId: string | null = subcategoryId || null

      if (isNewCategory) {
        if (type === 'TRANSFERENCIA') {
          throw new Error('Transferência não pode ter categoria')
        }

        const created = await createCategoryWithOptionalSubcategory({
          name: normalizedNewCategory ?? '',
          type: type as 'ENTRADA' | 'SAIDA',
          subcategoryName:
            type === 'SAIDA' && (normalizedNewSubcategory?.length ?? 0) > 0
              ? normalizedNewSubcategory ?? undefined
              : undefined,
        })

        finalCategoryId = created.categoryId
        finalSubcategoryId = created.subcategoryId ?? null
      }

      if (
        !isNewCategory &&
        type === 'SAIDA' &&
        categoryId &&
        (normalizedNewSubcategory?.length ?? 0) > 0 &&
        !subcategoryId
      ) {
        const createdSub = await createSubcategoryForExistingCategory(
          normalizedNewSubcategory ?? '',
          categoryId
        )

        finalCategoryId = categoryId
        finalSubcategoryId = createdSub.id
      }

      if (!isCardPurchase) {
        const { data: existing } = await supabase
          .from('movimentacoes')
          .select('conta_origem_id, tipo')
          .eq('id', id)
          .single()

        if (existing?.tipo === 'SAIDA' && existing.conta_origem_id) {
          const impact = await testAccountImpact(
            existing.conta_origem_id,
            Number(amount),
            { excludeMovimentacaoId: id }
          )

          if (impact.type === 'DINHEIRO' && impact.willExceed) {
            setLimitMessage(
              `Saldo insuficiente. Disponível: ${formatCurrency(impact.available)}`
            )
            return
          }
          
          if (impact.type === 'CONTA_CORRENTE' && impact.willExceed) {
            setLimitMessage(
              `Atenção: saldo ficará negativo. Disponível atual: ${formatCurrency(impact.available)}`
            )
            return
          }
        }

        await supabase
          .from('movimentacoes')
          .update({
            valor: Number(amount),
            data: date,
            descricao: normalizedDescription,
            categoria_id: finalCategoryId || null,
            subcategoria_id: finalSubcategoryId || null,
          })
          .eq('id', id)
      } else {
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id

        if (!userId) {
          throw new Error('Usuário não autenticado')
        }

        const { data: existingCard } = await supabase
          .from('compras_cartao')
          .select('conta_cartao_id')
          .eq('id', id)
          .single()

        if (existingCard?.conta_cartao_id) {
          const impact = await testAccountImpact(
            existingCard.conta_cartao_id,
            Number(amount),
            { excludeCompraCartaoId: id }
          )

          if (impact.willExceed) {
            setLimitMessage(
              `Limite insuficiente. Disponível: ${formatCurrency(impact.available)}`
            )
            return
          }
        }

        await supabase
          .from('compras_cartao')
          .update({
            valor_total: Number(amount),
            data_compra: date,
            descricao: normalizedDescription,
            categoria_id: finalCategoryId || null,
            subcategoria_id: finalSubcategoryId || null,
            numero_parcelas: installments,
          })
          .eq('id', id)

        if (!installments || !firstInstallmentMonth) {
          throw new Error('Parcelamento inválido')
        }

        await supabase
          .from('parcelas_cartao')
          .delete()
          .eq('compra_cartao_id', id)
          .eq('user_id', userId)

        if (installments && installments > 0 && firstInstallmentMonth) {
          const [year, month] = firstInstallmentMonth
            .split('-')
            .map(Number)

          const values: number[] = []

          for (let i = 0; i < installments; i++) {
            const raw = parcelValues[i]
            const parsed = Number(raw)
            values.push(!isNaN(parsed) && parsed > 0 ? parsed : 0)
          }

          const newParcels = values.map((value, index) => {
            const calcMonth = month - 1 + index
            const calcDate = new Date(year, calcMonth, 1)

            const y = calcDate.getFullYear()
            const m = String(calcDate.getMonth() + 1).padStart(2, '0')

            return {
              compra_cartao_id: id,
              competencia: `${y}-${m}-01`,
              valor: value,
              user_id: userId,
            }
          })

          if (newParcels.length > 0) {
            await supabase
              .from('parcelas_cartao')
              .insert(newParcels)
          }
        }
      }

      window.location.href = '/transactions'
    } catch {
      setLimitMessage('Erro ao salvar')
    }
  }

  function updateParcel(index: number, value: string) {
    setParcelValues((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  useEffect(() => {
    if (!isCardPurchase) return
    if (!installments || installments <= 0) return

    const total = Number(amount)
    if (!total || total <= 0) return

    const base = Math.floor((total / installments) * 100) / 100
    const remainder = Number(
      (total - base * installments).toFixed(2)
    )

    const next: string[] = []

    for (let i = 0; i < installments; i++) {
      if (i === 0) {
        next.push((base + remainder).toFixed(2))
      } else {
        next.push(base.toFixed(2))
      }
    }

    setParcelValues(next)
  }, [amount, installments, isCardPurchase])

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

      {/* CATEGORIA */}
      <div className="field">
        <label>Categoria</label>
        <select
          className="select"
          value={categoryId}
          onChange={(e) => {
            const value = e.target.value

            if (value === '__NEW__') {
              setIsNewCategory(true)
              setCategoryId('')
              setSubcategoryId('')
              return
            }

            setIsNewCategory(false)
            setCategoryId(value)
            setSubcategoryId('')
            setIsNewSubcategory(false)
            setNewSubcategoryName('')
          }}
        >
          <option value="">Selecione</option>
          {categories
            .filter((c) => c.type === type)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          <option value="__NEW__">-- Nova categoria --</option>
        </select>
      </div>

      {isNewCategory && (
        <>
          <div className="field">
            <label>Nova categoria</label>
            <input
              className="input"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>

          {type === 'SAIDA' && (
            <div className="field">
              <label>Subcategoria (opcional)</label>
              <input
                className="input"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      {type === 'SAIDA' && categoryId && (
        <div className="field">
          <label>Subcategoria</label>
          <select
            className="select"
            value={subcategoryId}
            onChange={(e) => {
              const value = e.target.value

              if (value === '__NEW_SUB__') {
                setIsNewSubcategory(true)
                setSubcategoryId('')
                return
              }

              setIsNewSubcategory(false)
              setSubcategoryId(value)
            }}
          >
            <option value="">Selecione</option>
            {subcategories
              .filter((s) => s.categoryId === categoryId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            <option value="__NEW_SUB__">-- Nova subcategoria --</option>
          </select>
        </div>
      )}

      {type === 'SAIDA' && categoryId && isNewSubcategory && (
        <div className="field">
          <label>Nova subcategoria</label>
          <input
            className="input"
            value={newSubcategoryName}
            onChange={(e) => setNewSubcategoryName(e.target.value)}
          />
        </div>
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
        <label>Valor</label>
        <input
          className="input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* PARCELAMENTO (APENAS CARTÃO) */}
      {isCardPurchase ? (
        <>
          <div className="field">
            <label>Número de parcelas</label>
            <input
              className="input"
              type="number"
              min={1}
              value={installments ?? ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '') {
                  setInstallments(null)
                  setParcelValues([])
                  return
                }

                const parsed = Number(val)
                setInstallments(isNaN(parsed) ? null : parsed)
                setParcelValues([])
              }}
            />
          </div>

          <div className="field">
            <label>Mês da primeira parcela</label>
            <input
              className="input"
              type="month"
              value={firstInstallmentMonth}
              onChange={(e) =>
                setFirstInstallmentMonth(e.target.value)
              }
            />
          </div>

          {installments !== null && installments > 0 && parcelValues.length > 0 && parcelValues.map((value, i) => (
            <div key={i} className="parcel-row">
              <div className="readonly-field">
                {(() => {
                  if (!firstInstallmentMonth) return `Parcela ${i + 1}`

                  const [year, month] = firstInstallmentMonth
                    .split('-')
                    .map(Number)

                  const current = new Date(year, month - 1 + i, 1)

                  return current.toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })
                })()}
              </div>
              <input
                className="input"
                type="number"
                value={value}
                onChange={(e) =>
                  updateParcel(i, e.target.value)
                }
              />
            </div>
          ))}
        </>
      ) : null}

      <button className="button" onClick={handleSave}>
        Salvar alterações
      </button>
      {limitMessage && (
        <div className="success-overlay">
          <div className="success-box">
            <p>{limitMessage}</p>
            <div className="overlay-actions">
              <button
                type="button"
                className="button"
                onClick={() => setLimitMessage(null)}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}