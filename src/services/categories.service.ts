// src/services/categories.service.ts

import { supabase } from '@/lib/supabase'
import {
  Category,
  Subcategory,
  CategoryType,
} from '@/domain/category'
import { normalizeText } from '@/utils/normalize'

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
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, tipo_categoria, user_id')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('nome')

  if (error) {
    throw new Error('Erro ao listar categorias')
  }

  return (data ?? []).map(mapCategory)
}

export async function listSubcategories(): Promise<Subcategory[]> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data, error } = await supabase
    .from('subcategorias')
    .select('id, nome, categoria_id, user_id')
    .or(`user_id.is.null,user_id.eq.${userId}`)
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
  const normalized = normalizeText(name)
  if (!normalized || normalized.length < 2) {
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
    .ilike('nome', normalized)
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
      nome: normalized,
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
  const normalized = normalizeText(name)

  if (!normalized || normalized.length < 2) {
    throw new Error('Nome da subcategoria inválido')
  }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data: conflicts, error: conflictError } = await supabase
    .from('subcategorias')
    .select('id, user_id')
    .ilike('nome', normalized)
    .eq('categoria_id', categoryId)

  if (conflictError) {
    throw new Error('Erro ao validar subcategoria')
  }

  const duplicate = (conflicts ?? []).some(
    (c: { id: string; user_id: string | null }) =>
      c.user_id === null || c.user_id === userId
  )

  if (duplicate) {
    throw new Error('Subcategoria já existe')
  }

  const { data, error } = await supabase
    .from('subcategorias')
    .insert({
      nome: normalized,
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

/* =========================
   CREATE CATEGORY WITH OPTIONAL SUBCATEGORY
========================= */

export async function createCategoryWithOptionalSubcategory(params: {
  name: string
  type: CategoryType
  subcategoryName?: string
  parentCategoryId?: string
}): Promise<{ categoryId: string; subcategoryId: string | null }> {
  const { name, type, subcategoryName, parentCategoryId } = params

  // Caso esteja criando apenas uma subcategoria
  if (parentCategoryId && subcategoryName?.trim().length) {
    const subcategory = await createSubcategory(
      subcategoryName,
      parentCategoryId
    )

    return {
      categoryId: parentCategoryId,
      subcategoryId: subcategory.id,
    }
  }

  const category = await createCategory(name, type)

  let subcategoryId: string | null = null

  if (subcategoryName && subcategoryName.trim().length >= 2) {
    const subcategory = await createSubcategory(
      subcategoryName,
      category.id
    )
    subcategoryId = subcategory.id
  }

  return {
    categoryId: category.id,
    subcategoryId,
  }
}

/* =========================
   CREATE SUBCATEGORY FOR EXISTING CATEGORY
========================= */

export async function createSubcategoryForExistingCategory(
  name: string,
  categoryId: string
): Promise<Subcategory> {
  // Apenas delega para createSubcategory,
  // mantendo separação semântica de domínio
  return createSubcategory(name, categoryId)
}

/* =========================
   GET CATEGORY BY ID
========================= */

export async function getCategoryById(
  id: string
): Promise<Category> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, tipo_categoria, user_id')
    .eq('id', id)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .single()

  if (error || !data) {
    throw new Error('Categoria não encontrada')
  }

  return mapCategory(data)
}

/* =========================
   GET SUBCATEGORY BY ID
========================= */

export async function getSubcategoryById(
  id: string
): Promise<Subcategory> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data, error } = await supabase
    .from('subcategorias')
    .select('id, nome, categoria_id, user_id')
    .eq('id', id)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .single()

  if (error || !data) {
    throw new Error('Subcategoria não encontrada')
  }

  return mapSubcategory(data)
}

/* =========================
   UPDATE CATEGORY
========================= */

export async function updateCategory(
  id: string,
  name: string
): Promise<void> {
  const normalized = normalizeText(name)

  if (!normalized || normalized.length < 2) {
    throw new Error('Nome inválido')
  }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  // Busca categoria existente e impede edição de categoria default
  const { data: existingCategory } = await supabase
    .from('categorias')
    .select('user_id, tipo_categoria')
    .eq('id', id)
    .single()

  if (!existingCategory) {
    throw new Error('Categoria não encontrada')
  }

  if (existingCategory.user_id === null) {
    throw new Error('Categoria padrão não pode ser editada')
  }

  // Verifica conflito com outras categorias (default ou do próprio usuário)
  const { data: conflicts, error: conflictError } = await supabase
    .from('categorias')
    .select('id, user_id')
    .ilike('nome', normalized)
    .eq('tipo_categoria', existingCategory.tipo_categoria)

  if (conflictError) {
    throw new Error('Erro ao validar categoria')
  }

  const duplicate = (conflicts ?? []).some(
    (c: { id: string; user_id: string | null }) =>
      c.id !== id &&
      (c.user_id === null || c.user_id === userId)
  )

  if (duplicate) {
    throw new Error('Categoria já existe')
  }

  const { error } = await supabase
    .from('categorias')
    .update({ nome: normalized })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Erro ao atualizar categoria')
  }
}

/* =========================
   UPDATE SUBCATEGORY
========================= */

export async function updateSubcategory(
  id: string,
  name: string
): Promise<void> {
  const normalized = normalizeText(name)

  if (!normalized || normalized.length < 2) {
    throw new Error('Nome inválido')
  }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  // Impede edição de subcategoria default
  const { data: existing } = await supabase
    .from('subcategorias')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing) {
    throw new Error('Subcategoria não encontrada')
  }

  if (existing.user_id === null) {
    throw new Error(
      'Subcategoria padrão não pode ser editada'
    )
  }

  // Busca categoria da subcategoria
  const { data: subData } = await supabase
    .from('subcategorias')
    .select('categoria_id')
    .eq('id', id)
    .single()

  if (!subData) {
    throw new Error('Subcategoria não encontrada')
  }

  // Verifica conflito dentro da mesma categoria
  const { data: conflicts, error: conflictError } = await supabase
    .from('subcategorias')
    .select('id, user_id')
    .ilike('nome', normalized)
    .eq('categoria_id', subData.categoria_id)

  if (conflictError) {
    throw new Error('Erro ao validar subcategoria')
  }

  const duplicate = (conflicts ?? []).some(
    (c: { id: string; user_id: string | null }) =>
      c.id !== id &&
      (c.user_id === null || c.user_id === userId)
  )

  if (duplicate) {
    throw new Error('Subcategoria já existe')
  }

  const { error } = await supabase
    .from('subcategorias')
    .update({ nome: normalized })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Erro ao atualizar subcategoria')
  }
}

/* =========================
   USAGE CHECK
========================= */

export async function checkCategoryUsage(
  categoryId: string
): Promise<number> {
  const { count: movCount } = await supabase
    .from('movimentacoes')
    .select('*', { count: 'exact', head: true })
    .eq('categoria_id', categoryId)

  const { count: purchaseCount } = await supabase
    .from('compras_cartao')
    .select('*', { count: 'exact', head: true })
    .eq('categoria_id', categoryId)

  return (movCount ?? 0) + (purchaseCount ?? 0)
}

export async function checkSubcategoryUsage(
  subcategoryId: string
): Promise<number> {
  const { count: movCount } = await supabase
    .from('movimentacoes')
    .select('*', { count: 'exact', head: true })
    .eq('subcategoria_id', subcategoryId)

  const { count: purchaseCount } = await supabase
    .from('compras_cartao')
    .select('*', { count: 'exact', head: true })
    .eq('subcategoria_id', subcategoryId)

  return (movCount ?? 0) + (purchaseCount ?? 0)
}

/* =========================
   DELETE CATEGORY
========================= */

export async function deleteCategory(
  categoryId: string,
  newCategoryId?: string | null,
  newSubcategoryId?: string | null
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data: existing } = await supabase
    .from('categorias')
    .select('user_id')
    .eq('id', categoryId)
    .single()

  if (!existing) {
    throw new Error('Categoria não encontrada')
  }

  if (existing.user_id === null) {
    throw new Error('Categoria padrão não pode ser deletada')
  }

  /* 1️⃣ Atualiza movimentações */
  await supabase
    .from('movimentacoes')
    .update({
      categoria_id: newCategoryId ?? null,
      subcategoria_id: newSubcategoryId ?? null,
    })
    .eq('categoria_id', categoryId)
    .eq('user_id', userId)

  /* 2️⃣ Atualiza compras cartão */
  await supabase
    .from('compras_cartao')
    .update({
      categoria_id: newCategoryId ?? null,
      subcategoria_id: newSubcategoryId ?? null,
    })
    .eq('categoria_id', categoryId)
    .eq('user_id', userId)

  /* 3️⃣ Deleta subcategorias da categoria */
  await supabase
    .from('subcategorias')
    .delete()
    .eq('categoria_id', categoryId)
    .eq('user_id', userId)

  /* 4️⃣ Deleta categoria */
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Erro ao deletar categoria')
  }
}

/* =========================
   DELETE SUBCATEGORY
========================= */

export async function deleteSubcategory(
  subcategoryId: string,
  newSubcategoryId?: string | null
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Usuário não autenticado')
  }

  const { data: existing } = await supabase
    .from('subcategorias')
    .select('user_id')
    .eq('id', subcategoryId)
    .single()

  if (!existing) {
    throw new Error('Subcategoria não encontrada')
  }

  if (existing.user_id === null) {
    throw new Error('Subcategoria padrão não pode ser deletada')
  }

  const inUse = await checkSubcategoryUsage(subcategoryId)

  if (inUse) {
    await supabase
      .from('movimentacoes')
      .update({
        subcategoria_id: newSubcategoryId ?? null,
      })
      .eq('subcategoria_id', subcategoryId)
      .eq('user_id', userId)

    await supabase
      .from('compras_cartao')
      .update({
        subcategoria_id: newSubcategoryId ?? null,
      })
      .eq('subcategoria_id', subcategoryId)
      .eq('user_id', userId)
  }

  const { error } = await supabase
    .from('subcategorias')
    .delete()
    .eq('id', subcategoryId)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Erro ao deletar subcategoria')
  }
}