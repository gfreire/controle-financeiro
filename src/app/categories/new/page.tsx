'use client'

import Link from 'next/link'
import CategoryForm from '@/components/categories/CategoryForm'

export default function NewCategoryPage() {
  return (
    <main className="container">
      <Link href="/categories" className="link">
        ← Voltar
      </Link>

      <h1 className="title">
        Nova categoria / subcategoria
      </h1>

      <CategoryForm mode="create" />
    </main>
  )
}
