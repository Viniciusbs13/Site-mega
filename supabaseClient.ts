
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://chzkslqbpmlpepvydacu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoemtzbHFicGxtcGVwdnlkYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzgyODMsImV4cCI6MjA4NTY1NDI4M30.a-ot977cQW1uQJwyympfvXrpWkLyUhNuARPFwIV_wDk';

let supabaseInstance: any = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
} catch (e) {
  console.warn("⚠️ Biblioteca Supabase bloqueada localmente. O sistema operará em Modo Local-First.");
}

export const supabase = supabaseInstance;
