
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_URL = 'https://chzkslqbpmlpepvydacu.supabase.co';

export const dbService = {
  diagnoseConnection: async (): Promise<{ status: 'CONNECTED' | 'BLOCKED' | 'SERVER_ERROR' | 'OFFLINE', message?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': 'ping' },
        mode: 'no-cors', // Tenta um ping menos restritivo
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return { status: 'CONNECTED' };
    } catch (e: any) {
      if (e.name === 'AbortError') return { status: 'OFFLINE', message: 'Conexão lenta.' };
      if (e.message?.includes('fetch') || e.name === 'TypeError' || e.status === 0) {
        return { 
          status: 'BLOCKED', 
          message: 'Extensão de Navegador bloqueando Supabase.' 
        };
      }
      return { status: 'SERVER_ERROR', message: e.message };
    }
  },

  saveState: async (state: AppState): Promise<{ success: boolean; error?: string; isNetworkBlock?: boolean }> => {
    // 1. SEMPRE SALVA LOCAL PRIMEIRO (Garantia de 0% de perda)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Erro crítico no LocalStorage:", e);
    }

    // 2. TENTA NUVEM SE DISPONÍVEL
    if (!supabase) return { success: false, error: "Cloud desativada.", isNetworkBlock: true };

    try {
      const { error } = await supabase
        .from('omega_store')
        .upsert({ id: 1, state: state }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      const isBlock = e.message?.includes('fetch') || e.name === 'TypeError' || e.status === 0;
      
      // Silencia logs repetitivos para não poluir o console do CEO
      if (!isBlock) console.error("Erro Cloud:", e.message);
      
      return { 
        success: false, 
        error: isBlock ? "Bloqueado por Extensão" : e.message,
        isNetworkBlock: isBlock
      };
    }
  },

  loadState: async (): Promise<AppState | null> => {
    // Prioriza Local para velocidade instantânea
    const localData = localStorage.getItem(STORAGE_KEY);
    let localParsed: AppState | null = null;
    
    if (localData) {
      try { localParsed = JSON.parse(localData); } catch (e) {}
    }

    // Tenta atualizar do Cloud se possível
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('omega_store')
          .select('state')
          .eq('id', 1)
          .maybeSingle();

        if (!error && data?.state) {
          return data.state as AppState;
        }
      } catch (e) {
        // Falha silenciosa: usa o local
      }
    }

    return localParsed;
  },
};
