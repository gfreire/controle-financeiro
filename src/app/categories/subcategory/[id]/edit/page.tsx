

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getSubcategoryById,
  updateSubcategory,
} from '@/services/categories.service'
import { Subcategory } from '@/domain/category'

export default function EditSubcategoryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [subcategory, setSubcategory] =
    useState<Subcategory | null>(null)

  const [name, setName] = useState('')
  const [error, setError] =
    useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return

      const sub = await getSubcategoryById(id)
      setSubcategory(sub)
      setName(sub.name)
    }

    load()
  }, [id])

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()
    setError(null)

    if (!subcategory) return

    try {
      setLoading(true)

      const trimmed = name.trim()

      if (trimmed.length < 2) {
        throw new Error(
          'Nome deve ter pelo menos 2 caracteres'
        )
      }

      if (subcategory.isDefault) {
        throw new Error(
          'Subcategoria padrão não pode ser editada'
        )
      }

      await updateSubcategory(
        subcategory.id,
        trimmed
      )

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

  if (!subcategory) {
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

      <h1 className="title">
        Editar subcategoria
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nome</label>
          <input
            className="input"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            disabled={subcategory.isDefault}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!subcategory.isDefault && (
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
    </main>
  )
}