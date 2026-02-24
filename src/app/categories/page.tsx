'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  listCategories,
  listSubcategories,
  checkCategoryUsage,
  checkSubcategoryUsage,
  deleteCategory,
  deleteSubcategory,
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

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'CATEGORY' | 'SUBCATEGORY'
    id: string
    name: string
    usageCount: number
  } | null>(null)

  const [replacementCategoryId, setReplacementCategoryId] =
    useState<string>('')

  const [replacementSubcategoryId, setReplacementSubcategoryId] =
    useState<string>('')

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

  async function handleDeleteCategory(id: string) {
    const category = categories.find((c) => c.id === id)
    if (!category) return

    const usageCount = await checkCategoryUsage(id)

    if (usageCount === 0) {
      await deleteCategory(id, null)
      await loadData()
      return
    }

    setDeleteTarget({
      type: 'CATEGORY',
      id,
      name: category.name,
      usageCount,
    })
  }

  async function handleDeleteSubcategory(id: string) {
    const sub = subcategories.find((s) => s.id === id)
    if (!sub) return

    const usageCount = await checkSubcategoryUsage(id)

    if (usageCount === 0) {
      await deleteSubcategory(id, null)
      await loadData()
      return
    }

    setDeleteTarget({
      type: 'SUBCATEGORY',
      id,
      name: sub.name,
      usageCount,
    })
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
                <div
                  className={`category-row ${
                    isHidden ? 'is-disabled' : ''
                  }`}
                >
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
                            handleDeleteCategory(category.id)
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
                            className={`subcategory-row ${
                              subHidden ? 'is-disabled' : ''
                            }`}
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
                                      handleDeleteSubcategory(sub.id)
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
      {deleteTarget && (
        <div className="overlay overlay-centered">
          <div className="modal">
            <h3>Confirmação</h3>

            <p>
              A categoria/subcategoria{' '}
              <strong>{deleteTarget.name}</strong>{' '}
              está sendo utilizada em{' '}
              <strong>{deleteTarget.usageCount}</strong>{' '}
              {deleteTarget.usageCount === 1
                ? 'registro'
                : 'registros'}.
            </p>

            <p>
              Ao deletar, todos os registros vinculados serão
              atualizados. Você pode deixar sem categoria
              ou migrar todos para outra categoria e,
              opcionalmente, para uma subcategoria específica.
            </p>

            {deleteTarget.type === 'CATEGORY' && (
              <>
                <div className="field">
                  <label>Nova categoria</label>
                  <select
                    className="select"
                    value={replacementCategoryId}
                    onChange={(e) => {
                      setReplacementCategoryId(e.target.value)
                      setReplacementSubcategoryId('')
                    }}
                  >
                    <option value="">Sem categoria</option>
                    {categories
                      .filter((c) => {
                        const original = categories.find(
                          (cat) => cat.id === deleteTarget.id
                        )
                        return (
                          c.id !== deleteTarget.id &&
                          c.type === original?.type
                        )
                      })
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {replacementCategoryId && (
                  <div className="field">
                    <label>Nova subcategoria</label>
                    <select
                      className="select"
                      value={replacementSubcategoryId}
                      onChange={(e) =>
                        setReplacementSubcategoryId(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Sem subcategoria
                      </option>
                      {subcategories
                        .filter(
                          (s) =>
                            s.categoryId ===
                            replacementCategoryId
                        )
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {deleteTarget.type === 'SUBCATEGORY' && (
              <div className="field">
                <label>Nova subcategoria</label>
                <select
                  className="select"
                  value={replacementSubcategoryId}
                  onChange={(e) =>
                    setReplacementSubcategoryId(
                      e.target.value
                    )
                  }
                >
                  <option value="">Sem subcategoria</option>
                  {subcategories
                    .filter((s) => {
                      const originalSub = subcategories.find(
                        (sub) => sub.id === deleteTarget.id
                      )

                      return (
                        s.id !== deleteTarget.id &&
                        s.categoryId === originalSub?.categoryId
                      )
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setDeleteTarget(null)
                  setReplacementCategoryId('')
                  setReplacementSubcategoryId('')
                }}
              >
                Cancelar
              </button>

              <button
                className="button danger"
                onClick={async () => {
                  if (deleteTarget.type === 'CATEGORY') {
                    await deleteCategory(
                      deleteTarget.id,
                      replacementCategoryId || null
                    )
                  } else {
                    await deleteSubcategory(
                      deleteTarget.id,
                      replacementSubcategoryId || null
                    )
                  }

                  setDeleteTarget(null)
                  setReplacementCategoryId('')
                  setReplacementSubcategoryId('')
                  await loadData()
                }}
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}