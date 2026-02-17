// src/services/categories.service.ts

import { supabase } from '@/lib/supabase'
import {
  Category,
  Subcategory,
  CategoryType,
} from '@/domain/category'

/* =========================
   DB TYPES
========================= */

type DBCategory = {
  id: string
  nome: string
  tipo_categoria: CategoryType
  user_id: string | null
}

type DBSubcategory = {
  id: string
  nome: string
  categoria_id: string
  user_id: string | null
}

/* =========================
   MAPPERS
========================= */

function mapCategory(row: DBCategory): Category {
  return {
    id: row.id,
    name: row.nome,
    type: row.tipo_categoria,
    isDefault: row.user_id === null,
  }
}

function mapSubcategory(row: DBSubcategory): Subcategory {
  return {
    id: row.id,
    name: row.nome,
    categoryId: row.categoria_id,
    isDefault: row.user_id === null,
  }
}

/* =========================
   SERVICES
========================= */

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, tipo_categoria, user_id')
    .order('nome')

  if (error) {
    throw new Error('Erro ao listar categorias')
  }

  return (data ?? []).map(mapCategory)
}

export async function listSubcategories(): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from('subcategorias')
    .select('id, nome, categoria_id, user_id')
    .order('nome')

  if (error) {
    throw new Error('Erro ao listar subcategorias')
  }

  return (data ?? []).map(mapSubcategory)
}