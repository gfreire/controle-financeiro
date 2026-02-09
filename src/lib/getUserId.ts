import { supabase } from '@/lib/supabase'

export async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Usuário não autenticado')
  }

  return user.id
}