export type CategoryType = 'ENTRADA' | 'SAIDA'

export type Category = {
  id: string
  nome: string
  tipo_categoria: CategoryType
  is_default: boolean
  ativa: boolean
}

export type Subcategory = {
  id: string
  categoria_id: string
  nome: string
  ativa: boolean
}

/**
 * Input para criação de categoria
 */
export type CreateCategoryInput = {
  nome: string
  tipo_categoria: CategoryType
}

/**
 * Regras de negócio
 */
export function validateCreateCategory(
  input: CreateCategoryInput
) {
  if (!input.nome || input.nome.trim().length < 2) {
    throw new Error('Nome da categoria é obrigatório')
  }

  if (
    input.tipo_categoria !== 'ENTRADA' &&
    input.tipo_categoria !== 'SAIDA'
  ) {
    throw new Error('Tipo de categoria inválido')
  }
}