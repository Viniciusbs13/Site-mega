
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Credenciais exatas fornecidas pelo usuário
const supabaseUrl = 'https://chzkslqbplmpepvydacu.supabase.co'; 
const supabaseKey = 'sb_publishable_34RidSlAX-HkuuxY73BcQg_lSGNlriO';

let supabaseInstance: any = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
} catch (e) {
  console.error("Erro crítico na inicialização do Supabase:", e);
}

export const supabase = supabaseInstance;
