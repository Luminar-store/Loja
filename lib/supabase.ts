import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export async function validateSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      console.error('Erro ao conectar com Supabase (products):', error.message);
      return false;
    }
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('Falha na validação de conexão Supabase:', err);
    return false;
  }
}

