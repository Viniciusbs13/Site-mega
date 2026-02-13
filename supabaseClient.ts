
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Dados fornecidos pelo usuário para integração real
const supabaseUrl = 'https://chzkslqbplmpepvydacu.supabase.co'; 
const supabaseKey = 'sb_publishable_34RidSlAX-HkuuxY73BcQg_lSGNlriO';

let supabaseInstance: any = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
} catch (e) {
  console.warn("⚠️ Biblioteca Supabase bloqueada localmente ou erro de inicialização. O sistema operará em Modo Local-First.");
}

export const supabase = supabaseInstance;
