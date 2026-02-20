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

/* =========================
   CREATE CATEGORY
========================= */

export async function createCategory(
  name: string,
  type: CategoryType
): Promise<Category> {
  const trimmed = name.trim()

  if (trimmed.length < 2) {
    throw new Error('Nome da categoria inválido')
  }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  // Verifica conflito apenas com:
  // 1) categorias DEFAULT (user_id IS NULL)
  // 2) categorias do próprio usuário
  const { data: existing, error: checkError } = await supabase
    .from('categorias')
    .select('id, user_id')
    .ilike('nome', trimmed)
    .eq('tipo_categoria', type)

  if (checkError) {
    throw new Error('Erro ao validar categoria')
  }

  type ExistingCategoryRow = {
    id: string
    user_id: string | null
  }

  const conflict = (existing ?? []).some(
    (c: ExistingCategoryRow) =>
      c.user_id === null || c.user_id === userId
  )

  if (conflict) {
    throw new Error('Categoria já existe')
  }

  const { data, error } = await supabase
    .from('categorias')
    .insert({
      nome: trimmed,
      tipo_categoria: type,
      user_id: userId,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Erro ao criar categoria')
  }

  return mapCategory(data)
}

/* =========================
   CREATE SUBCATEGORY
========================= */

export async function createSubcategory(
  name: string,
  categoryId: string
): Promise<Subcategory> {
  const trimmed = name.trim()

  if (trimmed.length < 2) {
    throw new Error('Nome da subcategoria inválido')
  }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data, error } = await supabase
    .from('subcategorias')
    .insert({
      nome: trimmed,
      categoria_id: categoryId,
      user_id: userId,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Erro ao criar subcategoria')
  }

  return mapSubcategory(data)
}