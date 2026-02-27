'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getCategoryById } from '@/services/categories.service'
import { Category } from '@/domain/category'
import CategoryForm from '@/components/categories/CategoryForm'

export default function EditCategoryPage() {
  const params = useParams()
  const id = params?.id as string

  const [category, setCategory] =
    useState<Category | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return

      const cat = await getCategoryById(id)
      setCategory(cat)
    }

    load()
  }, [id])

  if (!category) {
    return (
      <main className="container">
        <p>Carregando...</p>
      </main>
    )
  }

  return (
    <main className="container">
      <Link href="/categories" className="link">
        ← Voltar
      </Link>

      <h1 className="title">
        Editar categoria
      </h1>

      <CategoryForm
        mode="edit"
        initialData={category}
      />
    </main>
  )
}