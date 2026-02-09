export type CategoriaTipo = 'ENTRADA' | 'SAIDA'

export type Subcategory = {
  id: string
  nome: string
  ativa: boolean
}

export type Category = {
  id: string
  nome: string
  tipo_categoria: CategoriaTipo
  ativa: boolean
  subcategorias?: Subcategory[]
}