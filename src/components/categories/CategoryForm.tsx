'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createCategory,
  createSubcategory,
  updateCategory,
  listCategories
} from '@/services/categories.service'
import { Category, CategoryType } from '@/domain/category'
import { normalizeText } from '@/utils/normalize'

type Props = {
  mode: 'create' | 'edit'
  initialData?: Category
}

export default function CategoryForm({
  mode,
  initialData
}: Props) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const [type, setType] = useState<CategoryType>(
    initialData?.type ?? 'SAIDA'
  )

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>('__NEW__')

  const [newCategoryName, setNewCategoryName] =
    useState(initialData?.name ?? '')

  const [newSubcategoryName, setNewSubcategoryName] =
    useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isEdit) {
      listCategories().then(setCategories)
    }
  }, [isEdit])

  const filteredCategories = categories.filter(
    (c) => c.type === type
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      setLoading(true)

      const normalizedName =
        normalizeText(newCategoryName) ?? ''

      const creatingNewCategory =
        type === 'ENTRADA' || selectedCategoryId === '__NEW__'

      if (creatingNewCategory) {
        if (!normalizedName || normalizedName.length < 2) {
          throw new Error(
            'Nome da categoria deve ter pelo menos 2 caracteres'
          )
        }
      }

      if (isEdit && initialData) {
        await updateCategory(initialData.id, normalizedName)

        setSuccess(true)
        setTimeout(() => {
          router.push('/categories')
        }, 1500)

        return
      }

      let finalCategoryId: string

      if (type === 'SAIDA' && selectedCategoryId !== '__NEW__') {
        finalCategoryId = selectedCategoryId
      } else {
        const created = await createCategory(
          normalizedName,
          type
        )

        finalCategoryId = created.id
      }

      let somethingCreated = false

      if (selectedCategoryId === '__NEW__') {
        somethingCreated = true
      }

      const normalizedSub = normalizeText(
        newSubcategoryName
      )

      if (normalizedSub && normalizedSub.length > 0) {
        if (normalizedSub.length < 2) {
          throw new Error(
            'Nome da subcategoria deve ter pelo menos 2 caracteres'
          )
        }

        await createSubcategory(
          normalizedSub,
          finalCategoryId
        )

        somethingCreated = true
      }

      if (!somethingCreated) {
        throw new Error(
          'Informe uma nova categoria ou uma subcategoria para salvar'
        )
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/categories')
      }, 1500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        const message = err.message.toLowerCase()

        if (
          message.includes('duplicate') ||
          message.includes('already exists') ||
          message.includes('unique')
        ) {
          setError('Categoria já existe')
        } else {
          setError(err.message)
        }
      } else {
        setError('Erro inesperado')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {success && (
        <div className="success-overlay">
          <div className="success-box">
            Salvo com sucesso
          </div>
        </div>
      )}

      {error && (
        <div className="error field">
          {error}
        </div>
      )}

      {!isEdit && (
        <div className="field">
          <label>Tipo</label>
          <select
            className="select"
            value={type}
            onChange={(e) => {
              setType(e.target.value as CategoryType)
              setSelectedCategoryId('__NEW__')
              setNewCategoryName('')
              setNewSubcategoryName('')
            }}
          >
            <option value="SAIDA">Saída</option>
            <option value="ENTRADA">Entrada</option>
          </select>
        </div>
      )}

      {!isEdit && type === 'SAIDA' && (
        <div className="field">
          <label>Categoria</label>
          <select
            className="select"
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value)
              setNewSubcategoryName('')
            }}
          >
            <option value="__NEW__">+ Nova categoria</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(isEdit || selectedCategoryId === '__NEW__' || type === 'ENTRADA') && (
        <div className="field">
          <label>Nome da categoria</label>
          <input
            className="input"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>
      )}

      {!isEdit && type === 'SAIDA' && selectedCategoryId !== '' && (
        <div className="field">
          <label>Subcategoria (opcional)</label>
          <input
            className="input"
            value={newSubcategoryName}
            onChange={(e) =>
              setNewSubcategoryName(e.target.value)
            }
          />
        </div>
      )}

      <button
        className="button"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
      </button>
    </form>
  )
}