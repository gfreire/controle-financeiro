import { supabase } from '@/lib/supabase'
import { Category, CategoriaTipo } from '@/domain/category'

export async function listCategories(
  tipo: CategoriaTipo
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select(`
      id,
      nome,
      tipo_categoria,
      ativa,
      subcategorias (
        id,
        nome,
        ativa
      )
    `)
    .eq('tipo_categoria', tipo)
    .eq('ativa', true)
    .order('nome', { ascending: true })

  if (error) {
    throw new Error('Erro ao carregar categorias')
  }

  return data ?? []
}