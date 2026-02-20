'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  createCategory,
  createSubcategory,
  listCategories,
} from '@/services/categories.service'
import { Category, CategoryType } from '@/domain/category'

export default function NewCategoryPage() {
  const [type, setType] = useState<CategoryType>('SAIDA')

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>('__NEW__')

  const [newCategoryName, setNewCategoryName] =
    useState<string>('')

  const [newSubcategoryName, setNewSubcategoryName] =
    useState<string>('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const data = await listCategories()
      setCategories(data)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      setLoading(true)

      let finalCategoryId = selectedCategoryId

      // =========================
      // CRIAR NOVA CATEGORIA
      // =========================
      if (selectedCategoryId === '__NEW__') {
        const trimmed = newCategoryName.trim()

        if (trimmed.length < 2) {
          throw new Error(
            'Nome da categoria deve ter pelo menos 2 caracteres'
          )
        }

        const created = await createCategory(
          trimmed,
          type
        )

        finalCategoryId = created.id
      }

      // =========================
      // CRIAR SUBCATEGORIA (OPCIONAL)
      // =========================
      const subTrimmed = newSubcategoryName.trim()

      if (subTrimmed.length > 0) {
        if (subTrimmed.length < 2) {
          throw new Error(
            'Nome da subcategoria deve ter pelo menos 2 caracteres'
          )
        }

        await createSubcategory(
          subTrimmed,
          finalCategoryId
        )
      }

      setSuccess(true)

      // reset controlado
      setSelectedCategoryId('__NEW__')
      setNewCategoryName('')
      setNewSubcategoryName('')

      setTimeout(() => {
        setSuccess(false)
      }, 2000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao salvar')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(
    (c) => c.type === type
  )

  return (
    <main className="container">
      {success && (
        <div className="success-overlay">
          <div className="success-box">
            Salvo com sucesso
          </div>
        </div>
      )}
      <Link href="/categories" className="link">
        ← Voltar
      </Link>

      <h1 className="title">
        Nova categoria / subcategoria
      </h1>

      <form onSubmit={handleSubmit}>
        {/* TIPO */}
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

        {/* CATEGORIA */}
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
            <option value="__NEW__">
              + Nova categoria
            </option>

            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* INPUT NOVA CATEGORIA */}
        {selectedCategoryId === '__NEW__' && (
          <div className="field">
            <label>Nome da nova categoria</label>
            <input
              className="input"
              value={newCategoryName}
              onChange={(e) =>
                setNewCategoryName(e.target.value)
              }
              placeholder="Ex: Pets"
            />
          </div>
        )}

        {/* SUBCATEGORIA */}
        {type === 'SAIDA' && (
          <div className="field">
            <label>
              Subcategoria (opcional)
            </label>
            <input
              className="input"
              value={newSubcategoryName}
              onChange={(e) =>
                setNewSubcategoryName(e.target.value)
              }
              placeholder="Ex: Ração"
            />
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="button"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </main>
  )
}
