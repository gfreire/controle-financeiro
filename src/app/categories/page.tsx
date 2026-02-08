'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  listCategoriesByType,
  listSubcategoriesByCategory,
  hideCategory,
} from '@/services/categories.service'

import { Category, Subcategory } from '@/domain/category'

type Tab = 'ENTRADA' | 'SAIDA'

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('SAIDA')
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData(tab: Tab) {
    try {
      setLoading(true)
      setError(null)
        
      const cats = await listCategoriesByType(tab)
      setCategories(cats)

      if (tab === 'SAIDA') {
        const allSubs: Subcategory[] = []

        for (const cat of cats) {
          const subs = await listSubcategoriesByCategory(cat.id)
          allSubs.push(...subs)
        }

        setSubcategories(allSubs)
      } else {
        setSubcategories([])
      }
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

  async function handleHideCategory(id: string) {
    if (!window.confirm('Deseja ocultar esta categoria?')) return

    try {
      await hideCategory(id)
      await loadData(activeTab)
    } catch {
      alert('Erro ao ocultar categoria')
    }
  }

  useEffect(() => {
    loadData(activeTab)
  }, [activeTab])

  return (
    <main className="container">
      <Link href="/" className="link">
        ← Voltar para Dashboard
      </Link>

      <h1 className="title">Categorias</h1>

      {/* Tabs */}
      <div className="header-row">
        <button
          className={
            activeTab === 'SAIDA'
              ? 'button secondary'
              : 'button'
          }
          onClick={() => setActiveTab('SAIDA')}
        >
          Saídas
        </button>

        <button
          className={
            activeTab === 'ENTRADA'
              ? 'button secondary'
              : 'button'
          }
          onClick={() => setActiveTab('ENTRADA')}
        >
          Entradas
        </button>
      </div>

      {loading && <p className="muted">Carregando...</p>}
      {error && <div className="error field">{error}</div>}

      {!loading && categories.length === 0 && (
        <p className="muted">Nenhuma categoria encontrada</p>
      )}

      {/* Árvore */}
      <div className="list">
        {categories.map((cat) => (
          <div key={cat.id} className="category">
            <div className="category-row">
              <strong>{cat.nome}</strong>

              <button
                className="link danger"
                onClick={() =>
                  handleHideCategory(cat.id)
                }
              >
                Ocultar
              </button>
            </div>

            {/* Subcategorias apenas para SAÍDA */}
            {activeTab === 'SAIDA' && (
              <div className="subcategories">
                {subcategories
                  .filter(
                    (s) => s.categoria_id === cat.id
                  )
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="subcategory"
                    >
                      └ {sub.nome}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}