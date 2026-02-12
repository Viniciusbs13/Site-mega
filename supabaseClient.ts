import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Dados configurados com base no seu projeto 'chzkslqbpmlpepvydacu'
const supabaseUrl = 'https://chzkslqbpmlpepvydacu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoemtzbHFicGxtcGVwdnlkYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzgyODMsImV4cCI6MjA4NTY1NDI4M30.a-ot977cQW1uQJwyympfvXrpWkLyUhNuARPFwIV_wDk';

export const supabase = createClient(supabaseUrl, supabaseKey);
