'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  listCategories,
  listSubcategories,
} from '@/services/categories.service'
import {
  Category,
  Subcategory,
  CategoryType,
} from '@/domain/category'

export default function CategoriesPage() {
  const [activeTab, setActiveTab] =
    useState<CategoryType>('SAIDA')

  const [categories, setCategories] =
    useState<Category[]>([])

  const [subcategories, setSubcategories] =
    useState<Subcategory[]>([])

  const [expanded, setExpanded] =
    useState<Record<string, boolean>>({})

  const [hidden, setHidden] =
    useState<Record<string, boolean>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      const [cats, subs] = await Promise.all([
        listCategories(),
        listSubcategories(),
      ])

      setCategories(cats)
      setSubcategories(subs)
    } catch {
      setError('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (cat) => cat.type === activeTab
      ),
    [categories, activeTab]
  )

  const hasAnyExpanded = useMemo(
    () =>
      filteredCategories.some(
        (c) => expanded[c.id]
      ),
    [filteredCategories, expanded]
  )

  function toggleExpand(id: string) {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  function toggleAll() {
    const nextState = !hasAnyExpanded
    const map: Record<string, boolean> = {}

    filteredCategories.forEach((c) => {
      const hasSubs = subcategories.some(
        (s) => s.categoryId === c.id
      )

      if (hasSubs) {
        map[c.id] = nextState
      }
    })

    setExpanded(map)
  }

  function toggleHidden(id: string) {
    setHidden((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <main className="container">
      <Link href="/" className="link">
        ← Voltar para Dashboard
      </Link>

      <div className="header-row">
        <h1 className="title">Categorias</h1>

        <Link
          href="/categories/new"
          className="button secondary"
        >
          Nova categoria
        </Link>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${
            activeTab === 'SAIDA' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('SAIDA')}
        >
          Saída
        </button>

        <button
          className={`tab ${
            activeTab === 'ENTRADA' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('ENTRADA')}
        >
          Entrada
        </button>
      </div>

      {activeTab === 'SAIDA' && (
        <div className="expand-all-row">
          <button
            className="link small"
            onClick={toggleAll}
          >
            {hasAnyExpanded
              ? 'Recolher tudo'
              : 'Expandir tudo'}
          </button>
        </div>
      )}

      {loading && (
        <p className="muted">Carregando...</p>
      )}

      {error && (
        <div className="error field">{error}</div>
      )}

      {!loading && (
        <div className="list">
          {filteredCategories.map((category) => {
            const subs = subcategories.filter(
              (s) => s.categoryId === category.id
            )

            const isExpanded =
              expanded[category.id] ?? false

            const isHidden =
              hidden[category.id] ?? false

            return (
              <div key={category.id}>
                <div className="category-row">
                  <div className="category-left">
                    {activeTab === 'SAIDA' &&
                      subs.length > 0 && (
                        <button
                          className="expand-btn"
                          onClick={() =>
                            toggleExpand(
                              category.id
                            )
                          }
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      )}

                    <strong>
                      {category.name}
                    </strong>

                    {category.isDefault && (
                      <span className="badge">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="category-actions">
                    {!category.isDefault && (
                      <>
                        <Link
                          href={`/categories/${category.id}/edit`}
                          className="link"
                        >
                          Editar
                        </Link>

                        <button
                          className="link danger"
                          onClick={() =>
                            console.log('Delete categoria', category.id)
                          }
                        >
                          Excluir
                        </button>
                      </>
                    )}

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() =>
                          toggleHidden(
                            category.id
                          )
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                {activeTab === 'SAIDA' &&
                  isExpanded &&
                  subs.length > 0 && (
                    <div className="subcategory-list">
                      {subs.map((sub) => {
                        const subHidden =
                          hidden[sub.id] ?? false

                        return (
                          <div
                            key={sub.id}
                            className="subcategory-row"
                          >
                            <span>
                              {sub.name}
                            </span>

                            <div className="category-actions">
                              {!sub.isDefault && (
                                <>
                                  <Link
                                    href={`/categories/subcategory/${sub.id}/edit`}
                                    className="link"
                                  >
                                    Editar
                                  </Link>

                                  <button
                                    className="link danger"
                                    onClick={() =>
                                      console.log('Delete subcategoria', sub.id)
                                    }
                                  >
                                    Excluir
                                  </button>
                                </>
                              )}

                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={!subHidden}
                                  onChange={() =>
                                    toggleHidden(
                                      sub.id
                                    )
                                  }
                                />
                                <span className="slider" />
                              </label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}