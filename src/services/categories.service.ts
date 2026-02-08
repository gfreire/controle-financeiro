import { supabase } from '@/lib/supabase'
import {
  Category,
  Subcategory,
  CategoryType,
  CreateCategoryInput,
  validateCreateCategory,
} from '@/domain/category'

/* =========================
   LISTAGEM
========================= */

export async function listCategoriesByType(
  tipo: CategoryType
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('tipo_categoria', tipo)
    .eq('ativa', true)
    .order('nome')

  if (error) {
    throw new Error('Erro ao listar categorias')
  }

  return data as Category[]
}

export async function listSubcategoriesByCategory(
  categoriaId: string
): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from('subcategorias')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('ativa', true)
    .order('nome')

  if (error) {
    throw new Error('Erro ao listar subcategorias')
  }

  return data as Subcategory[]
}

/* =========================
   CRIAÇÃO
========================= */

export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  validateCreateCategory(input)

  const { data, error } = await supabase
    .from('categorias')
    .insert({
      nome: input.nome.trim(),
      tipo_categoria: input.tipo_categoria,
      is_default: false,
      ativa: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Erro ao criar categoria')
  }

  return data as Category
}

/* =========================
   OCULTAR (DELETE LÓGICO)
========================= */

export async function hideCategory(
  categoryId: string
): Promise<void> {
  const { error } = await supabase
    .from('categorias')
    .update({ ativa: false })
    .eq('id', categoryId)

  if (error) {
    throw new Error('Erro ao ocultar categoria')
  }
}