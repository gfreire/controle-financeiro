// src/domain/category.ts

export type CategoryType = 'ENTRADA' | 'SAIDA'

/**
 * Categoria de domínio.
 * isDefault NÃO vem do banco como coluna.
 * É derivado de user_id === null no service.
 */
export type Category = {
  id: string
  name: string
  type: CategoryType
  isDefault: boolean
}

/**
 * Subcategoria de domínio.
 * Também deriva isDefault de user_id === null.
 */
export type Subcategory = {
  id: string
  categoryId: string
  name: string
  isDefault: boolean
}

/* =========================
   INPUTS
========================= */

export type CreateCategoryInput = {
  name: string
  type: CategoryType
}

export type UpdateCategoryInput = {
  name: string
}

export type CreateSubcategoryInput = {
  name: string
  categoryId: string
}

export type UpdateSubcategoryInput = {
  name: string
}

/* =========================
   VALIDATIONS
========================= */

export function validateCreateCategory(
  input: CreateCategoryInput
) {
  if (!input.name.trim()) {
    throw new Error('Nome da categoria é obrigatório')
  }

  if (!input.type) {
    throw new Error('Tipo da categoria é obrigatório')
  }
}

export function validateUpdateCategory(
  input: UpdateCategoryInput
) {
  if (!input.name.trim()) {
    throw new Error('Nome da categoria é obrigatório')
  }
}

export function validateCreateSubcategory(
  input: CreateSubcategoryInput
) {
  if (!input.name.trim()) {
    throw new Error('Nome da subcategoria é obrigatório')
  }

  if (!input.categoryId) {
    throw new Error('Categoria é obrigatória')
  }
}

export function validateUpdateSubcategory(
  input: UpdateSubcategoryInput
) {
  if (!input.name.trim()) {
    throw new Error('Nome da subcategoria é obrigatório')
  }
}