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

        <button className="button secondary">
          Nova categoria
        </button>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 12,
          }}
        >
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
              <div key={category.id} className="card">
                <div className="card-main">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
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

                    <div className="card-actions">
                      {!category.isDefault && (
                        <button className="link">
                          Editar
                        </button>
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
                </div>

                {activeTab === 'SAIDA' &&
                  isExpanded &&
                  subs.length > 0 && (
                    <ul
                      style={{
                        marginTop: 8,
                        paddingLeft: 28,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {subs.map((sub) => {
                        const subHidden =
                          hidden[sub.id] ?? false

                        return (
                          <li
                            key={sub.id}
                            style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>
                              {sub.name}
                            </span>

                            <div className="card-actions">
                              {!sub.isDefault && (
                                <button className="link">
                                  Editar
                                </button>
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
                          </li>
                        )
                      })}
                    </ul>
                  )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}