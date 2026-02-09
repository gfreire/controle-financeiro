'use client'

import { useEffect, useState } from 'react'
import { listCategories } from '@/services/categories.service'
import { Category } from '@/domain/category'

type Tab = 'SAIDA' | 'ENTRADA'

export default function CategoriesPage() {
  const [tab, setTab] = useState<Tab>('SAIDA')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await listCategories(tab)
        setCategories(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar categorias'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [tab])

  return (
    <main className="container">
      <h1 className="title">Categorias</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'SAIDA' ? 'active' : ''}`}
          onClick={() => setTab('SAIDA')}
        >
          Saída
        </button>

        <button
          className={`tab ${tab === 'ENTRADA' ? 'active' : ''}`}
          onClick={() => setTab('ENTRADA')}
        >
          Entrada
        </button>
      </div>

      {loading && <p className="muted">Carregando...</p>}

      {error && <div className="error field">{error}</div>}

      {!loading && categories.length === 0 && (
        <p className="muted">Nenhuma categoria cadastrada</p>
      )}

      <div className="category-list">
        {categories.map((cat) => (
          <div key={cat.id} className="category-card">
            <div className="category-header">
              <strong>{cat.nome}</strong>

              <button className="link danger">
                Ocultar
              </button>
            </div>

            {cat.subcategorias?.length ? (
              <ul className="subcategory-list">
                {cat.subcategorias.map((sub) => (
                  <li key={sub.id}>{sub.nome}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  )
}