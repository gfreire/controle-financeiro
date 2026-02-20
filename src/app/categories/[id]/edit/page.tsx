

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getCategoryById,
  updateCategory,
  updateSubcategory,
  listSubcategories,
} from '@/services/categories.service'
import { Category, Subcategory } from '@/domain/category'

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return

      const cat = await getCategoryById(id)
      setCategory(cat)
      setName(cat.name)

      const subs = await listSubcategories()
      setSubcategories(
        subs.filter((s) => s.categoryId === id)
      )
    }

    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!category) return

    try {
      setLoading(true)

      const trimmed = name.trim()

      if (trimmed.length < 2) {
        throw new Error(
          'Nome deve ter pelo menos 2 caracteres'
        )
      }

      if (category.isDefault) {
        throw new Error(
          'Categorias padrão não podem ser editadas'
        )
      }

      await updateCategory(category.id, trimmed)

      setSuccess(true)

      setTimeout(() => {
        setSuccess(false)
        router.push('/categories')
      }, 1500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao atualizar')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubcategoryUpdate(
    subId: string,
    newName: string
  ) {
    if (!newName.trim()) return

    try {
      await updateSubcategory(subId, newName.trim())
    } catch {
      alert('Erro ao atualizar subcategoria')
    }
  }

  if (!category) {
    return (
      <main className="container">
        <p>Carregando...</p>
      </main>
    )
  }

  return (
    <main className="container">
      {success && (
        <div className="success-overlay">
          <div className="success-box">
            Atualizado com sucesso
          </div>
        </div>
      )}

      <Link href="/categories" className="link">
        ← Voltar
      </Link>

      <h1 className="title">Editar categoria</h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nome</label>
          <input
            className="input"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            disabled={category.isDefault}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!category.isDefault && (
          <button
            type="submit"
            className="button"
            disabled={loading}
          >
            {loading
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>
        )}
      </form>

      {category.type === 'SAIDA' &&
        subcategories.length > 0 && (
          <>
            <h2 className="subtitle">
              Subcategorias
            </h2>

            {subcategories.map((sub) => (
              <div
                key={sub.id}
                className="field"
              >
                <input
                  className="input"
                  defaultValue={sub.name}
                  onBlur={(e) =>
                    handleSubcategoryUpdate(
                      sub.id,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
          </>
        )}
    </main>
  )
}